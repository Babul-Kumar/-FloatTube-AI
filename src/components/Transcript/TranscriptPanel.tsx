import { useEffect, useRef, useState } from 'react'
import type { VideoProvider, TranscriptSegment } from '../../providers/VideoProvider'
import { getTranscript } from '../../services/transcript'

interface Props {
  provider: VideoProvider
  currentTime: number
  onSeek: (seconds: number) => void
}

export function TranscriptPanel({ provider, currentTime, onSeek }: Props) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    getTranscript(provider).then(res => {
      setSegments(res)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [provider])

  // Find active segment
  const activeIndex = segments.findIndex(
    s => currentTime >= s.start && currentTime <= s.end
  )

  // Auto scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [activeIndex])

  const filteredSegments = segments.filter(s =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#13131a',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Search Input */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <input
          type="text"
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 10px',
            color: '#fff',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Transcript content */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {loading ? (
          <div style={{ color: '#888', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
            Loading transcript...
          </div>
        ) : filteredSegments.length === 0 ? (
          <div style={{ color: '#666', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
            {segments.length === 0 ? 'No transcript available.' : 'No matches found.'}
          </div>
        ) : (
          filteredSegments.map((seg, idx) => {
            const isActive = segments.indexOf(seg) === activeIndex
            const timeStr = formatTime(seg.start)
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(seg.start)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  lineHeight: '1.4',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#818CF8' : '#ccc',
                  borderLeft: isActive ? '2px solid #6366F1' : '2px solid transparent',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    marginRight: 8,
                    color: isActive ? '#6366F1' : '#666',
                    fontSize: 10,
                  }}
                >
                  [{timeStr}]
                </span>
                {seg.text}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
