import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '$env/static/private';

export const groq = new Groq({ apiKey: GROQ_API_KEY });

export const ROLEPLAY_MODEL = 'llama-3.3-70b-versatile';
export const SCORE_MODEL    = 'llama-3.1-8b-instant'; // fast, cheap for scoring
export const STT_MODEL      = 'whisper-large-v3-turbo'; // for ASR
export const TTS_MODEL      = 'canopylabs/orpheus-v1-english';
export const TTS_VOICE      = 'hannah'; // natural female voice — others: autumn, diana, austin, daniel, troy

/**
 * Builds the system prompt for an AI roleplay client character.
 * Pure function — injectable for tests.
 */
export function buildRoleplaySystemPrompt(opts: {
    scenario: string;
    clientPersona: string;
    clientOpening: string;
    scoringCriteria: string[];
}): string {
    return `You are roleplaying as an English-speaking client in a business scenario.

SCENARIO: ${opts.scenario}
YOUR PERSONA: ${opts.clientPersona}
YOUR OPENING LINE: "${opts.clientOpening}"

RULES:
- Stay fully in character as the client. Never break character.
- Respond naturally, as if in a real conversation. Keep replies to 2-4 sentences.
- You are testing if the Virtual Assistant (VA) can handle you professionally.
- Do NOT correct the VA's English, just respond naturally to what they say.
- Gradually react based on how well the VA handles the conversation.
- After 4-6 exchanges, you may wrap up the conversation naturally.

SCORING CRITERIA the VA is being assessed on (for context only):
${opts.scoringCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
}

/**
 * Builds the scoring prompt for evaluating a single VA response.
 * Pure function — injectable for tests.
 */
export function buildScoringPrompt(opts: {
    scenario: string;
    scoringCriteria: string[];
    vaResponse: string;
    conversationHistory: string;
}): string {
    return `You are an English communication coach for Vietnamese Virtual Assistants.

Evaluate this VA response in a roleplay scenario and return a JSON score.

SCENARIO: ${opts.scenario}

CONVERSATION SO FAR:
${opts.conversationHistory}

VA RESPONSE TO SCORE: "${opts.vaResponse}"

SCORING CRITERIA:
${opts.scoringCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "total": <0-100 integer>,
  "breakdown": {
    "clarity": <0-25>,
    "professionalism": <0-25>,
    "vocabulary": <0-25>,
    "confidence": <0-25>
  },
  "feedback": "<1-2 sentence constructive feedback in English>",
  "highlight": "<best phrase or word the VA used, or empty string>"
}`;
}

/**
 * Parses and validates a Groq scoring JSON response.
 * Returns null if the response is malformed.
 * Pure function — no side effects, injectable for tests.
 */
export type ScoreResult = {
    total: number;
    breakdown: { clarity: number; professionalism: number; vocabulary: number; confidence: number };
    feedback: string;
    highlight: string;
};

export function parseScoreResponse(raw: string): ScoreResult | null {
    // Strip markdown code fences if model wraps it
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    try {
        const parsed = JSON.parse(cleaned);
        if (
            typeof parsed.total !== 'number' ||
            typeof parsed.breakdown !== 'object' ||
            typeof parsed.feedback !== 'string'
        ) return null;
        return {
            total: Math.min(100, Math.max(0, Math.round(parsed.total))),
            breakdown: {
                clarity:        Math.min(25, Math.max(0, Math.round(parsed.breakdown.clarity ?? 0))),
                professionalism: Math.min(25, Math.max(0, Math.round(parsed.breakdown.professionalism ?? 0))),
                vocabulary:     Math.min(25, Math.max(0, Math.round(parsed.breakdown.vocabulary ?? 0))),
                confidence:     Math.min(25, Math.max(0, Math.round(parsed.breakdown.confidence ?? 0))),
            },
            feedback:  String(parsed.feedback ?? ''),
            highlight: String(parsed.highlight ?? ''),
        };
    } catch {
        return null;
    }
}
