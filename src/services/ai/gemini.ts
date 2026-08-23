import { getSettings } from '../../storage/settings'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-2.0-flash'
const FALLBACK_MODEL = 'gemini-1.5-flash'

interface GeminiRequestOptions {
  prompt?: string
  systemInstruction?: string
  contents?: Array<{
    role: 'user' | 'model'
    parts: Array<{ text: string }>
  }>
  jsonMode?: boolean
  temperature?: number
  apiKeyOverride?: string
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

/**
 * Extracts and cleans JSON from a string that might be wrapped in markdown code blocks.
 */
export function extractJSON<T = any>(rawText: string): T {
  let cleaned = rawText.trim()

  // Remove markdown code fences ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '')
  cleaned = cleaned.replace(/\n?```\s*$/i, '')
  cleaned = cleaned.trim()

  // Try direct parse first
  try {
    return JSON.parse(cleaned)
  } catch (initialErr) {
    // Attempt recovery by locating the first { or [ and last } or ]
    const firstBrace = cleaned.indexOf('{')
    const firstBracket = cleaned.indexOf('[')
    let startIdx = -1
    let endIdx = -1

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace
      endIdx = cleaned.lastIndexOf('}')
    } else if (firstBracket !== -1) {
      startIdx = firstBracket
      endIdx = cleaned.lastIndexOf(']')
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const candidate = cleaned.substring(startIdx, endIdx + 1)
      try {
        return JSON.parse(candidate)
      } catch (e) {
        // Fall through to error below
      }
    }

    throw new GeminiError(
      'Failed to parse structured response from Gemini. The AI response was malformed.',
      'PARSE_ERROR',
    )
  }
}

/**
 * Executes a call to the Google Gemini API with error handling and fallback models.
 */
export async function callGemini(options: GeminiRequestOptions): Promise<string> {
  const settings = await getSettings()
  const apiKey = (options.apiKeyOverride ?? settings.geminiApiKey ?? '').trim()

  if (!apiKey) {
    throw new GeminiError(
      'Gemini API key is missing. Please add your API key in Settings (get a free key at ai.google.dev).',
      'MISSING_API_KEY',
    )
  }

  const contents = options.contents ?? [
    {
      role: 'user',
      parts: [{ text: options.prompt ?? '' }],
    },
  ]

  const payload: Record<string, any> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  }

  if (options.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    }
  }

  // Try primary model, fallback if model unavailable
  try {
    return await executeRequest(DEFAULT_MODEL, apiKey, payload)
  } catch (error: any) {
    if (error?.status === 404 || error?.code === 'MODEL_NOT_FOUND') {
      console.warn(`[FloatTube AI] ${DEFAULT_MODEL} unavailable, retrying with ${FALLBACK_MODEL}...`)
      return await executeRequest(FALLBACK_MODEL, apiKey, payload)
    }
    throw error
  }
}

async function executeRequest(model: string, apiKey: string, payload: any): Promise<string> {
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (networkErr: any) {
    throw new GeminiError(
      'Network connection to Google Gemini API failed. Please check your internet connection.',
      'NETWORK_ERROR',
    )
  }

  if (!response.ok) {
    let errorData: any = null
    try {
      errorData = await response.json()
    } catch {
      // Ignore JSON parse errors for error body
    }

    const message = errorData?.error?.message ?? response.statusText

    if (response.status === 400) {
      if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
        throw new GeminiError(
          'Invalid Gemini API key. Please check your API key in Settings.',
          'INVALID_API_KEY',
          400,
        )
      }
      throw new GeminiError(`Gemini Request Error: ${message}`, 'BAD_REQUEST', 400)
    }

    if (response.status === 403) {
      throw new GeminiError(
        'Gemini API key does not have permission or billing is blocked. Check your Google AI Studio console.',
        'FORBIDDEN',
        403,
      )
    }

    if (response.status === 429) {
      throw new GeminiError(
        'Gemini API rate limit or quota exceeded. Please wait a moment and try again.',
        'RATE_LIMITED',
        429,
      )
    }

    if (response.status === 404) {
      throw new GeminiError(`Model ${model} not found or unsupported.`, 'MODEL_NOT_FOUND', 404)
    }

    throw new GeminiError(`Gemini API error (${response.status}): ${message}`, 'API_ERROR', response.status)
  }

  const result = await response.json()
  const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!candidateText) {
    const finishReason = result.candidates?.[0]?.finishReason
    if (finishReason === 'SAFETY') {
      throw new GeminiError(
        'The response was flagged by safety filters. Please try rephrasing or using a different section.',
        'SAFETY_FLAG',
      )
    }
    throw new GeminiError('Gemini returned an empty response.', 'EMPTY_RESPONSE')
  }

  return candidateText
}

/**
 * Validates a Gemini API key by performing a lightweight test generation call.
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  const cleanKey = apiKey.trim()
  if (!cleanKey) {
    return { success: false, message: 'API key cannot be empty.' }
  }

  try {
    const text = await callGemini({
      apiKeyOverride: cleanKey,
      prompt: 'Respond with a single word: "connected"',
      temperature: 0.1,
    })

    if (text && text.toLowerCase().includes('connected')) {
      return { success: true, message: 'Connection successful! Gemini API is active.' }
    }
    return { success: true, message: 'Connection verified with Google Gemini.' }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message ?? 'Failed to connect to Gemini API.',
    }
  }
}
