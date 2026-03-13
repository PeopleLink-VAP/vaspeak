import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { MONTHLY_ALLOWANCE } from '$lib/server/credits';

export const GET: RequestHandler = async ({ cookies }) => {
	const userId = cookies.get('session_user_id');
	if (!userId) return json({ error: 'Not authenticated' }, { status: 401 });

	// Credits summary
	let credits = { used: 0, allowance: MONTHLY_ALLOWANCE, resetDate: '' };
	try {
		const rows = await db.execute({
			sql: 'SELECT credits_used, monthly_allowance, reset_date FROM user_credits WHERE user_id = ?',
			args: [userId]
		});
		if (rows.rows.length > 0) {
			credits = {
				used:       Number(rows.rows[0].credits_used ?? 0),
				allowance:  Number(rows.rows[0].monthly_allowance ?? MONTHLY_ALLOWANCE),
				resetDate:  String(rows.rows[0].reset_date ?? '')
			};
		}
	} catch { /* table may not exist yet */ }

	// Usage history from user_progress — count roleplay blocks completed per day
	const history: Array<{ date: string; creditsSpent: number; lessonTitle: string }> = [];
	try {
		const rows = await db.execute({
			sql: `SELECT up.completed_at, up.simulation_scores, l.title
			      FROM user_progress up
			      JOIN lessons l ON l.id = up.lesson_id
			      WHERE up.user_id = ? AND up.simulation_scores IS NOT NULL
			      ORDER BY up.completed_at DESC
			      LIMIT 20`,
			args: [userId]
		});
		for (const row of rows.rows) {
			const date = String(row.completed_at ?? '').slice(0, 10);
			// Each roleplay block completion costs 3 credits (ROLEPLAY_CREDIT_COST)
			// We track this via simulation_scores presence
			let spent = 0;
			try {
				const scores = JSON.parse(String(row.simulation_scores ?? '{}'));
				if (scores.roleplay) spent = 3;
			} catch { /* ignore */ }
			history.push({ date, creditsSpent: spent, lessonTitle: String(row.title ?? '') });
		}
	} catch { /* ignore */ }

	return json({
		credits: {
			...credits,
			remaining: Math.max(0, credits.allowance - credits.used)
		},
		history
	});
};
