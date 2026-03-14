/**
 * Shared vocabulary challenge generation — used by both Telegram bot and in-app games.
 * Extracted from telegram.ts for reuse.
 */
import { randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';

const GROQ_API_KEY = env.GROQ_API_KEY || '';

export interface VocabChallenge {
    word: string;
    definition: string;
    example: string;
    question: string;
    options: string[];
    correctIndex: number;
}

/**
 * Generate a vocabulary challenge using Groq AI.
 * Returns a word, definition, example sentence, fill-in-the-blank question, and 4 options.
 */
export async function generateVocabChallenge(level: string, niche: string, existingWords: string[]): Promise<VocabChallenge> {
    const existingList = existingWords.slice(0, 30).join(', ') || 'none yet';

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a vocabulary teacher for Vietnamese Virtual Assistants learning English.
Generate ONE new vocabulary word appropriate for a ${level} level VA working in ${niche}.
DO NOT repeat these words: ${existingList}
The word should be practical for VA work communication.

Return ONLY valid JSON (no markdown, no code fences):
{
  "word": "the English word/phrase",
  "definition": "Vietnamese definition (concise)",
  "example": "A short example sentence using the word in a VA work context",
  "question": "A fill-in-the-blank sentence in English (use ___ for the blank)",
  "options": ["correct answer", "wrong1", "wrong2", "wrong3"],
  "correctIndex": 0
}
Shuffle the options randomly and set correctIndex to match the correct answer's position (0-3).`
                },
                {
                    role: 'user',
                    content: `Generate a vocabulary challenge for a ${level} VA in ${niche} niche.`
                }
            ],
            temperature: 0.8,
            max_tokens: 300
        })
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
}

/**
 * Create a new vocab challenge for a user, storing it in telegram_challenges
 * (shared table for both Telegram and in-app games) and vocabulary_bank.
 * Returns the challenge object for display.
 */
export async function createVocabChallengeForUser(userId: string): Promise<VocabChallenge & { isNew: boolean }> {
    // Check for existing unanswered challenge
    const pending = await db.execute({
        sql: 'SELECT word, correct_index, options FROM telegram_challenges WHERE user_id = ? AND answered = 0 ORDER BY created_at DESC LIMIT 1',
        args: [userId]
    });

    if (pending.rows.length > 0) {
        const row = pending.rows[0];
        const options = JSON.parse(String(row.options));
        // We don't send back correctIndex — that would let the client cheat
        return {
            word: String(row.word),
            definition: '', // hidden until answered
            example: '',    // hidden until answered
            question: '',   // need to reconstruct or store it — fetch from vocab bank
            options,
            correctIndex: -1, // hidden
            isNew: false
        };
    }

    // Get user level/niche
    const profileRow = await db.execute({
        sql: 'SELECT current_level, niche FROM profiles WHERE id = ?',
        args: [userId]
    });
    const profile = profileRow.rows[0];
    const level = String(profile?.current_level || 'beginner');
    const niche = String(profile?.niche || 'general');

    // Get existing words to avoid repeats
    const vocabRows = await db.execute({
        sql: 'SELECT word FROM vocabulary_bank WHERE user_id = ? ORDER BY added_at DESC LIMIT 50',
        args: [userId]
    });
    const existingWords = vocabRows.rows.map(r => String(r.word));

    // Generate challenge via AI
    const challenge = await generateVocabChallenge(level, niche, existingWords);

    // Save to vocab bank
    const vocabId = randomBytes(8).toString('hex');
    await db.execute({
        sql: `INSERT OR IGNORE INTO vocabulary_bank (id, user_id, word, definition, context_sentence, mastered)
              VALUES (?, ?, ?, ?, ?, 0)`,
        args: [vocabId, userId, challenge.word, challenge.definition, challenge.example]
    });

    // Store challenge for answer verification (shared with Telegram)
    await db.execute({
        sql: `INSERT OR REPLACE INTO telegram_challenges (user_id, word, correct_index, options, answered, created_at)
              VALUES (?, ?, ?, ?, 0, datetime('now'))`,
        args: [userId, challenge.word, challenge.correctIndex, JSON.stringify(challenge.options)]
    });

    return { ...challenge, isNew: true };
}

/**
 * Process a user's answer to a vocab challenge.
 * Returns result info for display.
 */
export async function answerVocabChallenge(
    userId: string,
    word: string,
    answerIndex: number
): Promise<{
    correct: boolean;
    correctIndex: number;
    correctAnswer: string;
    word: string;
    definition: string;
    example: string;
    creditsEarned: number;
}> {
    const ch = await db.execute({
        sql: 'SELECT word, correct_index, options FROM telegram_challenges WHERE user_id = ? AND word = ? AND answered = 0',
        args: [userId, word]
    });

    if (ch.rows.length === 0) {
        throw new Error('No pending challenge found for this word');
    }

    const correctIdx = Number(ch.rows[0].correct_index);
    const options = JSON.parse(String(ch.rows[0].options));
    const isCorrect = answerIndex === correctIdx;
    const label = 'ABCD'[answerIndex] || '?';

    // Mark as answered
    await db.execute({
        sql: `UPDATE telegram_challenges SET answered = 1, user_answer = ?, answered_at = datetime('now'), correct = ?, credits_earned = ? WHERE user_id = ? AND word = ?`,
        args: [label, isCorrect ? 1 : 0, isCorrect ? 1 : 0, userId, word]
    });

    // Get vocab info for result display
    const vocabRow = await db.execute({
        sql: 'SELECT definition, context_sentence FROM vocabulary_bank WHERE user_id = ? AND word = ?',
        args: [userId, word]
    });
    const definition = String(vocabRow.rows[0]?.definition ?? '');
    const example = String(vocabRow.rows[0]?.context_sentence ?? '');

    // Credit + mastery bookkeeping (non-blocking)
    if (isCorrect) {
        try {
            const { earnCredits } = await import('$lib/server/credits');
            await earnCredits(userId, 1, 'word_game_challenge');
            await db.execute({ sql: 'UPDATE vocabulary_bank SET mastered = 1 WHERE user_id = ? AND word = ?', args: [userId, word] });
        } catch (err) {
            console.error('[vocab answer] credit update failed (non-fatal):', err);
        }
    }

    return {
        correct: isCorrect,
        correctIndex: correctIdx,
        correctAnswer: options[correctIdx],
        word: String(ch.rows[0].word),
        definition,
        example,
        creditsEarned: isCorrect ? 1 : 0
    };
}
