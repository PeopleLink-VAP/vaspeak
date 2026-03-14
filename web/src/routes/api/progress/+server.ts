import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { earnCredits } from '$lib/server/credits';
import { calculateStreakBonus, getNewMilestones, getRewardCredits, type UserStats } from '$lib/gamification';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ ok: true, note: 'No session — progress not saved' });
	}
	const userId = locals.user.id;

	let body: {
		lessonId: string;
		blockCompletions: Record<string, boolean>;
		stressLevel?: number | null;
		reflectionNotes?: string | null;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const { lessonId, blockCompletions, stressLevel, reflectionNotes } = body;

	if (!lessonId || typeof blockCompletions !== 'object') {
		return json({ error: 'Missing lessonId or blockCompletions' }, { status: 400 });
	}

	// Determine if all 4 blocks are complete
	const allDone = Object.values(blockCompletions).filter(Boolean).length >= 4;

	try {
		await db.execute({
			sql: `INSERT INTO user_progress (id, user_id, lesson_id, block_completions, stress_level, reflection_notes, completed_at)
			      VALUES (lower(hex(randomblob(8))), ?, ?, ?, ?, ?, ?)
			      ON CONFLICT(user_id, lesson_id) DO UPDATE SET
			          block_completions = excluded.block_completions,
			          stress_level = excluded.stress_level,
			          reflection_notes = excluded.reflection_notes,
			          completed_at = excluded.completed_at`,
			args: [
				userId,
				lessonId,
				JSON.stringify(blockCompletions),
				stressLevel ?? null,
				reflectionNotes ?? null,
				allDone ? new Date().toISOString() : null
			]
		});

		let rewards: { streakBonus?: { credits: number; message: string }; newMilestones?: Array<{ id: string; label: string; icon: string; credits: number }> } = {};

		// Update streak and award bonuses if lesson is fully complete
		if (allDone) {
			const today = new Date().toISOString().slice(0, 10);
			await db.execute({
				sql: `UPDATE profiles SET
				          last_active_date = ?,
				          streak_count = CASE
				              WHEN last_active_date = date(?, '-1 day') THEN streak_count + 1
				              WHEN last_active_date = ? THEN streak_count
				              ELSE 1
				          END,
				          updated_at = CURRENT_TIMESTAMP
				      WHERE id = ?`,
				args: [today, today, today, userId]
			});

			// Get updated streak count
			const profileRow = await db.execute({
				sql: 'SELECT streak_count FROM profiles WHERE id = ?',
				args: [userId]
			});
			const currentStreak = Number(profileRow.rows[0]?.streak_count ?? 1);

			// Award streak bonus credits
			const bonus = calculateStreakBonus(currentStreak);
			await earnCredits(userId, bonus.credits, 'daily_bonus');
			rewards.streakBonus = { credits: bonus.credits, message: bonus.messageVi };

			// Check for new milestones
			const [progressCount, vocabCount, scoreResult, earnedResult, weeksResult] = await Promise.all([
				db.execute({ sql: 'SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND completed_at IS NOT NULL', args: [userId] }),
				db.execute({ sql: 'SELECT COUNT(*) as c FROM vocabulary_bank WHERE user_id = ? AND mastered = 1', args: [userId] }),
				db.execute({ sql: 'SELECT MAX(CAST(json_extract(simulation_scores, \'$.total\') AS INTEGER)) as max_score FROM user_progress WHERE user_id = ?', args: [userId] }),
				db.execute({ sql: 'SELECT reason FROM credit_events WHERE user_id = ? AND reason LIKE \'milestone_%\'', args: [userId] }),
				db.execute({
					sql: `SELECT DISTINCT l.week_number FROM user_progress up
					      JOIN lessons l ON l.id = up.lesson_id
					      WHERE up.user_id = ? AND up.completed_at IS NOT NULL
					      GROUP BY l.week_number
					      HAVING COUNT(*) >= 7`,
					args: [userId]
				})
			]);

			const stats: UserStats = {
				streakCount: currentStreak,
				lessonsCompleted: Number(progressCount.rows[0]?.c ?? 0),
				vocabMastered: Number(vocabCount.rows[0]?.c ?? 0),
				highestRoleplayScore: Number(scoreResult.rows[0]?.max_score ?? 0),
				weeksCompleted: weeksResult.rows.map(r => Number(r.week_number)),
				earnedMilestoneIds: earnedResult.rows.map(r => String(r.reason).replace('milestone_', ''))
			};

			const newMilestones = getNewMilestones(stats);
			if (newMilestones.length > 0) {
				rewards.newMilestones = [];
				for (const m of newMilestones) {
					const creditReward = getRewardCredits(m.reward);
					if (creditReward > 0) {
						await earnCredits(userId, creditReward, `milestone_${m.id}`);
					}
					rewards.newMilestones.push({
						id: m.id,
						label: m.labelVi,
						icon: m.icon,
						credits: creditReward
					});
				}
			}
		}

		return json({ ok: true, allDone, rewards });
	} catch (err) {
		console.error('[progress] DB error:', err);
		return json({ error: 'Failed to save progress' }, { status: 500 });
	}
};
