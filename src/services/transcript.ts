import type { VideoProvider, TranscriptSegment } from '../providers/VideoProvider'

export async function getTranscript(provider: VideoProvider): Promise<TranscriptSegment[]> {
  if (provider.fetchTranscript) {
    try {
      const segments = await provider.fetchTranscript()
      if (segments && segments.length > 0) return segments
    } catch (e) {
      console.warn('[FloatTube] Failed to fetch provider transcript:', e)
    }
  }

  // Fallback: search for track element in the page
  const video = provider.getVideo()
  if (!video) return []

  const tracks = Array.from(video.querySelectorAll('track'))
  const captionTrack = tracks.find(t => t.kind === 'captions' || t.kind === 'subtitles')
  if (captionTrack && captionTrack.src) {
    try {
      const res = await fetch(captionTrack.src)
      const text = await res.text()
      return parseWebVTT(text)
    } catch (e) {
      console.warn('[FloatTube] Failed to fetch WebVTT track:', e)
    }
  }

  return []
}

function parseWebVTT(text: string): TranscriptSegment[] {
  // Simple WebVTT parser
  const lines = text.split(/\r?\n/)
  const segments: TranscriptSegment[] = []
  let currentSegment: Partial<TranscriptSegment> | null = null

  const timeRegex = /(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/
  const simpleTimeRegex = /(\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}\.\d{3})/

  const parseTime = (t: string): number => {
    const parts = t.split(':')
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
    } else {
      return parseInt(parts[0]) * 60 + parseFloat(parts[1])
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const match = line.match(timeRegex) || line.match(simpleTimeRegex)
    if (match) {
      if (currentSegment && currentSegment.text) {
        segments.push(currentSegment as TranscriptSegment)
      }
      currentSegment = {
        start: parseTime(match[1]),
        end: parseTime(match[2]),
        text: ''
      }
    } else if (currentSegment && !line.match(/^\d+$/) && line !== 'WEBVTT') {
      currentSegment.text = (currentSegment.text ? currentSegment.text + ' ' : '') + line
    }
  }

  if (currentSegment && currentSegment.text) {
    segments.push(currentSegment as TranscriptSegment)
  }

  return segments
}
