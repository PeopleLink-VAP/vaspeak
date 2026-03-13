import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	const userId = locals.user.id;


	// Load today's lesson (based on user progress — find lowest incomplete day)
	// For now, default to day 1 if no progress
	let todayLesson = null;
	let progress = { completedDays: 0, currentDay: 1 };

	try {
		// Find the furthest completed lesson
		const progressRows = await db.execute({
			sql: `SELECT l.day_number
			      FROM user_progress up
			      JOIN lessons l ON l.id = up.lesson_id
			      WHERE up.user_id = ? AND up.completed_at IS NOT NULL
			      ORDER BY l.day_number DESC
			      LIMIT 1`,
			args: [userId]
		});
		const lastCompleted = progressRows.rows[0]?.day_number ?? 0;
		progress.completedDays = Number(lastCompleted);
		progress.currentDay = Number(lastCompleted) + 1;

		// Load today's lesson
		const lessonRows = await db.execute({
			sql: `SELECT id, day_number, week_number, week_theme, niche, title
			      FROM lessons
			      WHERE day_number = ? AND niche = 'general' AND is_published = 1`,
			args: [progress.currentDay]
		});

		if (lessonRows.rows.length > 0) {
			todayLesson = lessonRows.rows[0];
		}
	} catch {
		// DB not ready or user not found — that's OK for the landing experience
	}

	// Load credits
	let credits = { used: 0, allowance: 100 };
	try {
		const creditRows = await db.execute({
			sql: 'SELECT credits_used, monthly_allowance FROM user_credits WHERE user_id = ?',
			args: [userId]
		});
		if (creditRows.rows.length > 0) {
			credits = {
				used: Number(creditRows.rows[0].credits_used),
				allowance: Number(creditRows.rows[0].monthly_allowance)
			};
		}
	} catch { /* ignore */ }

	// Load profile
	let profile = null;
	try {
		const profileRows = await db.execute({
			sql: 'SELECT display_name, streak_count, current_level FROM profiles WHERE id = ?',
			args: [userId]
		});
		profile = profileRows.rows[0] ?? null;
	} catch { /* ignore */ }

	return { todayLesson, progress, credits, profile };
};
