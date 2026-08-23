export interface VideoSummary {
  overview: string
  keyTakeaways: string[]
  importantConcepts: Array<{ term: string; explanation: string }>
  applications: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

export interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category?: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number // 0-indexed index
  explanation: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  suggestedFollowUps?: string[]
}

export type AICacheType = 'summary' | 'flashcards' | 'quiz'

export interface AICacheRecord {
  id?: number
  cacheKey: string
  videoId: string
  type: AICacheType
  data: any
  createdAt: number
}
