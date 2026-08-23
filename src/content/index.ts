import React from 'react'
import { createRoot } from 'react-dom/client'
import { detectProvider } from '../providers/registry'
import { setupAutoFloat, teardownAutoFloat } from './autoFloat'
import { handleCommand, setShortcutProvider } from './shortcuts'
import { enableFocusMode, disableFocusMode } from './focusMode'
import { getSettings, type FloatSettings } from '../storage/settings'
import { FloatingPlayer } from '../components/FloatingPlayer/FloatingPlayer'
import { getTranscript } from '../services/transcript'

let rootElement: HTMLDivElement | null = null
let reactRoot: any = null
let initialized = false
let provider: any = null

// ─── Custom Overlay (FloatingPlayer) ──────────────────────────────────────────

function mountOverlay(currentProvider: any) {
  if (rootElement) {
    unmountOverlay()
    return
  }

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

// ─── Initialization ────────────────────────────────────────────────────────────

async function ensureInitialized(): Promise<boolean> {
  if (initialized && provider?.getVideo()) return true

  const detected = detectProvider()
  if (!detected) return false

  const video = detected.getVideo()
  if (!video) return false

  provider = detected
  setShortcutProvider(provider)

  // Setup auto-float event listeners (only attaches once due to guard inside)
  await setupAutoFloat()

  // Apply focus mode if enabled
  const settings = await getSettings()
  if (settings.focusModeEnabled) {
    enableFocusMode(provider.siteId)
  }

  initialized = true
  console.log(`[FloatTube AI] Initialized on ${provider.name}`)
  return true
}

function getResolvedVideoId(currentProvider: any): string {
  return currentProvider.getVideoId?.() ?? `${window.location.pathname}${window.location.search}`
}

// ─── Message Listener ─────────────────────────────────────────────────────────

if (!(window as any).__floattube_injected) {
  ;(window as any).__floattube_injected = true

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {

      // ── Keyboard shortcut commands (play-pause, vol-up, skip, toggle-float) ──
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

      // ── Popup "Start Floating" button → native browser PiP ────────────────
      case 'TOGGLE_FLOAT': {
        // Exit existing PiP first if active
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture()
            .then(() => sendResponse({ success: true, isFloating: false }))
            .catch((err: any) => {
              console.error('[FloatTube] Failed to exit PiP:', err)
              sendResponse({ success: false, isFloating: true })
            })
          return true // async response
        }

        const detected = detectProvider()
        if (!detected) {
          sendResponse({ success: false, isFloating: false })
          return true
        }

        provider = detected
        setShortcutProvider(provider)
        const video = provider.getVideo()

        if (!video) {
          sendResponse({ success: false, isFloating: false })
          return true
        }

        // Request native PiP
        video.requestPictureInPicture()
          .then(() => {
            sendResponse({ success: true, isFloating: true })
            getSettings().then(settings => {
              if (settings.focusModeEnabled) {
                enableFocusMode(provider.siteId)
              }
              setupAutoFloat()
            })
          })
          .catch((err: any) => {
            console.error('[FloatTube] Failed to request PiP:', err)
            sendResponse({ success: false, isFloating: false })
          })

        return true // async response
      }

      case 'TOGGLE_OVERLAY': {
        ensureInitialized().then((ok) => {
          if (!ok || !provider) {
            sendResponse({ success: false })
            return
          }
          mountOverlay(provider)
          sendResponse({ success: true, isOverlayOpen: !!rootElement })
        })
        return true
      }

      // ── Seek to timestamp (from side panel / options) ──────────────────────
      case 'SEEK_TO': {
        ensureInitialized().then((ok) => {
          if (!ok || !provider) return
          provider.seekTo(message.seconds)
        })
        break
      }

      // ── Toggle Focus Mode ──────────────────────────────────────────────────
      case 'TOGGLE_FOCUS_MODE': {
        ensureInitialized().then((ok) => {
          if (!ok || !provider) return
          const el = document.getElementById('floattube-focus-mode-css')
          if (el) disableFocusMode()
          else enableFocusMode(provider.siteId)
        })
        break
      }

      // ── Get current video state (used by popup, side panel, options) ───────
      case 'GET_VIDEO_STATE': {
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
              videoId: getResolvedVideoId(provider),
              isFloating: !!document.pictureInPictureElement,
              isOverlayOpen: !!rootElement,
            }
          })
        })
        return true // async response
      }

      case 'GET_TRANSCRIPT': {
        ensureInitialized().then(async (ok) => {
          if (!ok || !provider) {
            sendResponse({ segments: [] })
            return
          }

          try {
            const segments = await getTranscript(provider)
            sendResponse({ segments })
          } catch (error) {
            console.warn('[FloatTube] Failed to load transcript:', error)
            sendResponse({ segments: [] })
          }
        })
        return true
      }
    }
  })

  // ── Periodic video state broadcast (syncs popup, side panel, options) ──────
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
          videoId: getResolvedVideoId(provider),
          isFloating: !!document.pictureInPictureElement,
          isOverlayOpen: !!rootElement,
        }
      })
    } catch {
      // Extension context may be invalidated on reload — suppress error
    }
  }, 1000)

  // ── Poll until video element is ready ─────────────────────────────────────
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

  // ── Handle YouTube SPA navigation (yt-navigate-finish resets state) ────────
  if (window.location.hostname.includes('youtube.com')) {
    document.addEventListener('yt-navigate-finish', () => {
      initialized = false
      provider = null
      teardownAutoFloat()
      setTimeout(() => pollInitialization(10), 1000)
    })
  }

  // ── Reactively apply Focus Mode when settings change ──────────────────────
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.floatSettings) {
        const newSettings = changes.floatSettings.newValue as FloatSettings | undefined
        const currentProvider = provider || detectProvider()
        if (newSettings && currentProvider) {
          if (newSettings.focusModeEnabled) {
            enableFocusMode(currentProvider.siteId)
          } else {
            disableFocusMode()
          }
        }
      }
    })
  }
}
