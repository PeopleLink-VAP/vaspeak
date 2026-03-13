import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const userId = cookies.get('session_user_id');

	// For dev with no session, still acknowledge
	if (!userId) {
		return json({ ok: true, note: 'No session — progress not saved' });
	}

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

		// Update streak if lesson is fully complete
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
		}

		return json({ ok: true, allDone });
	} catch (err) {
		console.error('[progress] DB error:', err);
		return json({ error: 'Failed to save progress' }, { status: 500 });
	}
};
