import { describe, it, expect } from 'vitest'
import { extractJSON, GeminiError } from '../src/services/ai/gemini'
import { formatTranscriptForAI } from '../src/services/ai/aiService'
import {
  buildSummaryPrompt,
  buildFlashcardsPrompt,
  buildQuizPrompt,
  buildChatSystemPrompt,
} from '../src/services/ai/prompts'
import type { TranscriptSegment } from '../src/providers/VideoProvider'

describe('Gemini AI Service & JSON Parsing', () => {
  it('should cleanly parse pure JSON string', () => {
    const json = '{"overview":"Test summary","keyTakeaways":["A","B"]}'
    const result = extractJSON<{ overview: string; keyTakeaways: string[] }>(json)
    expect(result.overview).toBe('Test summary')
    expect(result.keyTakeaways).toEqual(['A', 'B'])
  })

  it('should strip markdown code fences ```json ... ``` and parse properly', () => {
    const raw = '```json\n{\n  "overview": "Markdown fenced summary",\n  "keyTakeaways": ["One"]\n}\n```'
    const result = extractJSON<{ overview: string }>(raw)
    expect(result.overview).toBe('Markdown fenced summary')
  })

  it('should recover JSON from surrounding conversational text', () => {
    const text = 'Here is the summary you requested:\n```json\n{"difficulty":"Intermediate"}\n```\nHope this helps!'
    const result = extractJSON<{ difficulty: string }>(text)
    expect(result.difficulty).toBe('Intermediate')
  })

  it('should throw GeminiError with code PARSE_ERROR when given unparseable text', () => {
    expect(() => extractJSON('Invalid non-json text without braces')).toThrow(GeminiError)
    try {
      extractJSON('Invalid')
    } catch (err: any) {
      expect(err.code).toBe('PARSE_ERROR')
    }
  })

  it('should format transcript segments with timestamp markers and observe char limits', () => {
    const segments: TranscriptSegment[] = [
      { start: 0, end: 5, text: 'Hello everyone' },
      { start: 65, end: 72, text: 'Let us discuss React' },
      { start: 3661, end: 3670, text: 'Conclusion of lecture' },
    ]

    const formatted = formatTranscriptForAI(segments)
    expect(formatted).toContain('[0:00] Hello everyone')
    expect(formatted).toContain('[1:05] Let us discuss React')
    expect(formatted).toContain('[61:01] Conclusion of lecture')

    // Truncation limit test
    const truncated = formatTranscriptForAI(segments, 30)
    expect(truncated).toContain('[Transcript truncated after')
  })

  it('should construct valid structured prompts for Summary, Flashcards, Quiz, and Chat', () => {
    const transcript = '[0:00] In this video we learn about TypeScript.'
    const title = 'TypeScript Masterclass'

    const summaryPrompt = buildSummaryPrompt(transcript, title)
    expect(summaryPrompt).toContain('TypeScript Masterclass')
    expect(summaryPrompt).toContain('importantConcepts')

    const flashcardsPrompt = buildFlashcardsPrompt(transcript, title)
    expect(flashcardsPrompt).toContain('flashcards')
    expect(flashcardsPrompt).toContain('question')

    const quizPrompt = buildQuizPrompt(transcript, title)
    expect(quizPrompt).toContain('multiple-choice')
    expect(quizPrompt).toContain('correctAnswer')

    const chatPrompt = buildChatSystemPrompt(transcript, title)
    expect(chatPrompt).toContain('FloatTube AI')
    expect(chatPrompt).toContain('---FOLLOW_UPS---')
  })
})
