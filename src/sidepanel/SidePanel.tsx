import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getNotes, addNote, deleteNote, getBookmarks, addBookmark, deleteBookmark } from '../storage/db'
import { getTranscript } from '../services/transcript'
import type { TranscriptSegment } from '../providers/VideoProvider'
import { jsPDF } from 'jspdf'

const TABS = [
  { id: 'notes', label: 'Notes' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'ai', label: 'AI' },
] as const

type TabId = typeof TABS[number]['id']

interface VideoState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  siteId: string
  title: string
  videoId: string
}

export default function SidePanel() {
  const [activeTab, setActiveTab] = useState<TabId>('notes')
  const [videoState, setVideoState] = useState<VideoState | null>(null)
  const [activeTabId, setActiveTabId] = useState<number | null>(null)

  // Listen to state changes from content script
  useEffect(() => {
    // 1. Initial query: try currently active tab first, then fall back to last video tab
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_STATE' }, (response) => {
            if (!chrome.runtime.lastError && response?.state) {
              setVideoState(response.state)
              setActiveTabId(tab.id ?? null)
            } else {
              // Active tab didn't have video, ask background script for the last video tab
              chrome.runtime.sendMessage({ type: 'GET_LAST_VIDEO_TAB' }, (res) => {
                if (res?.tabId) {
                  setActiveTabId(res.tabId ?? null)
                  chrome.tabs.sendMessage(res.tabId, { type: 'GET_VIDEO_STATE' }, (vResponse: any) => {
                    if (!chrome.runtime.lastError && vResponse?.state) {
                      setVideoState(vResponse.state)
                    }
                  })
                }
              })
            }
          })
        }
      })
    } else {
      // Mock active video state for standalone browser testing
      setVideoState({
        isPlaying: false,
        currentTime: 125,
        duration: 600,
        volume: 0.8,
        playbackRate: 1.0,
        siteId: 'youtube',
        title: 'Learn React in 10 Minutes - Tutorial for Beginners',
        videoId: 'dQw4w9WgXcQ'
      })
    }

    // 2. Message listener for runtime messages
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      const listener = (message: any, sender: any) => {
        if (message.type === 'VIDEO_STATE') {
          // Sync if sender is active, or if we have no activeTabId yet, or if it matches current tab we're tracking
          if (sender.tab?.active || !activeTabId || sender.tab?.id === activeTabId) {
            setVideoState(message.state)
            if (sender.tab?.id) {
              setActiveTabId(sender.tab.id)
            }
          }
        }
      }
      chrome.runtime.onMessage.addListener(listener)
      return () => chrome.runtime.onMessage.removeListener(listener)
    }
  }, [activeTabId])

  const handleSeek = (seconds: number) => {
    if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.sendMessage(activeTabId, { type: 'SEEK_TO', seconds })
    } else if (videoState) {
      setVideoState({ ...videoState, currentTime: seconds })
    }
  }

  const handlePlayPause = () => {
    if (activeTabId && videoState && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.sendMessage(activeTabId, {
        type: 'COMMAND',
        command: videoState.isPlaying ? 'pause' : 'play'
      })
    } else if (videoState) {
      setVideoState({ ...videoState, isPlaying: !videoState.isPlaying })
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #0f0f13 0%, #1a1a2e 100%)',
      fontFamily: "'Inter', sans-serif",
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 0',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>FloatTube AI</div>
          {videoState && (
            <div style={{
              fontSize: 11,
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '2px 8px',
              borderRadius: 20,
              color: '#818CF8',
              fontWeight: 500
            }}>
              Connected to {videoState.siteId}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '10px 2px',
              background: activeTab === tab.id ? 'rgba(99,102,241,0.12)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? '#818CF8' : 'transparent'}`,
              color: activeTab === tab.id ? '#818CF8' : '#aaa',
              fontSize: 14, cursor: 'pointer', fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}
          >
            {!videoState ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20, color: '#9ca3af', fontSize: 14 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📺</div>
                <div>No active video detected.</div>
                <div style={{ marginTop: 4, fontSize: 12 }}>Open YouTube or Udemy to begin.</div>
              </div>
            ) : (
              <>
                {activeTab === 'notes' && (
                  <NotesTab videoState={videoState} onSeek={handleSeek} onPlayPause={handlePlayPause} />
                )}
                {activeTab === 'transcript' && (
                  <TranscriptTab videoState={videoState} onSeek={handleSeek} />
                )}
                {activeTab === 'workspace' && (
                  <WorkspaceTab videoState={videoState} onSeek={handleSeek} />
                )}
                {activeTab === 'ai' && (
                  <AITab />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function NotesTab({ videoState, onSeek, onPlayPause }: { videoState: VideoState, onSeek: (s: number) => void, onPlayPause: () => void }) {
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const videoId = videoState.videoId

  const loadNotes = async () => {
    const res = await getNotes(videoId)
    res.sort((a, b) => a.timestamp - b.timestamp)
    setNotes(res)
  }

  useEffect(() => {
    loadNotes()
  }, [videoId])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    const timestamp = Math.floor(videoState.currentTime)
    await addNote({
      videoId,
      siteId: videoState.siteId,
      timestamp,
      content: newNote.trim()
    })
    setNewNote('')
    loadNotes()
  }

  const handleDelete = async (id: number) => {
    await deleteNote(id)
    loadNotes()
  }

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    const pad = (n: number) => (n < 10 ? '0' + n : n)
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
    return `${m}:${pad(s)}`
  }

  const exportAsMD = () => {
    let md = `# Notes: ${videoState.title}\n\n`
    notes.forEach((n: any) => {
      md += `* [${formatTime(n.timestamp)}] - ${n.content}\n`
    })
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${videoState.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`
    a.click()
  }

  const exportAsPDF = () => {
    const doc = new jsPDF()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text(`Notes: ${videoState.title}`, 10, 15)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    
    let y = 25
    notes.forEach((n: any) => {
      if (y > 280) {
        doc.addPage()
        y = 15
      }
      const timeStr = `[${formatTime(n.timestamp)}]`
      doc.setFont("helvetica", "bold")
      doc.text(timeStr, 10, y)
      doc.setFont("helvetica", "normal")
      
      const splitText = doc.splitTextToSize(n.content, 160)
      doc.text(splitText, 30, y)
      y += (splitText.length * 5) + 5
    })
    
    doc.save(`${videoState.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.pdf`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>VIDEO NOTES ({notes.length})</div>
        {notes.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={exportAsMD} style={{ ...BTN_STYLE, flex: 'none', padding: '4px 8px' }}>MD</button>
            <button onClick={exportAsPDF} style={{ ...BTN_STYLE, flex: 'none', padding: '4px 8px' }}>PDF</button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af', fontSize: 14 }}>
            No notes for this video yet. Add one below!
          </div>
        ) : (
          notes.map((n: any) => (
            <div key={n.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <button onClick={() => onSeek(n.timestamp)} style={{
                  background: 'rgba(99, 102, 241, 0.15)', border: 'none', borderRadius: 4,
                  color: '#818CF8', fontSize: 11, fontWeight: 600, padding: '2px 6px', cursor: 'pointer'
                }}>
                  ⏱️ {formatTime(n.timestamp)}
                </button>
                <button onClick={() => handleDelete(n.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
              </div>
              <div style={{ fontSize: 14, color: '#ccc', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{n.content}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={newNote}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
          placeholder={`Take a note at ${formatTime(videoState.currentTime)}...`}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: 10,
            color: '#ddd', fontSize: 14, resize: 'none',
            fontFamily: "'Inter', sans-serif", outline: 'none',
            height: 60, lineHeight: 1.4
          }}
        />
        <button type="submit" style={{
          background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
          border: 'none', borderRadius: 8, color: '#fff',
          fontSize: 14, fontWeight: 600, padding: '10px 14px', cursor: 'pointer'
        }}>Add</button>
      </form>
    </div>
  )
}

function TranscriptTab({ videoState, onSeek }: { videoState: VideoState, onSeek: (s: number) => void }) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    // Make a dummy provider object to query transcripts
    const dummyProvider = {
      getVideo: () => null,
      getVideoId: () => videoState.videoId,
      matches: (_url: string) => true,
      getTitle: () => videoState.title,
      getDuration: () => videoState.duration,
      getCurrentTime: () => videoState.currentTime,
      play: () => {},
      pause: () => {},
      seekTo: () => {},
      setVolume: () => {},
      setPlaybackRate: () => {},
      skipNext: () => {},
      skipPrev: () => {},
      isPlaying: () => videoState.isPlaying,
      siteId: videoState.siteId,
      name: videoState.siteId,
      fetchTranscript: async () => {
        if (videoState.siteId === 'youtube') {
          const res = await fetch(`https://www.youtube.com/api/timedtext?lang=en&v=${videoState.videoId}&fmt=json3`)
          if (res.ok) {
            const data = await res.json()
            return (data.events || []).filter((e: any) => e.segs).map((e: any) => ({
              start: (e.tStartMs || 0) / 1000,
              end: ((e.tStartMs || 0) + (e.dDurationMs || 2000)) / 1000,
              text: e.segs.map((s: any) => s.utf8 || '').join('').trim()
            })).filter((s: any) => s.text)
          }
        }
        return []
      }
    }

    getTranscript(dummyProvider).then(res => {
      setSegments(res)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [videoState.videoId])

  const activeIndex = segments.findIndex(
    (s: TranscriptSegment) => videoState.currentTime >= s.start && videoState.currentTime <= s.end
  )

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [activeIndex])

  const filtered = segments.filter((s: TranscriptSegment) => s.text.toLowerCase().includes(search.toLowerCase()))

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16 }}>
      <input
        type="text"
        placeholder="Search transcript..."
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '8px 10px',
          color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12
        }}
      />
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 14 }}>Loading transcript...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 14 }}>No matching lines.</div>
        ) : (
          filtered.map((seg: TranscriptSegment, idx: number) => {
            const isActive = segments.indexOf(seg) === activeIndex
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(seg.start)}
                style={{
                  padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 14, lineHeight: 1.4,
                  backgroundColor: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: isActive ? '#818CF8' : '#aaa',
                  borderLeft: isActive ? '2px solid #6366F1' : '2px solid transparent'
                }}
              >
                <span style={{ fontWeight: 600, marginRight: 8, color: isActive ? '#818CF8' : '#9ca3af', fontSize: 11 }}>
                  [{formatTime(seg.start)}]
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

function AITab() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>AI ASSISTANT</div>
      <div style={{
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 10, padding: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>AI Pack – Coming Soon</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>Add your Gemini API key in Settings to enable AI summaries, chat, flashcards, and quizzes.</div>
      </div>
    </div>
  )
}

function WorkspaceTab({ videoState, onSeek }: { videoState: VideoState, onSeek: (s: number) => void }) {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const videoId = videoState.videoId

  const loadBookmarks = async () => {
    const res = await getBookmarks(videoId)
    res.sort((a, b) => a.timestamp - b.timestamp)
    setBookmarks(res)
  }

  useEffect(() => {
    loadBookmarks()
  }, [videoId])

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBookmarkLabel.trim()) return

    const timestamp = Math.floor(videoState.currentTime)
    await addBookmark({
      videoId,
      siteId: videoState.siteId,
      timestamp,
      label: newBookmarkLabel.trim()
    })
    setNewBookmarkLabel('')
    loadBookmarks()
  }

  const handleDeleteBookmark = async (id: number) => {
    await deleteBookmark(id)
    loadBookmarks()
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`
    window.open(url, '_blank')
    setSearchQuery('')
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16, gap: 16 }}>
      {/* Bookmarks Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>BOOKMARKS & CHAPTERS ({bookmarks.length})</div>
        
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 14 }}>
              No bookmarks yet. Add key moments below!
            </div>
          ) : (
            bookmarks.map((bm: any) => (
              <div key={bm.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8, padding: '8px 10px', gap: 10
              }}>
                <button onClick={() => onSeek(bm.timestamp)} style={{
                  background: 'rgba(99, 102, 241, 0.15)', border: 'none', borderRadius: 4,
                  color: '#818CF8', fontSize: 11, fontWeight: 600, padding: '3px 8px', cursor: 'pointer',
                  flexShrink: 0
                }}>
                  ⏱️ {formatTime(bm.timestamp)}
                </button>
                <div style={{ flex: 1, fontSize: 14, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bm.label}
                </div>
                <button onClick={() => handleDeleteBookmark(bm.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: 0 }}>🗑️</button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddBookmark} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder={`Add bookmark at ${formatTime(videoState.currentTime)}...`}
            value={newBookmarkLabel}
            onChange={(e) => setNewBookmarkLabel(e.target.value)}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '8px 10px',
              color: '#fff', fontSize: 14, outline: 'none',
              fontFamily: "'Inter', sans-serif"
            }}
          />
          <button type="submit" style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            border: 'none', borderRadius: 8, color: '#fff',
            fontSize: 14, fontWeight: 600, padding: '8px 14px', cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}>Save</button>
        </form>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

      {/* Google Search Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>WEB SEARCH</div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Search Google inline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '8px 10px',
              color: '#fff', fontSize: 14, outline: 'none',
              fontFamily: "'Inter', sans-serif"
            }}
          />
          <button type="submit" style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            border: 'none', borderRadius: 8, color: '#fff',
            fontSize: 14, fontWeight: 600, padding: '8px 14px', cursor: 'pointer'
          }}>Search</button>
        </form>
      </div>
    </div>
  )
}

const BTN_STYLE: React.CSSProperties = {
  flex: 1, padding: '8px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#aaa',
  fontSize: 11, cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
}
