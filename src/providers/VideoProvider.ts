// VideoProvider – base interface for all site implementations
export interface TranscriptSegment {
  start: number   // seconds
  end: number
  text: string
}

export interface VideoProvider {
  name: string
  siteId: string
  matches: (url: string) => boolean
  getVideo: () => HTMLVideoElement | null
  getVideoId: () => string | null
  getTitle: () => string
  getDuration: () => number
  getCurrentTime: () => number
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
  setVolume: (level: number) => void    // 0–1
  setPlaybackRate: (rate: number) => void
  skipNext: () => void
  skipPrev: () => void
  fetchTranscript?: () => Promise<TranscriptSegment[]>
  isPlaying: () => boolean
}
