import { pipManager } from './pipManager'
import { getSettings } from '../storage/settings'
import { detectProvider } from '../providers/registry'

let attached = false

export async function setupAutoFloat() {
  if (attached) return
  attached = true

  const settings = await getSettings()
  const provider = detectProvider()
  const video = provider?.getVideo()

  if (video) {
    if (settings.autoFloatOnTabChange) {
      try {
        (video as any).autoPictureInPicture = true
        video.setAttribute('autopictureinpicture', 'true')
      } catch (e) {
        console.warn('[FloatTube] Failed to set autoPictureInPicture attribute:', e)
      }
    } else {
      try {
        (video as any).autoPictureInPicture = false
        video.removeAttribute('autopictureinpicture')
      } catch (e) {
        // ignore
      }
    }
  }

  // Tab switch / hidden
  if (settings.autoFloatOnTabChange) {
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden && !pipManager.isPiPActive()) {
        try {
          await pipManager.requestPiP()
        } catch (e) {
          // Suppress browser gesture restriction warnings on visibilitychange
        }
      }
    })
  }

  // Window blur (minimize or alt+tab away from Chrome)
  if (settings.autoFloatOnWindowBlur) {
    window.addEventListener('blur', async () => {
      if (!pipManager.isPiPActive()) {
        try {
          await pipManager.requestPiP()
        } catch (e) {
          // Suppress
        }
      }
    })
  }

  // Page unload / navigation (e.g. clicking a link)
  if (settings.autoFloatOnPageHide) {
    window.addEventListener('pagehide', async () => {
      if (!pipManager.isPiPActive()) {
        try {
          await pipManager.requestPiP()
        } catch (e) {
          // Suppress
        }
      }
    })
  }
}

export function teardownAutoFloat() {
  attached = false
}
