import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getNotes, addNote, deleteNote, getBookmarks, addBookmark, deleteBookmark } from '../storage/db'
import type { TranscriptSegment } from '../providers/VideoProvider'
import { jsPDF } from 'jspdf'

const TABS = [
  { id: 'notes',      label: 'Notes'      },
  { id: 'transcript', label: 'Transcript' },
  { id: 'workspace',  label: 'Workspace'  },
  { id: 'ai',         label: 'AI'         },
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

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text:      '#f1f5f9',   // primary text — near white
  textMid:   '#cbd5e1',   // secondary text
  textDim:   '#94a3b8',   // labels / meta
  textGhost: '#64748b',   // empty states
  accent:    '#818CF8',   // indigo accent
  accentBg:  'rgba(99,102,241,0.15)',
  accentBorder: 'rgba(99,102,241,0.3)',
  border:    'rgba(255,255,255,0.10)',
  cardBg:    'rgba(255,255,255,0.05)',
  inputBg:   'rgba(255,255,255,0.07)',
  danger:    '#f87171',
}

const INPUT: React.CSSProperties = {
  width: '100%',
  background: C.inputBg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '11px 13px',
  color: C.text,
  fontSize: 17,
  outline: 'none',
  fontFamily: "'Inter', sans-serif",
}

const BTN_PRIMARY: React.CSSProperties = {
  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 17,
  fontWeight: 700,
  padding: '11px 18px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const BTN_GHOST: React.CSSProperties = {
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  color: C.textMid,
  fontSize: 15,
  fontWeight: 600,
  padding: '5px 12px',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: C.textDim,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 10,
}

// ── Root component ───────────────────────────────────────────────────────────
export default function SidePanel() {
  const [activeTab, setActiveTab]   = useState<TabId>('notes')
  const [videoState, setVideoState] = useState<VideoState | null>(null)
  const [activeTabId, setActiveTabId] = useState<number | null>(null)

  const handleClosePanel = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.sidePanel?.close) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (typeof tab?.windowId === 'number') {
          await chrome.sidePanel.close({ windowId: tab.windowId }); return
        }
      }
    } catch { /* ignore */ }
    window.close()
  }

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab?.id) return
        chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_STATE' }, (res) => {
          if (!chrome.runtime.lastError && res?.state) {
            setVideoState(res.state); setActiveTabId(tab.id ?? null)
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
      setVideoState({ isPlaying: false, currentTime: 125, duration: 600, volume: 0.8,
        playbackRate: 1, siteId: 'youtube',
        title: 'Learn React in 10 Minutes', videoId: 'dQw4w9WgXcQ' })
    }

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (msg: any, sender: any) => {
        if (msg.type !== 'VIDEO_STATE') return
        setActiveTabId(prev => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const seek = (s: number) => {
    if (activeTabId && typeof chrome !== 'undefined')
      chrome.tabs.sendMessage(activeTabId, { type: 'SEEK_TO', seconds: s })
    else if (videoState) setVideoState({ ...videoState, currentTime: s })
  }

  const playPause = () => {
    if (activeTabId && videoState && typeof chrome !== 'undefined')
      chrome.tabs.sendMessage(activeTabId, { type: 'COMMAND', command: videoState.isPlaying ? 'pause' : 'play' })
    else if (videoState) setVideoState({ ...videoState, isPlaying: !videoState.isPlaying })
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'linear-gradient(180deg, #0d0d12 0%, #111120 100%)',
      fontFamily: "'Inter', sans-serif", color: C.text, overflow: 'hidden',
    }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '12px 14px 0',
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>▶</div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>FloatTube AI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {videoState && (
              <span style={{
                fontSize: 12, background: C.accentBg, border: `1px solid ${C.accentBorder}`,
                padding: '2px 8px', borderRadius: 20, color: C.accent, fontWeight: 600,
              }}>{videoState.siteId}</span>
            )}
            <button onClick={handleClosePanel} style={{
              width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.border}`,
              background: C.cardBg, color: C.text, fontSize: 20, cursor: 'pointer',
              display: 'grid', placeItems: 'center',
            }}>×</button>
          </div>
        </div>

        {/* Video title */}
        {videoState?.title && (
          <div style={{
            fontSize: 13, color: C.textDim, marginBottom: 8,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }} title={videoState.title}>{videoState.title}</div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: '9px 2px',
              background: activeTab === t.id ? C.accentBg : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === t.id ? C.accent : 'transparent'}`,
              color: activeTab === t.id ? '#e0e7ff' : '#94a3b8',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
              borderRadius: '4px 4px 0 0', whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.1 }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          >
            {!videoState ? (
              <Empty icon="📺" title="No active video" sub="Open YouTube, Udemy, Netflix or any video site." />
            ) : (
              <>
                {activeTab === 'notes'      && <NotesTab      vs={videoState} seek={seek} playPause={playPause} />}
                {activeTab === 'transcript' && <TranscriptTab vs={videoState} seek={seek} activeTabId={activeTabId} />}
                {activeTab === 'workspace'  && <WorkspaceTab  vs={videoState} seek={seek} />}
                {activeTab === 'ai'         && <AITab />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Empty state helper ───────────────────────────────────────────────────────
function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: C.textDim, lineHeight: 1.6 }}>{sub}</div>
    </div>
  )
}

// ── Timestamp formatter ──────────────────────────────────────────────────────
function fmt(secs: number) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60)
  const p = (n: number) => (n < 10 ? '0' + n : n)
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`
}

// ── Notes Tab ────────────────────────────────────────────────────────────────
function NotesTab({ vs, seek, playPause }: { vs: VideoState; seek: (s: number) => void; playPause: () => void }) {
  const [notes, setNotes] = useState<any[]>([])
  const [text, setText]   = useState('')
  const vid = vs.videoId

  const load = async () => { const r = await getNotes(vid); setNotes(r.sort((a,b)=>a.timestamp-b.timestamp)) }
  useEffect(() => { load() }, [vid])

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); if (!text.trim()) return
    await addNote({ videoId: vid, siteId: vs.siteId, timestamp: Math.floor(vs.currentTime), content: text.trim() })
    setText(''); load()
  }

  const del = async (id: number) => { await deleteNote(id); load() }

  const exportMD = () => {
    let md = `# Notes: ${vs.title}\n\n`
    notes.forEach(n => { md += `* [${fmt(n.timestamp)}] - ${n.content}\n` })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([md], { type: 'text/markdown' })),
      download: `${vs.title.replace(/[^a-z0-9]/gi,'_').toLowerCase()}_notes.md`,
    }); a.click()
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica','bold'); doc.setFontSize(16)
    doc.text(`Notes: ${vs.title.substring(0, 60)}`, 10, 15)
    doc.setFont('helvetica','normal'); doc.setFontSize(10)
    let y = 25
    notes.forEach(n => {
      if (y > 280) { doc.addPage(); y = 15 }
      doc.setFont('helvetica','bold'); doc.text(`[${fmt(n.timestamp)}]`, 10, y)
      doc.setFont('helvetica','normal')
      const lines = doc.splitTextToSize(n.content, 160)
      doc.text(lines, 30, y); y += lines.length * 5 + 5
    })
    doc.save(`${vs.title.replace(/[^a-z0-9]/gi,'_').toLowerCase()}_notes.pdf`)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'12px 14px', minHeight:0 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, flexShrink:0 }}>
        <span style={SECTION_LABEL}>Notes ({notes.length})</span>
        {notes.length > 0 && (
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={exportMD}  style={BTN_GHOST}>📄 MD</button>
            <button onClick={exportPDF} style={BTN_GHOST}>📕 PDF</button>
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:10, minHeight:0 }}>
        {notes.length === 0
          ? <Empty icon="📝" title="No notes yet" sub="Add a note for this video below." />
          : notes.map((n: any) => (
              <div key={n.id} style={{
                background: C.cardBg, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '10px 12px',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <button onClick={() => seek(n.timestamp)} style={{
                    background: C.accentBg, border: `1px solid ${C.accentBorder}`,
                    borderRadius: 5, color: C.accent, fontSize: 13, fontWeight: 700,
                    padding: '3px 8px', cursor: 'pointer',
                  }}>⏱ {fmt(n.timestamp)}</button>
                  <button onClick={() => del(n.id)} style={{
                    background:'transparent', border:'none', color: C.danger,
                    cursor:'pointer', fontSize:16, padding:'2px 4px',
                  }}>🗑</button>
                </div>
                <div style={{ fontSize:15, color: C.text, whiteSpace:'pre-wrap', lineHeight:1.55 }}>
                  {n.content}
                </div>
              </div>
            ))
        }
      </div>

      {/* Input */}
      <form onSubmit={add} style={{ display:'flex', gap:8, alignItems:'flex-end', flexShrink:0 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); add(e as any) } }}
          placeholder={`Note at ${fmt(vs.currentTime)}…`}
          style={{ ...INPUT, width:'auto', flex:1, height:64, resize:'none', fontSize:14, lineHeight:1.5 }}
        />
        <button type="submit" style={{ ...BTN_PRIMARY, height:64 }}>Add</button>
      </form>
    </div>
  )
}

// ── Transcript Tab ───────────────────────────────────────────────────────────
function TranscriptTab({ vs, seek, activeTabId }: { vs: VideoState; seek: (s: number) => void; activeTabId: number | null }) {
  const [segs, setSegs]     = useState<TranscriptSegment[]>([])
  const [loading, setLoad]  = useState(true)
  const [q, setQ]           = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const activeRef           = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoad(true)
    if (typeof chrome === 'undefined' || !chrome.tabs || !activeTabId) {
      setSegs([])
      setLoad(false)
      return
    }

    chrome.tabs.sendMessage(activeTabId, { type: 'GET_TRANSCRIPT' }, (response) => {
      if (chrome.runtime.lastError) {
        setSegs([])
        setLoad(false)
        return
      }

      setSegs(response?.segments ?? [])
      setLoad(false)
    })
  }, [activeTabId, vs.videoId])

  const active = segs.findIndex(s => vs.currentTime >= s.start && vs.currentTime <= s.end)
  useEffect(() => { if (activeRef.current) activeRef.current.scrollIntoView({ behavior:'smooth', block:'nearest' }) }, [active])

  const filtered = segs.filter(s => s.text.toLowerCase().includes(q.toLowerCase()))
  const fmtSeg   = (secs:number) => { const m=Math.floor(secs/60),s=Math.floor(secs%60); return `${m}:${s<10?'0':''}${s}` }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'12px 14px', minHeight:0 }}>
      <input type="text" placeholder="Search transcript…" value={q}
        onChange={e => setQ(e.target.value)}
        style={{ ...INPUT, marginBottom:10, flexShrink:0 }}
      />
      <div ref={containerRef} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:3, minHeight:0 }}>
        {loading ? <Empty icon="⏳" title="Loading transcript" sub="Fetching captions from the server…" />
        : filtered.length === 0 ? <Empty icon={segs.length?'🔍':'🚫'} title={segs.length?'No matches':'No transcript'} sub={segs.length?'Try a different search term.':'Captions not available for this video.'} />
        : filtered.map((seg, i) => {
            const isActive = segs.indexOf(seg) === active
            return (
              <div key={i} ref={isActive ? activeRef : null} onClick={() => seek(seg.start)} style={{
                padding:'7px 10px', borderRadius:7, cursor:'pointer', fontSize:14, lineHeight:1.5,
                backgroundColor: isActive ? C.accentBg : 'transparent',
                color: isActive ? '#c7d2fe' : C.textMid,
                borderLeft: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
                transition:'background-color 0.1s',
              }}>
                <span style={{ fontWeight:700, marginRight:6, color: isActive ? C.accent : C.textGhost, fontSize:12 }}>
                  [{fmtSeg(seg.start)}]
                </span>
                {seg.text}
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

// ── AI Tab ───────────────────────────────────────────────────────────────────
function AITab() {
  return (
    <div style={{ padding:'14px' }}>
      <div style={SECTION_LABEL}>AI Assistant</div>
      <div style={{
        background: C.accentBg, border: `1px solid ${C.accentBorder}`,
        borderRadius:12, padding:20, textAlign:'center',
      }}>
        <div style={{ fontSize:32, marginBottom:10 }}>🤖</div>
        <div style={{ fontSize:16, color: C.text, fontWeight:700, marginBottom:6 }}>AI Pack – Coming Soon</div>
        <div style={{ fontSize:14, color: C.textDim, lineHeight:1.6 }}>
          Add your Gemini API key in Settings to enable AI summaries, chat, flashcards, and quizzes.
        </div>
      </div>
    </div>
  )
}

// ── Workspace Tab ────────────────────────────────────────────────────────────
function WorkspaceTab({ vs, seek }: { vs: VideoState; seek: (s: number) => void }) {
  const [bookmarks, setBm]       = useState<any[]>([])
  const [bmLabel, setBmLabel]    = useState('')
  const [searchQ, setSearchQ]    = useState('')
  const vid = vs.videoId

  const load = async () => { const r = await getBookmarks(vid); setBm(r.sort((a,b)=>a.timestamp-b.timestamp)) }
  useEffect(() => { load() }, [vid])

  const addBm = async (e: React.FormEvent) => {
    e.preventDefault(); if (!bmLabel.trim()) return
    await addBookmark({ videoId:vid, siteId:vs.siteId, timestamp:Math.floor(vs.currentTime), label:bmLabel.trim() })
    setBmLabel(''); load()
  }

  const delBm = async (id: number) => { await deleteBookmark(id); load() }

  const search = (e: React.FormEvent) => {
    e.preventDefault(); if (!searchQ.trim()) return
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQ.trim())}`, '_blank')
    setSearchQ('')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'12px 14px', gap:14, minHeight:0, overflowY:'auto' }}>

      {/* Bookmarks */}
      <div>
        <div style={SECTION_LABEL}>⏱ Bookmarks ({bookmarks.length})</div>

        {bookmarks.length === 0
          ? (
            <div style={{
              background: C.cardBg, border: `1px dashed ${C.border}`, borderRadius:10,
              padding:16, textAlign:'center', color: C.textDim, fontSize:12, lineHeight:1.6,
              marginBottom:10,
            }}>
              No bookmarks yet.<br />Save a key moment below!
            </div>
          )
          : (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
              {bookmarks.map((bm:any) => (
                <div key={bm.id} style={{
                  display:'flex', alignItems:'center', gap:10,
                  background: C.cardBg, border: `1px solid ${C.border}`,
                  borderRadius:9, padding:'9px 12px',
                }}>
                  <button onClick={()=>seek(bm.timestamp)} style={{
                    background: C.accentBg, border:`1px solid ${C.accentBorder}`,
                    borderRadius:5, color: C.accent, fontSize:13, fontWeight:700,
                    padding:'3px 8px', cursor:'pointer', flexShrink:0,
                  }}>⏱ {fmt(bm.timestamp)}</button>
                  <div style={{ flex:1, fontSize:15, color: C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {bm.label}
                  </div>
                  <button onClick={()=>delBm(bm.id)} style={{
                    background:'transparent', border:'none', color: C.danger,
                    cursor:'pointer', fontSize:16, padding:'2px 4px', flexShrink:0,
                  }}>🗑</button>
                </div>
              ))}
            </div>
          )
        }

        <form onSubmit={addBm} style={{ display:'flex', gap:8 }}>
          <input type="text" placeholder={`Bookmark at ${fmt(vs.currentTime)}…`}
            value={bmLabel} onChange={e=>setBmLabel(e.target.value)}
            style={{ ...INPUT, flex:1, width:'auto' }}
          />
          <button type="submit" style={BTN_PRIMARY}>Save</button>
        </form>
      </div>

      {/* Divider */}
      <div style={{ height:1, background: C.border, flexShrink:0 }} />

      {/* Web search */}
      <div>
        <div style={SECTION_LABEL}>🔍 Web Search</div>
        <div style={{ fontSize:14, color: C.textDim, marginBottom:8, lineHeight:1.5 }}>
          Search Google without leaving your video — opens in a new tab.
        </div>
        <form onSubmit={search} style={{ display:'flex', gap:8 }}>
          <input type="text" placeholder="Search Google…"
            value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            style={{ ...INPUT, flex:1, width:'auto' }}
          />
          <button type="submit" style={BTN_PRIMARY}>Go</button>
        </form>
      </div>

    </div>
  )
}
