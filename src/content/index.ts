import React from 'react'
import { createRoot } from 'react-dom/client'
import { detectProvider } from '../providers/registry'
import { setupAutoFloat } from './autoFloat'
import { handleCommand, setShortcutProvider } from './shortcuts'
import { enableFocusMode, disableFocusMode } from './focusMode'
import { getSettings } from '../storage/settings'
import { FloatingPlayer } from '../components/FloatingPlayer/FloatingPlayer'

let rootElement: HTMLDivElement | null = null
let reactRoot: any = null
let initialized = false
let provider: any = null

function mountOverlay(currentProvider: any) {
  if (rootElement) return

  rootElement = document.createElement('div')
  rootElement.id = 'floattube-root'
  rootElement.style.position = 'fixed'
  rootElement.style.zIndex = '2147483647'
  rootElement.style.top = '0'
  rootElement.style.left = '0'
  rootElement.style.width = '0'
  rootElement.style.height = '0'
  rootElement.style.pointerEvents = 'none'

  const shadow = rootElement.attachShadow({ mode: 'open' })

  // Inject bundled content CSS
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = chrome.runtime.getURL('src/content/content.css')
  shadow.appendChild(link)

  // Inject Google Font
  const fontLink = document.createElement('link')
  fontLink.rel = 'stylesheet'
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  shadow.appendChild(fontLink)

  const container = document.createElement('div')
  container.id = 'floattube-react-container'
  container.style.pointerEvents = 'auto'
  shadow.appendChild(container)

  document.body.appendChild(rootElement)

  reactRoot = createRoot(container)
  reactRoot.render(
    React.createElement(FloatingPlayer, {
      provider: currentProvider,
      onClose: unmountOverlay,
    })
  )
}

function unmountOverlay() {
  if (reactRoot) {
    reactRoot.unmount()
    reactRoot = null
  }
  if (rootElement) {
    rootElement.remove()
    rootElement = null
  }
}

// Function to handle runtime initialization on-demand or on load
async function ensureInitialized(): Promise<boolean> {
  if (initialized && provider?.getVideo()) return true

  const detected = detectProvider()
  if (!detected) return false

  const video = detected.getVideo()
  if (!video) return false

  provider = detected
  setShortcutProvider(provider)

  // Setup auto float triggers
  await setupAutoFloat()

  // Apply focus mode if enabled
  const settings = await getSettings()
  if (settings.focusModeEnabled) {
    enableFocusMode(provider.siteId)
  }

  initialized = true
  console.log(`[FloatTube AI] Initialized custom overlay controller on ${provider.name}`)
  return true
}

if (!(window as any).__floattube_injected) {
  (window as any).__floattube_injected = true

  // Register message listener immediately at top level to ensure immediate responsiveness (e.g. during dynamic injection)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'COMMAND': {
        if (initialized && provider) {
          if (message.command === 'play') {
            provider.play()
          } else if (message.command === 'pause') {
            provider.pause()
          } else {
            handleCommand(message.command)
          }
        } else {
          ensureInitialized().then((ok) => {
            if (!ok || !provider) return
            if (message.command === 'play') {
              provider.play()
            } else if (message.command === 'pause') {
              provider.pause()
            } else {
              handleCommand(message.command)
            }
          })
        }
        break
      }

      case 'TOGGLE_FLOAT': {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture().then(() => {
            sendResponse({ success: true })
          }).catch((err: any) => {
            console.error('[FloatTube] Failed to exit PiP:', err)
            sendResponse({ success: false })
          })
          return true
        }

        const detected = detectProvider()
        if (detected) {
          provider = detected
          setShortcutProvider(provider)
          const video = provider.getVideo()
          if (video) {
            // Call synchronously to preserve user gesture from popup click / shortcut
            video.requestPictureInPicture().then(() => {
              sendResponse({ success: true })
            }).catch((err: any) => {
              console.error('[FloatTube] Failed to request PiP:', err)
              sendResponse({ success: false })
            })

            // Enable auto picture-in-picture natively
            try {
              (video as any).autoPictureInPicture = true
              video.setAttribute('autopictureinpicture', 'true')
            } catch (e) {
              // ignore
            }

            // Trigger secondary settings loading in background
            getSettings().then(settings => {
              if (settings.focusModeEnabled) {
                enableFocusMode(provider.siteId)
              }
              setupAutoFloat()
            })
          } else {
            sendResponse({ success: false })
          }
        } else {
          sendResponse({ success: false })
        }
        return true // Keep channel open
      }

      case 'SEEK_TO':
        ensureInitialized().then((ok) => {
          if (!ok || !provider) return
          provider.seekTo(message.seconds)
        })
        break

      case 'TOGGLE_FOCUS_MODE':
        ensureInitialized().then((ok) => {
          if (!ok || !provider) return
          const el = document.getElementById('floattube-focus-mode-css')
          if (el) disableFocusMode()
          else enableFocusMode(provider.siteId)
        })
        break

      case 'GET_VIDEO_STATE':
        ensureInitialized().then((ok) => {
          if (!ok || !provider) {
            sendResponse({ state: null })
            return
          }
          const v = provider.getVideo()
          sendResponse({
            state: {
              isPlaying: provider.isPlaying(),
              currentTime: v?.currentTime ?? 0,
              duration: v?.duration ?? 0,
              volume: v?.volume ?? 1,
              playbackRate: v?.playbackRate ?? 1,
              siteId: provider.siteId,
              title: provider.getTitle(),
              videoId: provider.getVideoId(),
              isFloating: !!document.pictureInPictureElement,
            }
          })
        })
        return true // Keep channel open
    }
  })

  // Periodically send video state updates to synchronise options page, popup, side panel
  setInterval(() => {
    if (!initialized || !provider) return
    const v = provider.getVideo()
    if (!v) return
    try {
      chrome.runtime.sendMessage({
        type: 'VIDEO_STATE',
        state: {
          isPlaying: provider.isPlaying(),
          currentTime: v.currentTime,
          duration: v.duration || 0,
          volume: v.volume,
          playbackRate: v.playbackRate,
          siteId: provider.siteId,
          title: provider.getTitle(),
          videoId: provider.getVideoId(),
          isFloating: !!document.pictureInPictureElement,
        }
      })
    } catch (e) {
      // Catch runtime context invalidated errors
    }
  }, 1000)

  // Wait for video element to be ready on initial load
  function pollInitialization(maxAttempts = 30) {
    let attempts = 0
    const interval = setInterval(() => {
      ensureInitialized().then((ok) => {
        if (ok || ++attempts >= maxAttempts) {
          clearInterval(interval)
        }
      })
    }, 500)
  }

  pollInitialization()

  // Handle YouTube SPA navigation
  if (window.location.hostname.includes('youtube.com')) {
    document.addEventListener('yt-navigate-finish', () => {
      initialized = false
      setTimeout(() => pollInitialization(10), 1000)
    })
  }
}
