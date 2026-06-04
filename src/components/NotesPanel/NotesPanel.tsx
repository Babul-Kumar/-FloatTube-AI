import React, { useState, useEffect } from 'react'
import { getNotes, addNote, deleteNote } from '../../storage/db'
import type { VideoProvider } from '../../providers/VideoProvider'
import { jsPDF } from 'jspdf'

interface Props {
  provider: VideoProvider
  currentTime: number
  onSeek: (seconds: number) => void
}

export function NotesPanel({ provider, currentTime, onSeek }: Props) {
  const [notes, setNotes] = useState<any[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const videoId = provider.getVideoId() || 'unknown'
  const siteId = provider.siteId

  const loadNotes = async () => {
    try {
      const res = await getNotes(videoId)
      res.sort((a, b) => a.timestamp - b.timestamp)
      setNotes(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [videoId])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    const timestamp = Math.floor(currentTime)
    try {
      await addNote({
        videoId,
        siteId,
        timestamp,
        content: newNoteText.trim(),
      })
      setNewNoteText('')
      loadNotes()
    } catch (err) {
      console.error('Failed to add note:', err)
    }
  }

  const handleDeleteNote = async (id: number) => {
    try {
      await deleteNote(id)
      loadNotes()
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

  const exportAsMarkdown = () => {
    const title = provider.getTitle()
    let content = `# Notes for "${title}"\nVideo Link: ${window.location.href}\n\n`
    notes.forEach(note => {
      content += `* [${formatTime(note.timestamp)}] - ${note.content}\n`
    })

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `notes-${videoId}.md`)
    link.click()
  }

  const exportAsPDF = () => {
    const doc = new jsPDF()
    const title = provider.getTitle()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    const titleText = title.length > 50 ? title.substring(0, 50) + '...' : title
    doc.text(`Notes: ${titleText}`, 14, 20)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Source: ${window.location.href.substring(0, 80)}`, 14, 28)
    
    let y = 38
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    
    notes.forEach((note, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      const timeStr = `[${formatTime(note.timestamp)}]`
      doc.setFont('helvetica', 'bold')
      doc.text(timeStr, 14, y)
      
      doc.setFont('helvetica', 'normal')
      const splitText = doc.splitTextToSize(note.content, 150)
      doc.text(splitText, 35, y)
      y += (splitText.length * 5) + 4
    })
    
    doc.save(`notes-${videoId}.pdf`)
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
      {/* Export Options */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>NOTES ({notes.length})</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={exportAsMarkdown} style={utilBtnStyle} title="Export as Markdown">
            📄 MD
          </button>
          <button onClick={exportAsPDF} style={utilBtnStyle} title="Export as PDF">
            📕 PDF
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {notes.length === 0 ? (
          <div style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            No notes taken yet. Take a note below!
          </div>
        ) : (
          notes.map((note, index) => (
            <div
              key={note.id || index}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                padding: '8px 10px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() => onSeek(note.timestamp)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: 'none',
                    borderRadius: 4,
                    color: '#818CF8',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 6px',
                    cursor: 'pointer',
                  }}
                >
                  ⏱️ {formatTime(note.timestamp)}
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: 13,
                    cursor: 'pointer',
                    opacity: 0.6,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                >
                  🗑️
                </button>
              </div>
              <div style={{ fontSize: 14, color: '#ddd', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                {note.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input form */}
      <form
        onSubmit={handleAddNote}
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: 8,
          display: 'flex',
          gap: 6,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          placeholder="Take a note at current time..."
          value={newNoteText}
          onChange={e => setNewNoteText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleAddNote(e)
            }
          }}
          rows={1}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            padding: '6px 10px',
            color: '#fff',
            fontSize: 14,
            outline: 'none',
            resize: 'none',
            fontFamily: 'Inter, sans-serif',
            maxHeight: 80,
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
            height: 28,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Add
        </button>
      </form>
    </div>
  )
}

const utilBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 4,
  color: '#ccc',
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 8px',
  cursor: 'pointer',
  transition: 'all 0.15s',
}
