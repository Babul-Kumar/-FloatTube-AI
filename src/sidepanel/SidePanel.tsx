import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  getBookmarks,
  addBookmark,
  updateBookmark,
  deleteBookmark,
  getAICache,
  getLatestAICacheForVideo,
  type Note,
  type Bookmark,
} from '../storage/db'
import type { TranscriptSegment } from '../providers/VideoProvider'
import type { VideoSummary } from '../services/ai/types'
import { AIStudio } from '../components/AI/AIStudio'
import { jsPDF } from 'jspdf'

const TABS = [
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'transcript', label: 'Transcript', icon: '📄' },
  { id: 'workspace', label: 'Workspace', icon: '💼' },
  { id: 'ai', label: 'AI Studio', icon: '✨' },
] as const

type TabId = (typeof TABS)[number]['id']

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

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: '#f1f5f9',
  textMid: '#cbd5e1',
  textDim: '#94a3b8',
  textGhost: '#64748b',
  accent: '#818CF8',
  accentBg: 'rgba(99,102,241,0.15)',
  accentBorder: 'rgba(99,102,241,0.3)',
  border: 'rgba(255,255,255,0.10)',
  cardBg: 'rgba(255,255,255,0.05)',
  inputBg: 'rgba(255,255,255,0.07)',
  danger: '#f87171',
}

const INPUT: React.CSSProperties = {
  width: '100%',
  background: C.inputBg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '10px 12px',
  color: C.text,
  fontSize: 13,
  outline: 'none',
  fontFamily: "'Inter', sans-serif",
}

const BTN_PRIMARY: React.CSSProperties = {
  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  padding: '10px 16px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const BTN_GHOST: React.CSSProperties = {
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  color: C.textMid,
  fontSize: 12,
  fontWeight: 600,
  padding: '4px 10px',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: C.textDim,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 8,
}

export default function SidePanel() {
  const [activeTab, setActiveTab] = useState<TabId>('notes')
  const [videoState, setVideoState] = useState<VideoState | null>(null)
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([])
  const [transcriptLoading, setTranscriptLoading] = useState(false)

  const handleClosePanel = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.sidePanel?.close) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (typeof tab?.windowId === 'number') {
          await chrome.sidePanel.close({ windowId: tab.windowId })
          return
        }
      }
    } catch {
      // fallback
    }
    window.close()
  }

  // Load active video state
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab?.id) return
        chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_STATE' }, (res) => {
          if (!chrome.runtime.lastError && res?.state) {
            setVideoState(res.state)
            setActiveTabId(tab.id ?? null)
          } else {
            chrome.runtime.sendMessage({ type: 'GET_LAST_VIDEO_TAB' }, (r) => {
              if (!r?.tabId) return
              setActiveTabId(r.tabId)
              chrome.tabs.sendMessage(r.tabId, { type: 'GET_VIDEO_STATE' }, (vr: any) => {
                if (!chrome.runtime.lastError && vr?.state) setVideoState(vr.state)
              })
            })
          }
        })
      })
    } else {
      // Standalone dev preview fallback
      setVideoState({
        isPlaying: false,
        currentTime: 125,
        duration: 600,
        volume: 0.8,
        playbackRate: 1,
        siteId: 'youtube',
        title: 'Learn React in 10 Minutes',
        videoId: 'dQw4w9WgXcQ',
      })
    }

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (msg: any, sender: any) => {
        if (msg.type !== 'VIDEO_STATE') return
        setActiveTabId((prev) => {
          if (sender.tab?.active || !prev || sender.tab?.id === prev) {
            setVideoState(msg.state)
            return sender.tab?.id ?? prev
          }
          return prev
        })
      }
      chrome.runtime.onMessage.addListener(listener)
      return () => chrome.runtime.onMessage.removeListener(listener)
    }
  }, [])

  // Fetch transcript whenever activeTabId or videoId changes
  useEffect(() => {
    if (!videoState?.videoId) return
    setTranscriptLoading(true)

    if (typeof chrome === 'undefined' || !chrome.tabs || !activeTabId) {
      setTranscriptSegments([])
      setTranscriptLoading(false)
      return
    }

    chrome.tabs.sendMessage(activeTabId, { type: 'GET_TRANSCRIPT' }, (response) => {
      if (chrome.runtime.lastError) {
        setTranscriptSegments([])
        setTranscriptLoading(false)
        return
      }

      setTranscriptSegments(response?.segments ?? [])
      setTranscriptLoading(false)
    })
  }, [activeTabId, videoState?.videoId])

  const seek = (seconds: number) => {
    if (activeTabId && typeof chrome !== 'undefined') {
      chrome.tabs.sendMessage(activeTabId, { type: 'SEEK_TO', seconds })
    } else if (videoState) {
      setVideoState({ ...videoState, currentTime: seconds })
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #0d0d12 0%, #111120 100%)',
        fontFamily: "'Inter', sans-serif",
        color: C.text,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 14px 0',
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
              }}
            >
              ▶
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>FloatTube AI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {videoState && (
              <span
                style={{
                  fontSize: 11,
                  background: C.accentBg,
                  border: `1px solid ${C.accentBorder}`,
                  padding: '2px 8px',
                  borderRadius: 20,
                  color: C.accent,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {videoState.siteId}
              </span>
            )}
            <button
              onClick={handleClosePanel}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.cardBg,
                color: C.text,
                fontSize: 16,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Video title */}
        {videoState?.title && (
          <div
            style={{
              fontSize: 12,
              color: C.textDim,
              marginBottom: 8,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={videoState.title}
          >
            {videoState.title}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                padding: '8px 2px',
                background: activeTab === t.id ? C.accentBg : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === t.id ? C.accent : 'transparent'}`,
                color: activeTab === t.id ? '#e0e7ff' : '#94a3b8',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.15s',
                borderRadius: '4px 4px 0 0',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.1 }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          >
            {!videoState ? (
              <Empty icon="📺" title="No active video" sub="Open YouTube, Udemy, Coursera, or any video site." />
            ) : (
              <>
                {activeTab === 'notes' && <NotesTab vs={videoState} seek={seek} />}
                {activeTab === 'transcript' && (
                  <TranscriptTab
                    segments={transcriptSegments}
                    loading={transcriptLoading}
                    currentTime={videoState.currentTime}
                    seek={seek}
                  />
                )}
                {activeTab === 'workspace' && <WorkspaceTab vs={videoState} seek={seek} />}
                {activeTab === 'ai' && (
                  <AIStudio
                    segments={transcriptSegments}
                    videoTitle={videoState.title}
                    videoId={videoState.videoId}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>{sub}</div>
    </div>
  )
}

function fmt(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  const p = (n: number) => (n < 10 ? '0' + n : n)
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`
}

// ─── Notes Tab ───────────────────────────────────────────────────────────────

function NotesTab({ vs, seek }: { vs: VideoState; seek: (s: number) => void }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const vid = vs.videoId

  const load = async () => {
    const r = await getNotes(vid)
    setNotes(r)
  }

  useEffect(() => {
    load()
  }, [vid])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await addNote({
      videoId: vid,
      siteId: vs.siteId,
      timestamp: Math.floor(vs.currentTime),
      content: text.trim(),
    })
    setText('')
    load()
  }

  const saveEdit = async (id: number) => {
    if (!editText.trim()) return
    await updateNote(id, editText.trim())
    setEditingId(null)
    load()
  }

  const del = async (id: number) => {
    await deleteNote(id)
    load()
  }

  const exportMD = async () => {
    const summary = await getLatestAICacheForVideo<VideoSummary>(vid, 'summary')
    const bookmarks = await getBookmarks(vid)

    let md = `# Video Notes: ${vs.title}\n\n`
    md += `- **Platform:** ${vs.siteId}\n`
    md += `- **Export Date:** ${new Date().toLocaleString()}\n\n`

    if (summary?.overview) {
      md += `## 📑 AI Executive Summary\n\n${summary.overview}\n\n`
      if (summary.keyTakeaways?.length) {
        md += `### 💡 Key Takeaways\n\n`
        summary.keyTakeaways.forEach((t) => (md += `- ${t}\n`))
        md += `\n`
      }
      if (summary.importantConcepts?.length) {
        md += `### 🔍 Core Concepts\n\n`
        summary.importantConcepts.forEach((c) => (md += `- **${c.term}**: ${c.explanation}\n`))
        md += `\n`
      }
    }

    if (notes.length > 0) {
      md += `## 📝 Timestamped Notes (${notes.length})\n\n`
      notes.forEach((n) => {
        md += `* **[${fmt(n.timestamp)}]** - ${n.content}\n`
      })
      md += `\n`
    }

    if (bookmarks.length > 0) {
      md += `## ⏱ Saved Bookmarks (${bookmarks.length})\n\n`
      bookmarks.forEach((b) => {
        md += `* **[${fmt(b.timestamp)}]** - ${b.label}\n`
      })
      md += `\n`
    }

    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' })),
      download: `${vs.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`,
    })
    a.click()
  }

  const exportPDF = async () => {
    const summary = await getLatestAICacheForVideo<VideoSummary>(vid, 'summary')
    const bookmarks = await getBookmarks(vid)

    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(`FloatTube AI Study Dossier`, 14, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Video: ${vs.title.substring(0, 60)} | ${new Date().toLocaleDateString()}`, 14, 25)

    let y = 35
    doc.setTextColor(0, 0, 0)

    if (summary?.overview) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('AI Executive Summary', 14, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const sumLines = doc.splitTextToSize(summary.overview, 180)
      doc.text(sumLines, 14, y)
      y += sumLines.length * 5 + 8
    }

    if (notes.length > 0) {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(`Timestamped Notes (${notes.length})`, 14, y)
      y += 8
      doc.setFontSize(10)

      notes.forEach((n) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        doc.setFont('helvetica', 'bold')
        doc.text(`[${fmt(n.timestamp)}]`, 14, y)
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(n.content, 150)
        doc.text(lines, 36, y)
        y += lines.length * 5 + 5
      })
      y += 6
    }

    if (bookmarks.length > 0) {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(`Saved Bookmarks (${bookmarks.length})`, 14, y)
      y += 8
      doc.setFontSize(10)

      bookmarks.forEach((b) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        doc.setFont('helvetica', 'bold')
        doc.text(`[${fmt(b.timestamp)}]`, 14, y)
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(b.label, 150)
        doc.text(lines, 36, y)
        y += lines.length * 5 + 5
      })
    }

    doc.save(`${vs.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_dossier.pdf`)
  }

  const filteredNotes = notes.filter((n) =>
    n.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 14px', minHeight: 0 }}>
      {/* Header & Export Options */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexShrink: 0 }}>
        <span style={SECTION_LABEL}>Notes ({notes.length})</span>
        {notes.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={exportMD} style={BTN_GHOST}>📄 MD</button>
            <button onClick={exportPDF} style={BTN_GHOST}>📕 PDF</button>
          </div>
        )}
      </div>

      {/* Note Search Filter (if > 3 notes) */}
      {notes.length > 3 && (
        <input
          type="text"
          placeholder="Filter notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...INPUT, padding: '6px 10px', marginBottom: 8, fontSize: 12, flexShrink: 0 }}
        />
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10, minHeight: 0 }}>
        {filteredNotes.length === 0 ? (
          <Empty icon="📝" title="No notes yet" sub={`Take a note at ${fmt(vs.currentTime)} below!`} />
        ) : (
          filteredNotes.map((n) => (
            <div
              key={n.id}
              style={{
                background: C.cardBg,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <button
                  onClick={() => seek(n.timestamp)}
                  style={{
                    background: C.accentBg,
                    border: `1px solid ${C.accentBorder}`,
                    borderRadius: 5,
                    color: C.accent,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                >
                  ⏱ {fmt(n.timestamp)}
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => {
                      if (n.id) {
                        setEditingId(n.id)
                        setEditText(n.content)
                      }
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => n.id && del(n.id)}
                    style={{ background: 'transparent', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 14 }}
                  >
                    🗑
                  </button>
                </div>
              </div>

              {editingId === n.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    style={{ ...INPUT, fontSize: 13, resize: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingId(null)} style={BTN_GHOST}>Cancel</button>
                    <button onClick={() => n.id && saveEdit(n.id)} style={BTN_PRIMARY}>Save</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: C.text, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {n.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={add} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              add(e as any)
            }
          }}
          placeholder={`Note at ${fmt(vs.currentTime)}... (Enter to save)`}
          style={{ ...INPUT, flex: 1, height: 58, resize: 'none', fontSize: 13, lineHeight: 1.4 }}
        />
        <button type="submit" style={{ ...BTN_PRIMARY, height: 58 }}>Add</button>
      </form>
    </div>
  )
}

// ─── Transcript Tab ──────────────────────────────────────────────────────────

function TranscriptTab({
  segments,
  loading,
  currentTime,
  seek,
}: {
  segments: TranscriptSegment[]
  loading: boolean
  currentTime: number
  seek: (s: number) => void
}) {
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)

  const activeIndex = segments.findIndex((s) => currentTime >= s.start && currentTime <= s.end)

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeIndex])

  const filtered = segments.filter((s) => s.text.toLowerCase().includes(q.toLowerCase()))

  const copyAll = () => {
    const full = segments.map((s) => `[${fmt(s.start)}] ${s.text}`).join('\n')
    navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 14px', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Search transcript..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ ...INPUT, flex: 1 }}
        />
        {segments.length > 0 && (
          <button onClick={copyAll} style={BTN_GHOST} title="Copy full transcript">
            {copied ? '✓' : '📋'}
          </button>
        )}
      </div>

      {q.trim() && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, flexShrink: 0 }}>
          Found {filtered.length} match{filtered.length === 1 ? '' : 'es'}
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0 }}>
        {loading ? (
          <Empty icon="⏳" title="Loading transcript" sub="Fetching captions from the server..." />
        ) : filtered.length === 0 ? (
          <Empty
            icon={segments.length ? '🔍' : '🚫'}
            title={segments.length ? 'No matches' : 'No transcript'}
            sub={segments.length ? 'Try a different search query.' : 'Captions not available for this video.'}
          />
        ) : (
          filtered.map((seg, i) => {
            const isActive = segments.indexOf(seg) === activeIndex
            return (
              <div
                key={i}
                ref={isActive ? activeRef : null}
                onClick={() => seek(seg.start)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: 1.5,
                  backgroundColor: isActive ? C.accentBg : 'transparent',
                  color: isActive ? '#c7d2fe' : C.textMid,
                  borderLeft: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
                  transition: 'background-color 0.1s',
                }}
              >
                <span style={{ fontWeight: 700, marginRight: 6, color: isActive ? C.accent : C.textGhost, fontSize: 11 }}>
                  [{fmt(seg.start)}]
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

// ─── Workspace Tab ───────────────────────────────────────────────────────────

function WorkspaceTab({ vs, seek }: { vs: VideoState; seek: (s: number) => void }) {
  const [bookmarks, setBm] = useState<Bookmark[]>([])
  const [bmLabel, setBmLabel] = useState('')
  const [editingBmId, setEditingBmId] = useState<number | null>(null)
  const [editBmLabel, setEditBmLabel] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const vid = vs.videoId

  const load = async () => {
    const r = await getBookmarks(vid)
    setBm(r)
  }

  useEffect(() => {
    load()
  }, [vid])

  const addBm = async (e: React.FormEvent) => {
    e.preventDefault()
    const label = bmLabel.trim() || `Bookmark @ ${fmt(vs.currentTime)}`
    await addBookmark({ videoId: vid, siteId: vs.siteId, timestamp: Math.floor(vs.currentTime), label })
    setBmLabel('')
    load()
  }

  const saveBmEdit = async (id: number) => {
    if (!editBmLabel.trim()) return
    await updateBookmark(id, editBmLabel.trim())
    setEditingBmId(null)
    load()
  }

  const delBm = async (id: number) => {
    await deleteBookmark(id)
    load()
  }

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQ.trim()) return
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQ.trim())}`, '_blank')
    setSearchQ('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 14px', gap: 14, minHeight: 0, overflowY: 'auto' }}>
      {/* Bookmarks */}
      <div>
        <div style={SECTION_LABEL}>⏱ Bookmarks ({bookmarks.length})</div>

        {bookmarks.length === 0 ? (
          <div
            style={{
              background: C.cardBg,
              border: `1px dashed ${C.border}`,
              borderRadius: 10,
              padding: 16,
              textAlign: 'center',
              color: C.textDim,
              fontSize: 12,
              lineHeight: 1.5,
              marginBottom: 10,
            }}
          >
            No bookmarks saved yet.<br />Bookmark important moments below!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <button
                  onClick={() => seek(bm.timestamp)}
                  style={{
                    background: C.accentBg,
                    border: `1px solid ${C.accentBorder}`,
                    borderRadius: 5,
                    color: C.accent,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  ⏱ {fmt(bm.timestamp)}
                </button>

                {editingBmId === bm.id ? (
                  <div style={{ display: 'flex', flex: 1, gap: 4 }}>
                    <input
                      type="text"
                      value={editBmLabel}
                      onChange={(e) => setEditBmLabel(e.target.value)}
                      style={{ ...INPUT, padding: '4px 6px', fontSize: 12 }}
                    />
                    <button onClick={() => bm.id && saveBmEdit(bm.id)} style={{ ...BTN_PRIMARY, padding: '4px 8px', fontSize: 11 }}>
                      ✓
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: C.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bm.label}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      if (bm.id) {
                        setEditingBmId(bm.id)
                        setEditBmLabel(bm.label)
                      }
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => bm.id && delBm(bm.id)}
                    style={{ background: 'transparent', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 13 }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addBm} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder={`Bookmark label @ ${fmt(vs.currentTime)}...`}
            value={bmLabel}
            onChange={(e) => setBmLabel(e.target.value)}
            style={{ ...INPUT, flex: 1 }}
          />
          <button type="submit" style={BTN_PRIMARY}>Save</button>
        </form>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, flexShrink: 0 }} />

      {/* Web search */}
      <div>
        <div style={SECTION_LABEL}>🔍 Web Search</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8, lineHeight: 1.4 }}>
          Search Google or documentation without losing your place in the video.
        </div>
        <form onSubmit={search} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Search Google..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{ ...INPUT, flex: 1 }}
          />
          <button type="submit" style={BTN_PRIMARY}>Go</button>
        </form>
      </div>
    </div>
  )
}
