import React, { useState, useEffect } from 'react'
import { getBookmarks, addBookmark, deleteBookmark } from '../../storage/db'
import type { VideoProvider } from '../../providers/VideoProvider'

interface Props {
  provider: VideoProvider
  currentTime: number
  onSeek: (seconds: number) => void
}

export function BookmarkList({ provider, currentTime, onSeek }: Props) {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [label, setLabel] = useState('')
  const videoId = provider.getVideoId() || 'unknown'
  const siteId = provider.siteId

  const loadBookmarks = async () => {
    try {
      const res = await getBookmarks(videoId)
      res.sort((a, b) => a.timestamp - b.timestamp)
      setBookmarks(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadBookmarks()
  }, [videoId])

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    const timestamp = Math.floor(currentTime)
    const displayLabel = label.trim() || `Bookmark @ ${formatTime(timestamp)}`

    try {
      await addBookmark({
        videoId,
        siteId,
        timestamp,
        label: displayLabel,
      })
      setLabel('')
      loadBookmarks()
    } catch (err) {
      console.error('Failed to add bookmark:', err)
    }
  }

  const handleDeleteBookmark = async (id: number) => {
    try {
      await deleteBookmark(id)
      loadBookmarks()
    } catch (err) {
      console.error(err)
    }
  }

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    const pad = (n: number) => (n < 10 ? '0' + n : n)
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
    return `${m}:${pad(s)}`
  }

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
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: 13,
          fontWeight: 600,
          color: '#888',
        }}
      >
        BOOKMARKS ({bookmarks.length})
      </div>

      {/* Bookmarks list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {bookmarks.length === 0 ? (
          <div style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            No bookmarks created yet.
          </div>
        ) : (
          bookmarks.map((bm, index) => (
            <div
              key={bm.id || index}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                onClick={() => onSeek(bm.timestamp)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                <span
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderRadius: 4,
                    color: '#818CF8',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⏱️ {formatTime(bm.timestamp)}
                </span>
                <span style={{ fontSize: 14, color: '#ddd', fontWeight: 500 }}>{bm.label}</span>
              </div>
              <button
                onClick={() => handleDeleteBookmark(bm.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 13,
                  cursor: 'pointer',
                  opacity: 0.6,
                  padding: '2px 6px',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      <form
        onSubmit={handleAddBookmark}
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: 8,
          display: 'flex',
          gap: 6,
        }}
      >
        <input
          type="text"
          placeholder="Bookmark label (optional)..."
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            padding: '6px 10px',
            color: '#fff',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            padding: '6px 12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Bookmark
        </button>
      </form>
    </div>
  )
}
