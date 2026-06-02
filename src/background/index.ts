// Background service worker — message bus + Commands API

let lastVideoTabId: number | null = null

chrome.commands.onCommand.addListener(async (command) => {
  console.log('[FloatTube AI] Service worker received shortcut command:', command)
  
  // If we have a tracked video tab, send the command there first
  if (lastVideoTabId !== null) {
    try {
      await chrome.tabs.sendMessage(lastVideoTabId, { type: 'COMMAND', command })
      console.log('[FloatTube AI] Sent command to tracked video tab:', lastVideoTabId)
      return
    } catch (e) {
      console.warn('[FloatTube AI] Tracked tab not responding, clearing:', lastVideoTabId, e)
      lastVideoTabId = null
    }
  }

  // Forward command to active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'COMMAND', command })
      console.log('[FloatTube AI] Sent command to active tab:', tab.id)
    } catch (e) {
      console.warn('[FloatTube AI] Failed to send command to active tab:', tab.id, e)
    }
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // If message comes from a content script (which runs on video tabs), track its tab ID
  if (sender.tab?.id) {
    lastVideoTabId = sender.tab.id
  }

  switch (message.type) {
    case 'GET_ACTIVE_TAB': {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        sendResponse({ tab })
      })
      return true  // async
    }
    case 'TOGGLE_FLOAT': {
      if (lastVideoTabId !== null) {
        chrome.tabs.sendMessage(lastVideoTabId, { type: 'TOGGLE_FLOAT' })
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_FLOAT' })
          }
        })
      }
      break
    }
    case 'TOGGLE_FOCUS_MODE': {
      if (lastVideoTabId !== null) {
        chrome.tabs.sendMessage(lastVideoTabId, { type: 'TOGGLE_FOCUS_MODE' })
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_FOCUS_MODE' })
          }
        })
      }
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

// On extension install / reload / update
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[FloatTube AI] Extension installed/reloaded')

  // Automatically inject content scripts into any already open video tabs
  try {
    const manifest = chrome.runtime.getManifest()
    const contentScripts = manifest.content_scripts?.[0]
    if (!contentScripts) return

    const matches = contentScripts.matches
    const jsFiles = contentScripts.js
    const cssFiles = contentScripts.css

    if (!jsFiles || !matches) return

    const tabs = await chrome.tabs.query({ url: matches })
    for (const tab of tabs) {
      if (tab.id) {
        try {
          // Inject content JS
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: jsFiles
          })
          // Inject content CSS
          if (cssFiles) {
            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: cssFiles
            })
          }
          console.log(`[FloatTube AI] Auto-injected content script into existing tab: ${tab.id}`)
        } catch (err) {
          // Suppress errors for restricted pages
          console.warn(`[FloatTube AI] Could not auto-inject tab ${tab.id}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('[FloatTube AI] Error during auto-injection:', err)
  }
})
