import type { VideoProvider } from './VideoProvider'

export class PrimeVideoProvider implements VideoProvider {
  name = 'Prime Video'
  siteId = 'primevideo'

  matches(url: string) {
    return url.includes('primevideo.com') ||
           (url.includes('amazon.com') && (url.includes('/video/') || url.includes('gp/video')))
  }
  getVideo(): HTMLVideoElement | null { return document.querySelector('video') }
  getVideoId(): string | null {
    const match = window.location.pathname.match(/\/detail\/([A-Z0-9]+)/)
    return match ? match[1] : null
  }
  getTitle(): string {
    return document.querySelector('[class*="title"]')?.textContent?.trim() ?? document.title
  }
  getDuration(): number { return this.getVideo()?.duration ?? 0 }
  getCurrentTime(): number { return this.getVideo()?.currentTime ?? 0 }
  isPlaying(): boolean { const v = this.getVideo(); return !!(v && !v.paused && !v.ended) }
  play() { this.getVideo()?.play() }
  pause() { this.getVideo()?.pause() }
  seekTo(s: number) { const v = this.getVideo(); if (v) v.currentTime = s }
  setVolume(l: number) { const v = this.getVideo(); if (v) v.volume = l }
  setPlaybackRate(r: number) { const v = this.getVideo(); if (v) v.playbackRate = r }
  skipNext() { document.querySelector<HTMLButtonElement>('[class*="nextButton"]')?.click() }
  skipPrev() { document.querySelector<HTMLButtonElement>('[class*="prevButton"]')?.click() }
}
