import { db } from '$lib/server/db';
import { redirect, fail } from '@sveltejs/kit';
import { randomBytes } from 'crypto';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/login');
    
    try {
        const [result, challengeRes] = await Promise.all([
            db.execute({
                sql: 'SELECT * FROM vocabulary_bank WHERE user_id = ? ORDER BY added_at DESC',
                args: [locals.user.id]
            }),
            db.execute({
                sql: `SELECT COUNT(*) as total, 
                      SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as wins,
                      SUM(CASE WHEN credits_earned > 0 THEN credits_earned ELSE 0 END) as credits_earned
                      FROM telegram_challenges WHERE user_id = ?`,
                args: [locals.user.id]
            })
        ]);
        const ch = challengeRes.rows[0];
        return { 
            words: result.rows,
            challengeStats: {
                total: Number(ch?.total ?? 0),
                wins: Number(ch?.wins ?? 0),
                creditsEarned: Number(ch?.credits_earned ?? 0)
            }
        };
    } catch (err) {
        console.error('[vocabulary load error]', err);
        return { words: [], challengeStats: { total: 0, wins: 0, creditsEarned: 0 } };
    }
};

export const actions: Actions = {
    add: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });
        
        const data = await request.formData();
        const word = data.get('word')?.toString().trim();
        const definition = data.get('definition')?.toString().trim();
        const context = data.get('context')?.toString().trim() || null;
        
        if (!word || !definition) {
            return fail(400, { error: 'Missing word or definition', word, definition, context });
        }
        
        const id = randomBytes(8).toString('hex');
        const now = new Date().toISOString();
        
        try {
            await db.execute({
                sql: `INSERT INTO vocabulary_bank (id, user_id, word, definition, context_sentence, mastered, added_at)
                      VALUES (?, ?, ?, ?, ?, 0, ?)`,
                args: [id, locals.user.id, word, definition, context, now]
            });
            return { success: true };
        } catch (err) {
            console.error('[vocabulary add error]', err);
            return fail(500, { error: 'Failed to save word', word, definition, context });
        }
    },
    
    toggle: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });
        
        const data = await request.formData();
        const id = data.get('id')?.toString();
        const currentMastered = data.get('current') === '1';
        
        if (!id) return fail(400, { error: 'Missing word ID' });
        
        try {
            await db.execute({
                sql: 'UPDATE vocabulary_bank SET mastered = ? WHERE id = ? AND user_id = ?',
                args: [currentMastered ? 0 : 1, id, locals.user.id]
            });
            return { success: true };
        } catch (err) {
            console.error('[vocabulary toggle error]', err);
            return fail(500, { error: 'Failed to update word' });
        }
    },
    
    delete: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });
        
        const data = await request.formData();
        const id = data.get('id')?.toString();
        
        if (!id) return fail(400, { error: 'Missing word ID' });
        
        try {
            await db.execute({
                sql: 'DELETE FROM vocabulary_bank WHERE id = ? AND user_id = ?',
                args: [id, locals.user.id]
            });
            return { success: true };
        } catch (err) {
            console.error('[vocabulary delete error]', err);
            return fail(500, { error: 'Failed to delete word' });
        }
    }
};
