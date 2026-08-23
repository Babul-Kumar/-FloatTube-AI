import React, { useState } from 'react'
import type { VideoSummary } from '../../services/ai/types'

interface Props {
  summary: VideoSummary | null
  loading: boolean
  onGenerate: () => void
  onRegenerate: () => void
  hasTranscript: boolean
}

export function AISummaryView({ summary, loading, onGenerate, onRegenerate, hasTranscript }: Props) {
  const [copied, setCopied] = useState(false)

  const copySummary = () => {
    if (!summary) return
    const text = `# Executive Summary\n${summary.overview}\n\n## Key Takeaways\n${summary.keyTakeaways.map((t) => `- ${t}`).join('\n')}\n\n## Important Concepts\n${summary.importantConcepts.map((c) => `- **${c.term}**: ${c.explanation}`).join('\n')}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818CF8', fontSize: 13, fontWeight: 600 }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>✨</span>
          Analyzing video transcript with Gemini...
        </div>
        <div style={{ height: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </div>
    )
  }

  if (!summary) {
    return (
      <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📑</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>AI Video Summary</div>
        <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 280, lineHeight: 1.5, marginBottom: 16 }}>
          Generate an executive overview, bullet takeaways, and core concept breakdown from the transcript.
        </div>
        <button
          onClick={onGenerate}
          disabled={!hasTranscript}
          style={{
            background: hasTranscript ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            padding: '10px 20px',
            cursor: hasTranscript ? 'pointer' : 'not-allowed',
            opacity: hasTranscript ? 1 : 0.5,
            boxShadow: hasTranscript ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ✨ Generate Summary
        </button>
        {!hasTranscript && (
          <div style={{ fontSize: 11, color: '#f87171', marginTop: 10 }}>
            Captions/transcript unavailable for this video.
          </div>
        )}
      </div>
    )
  }

  const difficultyColors = {
    Beginner: '#22c55e',
    Intermediate: '#f59e0b',
    Advanced: '#ef4444',
  }

  const diffColor = difficultyColors[summary.difficulty] || '#818CF8'

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
      {/* Header controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: diffColor,
              background: `${diffColor}22`,
              border: `1px solid ${diffColor}44`,
              padding: '2px 8px',
              borderRadius: 12,
            }}
          >
            {summary.difficulty} Level
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={copySummary}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: copied ? '#22c55e' : '#cbd5e1',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          <button
            onClick={onRegenerate}
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 6,
              color: '#818CF8',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            🔄 Regenerate
          </button>
        </div>
      </div>

      {/* Executive Overview */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '12px 14px',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>
          Executive Overview
        </div>
        <div style={{ fontSize: 13, color: '#f1f5f9', lineHeight: 1.6 }}>{summary.overview}</div>
      </div>

      {/* Key Takeaways */}
      {summary.keyTakeaways.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
            Key Takeaways ({summary.keyTakeaways.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {summary.keyTakeaways.map((point, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
                <span style={{ color: '#818CF8', fontWeight: 700, flexShrink: 0 }}>•</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Important Concepts */}
      {summary.importantConcepts.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
            Core Concepts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {summary.importantConcepts.map((concept, i) => (
              <div key={i} style={{ borderBottom: i < summary.importantConcepts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e0e7ff', marginBottom: 2 }}>
                  {concept.term}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                  {concept.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-World Applications */}
      {summary.applications.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
            Practical Applications
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {summary.applications.map((app, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span>{app}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
