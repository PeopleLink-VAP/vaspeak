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
                             p.streak_count, p.current_level, p.niche, p.created_at, p.updated_at, p.last_active_date,
                             uc.credits_used, uc.monthly_allowance, uc.subscription_status,
                             (SELECT COUNT(*) FROM user_progress up2 WHERE up2.user_id = p.id) as lessons_done,
                             (SELECT COUNT(*) FROM vocabulary_bank vb WHERE vb.user_id = p.id) as vocab_count,
                             (SELECT MAX(completed_at) FROM user_progress up3 WHERE up3.user_id = p.id) as last_lesson_at
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
                { sql: `DELETE FROM telegram_links WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM telegram_challenges WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM telegram_messages WHERE user_id = ?`, args: [userId] },
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
            const [profile, progress, vocab, creditEvents, recentProgress, telegramLink, telegramStats, activityTimeline] = await Promise.all([
                // Basic profile + credits
                db.execute({
                    sql: `SELECT p.*, uc.credits_used, uc.monthly_allowance, uc.subscription_status, uc.reset_date
                          FROM profiles p LEFT JOIN user_credits uc ON uc.user_id = p.id
                          WHERE p.id = ?`,
                    args: [userId]
                }),
                // Lesson progress aggregate
                db.execute({
                    sql: `SELECT COUNT(*) as total, MAX(completed_at) as last_completed,
                                 AVG(stress_level) as avg_stress
                          FROM user_progress WHERE user_id = ?`,
                    args: [userId]
                }),
                // Vocab aggregate
                db.execute({
                    sql: `SELECT COUNT(*) as total, SUM(CASE WHEN mastered = 1 THEN 1 ELSE 0 END) as mastered
                          FROM vocabulary_bank WHERE user_id = ?`,
                    args: [userId]
                }),
                // Recent credit events (last 8)
                db.execute({
                    sql: `SELECT reason, delta, created_at FROM credit_events
                          WHERE user_id = ? ORDER BY created_at DESC LIMIT 8`,
                    args: [userId]
                }),
                // Recent lesson progress with lesson titles (last 8)
                db.execute({
                    sql: `SELECT up.lesson_id, up.completed_at, up.stress_level, up.block_completions,
                                 l.title as lesson_title, l.week_number, l.day_number
                          FROM user_progress up
                          LEFT JOIN lessons l ON l.id = up.lesson_id
                          WHERE up.user_id = ?
                          ORDER BY up.completed_at DESC LIMIT 8`,
                    args: [userId]
                }),
                // Telegram link status
                db.execute({
                    sql: `SELECT telegram_chat_id, telegram_username, linked_at, reminder_hour, timezone
                          FROM telegram_links WHERE user_id = ?`,
                    args: [userId]
                }),
                // Telegram challenge stats
                db.execute({
                    sql: `SELECT COUNT(*) as total_challenges,
                                 SUM(CASE WHEN answered = 1 THEN 1 ELSE 0 END) as answered,
                                 SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct,
                                 SUM(COALESCE(credits_earned, 0)) as total_credits_earned
                          FROM telegram_challenges WHERE user_id = ?`,
                    args: [userId]
                }),
                // Unified activity timeline (last 15 events across all tables)
                db.execute({
                    sql: `SELECT * FROM (
                            SELECT 'lesson' as type, 'Completed Lesson #' || up.lesson_id as description,
                                   COALESCE(l.title, 'Lesson') as detail, up.completed_at as timestamp
                            FROM user_progress up LEFT JOIN lessons l ON l.id = up.lesson_id
                            WHERE up.user_id = ?
                          UNION ALL
                            SELECT 'credit' as type,
                                   CASE WHEN delta > 0 THEN 'Earned ' || delta || ' credits' ELSE 'Spent ' || ABS(delta) || ' credits' END as description,
                                   reason as detail, created_at as timestamp
                            FROM credit_events WHERE user_id = ?
                          UNION ALL
                            SELECT 'vocab' as type, 'Added word: ' || word as description,
                                   CASE WHEN mastered = 1 THEN 'Mastered' ELSE 'Learning' END as detail, added_at as timestamp
                            FROM vocabulary_bank WHERE user_id = ?
                          UNION ALL
                            SELECT 'telegram' as type, 'Telegram challenge' as description,
                                   word as detail, created_at as timestamp
                            FROM telegram_challenges WHERE user_id = ?
                          ) ORDER BY timestamp DESC LIMIT 15`,
                    args: [userId, userId, userId, userId]
                })
            ]);

            const user = profile.rows[0];
            if (!user) return fail(404, { error: 'User not found' });

            const lessonsCompleted = Number(progress.rows[0]?.total ?? 0);
            const totalLessons = 49; // 7 weeks × 7 days

            return {
                success: true,
                userProfile: {
                    ...user,
                    lessonsCompleted,
                    totalLessons,
                    completionPct: totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0,
                    lastLessonDate: progress.rows[0]?.last_completed ?? null,
                    avgStress: progress.rows[0]?.avg_stress ? Number(Number(progress.rows[0].avg_stress).toFixed(1)) : null,
                    vocabTotal: Number(vocab.rows[0]?.total ?? 0),
                    vocabMastered: Number(vocab.rows[0]?.mastered ?? 0),
                    recentCredits: creditEvents.rows,
                    recentProgress: recentProgress.rows,
                    telegram: telegramLink.rows[0] ?? null,
                    telegramStats: telegramStats.rows[0] ?? null,
                    activityTimeline: activityTimeline.rows
                }
            };
        } catch (err) {
            console.error('[admin/users] getUserProfile error:', err);
            return fail(500, { error: 'Failed to load profile' });
        }
    }
};
