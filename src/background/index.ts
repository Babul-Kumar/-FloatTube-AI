// Background service worker — message bus + Commands API

let lastVideoTabId: number | null = null

chrome.commands.onCommand.addListener(async (command) => {
  // If we have a tracked video tab, send the command there first
  if (lastVideoTabId !== null) {
    try {
      await chrome.tabs.sendMessage(lastVideoTabId, { type: 'COMMAND', command })
      return
    } catch (e) {
      // Tab was closed or not responding, clear tracked id and fall back
      lastVideoTabId = null
    }
  }

  // Forward command to active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'COMMAND', command })
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

// On extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[FloatTube AI] Extension installed')
})
