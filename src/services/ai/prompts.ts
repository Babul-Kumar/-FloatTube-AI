export function buildSummaryPrompt(transcriptText: string, title?: string): string {
  return `You are an elite educational AI assistant. Analyze this video transcript and return a detailed, structured learning summary in valid JSON format.

${title ? `Video Title: "${title}"` : ''}

TRANSCRIPT:
"""
${transcriptText}
"""

You MUST respond strictly with a valid JSON object matching this exact schema:
{
  "overview": "A clear, concise executive summary (3-5 sentences) summarizing the core message and purpose of the video.",
  "keyTakeaways": [
    "Takeaway point 1 (actionable, insightful)",
    "Takeaway point 2",
    "Takeaway point 3",
    "Takeaway point 4",
    "Takeaway point 5",
    "Takeaway point 6",
    "Takeaway point 7"
  ],
  "importantConcepts": [
    {
      "term": "Concept Name",
      "explanation": "Clear and accessible explanation of the concept as taught in the video."
    }
  ],
  "applications": [
    "Real-world application or practical action item 1",
    "Real-world application or practical action item 2",
    "Real-world application or practical action item 3"
  ],
  "difficulty": "Beginner" | "Intermediate" | "Advanced"
}

Do not include any conversational filler, markdown code block wrappers, or text outside the JSON object.`
}

export function buildFlashcardsPrompt(transcriptText: string, title?: string): string {
  return `You are an expert tutor creating active-recall study flashcards based on the provided video lecture transcript.

${title ? `Video Title: "${title}"` : ''}

TRANSCRIPT:
"""
${transcriptText}
"""

Generate 10 to 15 high-quality, high-yield study flashcards covering key definitions, principles, formulas, or takeaways.
You MUST respond strictly with a valid JSON array of objects matching this exact schema:
[
  {
    "id": "card-1",
    "question": "Clear, direct question testing recall of a core concept",
    "answer": "Accurate, concise, and easy-to-understand answer",
    "difficulty": "Easy" | "Medium" | "Hard",
    "category": "Topic Name"
  }
]

Do not include any conversational filler, markdown code block wrappers, or text outside the JSON array.`
}

export function buildQuizPrompt(transcriptText: string, title?: string): string {
  return `You are an expert educational examiner. Create an engaging 5 to 10 question multiple-choice quiz testing comprehension of this video lecture transcript.

${title ? `Video Title: "${title}"` : ''}

TRANSCRIPT:
"""
${transcriptText}
"""

Each question must have 4 distinct plausible options, exactly one correct answer (indicated by 0-based index 0, 1, 2, or 3), and a thorough explanation explaining why the answer is correct.

You MUST respond strictly with a valid JSON array of objects matching this exact schema:
[
  {
    "id": "q-1",
    "question": "What is the primary function of ... ?",
    "options": [
      "Option A text",
      "Option B text",
      "Option C text",
      "Option D text"
    ],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why Option A is correct according to the video.",
    "difficulty": "Easy" | "Medium" | "Hard"
  }
]

Do not include any conversational filler, markdown code block wrappers, or text outside the JSON array.`
}

export function buildChatSystemPrompt(transcriptText: string, title?: string): string {
  return `You are FloatTube AI, an expert, encouraging, and highly intelligent study tutor assisting a student who is currently watching a video.

${title ? `Video Title: "${title}"` : ''}

Here is the full grounded transcript of the video:
"""
${transcriptText}
"""

Guidelines for answering:
1. Ground your answers directly in what the instructor teaches in the video transcript whenever possible.
2. If the user asks for clarification, explain with clear analogies, simple language, and code/practical examples if applicable.
3. If the user asks something completely unrelated to the video, answer helpfully while noting if it wasn't covered in the video.
4. Keep answers readable with markdown formatting (bullet points, bold text, code blocks).
5. At the very end of your response, you may optionally suggest 2-3 short follow-up questions the user might ask, formatted as:
---FOLLOW_UPS---
- Follow up question 1?
- Follow up question 2?`
}
