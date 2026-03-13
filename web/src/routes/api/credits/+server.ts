import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCreditsRow, getCreditLedger } from '$lib/server/credits';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Not authenticated' }, { status: 401 });
	const userId = locals.user.id;

	const creditsRow = await getCreditsRow(userId);
	const ledger = await getCreditLedger(userId, 20);

	return json({
		credits: {
			...creditsRow,
			remaining: Math.max(0, creditsRow.allowance - creditsRow.used)
		},
		ledger
	});
};
