import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCreditsRow } from '$lib/server/credits';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	const userId = locals.user.id;

	// Load today's lesson (based on user progress — find lowest incomplete day)
	let todayLesson = null;
	let progress = { completedDays: 0, currentDay: 1 };

	try {
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

		const lessonRows = await db.execute({
			sql: `SELECT id, day_number, week_number, week_theme, niche, title
			      FROM lessons
			      WHERE day_number = ? AND niche = 'general' AND is_published = 1`,
			args: [progress.currentDay]
		});

		if (lessonRows.rows.length > 0) {
			todayLesson = lessonRows.rows[0];
		}
	} catch (err) {
		console.error('[dashboard] Failed to load progress/lesson:', err);
	}

	// Use shared helper — eliminates duplicated credit query
	const creditsRow = await getCreditsRow(userId);
	const credits = { used: creditsRow.used, allowance: creditsRow.allowance };

	// Load profile
	let profile = null;
	try {
		const profileRows = await db.execute({
			sql: 'SELECT display_name, streak_count, current_level, niche FROM profiles WHERE id = ?',
			args: [userId]
		});
		profile = profileRows.rows[0] ?? null;
	} catch (err) {
		console.error('[dashboard] Failed to load profile:', err);
	}

	// If user hasn't taken placement test, redirect them
	if (!profile?.current_level) {
		throw redirect(302, '/placement');
	}

	return { todayLesson, progress, credits, profile };
};
