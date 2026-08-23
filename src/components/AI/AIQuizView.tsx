import React, { useState } from 'react'
import type { QuizQuestion } from '../../services/ai/types'

interface Props {
  questions: QuizQuestion[]
  loading: boolean
  onGenerate: () => void
  onRegenerate: () => void
  hasTranscript: boolean
}

export function AIQuizView({ questions, loading, onGenerate, onRegenerate, hasTranscript }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  // Reset quiz state when questions change
  React.useEffect(() => {
    setCurrentIdx(0)
    setSelectedOption(null)
    setScore(0)
    setQuizCompleted(false)
  }, [questions])

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || quizCompleted) return // already answered
    setSelectedOption(idx)

    const currentQ = questions[currentIdx]
    if (idx === currentQ.correctAnswer) {
      setScore((s) => s + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1)
      setSelectedOption(null)
    } else {
      setQuizCompleted(true)
    }
  }

  const handleRestartQuiz = () => {
    setCurrentIdx(0)
    setSelectedOption(null)
    setScore(0)
    setQuizCompleted(false)
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32, animation: 'spin 1s linear infinite', marginBottom: 12 }}>🎯</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Building Lecture Quiz...</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Generating multiple-choice questions from key concepts.</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Interactive Quiz</div>
        <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 280, lineHeight: 1.5, marginBottom: 16 }}>
          Generate a 5–10 question multiple-choice quiz with explanations to test your comprehension.
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
          ✨ Generate Quiz
        </button>
      </div>
    )
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= 70

    return (
      <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{passed ? '🏆' : '📚'}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          {passed ? 'Great Job!' : 'Keep Practicing!'}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          You scored <strong style={{ color: '#fff' }}>{score}</strong> out of <strong style={{ color: '#fff' }}>{questions.length}</strong> ({percentage}%)
        </div>

        <div
          style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            background: passed ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
            color: passed ? '#22c55e' : '#f59e0b',
            border: `1px solid ${passed ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
            marginBottom: 24,
          }}
        >
          {passed ? 'Passed with flying colors' : 'Review the lecture notes & try again'}
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 280 }}>
          <button
            onClick={handleRestartQuiz}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '10px 0',
              color: '#cbd5e1',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Retake
          </button>
          <button
            onClick={onRegenerate}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 0',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✨ New Quiz
          </button>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIdx]
  const progressPercent = ((currentIdx + 1) / questions.length) * 100

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Quiz Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>
          Question {currentIdx + 1} of {questions.length}
        </span>
        <span style={{ fontSize: 12, color: '#818CF8', fontWeight: 600 }}>
          Score: {score}/{currentIdx + (selectedOption !== null ? 1 : 0)}
        </span>
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

      {/* Question Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 14,
            fontWeight: 600,
            color: '#f1f5f9',
            lineHeight: 1.5,
          }}
        >
          {currentQ.question}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx
            const isCorrect = idx === currentQ.correctAnswer
            const showResult = selectedOption !== null

            let bg = 'rgba(255,255,255,0.03)'
            let border = '1px solid rgba(255,255,255,0.08)'
            let textColor = '#cbd5e1'

            if (showResult) {
              if (isCorrect) {
                bg = 'rgba(34,197,94,0.15)'
                border = '1px solid rgba(34,197,94,0.4)'
                textColor = '#22c55e'
              } else if (isSelected) {
                bg = 'rgba(239,68,68,0.15)'
                border = '1px solid rgba(239,68,68,0.4)'
                textColor = '#ef4444'
              }
            } else if (isSelected) {
              bg = 'rgba(99,102,241,0.2)'
              border = '1px solid #6366F1'
              textColor = '#fff'
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={showResult}
                style={{
                  background: bg,
                  border,
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: textColor,
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: showResult ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.15s',
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
                {showResult && isCorrect && <span>✓</span>}
                {showResult && isSelected && !isCorrect && <span>✕</span>}
              </button>
            )
          })}
        </div>

        {/* Explanation Card */}
        {selectedOption !== null && (
          <div
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#cbd5e1',
              lineHeight: 1.5,
              marginTop: 4,
            }}
          >
            <strong style={{ color: '#818CF8', display: 'block', marginBottom: 2 }}>Explanation:</strong>
            {currentQ.explanation}
          </div>
        )}
      </div>

      {/* Next Button */}
      {selectedOption !== null && (
        <button
          onClick={handleNextQuestion}
          style={{
            marginTop: 10,
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question →'}
        </button>
      )}
    </div>
  )
}
