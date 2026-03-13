import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { MONTHLY_ALLOWANCE } from '$lib/server/credits';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	const userId = locals.user.id;

	let credits = { used: 0, allowance: MONTHLY_ALLOWANCE, resetDate: '' };
	try {
		const rows = await db.execute({
			sql: 'SELECT credits_used, monthly_allowance, reset_date FROM user_credits WHERE user_id = ?',
			args: [userId]
		});
		if (rows.rows.length > 0) {
			credits = {
				used:      Number(rows.rows[0].credits_used ?? 0),
				allowance: Number(rows.rows[0].monthly_allowance ?? MONTHLY_ALLOWANCE),
				resetDate: String(rows.rows[0].reset_date ?? '')
			};
		}
	} catch { /* ok */ }

	// Per-lesson usage history
	const history: Array<{ date: string; lessonTitle: string; creditsSpent: number; score: number | null }> = [];
	try {
		const rows = await db.execute({
			sql: `SELECT up.completed_at, up.simulation_scores, l.title, l.day_number
			      FROM user_progress up
			      JOIN lessons l ON l.id = up.lesson_id
			      WHERE up.user_id = ?
			      ORDER BY up.completed_at DESC
			      LIMIT 30`,
			args: [userId]
		});
		for (const row of rows.rows) {
			let spent = 0;
			let score: number | null = null;
			try {
				const scores = JSON.parse(String(row.simulation_scores ?? '{}'));
				if (scores.roleplay) {
					spent = 3;
					score = scores.roleplay.total ?? null;
				}
			} catch { /* ignore */ }
			history.push({
				date:         String(row.completed_at ?? '').slice(0, 10),
				lessonTitle:  String(row.title ?? `Day ${row.day_number}`),
				creditsSpent: spent,
				score
			});
		}
	} catch { /* ok */ }

	return {
		credits: {
			...credits,
			remaining: Math.max(0, credits.allowance - credits.used)
		},
		history
	};
};
