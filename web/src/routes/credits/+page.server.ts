import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCreditsRow, getCreditLedger, MONTHLY_ALLOWANCE } from '$lib/server/credits';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	const userId = locals.user.id;

	// Use shared helper — eliminates duplicate query
	const creditsRow = await getCreditsRow(userId);

	// Read the real credit_events ledger
	const ledger = await getCreditLedger(userId, 30);

	// Also load per-lesson usage history with scores for display context
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
			let score: number | null = null;
			try {
				const scores = JSON.parse(String(row.simulation_scores ?? '{}'));
				if (scores.roleplay) score = scores.roleplay.total ?? null;
			} catch { /* malformed scores — skip */ }
			history.push({
				date:         String(row.completed_at ?? '').slice(0, 10),
				lessonTitle:  String(row.title ?? `Day ${row.day_number}`),
				creditsSpent: ledger.find(e => e.createdAt.slice(0, 10) === String(row.completed_at ?? '').slice(0, 10))?.delta
					? Math.abs(ledger.find(e => e.createdAt.slice(0, 10) === String(row.completed_at ?? '').slice(0, 10))!.delta)
					: 0,
				score
			});
		}
	} catch (err) {
		console.error('[credits] Failed to load history:', err);
	}

	return {
		credits: {
			...creditsRow,
			remaining: Math.max(0, creditsRow.allowance - creditsRow.used)
		},
		ledger,
		history
	};
};
