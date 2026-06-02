import type { VideoProvider } from './VideoProvider'

export class UdemyProvider implements VideoProvider {
  name = 'Udemy'
  siteId = 'udemy'

  matches(url: string) {
    return url.includes('udemy.com')
  }

  getVideo(): HTMLVideoElement | null {
    return document.querySelector('video') 
  }

  getVideoId(): string | null {
    const match = window.location.pathname.match(/\/course\/([^/]+).*\/([0-9]+)/)
    return match ? match[2] : null
  }

  getTitle(): string {
    return document.querySelector('[data-purpose="course-title"]')?.textContent?.trim() ??
           document.title
  }

  getDuration(): number { return this.getVideo()?.duration ?? 0 }
  getCurrentTime(): number { return this.getVideo()?.currentTime ?? 0 }
  isPlaying(): boolean {
    const v = this.getVideo()
    return !!(v && !v.paused && !v.ended)
  }
  play() { this.getVideo()?.play() }
  pause() { this.getVideo()?.pause() }
  seekTo(s: number) { const v = this.getVideo(); if (v) v.currentTime = s }
  setVolume(l: number) { const v = this.getVideo(); if (v) v.volume = l }
  setPlaybackRate(r: number) { const v = this.getVideo(); if (v) v.playbackRate = r }
  skipNext() { document.querySelector<HTMLButtonElement>('[data-purpose="go-to-next-lecture"]')?.click() }
  skipPrev() { document.querySelector<HTMLButtonElement>('[data-purpose="go-to-previous-lecture"]')?.click() }
}
