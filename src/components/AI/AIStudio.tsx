import { useState, useEffect } from 'react'
import type { TranscriptSegment } from '../../providers/VideoProvider'
import type { VideoSummary, Flashcard, QuizQuestion, ChatMessage } from '../../services/ai/types'
import { AIService } from '../../services/ai/aiService'
import { getSettings } from '../../storage/settings'
import { AISummaryView } from './AISummaryView'
import { AIChatView } from './AIChatView'
import { AIFlashcardsView } from './AIFlashcardsView'
import { AIQuizView } from './AIQuizView'

interface Props {
  segments: TranscriptSegment[]
  videoTitle: string
  videoId: string
}

type AISubTab = 'summary' | 'chat' | 'flashcards' | 'quiz'

export function AIStudio({ segments, videoTitle, videoId }: Props) {
  const [subTab, setSubTab] = useState<AISubTab>('summary')
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)

  // AI Data States
  const [summary, setSummary] = useState<VideoSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [flashcardsLoading, setFlashcardsLoading] = useState(false)

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizLoading, setQuizLoading] = useState(false)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasTranscript = segments && segments.length > 0

  // Check API key on mount and when videoId changes
  useEffect(() => {
    getSettings().then((s) => {
      setHasApiKey(!!(s.geminiApiKey && s.geminiApiKey.trim()))
    })
  }, [])

  // Auto-load cached summary/flashcards/quiz for current video silently without API calls
  useEffect(() => {
    if (!videoId || !hasTranscript) return

    setErrorMessage(null)
    setSummary(null)
    setFlashcards([])
    setQuizQuestions([])
    setChatMessages([])

    // Check cache silently for summary
    AIService.getCachedSummary(segments, videoId)
      .then((res) => {
        if (res) setSummary(res)
      })
      .catch(() => {})

    // Check cache silently for flashcards
    AIService.getCachedFlashcards(segments, videoId)
      .then((res) => {
        if (res) setFlashcards(res)
      })
      .catch(() => {})

    // Check cache silently for quiz
    AIService.getCachedQuiz(segments, videoId)
      .then((res) => {
        if (res) setQuizQuestions(res)
      })
      .catch(() => {})
  }, [videoId, segments.length])

  const openSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open('options.html', '_blank')
    }
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleGenerateSummary = async (force = false) => {
    setSummaryLoading(true)
    setErrorMessage(null)
    try {
      const res = await AIService.generateSummary(segments, videoTitle, videoId, force)
      setSummary(res)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate summary.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    const updatedHistory = [...chatMessages, userMsg]
    setChatMessages(updatedHistory)
    setChatLoading(true)
    setErrorMessage(null)

    try {
      const { response, followUps } = await AIService.chatWithTranscript(
        segments,
        updatedHistory,
        text,
        videoTitle,
      )

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        suggestedFollowUps: followUps,
      }

      setChatMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to get answer from Gemini.')
    } finally {
      setChatLoading(false)
    }
  }

  const handleGenerateFlashcards = async (force = false) => {
    setFlashcardsLoading(true)
    setErrorMessage(null)
    try {
      const res = await AIService.generateFlashcards(segments, videoTitle, videoId, force)
      setFlashcards(res)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate flashcards.')
    } finally {
      setFlashcardsLoading(false)
    }
  }

  const handleGenerateQuiz = async (force = false) => {
    setQuizLoading(true)
    setErrorMessage(null)
    try {
      const res = await AIService.generateQuiz(segments, videoTitle, videoId, force)
      setQuizQuestions(res)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate quiz.')
    } finally {
      setQuizLoading(false)
    }
  }

  const SUB_TABS = [
    { id: 'summary', label: 'Summary', icon: '📑' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'flashcards', label: 'Flashcards', icon: '🗂️' },
    { id: 'quiz', label: 'Quiz', icon: '🎯' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Sub-tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.25)',
          flexShrink: 0,
        }}
      >
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              flex: 1,
              padding: '8px 2px',
              background: subTab === t.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${subTab === t.id ? '#6366F1' : 'transparent'}`,
              color: subTab === t.id ? '#e0e7ff' : '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'all 0.15s',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Missing API Key Warning */}
      {hasApiKey === false && (
        <div
          style={{
            margin: '10px 14px 0',
            padding: '10px 12px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.4 }}>
            <strong>Gemini API Key missing:</strong> Add your free API key in settings to enable AI features.
          </div>
          <button
            onClick={openSettings}
            style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ⚙️ Add Key
          </button>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div
          style={{
            margin: '10px 14px 0',
            padding: '10px 12px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.4 }}>
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fca5a5',
              fontSize: 16,
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main SubTab Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {subTab === 'summary' && (
          <AISummaryView
            summary={summary}
            loading={summaryLoading}
            onGenerate={() => handleGenerateSummary(false)}
            onRegenerate={() => handleGenerateSummary(true)}
            hasTranscript={hasTranscript}
          />
        )}
        {subTab === 'chat' && (
          <AIChatView
            messages={chatMessages}
            loading={chatLoading}
            onSendMessage={handleSendMessage}
            onClearChat={() => setChatMessages([])}
            hasTranscript={hasTranscript}
          />
        )}
        {subTab === 'flashcards' && (
          <AIFlashcardsView
            flashcards={flashcards}
            loading={flashcardsLoading}
            onGenerate={() => handleGenerateFlashcards(false)}
            onRegenerate={() => handleGenerateFlashcards(true)}
            hasTranscript={hasTranscript}
          />
        )}
        {subTab === 'quiz' && (
          <AIQuizView
            questions={quizQuestions}
            loading={quizLoading}
            onGenerate={() => handleGenerateQuiz(false)}
            onRegenerate={() => handleGenerateQuiz(true)}
            hasTranscript={hasTranscript}
          />
        )}
      </div>
    </div>
  )
}
