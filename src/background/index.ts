// Background service worker — message bus + Commands API

chrome.commands.onCommand.addListener(async (command) => {
  // Forward command to active YouTube/video tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'COMMAND', command })
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_ACTIVE_TAB': {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        sendResponse({ tab })
      })
      return true  // async
    }
    case 'TOGGLE_FLOAT': {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_FLOAT' })
        }
      })
      break
    }
    case 'TOGGLE_FOCUS_MODE': {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_FOCUS_MODE' })
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

// On extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[FloatTube AI] Extension installed')
})
