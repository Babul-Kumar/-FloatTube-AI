import type { VideoProvider } from './VideoProvider'

// Fallback: finds the largest <video> element on the page
export class GenericHTML5Provider implements VideoProvider {
  name = 'Generic HTML5'
  siteId = 'generic'

  matches(_url: string) { return true } // Always matches as fallback

  getVideo(): HTMLVideoElement | null {
    const videos = Array.from(document.querySelectorAll('video'))
    if (!videos.length) return null
    // Return the video with the largest visible area
    return videos.reduce((best, v) => {
      const r = v.getBoundingClientRect()
      const area = r.width * r.height
      const bR = best.getBoundingClientRect()
      return area > bR.width * bR.height ? v : best
    })
  }

  getVideoId(): string | null {
    return window.location.pathname + window.location.search
  }

  getTitle(): string { return document.title }
  getDuration(): number { return this.getVideo()?.duration ?? 0 }
  getCurrentTime(): number { return this.getVideo()?.currentTime ?? 0 }
  isPlaying(): boolean { const v = this.getVideo(); return !!(v && !v.paused && !v.ended) }
  play() { this.getVideo()?.play() }
  pause() { this.getVideo()?.pause() }
  seekTo(s: number) { const v = this.getVideo(); if (v) v.currentTime = s }
  setVolume(l: number) { const v = this.getVideo(); if (v) v.volume = l }
  setPlaybackRate(r: number) { const v = this.getVideo(); if (v) v.playbackRate = r }
  skipNext() {}
  skipPrev() {}
}
