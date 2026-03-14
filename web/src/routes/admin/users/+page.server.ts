import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const search = url.searchParams.get('q')?.trim() ?? '';
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const limit = 25;
    const offset = (page - 1) * limit;

    const where = search
        ? `WHERE p.email LIKE ? OR p.display_name LIKE ?`
        : '';
    const args: (string | number)[] = search
        ? [`%${search}%`, `%${search}%`, limit, offset]
        : [limit, offset];

    try {
        const [usersResult, countResult] = await Promise.all([
            db.execute({
                sql: `SELECT p.id, p.email, p.display_name, p.role, p.email_verified,
                             p.streak_count, p.current_level, p.created_at,
                             uc.credits_used, uc.monthly_allowance, uc.subscription_status
                      FROM profiles p
                      LEFT JOIN user_credits uc ON uc.user_id = p.id
                      ${where}
                      ORDER BY p.created_at DESC
                      LIMIT ? OFFSET ?`,
                args
            }),
            db.execute({
                sql: `SELECT COUNT(*) as total FROM profiles p ${where}`,
                args: search ? [`%${search}%`, `%${search}%`] : []
            })
        ]);

        const total = Number(countResult.rows[0]?.total ?? 0);

        return {
            users: usersResult.rows,
            total,
            page,
            pages: Math.ceil(total / limit),
            search
        };
    } catch (err) {
        console.error('[admin/users] load error:', err);
        return { users: [], total: 0, page: 1, pages: 1, search };
    }
};

export const actions: Actions = {
    // Toggle email_verified
    verify: async ({ request }) => {
        const data = await request.formData();
        const userId = String(data.get('userId') ?? '');
        const current = data.get('current') === '1';
        try {
            await db.execute({
                sql: `UPDATE profiles SET email_verified = ? WHERE id = ?`,
                args: [current ? 0 : 1, userId]
            });
        } catch (err) {
            console.error('[admin/users] verify error:', err);
            return fail(500, { error: 'Failed to update verification status' });
        }
        return { success: true };
    },

    // Promote to admin / demote to user
    setRole: async ({ request }) => {
        const data = await request.formData();
        const userId = String(data.get('userId') ?? '');
        const role = data.get('role') === 'admin' ? 'admin' : 'user';
        try {
            await db.execute({
                sql: `UPDATE profiles SET role = ? WHERE id = ?`,
                args: [role, userId]
            });
        } catch (err) {
            console.error('[admin/users] setRole error:', err);
            return fail(500, { error: 'Failed to update role' });
        }
        return { success: true };
    },

    // Reset user credits
    resetCredits: async ({ request }) => {
        const data = await request.formData();
        const userId = String(data.get('userId') ?? '');
        try {
            await db.execute({
                sql: `UPDATE user_credits SET credits_used = 0 WHERE user_id = ?`,
                args: [userId]
            });
        } catch (err) {
            console.error('[admin/users] resetCredits error:', err);
            return fail(500, { error: 'Failed to reset credits' });
        }
        return { success: true };
    },

    // Delete user and all their data
    deleteUser: async ({ request }) => {
        const data = await request.formData();
        const userId = String(data.get('userId') ?? '');
        try {
            await db.batch([
                { sql: `DELETE FROM credit_events WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM user_credits WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM user_progress WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM vocabulary_bank WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM magic_links WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM password_resets WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM auth_passwords WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM profiles WHERE id = ?`, args: [userId] }
            ]);
        } catch (err) {
            console.error('[admin/users] deleteUser error:', err);
            return fail(500, { error: 'Failed to delete user' });
        }
        return { success: true };
    },

    // Get detailed user profile for popup
    getUserProfile: async ({ request }) => {
        const data = await request.formData();
        const userId = String(data.get('userId') ?? '');
        try {
            const [profile, progress, vocab, creditEvents, lastActive] = await Promise.all([
                db.execute({
                    sql: `SELECT p.*, uc.credits_used, uc.monthly_allowance, uc.subscription_status, uc.reset_date
                          FROM profiles p LEFT JOIN user_credits uc ON uc.user_id = p.id
                          WHERE p.id = ?`,
                    args: [userId]
                }),
                db.execute({
                    sql: `SELECT COUNT(*) as total, MAX(completed_at) as last_completed
                          FROM user_progress WHERE user_id = ?`,
                    args: [userId]
                }),
                db.execute({
                    sql: `SELECT COUNT(*) as total, SUM(CASE WHEN mastered = 1 THEN 1 ELSE 0 END) as mastered
                          FROM vocabulary_bank WHERE user_id = ?`,
                    args: [userId]
                }),
                db.execute({
                    sql: `SELECT reason, delta, created_at FROM credit_events
                          WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
                    args: [userId]
                }),
                db.execute({
                    sql: `SELECT lesson_id, completed_at, simulation_scores, stress_level
                          FROM user_progress WHERE user_id = ?
                          ORDER BY completed_at DESC LIMIT 5`,
                    args: [userId]
                })
            ]);

            return {
                success: true,
                userProfile: {
                    ...profile.rows[0],
                    lessonsCompleted: Number(progress.rows[0]?.total ?? 0),
                    lastLessonDate: progress.rows[0]?.last_completed ?? null,
                    vocabTotal: Number(vocab.rows[0]?.total ?? 0),
                    vocabMastered: Number(vocab.rows[0]?.mastered ?? 0),
                    recentCredits: creditEvents.rows,
                    recentProgress: lastActive.rows
                }
            };
        } catch (err) {
            console.error('[admin/users] getUserProfile error:', err);
            return fail(500, { error: 'Failed to load profile' });
        }
    }
};
