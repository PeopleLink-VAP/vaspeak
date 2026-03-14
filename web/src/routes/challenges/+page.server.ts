import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getCreditsRow } from '$lib/server/credits';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	const userId = locals.user.id;

	const creditsRow = await getCreditsRow(userId);

	// Load profile for streak
	let streak = 0;
	try {
		const row = await db.execute({ sql: 'SELECT streak_count FROM profiles WHERE id = ?', args: [userId] });
		streak = Number(row.rows[0]?.streak_count ?? 0);
	} catch { /* ignore */ }

	// Load today's word challenge status
	let wordGameStatus: 'none' | 'pending' | 'correct' | 'wrong' = 'none';
	try {
		const today = await db.execute({
			sql: `SELECT answered, correct FROM telegram_challenges
			      WHERE user_id = ? AND date(created_at) = date('now')
			      ORDER BY created_at DESC LIMIT 1`,
			args: [userId]
		});
		if (today.rows.length > 0) {
			const row = today.rows[0];
			if (Number(row.answered) === 0) {
				wordGameStatus = 'pending';
			} else {
				wordGameStatus = Number(row.correct) === 1 ? 'correct' : 'wrong';
			}
		}
	} catch { /* ignore */ }

	// Total word game stats
	let wordGameStats = { total: 0, wins: 0 };
	try {
		const stats = await db.execute({
			sql: `SELECT COUNT(*) as total, SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as wins
			      FROM telegram_challenges WHERE user_id = ?`,
			args: [userId]
		});
		wordGameStats = {
			total: Number(stats.rows[0]?.total ?? 0),
			wins: Number(stats.rows[0]?.wins ?? 0)
		};
	} catch { /* ignore */ }

	return {
		credits: { remaining: creditsRow.allowance - creditsRow.used, allowance: creditsRow.allowance },
		streak,
		wordGameStatus,
		wordGameStats
	};
};
