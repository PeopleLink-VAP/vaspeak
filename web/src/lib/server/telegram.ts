/**
 * Shared helper: generate a vocab challenge using Groq AI.
 * Used by both the webhook (/word) and the daily cron.
 */
import { randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';

const GROQ_API_KEY = env.GROQ_API_KEY || '';
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '';

export async function sendTelegramMessage(chatId: string, text: string, extra?: object) {
    if (!BOT_TOKEN) return;
    const body: Record<string, unknown> = { chat_id: chatId, text, parse_mode: 'HTML', ...extra };
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

export interface VocabChallenge {
    word: string;
    definition: string;
    example: string;
    question: string;
    options: string[];
    correctIndex: number;
}

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
 * Generate and send a vocab challenge to a specific user via Telegram.
 * Also saves the word to vocab bank and stores the challenge for answer verification.
 */
export async function sendVocabChallenge(userId: string, chatId: string, displayName: string): Promise<boolean> {
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

    // Generate challenge
    const challenge = await generateVocabChallenge(level, niche, existingWords);

    // Save to vocab bank (generate random id — TEXT PK has no DEFAULT)
    const vocabId = randomBytes(8).toString('hex');
    await db.execute({
        sql: `INSERT OR IGNORE INTO vocabulary_bank (id, user_id, word, definition, context_sentence, mastered)
              VALUES (?, ?, ?, ?, ?, 0)`,
        args: [vocabId, userId, challenge.word, challenge.definition, challenge.example]
    });

    // Store challenge for answer verification
    await db.execute({
        sql: `INSERT OR REPLACE INTO telegram_challenges (user_id, word, correct_index, options, answered, created_at)
              VALUES (?, ?, ?, ?, 0, datetime('now'))`,
        args: [userId, challenge.word, challenge.correctIndex, JSON.stringify(challenge.options)]
    });

    // Format and send
    const labels = ['A', 'B', 'C', 'D'];
    const optionsText = challenge.options.map((o: string, i: number) => `${labels[i]}. ${o}`).join('\n');

    await sendTelegramMessage(chatId,
        `📚 <b>Từ Vựng Thử Thách</b>\n\n` +
        `Chào ${displayName}! Thử từ mới này nhé:\n\n` +
        `❓ <b>${challenge.question}</b>\n\n` +
        `${optionsText}\n\n` +
        `💡 Trả lời: A, B, C hoặc D\n` +
        `✅ Đúng = <b>+1 credit</b>`,
        {
            reply_markup: {
                keyboard: [[{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );

    return true;
}
