import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import { scorePlacement, validatePlacement } from '$lib/placement';
import type { PlacementInput } from '$lib/placement';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/login');

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
        const input: PlacementInput = {
            experience: (data.get('experience')?.toString() || '') as PlacementInput['experience'],
            speaking: (data.get('speaking')?.toString() || '') as PlacementInput['speaking'],
            niche: data.get('niche')?.toString() || 'general'
        };

        const validationError = validatePlacement(input);
        if (validationError) {
            return fail(400, { error: validationError });
        }

        const result = scorePlacement(input);

        try {
            await db.execute({
                sql: 'UPDATE profiles SET current_level = ?, niche = ? WHERE id = ?',
                args: [result.level, result.niche, locals.user.id]
            });
        } catch (err: any) {
            console.error('[placement error]', err);
            return fail(500, { error: 'Lưu thông tin thất bại, vui lòng thử lại.' });
        }

        throw redirect(303, '/dashboard');
    }
};
