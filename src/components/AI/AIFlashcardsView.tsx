import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { Flashcard } from '../../services/ai/types'

interface Props {
  flashcards: Flashcard[]
  loading: boolean
  onGenerate: () => void
  onRegenerate: () => void
  hasTranscript: boolean
}

export function AIFlashcardsView({ flashcards, loading, onGenerate, onRegenerate, hasTranscript }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [cardsList, setCardsList] = useState<Flashcard[]>(flashcards)

  // Sync cards when prop updates
  React.useEffect(() => {
    setCardsList(flashcards)
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [flashcards])

  const handleNext = () => {
    if (currentIndex < cardsList.length - 1) {
      setIsFlipped(false)
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false)
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleShuffle = () => {
    const shuffled = [...cardsList].sort(() => Math.random() - 0.5)
    setCardsList(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const handleExport = () => {
    if (cardsList.length === 0) return
    let md = `# Flashcards\n\n`
    cardsList.forEach((c, idx) => {
      md += `### Card ${idx + 1}: ${c.question}\n**Answer:** ${c.answer}\n*Difficulty:* ${c.difficulty}\n\n---\n\n`
    })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([md], { type: 'text/markdown' })),
      download: `flashcards.md`,
    })
    a.click()
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32, animation: 'spin 1s linear infinite', marginBottom: 12 }}>✨</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Creating Flashcards...</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Analyzing lecture concepts and formulating active-recall cards.</div>
      </div>
    )
  }

  if (cardsList.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗂️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Active-Recall Flashcards</div>
        <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 280, lineHeight: 1.5, marginBottom: 16 }}>
          Generate 10–15 study flashcards directly from the lecture transcript to test your recall.
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
          }}
        >
          ✨ Generate Flashcards
        </button>
      </div>
    )
  }

  const currentCard = cardsList[currentIndex]
  const progressPercent = ((currentIndex + 1) / cardsList.length) * 100

  const diffColors: Record<string, string> = {
    Easy: '#22c55e',
    Medium: '#f59e0b',
    Hard: '#ef4444',
  }

  const diffColor = diffColors[currentCard.difficulty] || '#818CF8'

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>
            Card {currentIndex + 1} / {cardsList.length}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: diffColor,
              background: `${diffColor}22`,
              padding: '2px 6px',
              borderRadius: 10,
            }}
          >
            {currentCard.difficulty}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleShuffle}
            title="Shuffle Cards"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#cbd5e1',
              fontSize: 12,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            🔀
          </button>
          <button
            onClick={handleExport}
            title="Export to Markdown"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#cbd5e1',
              fontSize: 12,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            📄 Export
          </button>
          <button
            onClick={onRegenerate}
            title="Regenerate Flashcards"
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 6,
              color: '#818CF8',
              fontSize: 12,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 14, overflow: 'hidden', flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            transition: 'width 0.2s',
          }}
        />
      </div>

      {/* Interactive 3D Flip Card Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <motion.div
          onClick={() => setIsFlipped(!isFlipped)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          style={{
            flex: 1,
            background: isFlipped
              ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)'
              : 'rgba(255,255,255,0.05)',
            border: isFlipped ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative',
            userSelect: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            transition: 'border 0.2s, background 0.2s',
          }}
        >
          {/* Card Category / Side Badge */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              fontSize: 11,
              fontWeight: 700,
              color: isFlipped ? '#a5b4fc' : '#94a3b8',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {isFlipped ? '✓ ANSWER' : '❓ QUESTION'}
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: isFlipped ? 500 : 600,
              color: '#f1f5f9',
              lineHeight: 1.6,
              maxWidth: 320,
              marginTop: 10,
            }}
          >
            {isFlipped ? currentCard.answer : currentCard.question}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 12,
              fontSize: 11,
              color: '#64748b',
            }}
          >
            Tap to flip card
          </div>
        </motion.div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexShrink: 0 }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '10px 0',
              color: currentIndex === 0 ? '#64748b' : '#cbd5e1',
              fontSize: 13,
              fontWeight: 600,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === cardsList.length - 1}
            style={{
              flex: 1,
              background: currentIndex === cardsList.length - 1 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6366F1, #4F46E5)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 0',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: currentIndex === cardsList.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === cardsList.length - 1 ? 0.5 : 1,
            }}
          >
            Next Card →
          </button>
        </div>
      </div>
    </div>
  )
}
