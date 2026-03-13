import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const day = parseInt(params.day, 10);

	if (isNaN(day) || day < 1) {
		throw error(400, 'Invalid lesson day');
	}

	const rows = await db.execute({
		sql: `SELECT id, day_number, week_number, week_theme, niche, title, content
		      FROM lessons
		      WHERE day_number = ? AND niche = 'general' AND is_published = 1`,
		args: [day]
	});

	if (rows.rows.length === 0) {
		throw error(404, `Lesson for day ${day} not found`);
	}

	const row = rows.rows[0];
	let content = [];
	try {
		content = JSON.parse(String(row.content));
	} catch {
		throw error(500, 'Lesson content is malformed');
	}

	// Load existing progress for this lesson if user is logged in
	let existingProgress = null;
	const userId = cookies.get('session_user_id');
	if (userId) {
		try {
			const progressRows = await db.execute({
				sql: 'SELECT block_completions, simulation_scores FROM user_progress WHERE user_id = ? AND lesson_id = ?',
				args: [userId, String(row.id)]
			});
			if (progressRows.rows.length > 0) {
				existingProgress = {
					blockCompletions: JSON.parse(String(progressRows.rows[0].block_completions || '{}')),
					simulationScores: JSON.parse(String(progressRows.rows[0].simulation_scores || '{}'))
				};
			}
		} catch { /* ignore */ }
	}

	return {
		lesson: {
			id: String(row.id),
			day: Number(row.day_number),
			week: Number(row.week_number),
			weekTheme: String(row.week_theme ?? ''),
			niche: String(row.niche),
			title: String(row.title),
			content
		},
		existingProgress
	};
};
