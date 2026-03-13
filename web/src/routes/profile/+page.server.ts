import { db } from '$lib/server/db';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/login');
    
    try {
        const [profileRes, creditsRes] = await Promise.all([
            db.execute({
                sql: 'SELECT * FROM profiles WHERE id = ?',
                args: [locals.user.id]
            }),
            db.execute({
                sql: 'SELECT * FROM user_credits WHERE user_id = ?',
                args: [locals.user.id]
            })
        ]);
        
        return { 
            profile: profileRes.rows[0],
            credits: creditsRes.rows[0]
        };
    } catch (err) {
        console.error('[profile load error]', err);
        return { profile: null, credits: null };
    }
};

export const actions: Actions = {
    update: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });
        
        const data = await request.formData();
        const displayName = data.get('displayName')?.toString().trim();
        const niche = data.get('niche')?.toString().trim() || 'general';
        
        if (!displayName) {
            return fail(400, { error: 'Tên hiển thị không được để trống' });
        }
        
        try {
            await db.execute({
                sql: 'UPDATE profiles SET display_name = ?, niche = ? WHERE id = ?',
                args: [displayName, niche, locals.user.id]
            });
            return { success: true };
        } catch (err) {
            console.error('[profile update error]', err);
            return fail(500, { error: 'Lỗi khi cập nhật hồ sơ' });
        }
    }
};
