// Background service worker - message bus + Commands API

let lastVideoTabId: number | null = null

/**
 * Route keyboard shortcuts to the right tab.
 * Toggle-float prefers the active tab, while playback commands can still fall
 * back to the last tracked video tab.
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[FloatTube AI] Shortcut received:', command)

  if (command === 'toggle-float') {
    const handled = await handleToggleFloatShortcut()
    if (!handled) {
      console.warn('[FloatTube AI] Toggle float shortcut did not find a usable video tab.')
    }
    return
  }

  const targetTab = await resolveCommandTab(command)
  if (!hasTabId(targetTab)) return

  const payload = { type: 'COMMAND', command }

  try {
    await sendMessageWithInjection(targetTab, payload, false)
    console.log('[FloatTube AI] Sent COMMAND to tab', targetTab.id)
  } catch (error) {
    console.warn('[FloatTube AI] Failed to send to tab', targetTab.id, error)
    if (lastVideoTabId === targetTab.id) {
      lastVideoTabId = null
    }
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.tab?.id && message.type === 'VIDEO_STATE') {
    lastVideoTabId = sender.tab.id
  }

  switch (message.type) {
    case 'GET_ACTIVE_TAB': {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        sendResponse({ tab })
      })
      return true
    }

    case 'GET_LAST_VIDEO_TAB': {
      sendResponse({ tabId: lastVideoTabId })
      break
    }

    case 'TOGGLE_FLOAT': {
      resolveCommandTab('toggle-float').then((tab) => {
        if (hasTabId(tab)) {
          sendMessageWithInjection(tab, { type: 'TOGGLE_FLOAT' }, true).catch(() => {
            if (lastVideoTabId === tab.id) {
              lastVideoTabId = null
            }
          })
        }
      })
      break
    }

    case 'TOGGLE_FOCUS_MODE': {
      resolveVideoTabId().then((tabId) => {
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_FOCUS_MODE' }).catch(() => {
            if (lastVideoTabId === tabId) {
              lastVideoTabId = null
            }
          })
        }
      })
      break
    }

    case 'OPEN_SIDE_PANEL': {
      if (sender.tab?.windowId) {
        chrome.sidePanel.open({ windowId: sender.tab.windowId })
      }
      break
    }
  }
})

function hasTabId(tab: chrome.tabs.Tab | null | undefined): tab is chrome.tabs.Tab & { id: number } {
  return typeof tab?.id === 'number'
}

function isScriptableTab(tab: chrome.tabs.Tab | null | undefined): tab is chrome.tabs.Tab & { id: number } {
  return hasTabId(tab) && !!tab.url && /^https?:\/\//.test(tab.url)
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab ?? null
}

async function getLastTrackedVideoTab(): Promise<chrome.tabs.Tab | null> {
  if (lastVideoTabId == null) return null

  try {
    return await chrome.tabs.get(lastVideoTabId)
  } catch {
    lastVideoTabId = null
    return null
  }
}

async function sendMessageWithInjection(
  tab: chrome.tabs.Tab & { id: number },
  payload: unknown,
  allowInjection: boolean,
) {
  try {
    return await chrome.tabs.sendMessage(tab.id, payload)
  } catch (error) {
    if (!allowInjection || !isScriptableTab(tab)) {
      throw error
    }

    await injectContentScript(tab.id)
    return chrome.tabs.sendMessage(tab.id, payload)
  }
}

async function handleToggleFloatShortcut(): Promise<boolean> {
  const activeTab = await getActiveTab()
  const trackedTab = await getLastTrackedVideoTab()
  const candidates = [activeTab, trackedTab].filter(
    (tab, index, list): tab is chrome.tabs.Tab & { id: number } =>
      hasTabId(tab) && list.findIndex((candidate) => candidate?.id === tab.id) === index,
  )

  for (const tab of candidates) {
    if (!isScriptableTab(tab)) continue

    try {
      const result = await togglePictureInPictureInTab(tab.id)
      if (result?.success) {
        lastVideoTabId = tab.id
        return true
      }

      if (result?.reason && result.reason !== 'NO_VIDEO') {
        console.warn('[FloatTube AI] PiP toggle failed on tab', tab.id, result.reason)
      }
    } catch (error) {
      console.warn('[FloatTube AI] Direct PiP toggle failed on tab', tab.id, error)
    }
  }

  return false
}

async function togglePictureInPictureInTab(tabId: number) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: togglePictureInPictureInPage,
  })

  return (results[0]?.result ?? null) as
    | { success: boolean; isFloating: boolean; reason?: string }
    | null
}

function togglePictureInPictureInPage() {
  const videos = Array.from(document.querySelectorAll('video'))
  const bestVideo = videos.reduce<HTMLVideoElement | null>((best, current) => {
    if (!best) return current

    const bestRect = best.getBoundingClientRect()
    const currentRect = current.getBoundingClientRect()
    const bestArea = bestRect.width * bestRect.height
    const currentArea = currentRect.width * currentRect.height
    return currentArea > bestArea ? current : best
  }, null)

  if (document.pictureInPictureElement) {
    return document.exitPictureInPicture()
      .then(() => ({ success: true, isFloating: false }))
      .catch((error: { name?: string } | undefined) => ({
        success: false,
        isFloating: true,
        reason: error?.name ?? 'EXIT_FAILED',
      }))
  }

  if (!document.pictureInPictureEnabled) {
    return { success: false, isFloating: false, reason: 'PIP_NOT_SUPPORTED' }
  }

  if (!bestVideo) {
    return { success: false, isFloating: false, reason: 'NO_VIDEO' }
  }

  return bestVideo.requestPictureInPicture()
    .then(() => ({ success: true, isFloating: true }))
    .catch((error: { name?: string } | undefined) => ({
      success: false,
      isFloating: false,
      reason: error?.name ?? 'REQUEST_FAILED',
    }))
}

async function injectContentScript(tabId: number) {
  const contentScript = chrome.runtime.getManifest().content_scripts?.[0]
  if (!contentScript?.js?.length) {
    throw new Error('Content script manifest entry is missing.')
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: contentScript.js,
  })

  if (contentScript.css?.length) {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: contentScript.css,
    })
  }
}

async function resolveCommandTab(command: string): Promise<chrome.tabs.Tab | null> {
  const activeTab = await getActiveTab()
  const trackedTab = await getLastTrackedVideoTab()
  if (trackedTab) return trackedTab
  return activeTab
}

/** Resolve the best tab to send video control messages to. */
async function resolveVideoTabId(): Promise<number | null> {
  const trackedTab = await getLastTrackedVideoTab()
  if (trackedTab?.id) return trackedTab.id

  const activeTab = await getActiveTab()
  return activeTab?.id ?? null
}

// Auto-inject content scripts into already-open video tabs on install/reload.
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[FloatTube AI] Extension installed/reloaded')

  try {
    const manifest = chrome.runtime.getManifest()
    const contentScripts = manifest.content_scripts?.[0]
    if (!contentScripts) return

    const { matches, js: jsFiles, css: cssFiles } = contentScripts
    if (!jsFiles || !matches) return

    const tabs = await chrome.tabs.query({ url: matches })
    for (const tab of tabs) {
      if (!tab.id) continue
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: jsFiles })
        if (cssFiles) {
          await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: cssFiles })
        }
        console.log(`[FloatTube AI] Injected content script into tab ${tab.id}`)
      } catch (error) {
        console.warn(`[FloatTube AI] Could not inject tab ${tab.id}:`, error)
      }
    }
  } catch (error) {
    console.error('[FloatTube AI] Auto-inject error:', error)
  }
})
