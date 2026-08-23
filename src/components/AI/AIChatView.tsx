import React, { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '../../services/ai/types'

interface Props {
  messages: ChatMessage[]
  loading: boolean
  onSendMessage: (text: string) => void
  onClearChat: () => void
  hasTranscript: boolean
}

const QUICK_PROMPTS = [
  '💡 Summarize in 3 bullet points',
  '👶 Explain at beginner level',
  '🎯 What is the most important takeaway?',
  '🔍 Give a practical real-world example',
]

export function AIChatView({ messages, loading, onSendMessage, onClearChat, hasTranscript }: Props) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return
    onSendMessage(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Grounded Transcript Chat
        </span>
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            Clear History
          </button>
        )}
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Ask FloatTube AI
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 260, lineHeight: 1.5, marginBottom: 16 }}>
              Ask any question about this lecture. Responses are grounded in the video transcript.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 300 }}>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(prompt.replace(/^[^\s]+\s*/, ''))}
                  disabled={!hasTranscript || loading}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: '#cbd5e1',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: hasTranscript ? 'pointer' : 'not-allowed',
                    opacity: hasTranscript ? 1 : 0.5,
                    transition: 'all 0.15s',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 4,
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : 'rgba(255,255,255,0.06)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 13,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: msg.role === 'user' ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
                }}
              >
                {msg.content}
              </div>

              {/* Follow-up suggestions */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {msg.suggestedFollowUps.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => onSendMessage(q)}
                      disabled={loading}
                      style={{
                        background: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: 12,
                        padding: '4px 10px',
                        color: '#a5b4fc',
                        fontSize: 11,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818CF8', fontSize: 12, padding: '4px 8px' }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>✨</span>
            FloatTube AI is thinking...
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 14px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasTranscript ? 'Ask about this video (Enter to send)...' : 'Captions unavailable...'}
          disabled={!hasTranscript || loading}
          rows={2}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
            resize: 'none',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.4,
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || !hasTranscript}
          style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            padding: '0 16px',
            cursor: !input.trim() || loading || !hasTranscript ? 'not-allowed' : 'pointer',
            opacity: !input.trim() || loading || !hasTranscript ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
