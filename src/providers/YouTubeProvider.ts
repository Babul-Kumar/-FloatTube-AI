import type { VideoProvider, TranscriptSegment } from './VideoProvider'

export class YouTubeProvider implements VideoProvider {
  name = 'YouTube'
  siteId = 'youtube'

  matches(url: string) {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  getVideo(): HTMLVideoElement | null {
    return document.querySelector('video.html5-main-video') ||
           document.querySelector('video')
  }

  getVideoId(): string | null {
    const params = new URLSearchParams(window.location.search)
    return params.get('v')
  }

  getTitle(): string {
    return document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent?.trim() ??
           document.title.replace(' - YouTube', '')
  }

  getDuration(): number {
    return this.getVideo()?.duration ?? 0
  }

  getCurrentTime(): number {
    return this.getVideo()?.currentTime ?? 0
  }

  isPlaying(): boolean {
    const v = this.getVideo()
    return !!(v && !v.paused && !v.ended)
  }

  play() { this.getVideo()?.play() }
  pause() { this.getVideo()?.pause() }

  seekTo(seconds: number) {
    const v = this.getVideo()
    if (v) v.currentTime = seconds
  }

  setVolume(level: number) {
    const v = this.getVideo()
    if (v) v.volume = Math.max(0, Math.min(1, level))
  }

  setPlaybackRate(rate: number) {
    const v = this.getVideo()
    if (v) v.playbackRate = rate
  }

  skipNext() {
    const btn = document.querySelector('.ytp-next-button') as HTMLButtonElement
    btn?.click()
  }

  skipPrev() {
    const v = this.getVideo()
    if (v) v.currentTime = Math.max(0, v.currentTime - 10)
  }

  async fetchTranscript(): Promise<TranscriptSegment[]> {
    const videoId = this.getVideoId()
    if (!videoId) return []
    try {
      // Try to get transcript via YouTube's timedtext API
      const res = await fetch(
        `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3`
      )
      if (!res.ok) throw new Error('No transcript')
      const data = await res.json()
      return (data.events || []).filter((e: any) => e.segs).map((e: any) => ({
        start: (e.tStartMs || 0) / 1000,
        end: ((e.tStartMs || 0) + (e.dDurationMs || 2000)) / 1000,
        text: e.segs.map((s: any) => s.utf8 || '').join('').trim(),
      })).filter((s: TranscriptSegment) => s.text)
    } catch {
      return []
    }
  }
}
