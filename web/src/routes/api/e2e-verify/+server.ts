import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request }) => {
	// Only allow in development or test environments
	if (!dev && process.env.NODE_ENV !== 'test') {
		return json({ error: 'Not allowed' }, { status: 403 });
	}

	const { email } = await request.json();
	if (!email) return json({ error: 'Missing email' }, { status: 400 });

	try {
		await db.execute({
			sql: 'UPDATE profiles SET email_verified = 1 WHERE email = ?',
			args: [email]
		});
		return json({ success: true });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
};
