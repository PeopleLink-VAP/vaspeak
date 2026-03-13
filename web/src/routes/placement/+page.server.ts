import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/login');

    // Fetch the user's current level to see if they've already taken it?
    // We'll let them re-take it if they want.
    const res = await db.execute({
        sql: 'SELECT current_level, niche FROM profiles WHERE id = ?',
        args: [locals.user.id]
    });
    const profile = res.rows[0];

    return { profile };
};

export const actions: Actions = {
    submit: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Not authenticated' });

        const data = await request.formData();
        const experience = data.get('experience')?.toString();
        const speakingMatch = data.get('speaking')?.toString();
        const niche = data.get('niche')?.toString() || 'general';

        if (!speakingMatch) {
            return fail(400, { error: 'Vui lòng chọn trình độ nói hiện tại của bạn.' });
        }

        // Logic determining starting level
        /**
         * Beginner -> 'general'
         * Intermediate / Advanced -> 'working_va'
         */
        let current_level = 'general';
        if (speakingMatch === 'intermediate' || speakingMatch === 'advanced') {
            current_level = 'working_va';
        }

        try {
            await db.execute({
                sql: 'UPDATE profiles SET current_level = ?, niche = ? WHERE id = ?',
                args: [current_level, niche, locals.user.id]
            });
        } catch (err: any) {
            console.error('[placement error]', err);
            return fail(500, { error: 'Lưu thông tin thất bại, vui lòng thử lại.' });
        }

        throw redirect(303, '/dashboard');
    }
};
