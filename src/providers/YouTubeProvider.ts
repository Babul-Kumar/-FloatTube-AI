import type { VideoProvider, TranscriptSegment } from './VideoProvider'

export class YouTubeProvider implements VideoProvider {
  name = 'YouTube'
  siteId = 'youtube'

  matches(url: string) {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  getVideo(): HTMLVideoElement | null {
    return (
      document.querySelector('video.html5-main-video') ||
      document.querySelector('video')
    )
  }

  getVideoId(): string | null {
    const params = new URLSearchParams(window.location.search)
    const v = params.get('v')
    if (v) return v

    // Handle youtu.be/ID
    const match = window.location.pathname.match(/\/([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  getTitle(): string {
    const titleEl =
      document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') ||
      document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
      document.querySelector('#title h1') ||
      document.querySelector('h1')
    return titleEl?.textContent?.trim() || document.title.replace(' - YouTube', '').trim()
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

  play() {
    this.getVideo()?.play()
  }

  pause() {
    this.getVideo()?.pause()
  }

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

    // Strategy 1: Attempt to extract caption tracks from ytInitialPlayerResponse
    const playerTrackUrl = this.getCaptionTrackFromPlayerResponse()
    if (playerTrackUrl) {
      try {
        // Try raw baseUrl first (which may be XML or JSON signed URL)
        let segs = await this.fetchAndParseTimedText(playerTrackUrl).catch(() => [])
        if (segs.length === 0 && !playerTrackUrl.includes('fmt=')) {
          // If raw url didn't return segments, try json3 format
          const json3Url = `${playerTrackUrl}&fmt=json3`
          segs = await this.fetchAndParseTimedText(json3Url).catch(() => [])
        }
        if (segs.length > 0) return segs
      } catch {
        // Fallback smoothly to direct endpoints without logging noisy errors
      }
    }

    // Strategy 2: Direct timedtext endpoints (English, ASR, en-US)
    const directEndpoints = [
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3`,
      `https://www.youtube.com/api/timedtext?lang=en&kind=asr&v=${videoId}&fmt=json3`,
      `https://www.youtube.com/api/timedtext?lang=en-US&v=${videoId}&fmt=json3`,
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
    ]

    for (const url of directEndpoints) {
      try {
        const segs = await this.fetchAndParseTimedText(url)
        if (segs.length > 0) return segs
      } catch {
        // Try next endpoint
      }
    }

    // Strategy 3: Check DOM for rendered transcript elements if open
    const domSegments = this.extractTranscriptFromDOM()
    if (domSegments.length > 0) return domSegments

    return []
  }

  private getCaptionTrackFromPlayerResponse(): string | null {
    try {
      // 1. Check window.ytInitialPlayerResponse if accessible
      const playerResp = (window as any).ytInitialPlayerResponse
      const tracks = playerResp?.captions?.playerCaptionsTracklistRenderer?.captionTracks
      if (Array.isArray(tracks) && tracks.length > 0) {
        // Find English track first, or fallback to first track
        const enTrack =
          tracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en') || t.vssId?.includes('.en')) ||
          tracks[0]
        return enTrack?.baseUrl || null
      }

      // 2. Check script tags for ytInitialPlayerResponse
      const scripts = Array.from(document.querySelectorAll('script'))
      for (const s of scripts) {
        if (s.textContent && s.textContent.includes('ytInitialPlayerResponse')) {
          const match = s.textContent.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/)
          if (match && match[1]) {
            const data = JSON.parse(match[1])
            const tr = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks
            if (Array.isArray(tr) && tr.length > 0) {
              const selected =
                tr.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en') || t.vssId?.includes('.en')) ||
                tr[0]
              return selected?.baseUrl || null
            }
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null
  }

  private async fetchAndParseTimedText(url: string): Promise<TranscriptSegment[]> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`)

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('json') || url.includes('fmt=json3')) {
      const data = await res.json()
      if (data.events && Array.isArray(data.events)) {
        return data.events
          .filter((e: any) => e.segs && Array.isArray(e.segs))
          .map((e: any) => {
            const text = e.segs.map((s: any) => s.utf8 || '').join('').trim()
            const start = (e.tStartMs || 0) / 1000
            const duration = (e.dDurationMs || 2000) / 1000
            return {
              start,
              end: start + duration,
              text,
            }
          })
          .filter((s: TranscriptSegment) => s.text.length > 0)
      }
    }

    // Fallback: XML timedtext parsing
    const xmlText = await res.text()
    if (xmlText.includes('<transcript>') || xmlText.includes('<text')) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlText, 'text/xml')
      const textNodes = Array.from(doc.querySelectorAll('text'))
      return textNodes.map((node) => {
        const start = parseFloat(node.getAttribute('start') || '0')
        const dur = parseFloat(node.getAttribute('dur') || '2')
        return {
          start,
          end: start + dur,
          text: node.textContent?.trim() || '',
        }
      }).filter((s) => s.text.length > 0)
    }

    return []
  }

  private extractTranscriptFromDOM(): TranscriptSegment[] {
    const segments: TranscriptSegment[] = []
    const renderedSegments = document.querySelectorAll(
      'ytd-transcript-segment-renderer, ytd-transcript-segment-list-renderer [role="button"]',
    )

    renderedSegments.forEach((el) => {
      const timeEl = el.querySelector('.segment-timestamp, [class*="timestamp"]')
      const textEl = el.querySelector('.segment-text, [class*="text"]')
      if (timeEl && textEl) {
        const timeStr = timeEl.textContent?.trim() || '0:00'
        const parts = timeStr.split(':').map((p) => parseInt(p, 10))
        let secs = 0
        if (parts.length === 3) secs = parts[0] * 3600 + parts[1] * 60 + parts[2]
        else if (parts.length === 2) secs = parts[0] * 60 + parts[1]

        segments.push({
          start: secs,
          end: secs + 3,
          text: textEl.textContent?.trim() || '',
        })
      }
    })

    return segments
  }
}
