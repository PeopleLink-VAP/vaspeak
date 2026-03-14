import { db } from '$lib/server/db';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { checkMilestones, MILESTONES, type UserStats } from '$lib/gamification';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/login');
    const userId = locals.user.id;
    
    try {
        const [profileRes, creditsRes, progressRes, vocabRes, challengeRes] = await Promise.all([
            db.execute({ sql: 'SELECT * FROM profiles WHERE id = ?', args: [userId] }),
            db.execute({ sql: 'SELECT * FROM user_credits WHERE user_id = ?', args: [userId] }),
            db.execute({ sql: 'SELECT lesson_id, l.week_number FROM user_progress up JOIN lessons l ON l.id = up.lesson_id WHERE up.user_id = ? AND up.completed_at IS NOT NULL', args: [userId] }),
            db.execute({ sql: 'SELECT COUNT(*) as count FROM vocabulary_bank WHERE user_id = ? AND mastered = 1', args: [userId] }),
            db.execute({ sql: 'SELECT COUNT(*) as total, SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as wins FROM telegram_challenges WHERE user_id = ?', args: [userId] })
        ]);
        
        const profile = profileRes.rows[0];
        const lessonsCompleted = progressRes.rows.length;
        const vocabMastered = Number(vocabRes.rows[0]?.count ?? 0);
        
        // Calculate weeks completed
        const weekLessonCounts = new Map<number, number>();
        for (const row of progressRes.rows) {
            const w = Number(row.week_number);
            weekLessonCounts.set(w, (weekLessonCounts.get(w) || 0) + 1);
        }
        const weeksCompleted: number[] = [];
        weekLessonCounts.forEach((count, week) => { if (count >= 7) weeksCompleted.push(week); });

        const stats: UserStats = {
            streakCount: Number(profile?.streak_count ?? 0),
            lessonsCompleted,
            vocabMastered,
            highestRoleplayScore: 0, // TODO: track this
            weeksCompleted,
            earnedMilestoneIds: [] // We check all — earned = qualifies
        };

        const milestoneChecks = checkMilestones(stats);
        const earnedBadges = milestoneChecks.map(mc => ({
            id: mc.milestone.id,
            label: mc.milestone.labelVi,
            icon: mc.milestone.icon,
            earned: true
        }));
        
        // Add unearned milestones too (greyed out)
        const allBadges = MILESTONES.map(m => {
            const earned = milestoneChecks.some(mc => mc.milestone.id === m.id);
            return { id: m.id, label: m.labelVi, icon: m.icon, earned };
        });

        const challengeStats = {
            total: Number(challengeRes.rows[0]?.total ?? 0),
            wins: Number(challengeRes.rows[0]?.wins ?? 0)
        };

        return { 
            profile,
            credits: creditsRes.rows[0],
            badges: allBadges,
            earnedCount: earnedBadges.length,
            stats: { lessonsCompleted, vocabMastered, streak: stats.streakCount },
            challengeStats
        };
    } catch (err) {
        console.error('[profile load error]', err);
        return { profile: null, credits: null, badges: [], earnedCount: 0, stats: null, challengeStats: { total: 0, wins: 0 } };
    }
};

export const actions: Actions = {
    update: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });
        
        const data = await request.formData();
        const displayName = data.get('displayName')?.toString().trim();
        const niche = data.get('niche')?.toString().trim() || 'general';
        
        if (!displayName) return fail(400, { error: 'Tên hiển thị không được để trống' });
        
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
