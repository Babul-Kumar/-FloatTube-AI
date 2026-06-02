import type { VideoProvider } from './VideoProvider'

// NOTE: Netflix has limited support due to DRM and player restrictions.
// Basic playback control works; volume and seek may be restricted.
export class NetflixProvider implements VideoProvider {
  name = 'Netflix'
  siteId = 'netflix'

  matches(url: string) { return url.includes('netflix.com') }
  getVideo(): HTMLVideoElement | null { return document.querySelector('video') }
  getVideoId(): string | null {
    const match = window.location.pathname.match(/\/watch\/([0-9]+)/)
    return match ? match[1] : null
  }
  getTitle(): string {
    return document.querySelector('.VideoContainer .VideoTitle')?.textContent?.trim() ??
           document.querySelector('[class*="title"]')?.textContent?.trim() ??
           document.title
  }
  getDuration(): number { return this.getVideo()?.duration ?? 0 }
  getCurrentTime(): number { return this.getVideo()?.currentTime ?? 0 }
  isPlaying(): boolean { const v = this.getVideo(); return !!(v && !v.paused && !v.ended) }
  play() { this.getVideo()?.play() }
  pause() { this.getVideo()?.pause() }
  seekTo(s: number) { const v = this.getVideo(); if (v) v.currentTime = s }
  setVolume(l: number) { const v = this.getVideo(); if (v) v.volume = l }
  setPlaybackRate(r: number) { const v = this.getVideo(); if (v) v.playbackRate = r }
  skipNext() {
    document.querySelector<HTMLButtonElement>('[data-uia="next-episode-seamless-button"]')?.click()
  }
  skipPrev() { const v = this.getVideo(); if (v) v.currentTime = Math.max(0, v.currentTime - 10) }
}
