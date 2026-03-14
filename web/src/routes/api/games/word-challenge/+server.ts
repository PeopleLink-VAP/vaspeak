/**
 * GET  /api/games/word-challenge — Fetch current pending challenge or generate a new one.
 * POST /api/games/word-challenge — Submit an answer.
 *
 * Auth: requires session cookie (locals.user).
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createVocabChallengeForUser, answerVocabChallenge } from '$lib/server/vocab';
import { db } from '$lib/server/db';
import { getCreditsRemaining } from '$lib/server/credits';

/**
 * GET — Return the user's current pending challenge, or generate a fresh one.
 */
export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
    const userId = locals.user.id;

    try {
        // Check remaining credits (generating costs Groq API call)
        const remaining = await getCreditsRemaining(userId);

        // Check for existing unanswered challenge first
        const pending = await db.execute({
            sql: `SELECT tc.word, tc.options, vb.context_sentence as question
                  FROM telegram_challenges tc
                  LEFT JOIN vocabulary_bank vb ON vb.user_id = tc.user_id AND vb.word = tc.word
                  WHERE tc.user_id = ? AND tc.answered = 0
                  ORDER BY tc.created_at DESC LIMIT 1`,
            args: [userId]
        });

        if (pending.rows.length > 0) {
            const row = pending.rows[0];
            return json({
                status: 'pending',
                challenge: {
                    word: String(row.word),
                    question: String(row.question || ''),
                    options: JSON.parse(String(row.options))
                },
                credits: remaining
            });
        }

        // Generate a new challenge
        const challenge = await createVocabChallengeForUser(userId);

        return json({
            status: 'new',
            challenge: {
                word: challenge.word,
                question: challenge.question,
                options: challenge.options
            },
            credits: remaining
        });
    } catch (err) {
        console.error('[word-challenge GET]', err);
        return json({ error: 'Failed to generate challenge' }, { status: 500 });
    }
};

/**
 * POST — Submit answer. Body: { word: string, answerIndex: number }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
    const userId = locals.user.id;

    try {
        const { word, answerIndex } = await request.json();

        if (!word || typeof answerIndex !== 'number' || answerIndex < 0 || answerIndex > 3) {
            return json({ error: 'Invalid request: need word and answerIndex (0-3)' }, { status: 400 });
        }

        const result = await answerVocabChallenge(userId, word, answerIndex);

        return json({
            status: 'answered',
            ...result
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[word-challenge POST]', message);

        if (message.includes('No pending challenge')) {
            return json({ error: message }, { status: 404 });
        }
        return json({ error: 'Failed to process answer' }, { status: 500 });
    }
};
