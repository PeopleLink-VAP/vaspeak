import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const NICHES = ['general', 'ecommerce', 'video_editor', 'operations', 'social_media', 'customer_service', 'data_entry', 'real_estate'];

export const load: PageServerLoad = async ({ url }) => {
    const niche = url.searchParams.get('niche') ?? 'all';
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const limit = 20;
    const offset = (page - 1) * limit;

    const where = niche !== 'all' ? `WHERE niche = ?` : '';
    const countArgs = niche !== 'all' ? [niche] : [];
    const listArgs = niche !== 'all' ? [niche, limit, offset] : [limit, offset];

    try {
        const [lessonsResult, countResult] = await Promise.all([
            db.execute({
                sql: `SELECT id, day_number, week_number, week_theme, niche, title,
                             is_published, created_at, updated_at
                      FROM lessons
                      ${where}
                      ORDER BY niche ASC, day_number ASC
                      LIMIT ? OFFSET ?`,
                args: listArgs
            }),
            db.execute({
                sql: `SELECT COUNT(*) as total FROM lessons ${where}`,
                args: countArgs
            })
        ]);

        const total = Number(countResult.rows[0]?.total ?? 0);

        return {
            lessons: lessonsResult.rows,
            total,
            page,
            pages: Math.ceil(total / limit),
            niches: NICHES,
            currentNiche: niche
        };
    } catch (err) {
        console.error('[admin/lessons] load error:', err);
        return { lessons: [], total: 0, page: 1, pages: 1, niches: NICHES, currentNiche: 'all' };
    }
};

export const actions: Actions = {
    // Toggle publish status
    togglePublish: async ({ request }) => {
        const data = await request.formData();
        const lessonId = String(data.get('lessonId') ?? '');
        const current = data.get('current') === '1';
        try {
            await db.execute({
                sql: `UPDATE lessons SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                args: [current ? 0 : 1, lessonId]
            });
        } catch (err) {
            console.error('[admin/lessons] togglePublish error:', err);
            return fail(500, { error: 'Failed to toggle publish status' });
        }
        return { success: true };
    },

    // Create a new empty lesson
    create: async ({ request }) => {
        const data = await request.formData();
        const dayNumber = Number(data.get('day_number') ?? 1);
        const weekNumber = Math.ceil(dayNumber / 7);
        const niche = String(data.get('niche') ?? 'general');
        const title = String(data.get('title') ?? '').trim();
        const weekTheme = String(data.get('week_theme') ?? '').trim();

        if (!title || !dayNumber) {
            return fail(400, { error: 'Title and day number are required' });
        }

        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        const emptyContent = JSON.stringify([
            { type: 'listening', title: 'Listening Practice', content: '' },
            { type: 'drilling', title: 'Pattern Drilling', content: '' },
            { type: 'roleplay', title: 'Guided Simulation', scenario: '', clientPersona: '' },
            { type: 'reflection', title: 'Emotional Reflection', prompt: '' }
        ]);

        try {
            await db.execute({
                sql: `INSERT INTO lessons (id, day_number, week_number, week_theme, niche, title, content, is_published)
                      VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                args: [id, dayNumber, weekNumber, weekTheme, niche, title, emptyContent]
            });
        } catch (err) {
            console.error('[admin/lessons] create error:', err);
            return fail(500, { error: 'Failed to create lesson' });
        }
        return { success: true, lessonId: id };
    },

    // Delete a lesson
    delete: async ({ request }) => {
        const data = await request.formData();
        const lessonId = String(data.get('lessonId') ?? '');
        try {
            await db.batch([
                { sql: `DELETE FROM user_progress WHERE lesson_id = ?`, args: [lessonId] },
                { sql: `DELETE FROM lessons WHERE id = ?`, args: [lessonId] }
            ]);
        } catch (err) {
            console.error('[admin/lessons] delete error:', err);
            return fail(500, { error: 'Failed to delete lesson' });
        }
        return { success: true };
    },

    // Update lesson metadata (title, week_theme, etc.)
    update: async ({ request }) => {
        const data = await request.formData();
        const lessonId = String(data.get('lessonId') ?? '');
        const title = String(data.get('title') ?? '').trim();
        const weekTheme = String(data.get('week_theme') ?? '').trim();

        if (!title) return fail(400, { error: 'Title is required' });

        try {
            await db.execute({
                sql: `UPDATE lessons SET title = ?, week_theme = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                args: [title, weekTheme, lessonId]
            });
        } catch (err) {
            console.error('[admin/lessons] update error:', err);
            return fail(500, { error: 'Failed to update lesson' });
        }
        return { success: true };
    }
};
