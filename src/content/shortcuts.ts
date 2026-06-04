import { pipManager } from './pipManager'
import type { VideoProvider } from '../providers/VideoProvider'

let provider: VideoProvider | null = null

export function setShortcutProvider(p: VideoProvider) {
  provider = p
  pipManager.setProvider(p)
}

/**
 * Handle keyboard shortcut commands forwarded from the background service worker.
 * `toggle-float` uses native browser PiP; all others use the provider API directly.
 */
export function handleCommand(command: string) {
  switch (command) {
    case 'toggle-float':
      // Guard: only attempt PiP if provider and video are available
      if (!provider) return
      pipManager.togglePiP()
      break

    case 'play-pause':
      if (provider?.isPlaying()) provider.pause()
      else provider?.play()
      break

    case 'vol-up':
      if (provider) {
        const v = provider.getVideo()
        if (v) provider.setVolume(Math.min(1, v.volume + 0.1))
      }
      break

    case 'vol-down':
      if (provider) {
        const v = provider.getVideo()
        if (v) provider.setVolume(Math.max(0, v.volume - 0.1))
      }
      break

    case 'skip-forward':
      if (provider) {
        const v = provider.getVideo()
        if (v) provider.seekTo(v.currentTime + 10)
      }
      break

    case 'skip-back':
      if (provider) {
        const v = provider.getVideo()
        if (v) provider.seekTo(Math.max(0, v.currentTime - 10))
      }
      break
  }
}
