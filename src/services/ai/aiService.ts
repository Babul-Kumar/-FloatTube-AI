import type { TranscriptSegment } from '../../providers/VideoProvider'
import type { VideoSummary, Flashcard, QuizQuestion, ChatMessage } from './types'
import {
  buildSummaryPrompt,
  buildFlashcardsPrompt,
  buildQuizPrompt,
  buildChatSystemPrompt,
} from './prompts'
import { callGemini, extractJSON, GeminiError } from './gemini'
import { getAICache, setAICache } from '../../storage/db'

/**
 * Creates a deterministic hash of transcript text to validate cache validity.
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

/**
 * Compiles TranscriptSegments into clean, readable text with timestamp markers.
 */
export function formatTranscriptForAI(segments: TranscriptSegment[], maxChars = 32000): string {
  if (!segments || segments.length === 0) return ''

  const lines: string[] = []
  let totalLength = 0

  for (const seg of segments) {
    const m = Math.floor(seg.start / 60)
    const s = Math.floor(seg.start % 60)
    const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`
    const line = `[${timeStr}] ${seg.text}`

    if (totalLength + line.length > maxChars) {
      lines.push(`... [Transcript truncated after ${totalLength} chars for optimal processing]`)
      break
    }

    lines.push(line)
    totalLength += line.length + 1
  }

  return lines.join('\n')
}

export class AIService {
  /**
   * Retrieves cached summary without triggering an API call.
   */
  static async getCachedSummary(segments: TranscriptSegment[], videoId: string): Promise<VideoSummary | null> {
    const text = formatTranscriptForAI(segments)
    if (!text.trim() || !videoId) return null
    const tHash = hashString(text)
    const cacheKey = `summary_${videoId}_${tHash}`
    return await getAICache<VideoSummary>(cacheKey)
  }

  /**
   * Retrieves cached flashcards without triggering an API call.
   */
  static async getCachedFlashcards(segments: TranscriptSegment[], videoId: string): Promise<Flashcard[] | null> {
    const text = formatTranscriptForAI(segments)
    if (!text.trim() || !videoId) return null
    const tHash = hashString(text)
    const cacheKey = `flashcards_${videoId}_${tHash}`
    return await getAICache<Flashcard[]>(cacheKey)
  }

  /**
   * Retrieves cached quiz without triggering an API call.
   */
  static async getCachedQuiz(segments: TranscriptSegment[], videoId: string): Promise<QuizQuestion[] | null> {
    const text = formatTranscriptForAI(segments)
    if (!text.trim() || !videoId) return null
    const tHash = hashString(text)
    const cacheKey = `quiz_${videoId}_${tHash}`
    return await getAICache<QuizQuestion[]>(cacheKey)
  }

  /**
   * Generates a structured video summary, key takeaways, and core concepts.
   */
  static async generateSummary(
    segments: TranscriptSegment[],
    videoTitle: string,
    videoId: string,
    forceRefresh = false,
  ): Promise<VideoSummary> {
    const text = formatTranscriptForAI(segments)
    if (!text.trim()) {
      throw new GeminiError(
        'Cannot generate summary: no transcript or captions are available for this video.',
        'NO_TRANSCRIPT',
      )
    }

    const tHash = hashString(text)
    const cacheKey = `summary_${videoId}_${tHash}`

    if (!forceRefresh) {
      const cached = await getAICache<VideoSummary>(cacheKey)
      if (cached && cached.overview && Array.isArray(cached.keyTakeaways)) {
        return cached
      }
    }

    const prompt = buildSummaryPrompt(text, videoTitle)
    const rawResponse = await callGemini({
      prompt,
      jsonMode: true,
      temperature: 0.2,
    })

    const parsed = extractJSON<VideoSummary>(rawResponse)

    // Validate structure
    const validated: VideoSummary = {
      overview: parsed.overview || 'Overview generated from video lecture.',
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
      importantConcepts: Array.isArray(parsed.importantConcepts) ? parsed.importantConcepts : [],
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
      difficulty: parsed.difficulty || 'Intermediate',
    }

    await setAICache(cacheKey, videoId, 'summary', validated)
    return validated
  }

  /**
   * Generates interactive active-recall flashcards from the transcript.
   */
  static async generateFlashcards(
    segments: TranscriptSegment[],
    videoTitle: string,
    videoId: string,
    forceRefresh = false,
  ): Promise<Flashcard[]> {
    const text = formatTranscriptForAI(segments)
    if (!text.trim()) {
      throw new GeminiError(
        'Cannot generate flashcards: no transcript or captions are available for this video.',
        'NO_TRANSCRIPT',
      )
    }

    const tHash = hashString(text)
    const cacheKey = `flashcards_${videoId}_${tHash}`

    if (!forceRefresh) {
      const cached = await getAICache<Flashcard[]>(cacheKey)
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached
      }
    }

    const prompt = buildFlashcardsPrompt(text, videoTitle)
    const rawResponse = await callGemini({
      prompt,
      jsonMode: true,
      temperature: 0.3,
    })

    const parsed = extractJSON<Flashcard[]>(rawResponse)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new GeminiError('Gemini did not return any flashcards.', 'EMPTY_CARDS')
    }

    const validated: Flashcard[] = parsed.map((card, idx) => ({
      id: card.id || `card-${idx + 1}`,
      question: card.question || 'Review concept',
      answer: card.answer || 'Answer',
      difficulty: card.difficulty || 'Medium',
      category: card.category,
    }))

    await setAICache(cacheKey, videoId, 'flashcards', validated)
    return validated
  }

  /**
   * Generates a multiple-choice quiz testing video comprehension.
   */
  static async generateQuiz(
    segments: TranscriptSegment[],
    videoTitle: string,
    videoId: string,
    forceRefresh = false,
  ): Promise<QuizQuestion[]> {
    const text = formatTranscriptForAI(segments)
    if (!text.trim()) {
      throw new GeminiError(
        'Cannot generate quiz: no transcript or captions are available for this video.',
        'NO_TRANSCRIPT',
      )
    }

    const tHash = hashString(text)
    const cacheKey = `quiz_${videoId}_${tHash}`

    if (!forceRefresh) {
      const cached = await getAICache<QuizQuestion[]>(cacheKey)
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached
      }
    }

    const prompt = buildQuizPrompt(text, videoTitle)
    const rawResponse = await callGemini({
      prompt,
      jsonMode: true,
      temperature: 0.3,
    })

    const parsed = extractJSON<QuizQuestion[]>(rawResponse)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new GeminiError('Gemini did not return quiz questions.', 'EMPTY_QUIZ')
    }

    const validated: QuizQuestion[] = parsed.map((q, idx) => ({
      id: q.id || `q-${idx + 1}`,
      question: q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Yes', 'No'],
      correctAnswer: typeof q.correctAnswer === 'number' ? Math.max(0, Math.min(q.options.length - 1, q.correctAnswer)) : 0,
      explanation: q.explanation || 'Refer to the video lecture for details.',
      difficulty: q.difficulty || 'Medium',
    }))

    await setAICache(cacheKey, videoId, 'quiz', validated)
    return validated
  }

  /**
   * Sends a conversational message grounded in the video transcript.
   */
  static async chatWithTranscript(
    segments: TranscriptSegment[],
    history: ChatMessage[],
    userQuestion: string,
    videoTitle?: string,
  ): Promise<{ response: string; followUps: string[] }> {
    const text = formatTranscriptForAI(segments)
    const systemInstruction = buildChatSystemPrompt(
      text.trim() || 'No transcript text available. Answer generally about the video title.',
      videoTitle,
    )

    // Build contents array for Gemini multi-turn format
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

    // Include recent conversation history (up to last 8 messages)
    const recentHistory = history.slice(-8)
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })
    }

    // Add current user question
    contents.push({
      role: 'user',
      parts: [{ text: userQuestion }],
    })

    const rawResponse = await callGemini({
      systemInstruction,
      contents,
      temperature: 0.4,
    })

    // Check for follow-up questions marker
    let responseText = rawResponse
    let followUps: string[] = []

    const marker = '---FOLLOW_UPS---'
    if (rawResponse.includes(marker)) {
      const parts = rawResponse.split(marker)
      responseText = parts[0].trim()
      const followUpBlock = parts[1] || ''
      followUps = followUpBlock
        .split('\n')
        .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter((l) => l.length > 5 && l.endsWith('?'))
        .slice(0, 3)
    }

    return {
      response: responseText,
      followUps,
    }
  }
}
