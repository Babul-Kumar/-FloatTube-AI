import { pipManager } from './pipManager'
import { getSettings } from '../storage/settings'
import { detectProvider } from '../providers/registry'

let attached = false
let cleanupFns: Array<() => void> = []
const pendingTimeouts = new Set<number>()

function setManagedTimeout(callback: () => void, delay: number) {
  const timeoutId = window.setTimeout(() => {
    pendingTimeouts.delete(timeoutId)
    callback()
  }, delay)
  pendingTimeouts.add(timeoutId)
}

/**
 * Set up event listeners for auto-float triggers.
 * Guards against double-attachment with the `attached` flag.
 * Each trigger checks that the video is actively playing before requesting PiP,
 * and uses a 600 ms debounce so that brief focus changes (e.g. opening the
 * extension popup) don't immediately trigger the float.
 */
export async function setupAutoFloat() {
  if (attached) return
  attached = true
  cleanupFns = []

  const settings = await getSettings()
  const provider = detectProvider()
  const video = provider?.getVideo()

  // Sync the native `autoPictureInPicture` attribute with the setting.
  if (video) {
    try {
      ;(video as any).autoPictureInPicture = !!settings.autoFloatOnTabChange
      if (settings.autoFloatOnTabChange) {
        video.setAttribute('autopictureinpicture', 'true')
      } else {
        video.removeAttribute('autopictureinpicture')
      }
    } catch {
      // Ignore; some browsers do not support this attribute.
    }
  }

  if (settings.autoFloatOnTabChange) {
    const onVisibilityChange = () => {
      if (!document.hidden) return

      const currentProvider = detectProvider()
      const currentVideo = currentProvider?.getVideo()
      if (!currentVideo || currentVideo.paused || currentVideo.ended) return

      let cancelled = false
      const cancelIfVisible = () => {
        cancelled = true
      }

      document.addEventListener('visibilitychange', cancelIfVisible, { once: true })

      setManagedTimeout(async () => {
        document.removeEventListener('visibilitychange', cancelIfVisible)
        if (cancelled || !document.hidden || pipManager.isPiPActive()) return

        try {
          await pipManager.requestPiP()
        } catch {
          // Suppress; browser gesture requirements can still block PiP.
        }
      }, 600)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    cleanupFns.push(() => document.removeEventListener('visibilitychange', onVisibilityChange))
  }

  if (settings.autoFloatOnWindowBlur) {
    const onBlur = () => {
      const currentProvider = detectProvider()
      const currentVideo = currentProvider?.getVideo()
      if (!currentVideo || currentVideo.paused || currentVideo.ended) return

      setManagedTimeout(async () => {
        if (document.hasFocus() || pipManager.isPiPActive()) return

        try {
          await pipManager.requestPiP()
        } catch {
          // Suppress.
        }
      }, 600)
    }

    window.addEventListener('blur', onBlur)
    cleanupFns.push(() => window.removeEventListener('blur', onBlur))
  }

  if (settings.autoFloatOnPageHide) {
    const onPageHide = async () => {
      const currentProvider = detectProvider()
      const currentVideo = currentProvider?.getVideo()
      if (!currentVideo || currentVideo.paused || currentVideo.ended) return
      if (pipManager.isPiPActive()) return

      try {
        await pipManager.requestPiP()
      } catch {
        // Suppress.
      }
    }

    window.addEventListener('pagehide', onPageHide)
    cleanupFns.push(() => window.removeEventListener('pagehide', onPageHide))
  }
}

/** Reset auto-float listeners so SPA navigation can re-attach them cleanly. */
export function teardownAutoFloat() {
  cleanupFns.forEach((cleanup) => cleanup())
  cleanupFns = []

  pendingTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
  pendingTimeouts.clear()

  attached = false
}
