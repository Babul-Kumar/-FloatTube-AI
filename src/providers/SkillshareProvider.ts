import type { VideoProvider } from './VideoProvider'

export class SkillshareProvider implements VideoProvider {
  name = 'Skillshare'
  siteId = 'skillshare'

  matches(url: string) { return url.includes('skillshare.com') }
  getVideo(): HTMLVideoElement | null { return document.querySelector('video') }
  getVideoId(): string | null {
    const match = window.location.pathname.match(/\/classes\/[^/]+\/([0-9]+)/)
    return match ? match[1] : null
  }
  getTitle(): string {
    return document.querySelector('h1')?.textContent?.trim() ?? document.title
  }
  getDuration(): number { return this.getVideo()?.duration ?? 0 }
  getCurrentTime(): number { return this.getVideo()?.currentTime ?? 0 }
  isPlaying(): boolean { const v = this.getVideo(); return !!(v && !v.paused && !v.ended) }
  play() { this.getVideo()?.play() }
  pause() { this.getVideo()?.pause() }
  seekTo(s: number) { const v = this.getVideo(); if (v) v.currentTime = s }
  setVolume(l: number) { const v = this.getVideo(); if (v) v.volume = l }
  setPlaybackRate(r: number) { const v = this.getVideo(); if (v) v.playbackRate = r }
  skipNext() { document.querySelector<HTMLButtonElement>('[class*="nextLesson"]')?.click() }
  skipPrev() { document.querySelector<HTMLButtonElement>('[class*="prevLesson"]')?.click() }
}
