import React, { useState } from 'react'
import type { VideoProvider } from '../../providers/VideoProvider'
import { NotesPanel } from '../NotesPanel/NotesPanel'
import { BookmarkList } from '../Bookmarks/BookmarkList'

interface Props {
  provider: VideoProvider
  currentTime: number
  onSeek: (seconds: number) => void
}

export function MiniWorkspace({ provider, currentTime, onSeek }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'bookmarks' | 'search'>('notes')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`
    window.open(url, '_blank')
    setSearchQuery('')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0f0f13',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Sub tabs header */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#161622',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          height: 30,
        }}
      >
        {(['notes', 'bookmarks', 'search'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            style={{
              flex: 1,
              background: activeSubTab === tab ? '#13131a' : 'transparent',
              border: 'none',
              borderBottom: activeSubTab === tab ? '2px solid #6366F1' : '2px solid transparent',
              color: activeSubTab === tab ? '#818CF8' : '#777',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'notes' && '📝 Notes'}
            {tab === 'bookmarks' && '⏱️ Bookmarks'}
            {tab === 'search' && '🔍 Search'}
          </button>
        ))}
      </div>

      {/* Sub tab content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeSubTab === 'notes' && (
          <NotesPanel provider={provider} currentTime={currentTime} onSeek={onSeek} />
        )}
        {activeSubTab === 'bookmarks' && (
          <BookmarkList provider={provider} currentTime={currentTime} onSeek={onSeek} />
        )}
        {activeSubTab === 'search' && (
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              backgroundColor: '#13131a',
              height: '100%',
              fontFamily: 'Inter, sans-serif',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 13, color: '#aaa', fontWeight: 500 }}>
              Search the web without interrupting your video:
            </div>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="Google search query..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
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
                }}
              >
                Go
              </button>
            </form>
            <div style={{ fontSize: 12, color: '#555', marginTop: 10 }}>
              * Results will open in a new tab so you can browse resources alongside your study session.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
