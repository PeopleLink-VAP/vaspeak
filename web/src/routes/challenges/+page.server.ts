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

	return {
		credits: { remaining: creditsRow.allowance - creditsRow.used, allowance: creditsRow.allowance },
		streak
	};
};
