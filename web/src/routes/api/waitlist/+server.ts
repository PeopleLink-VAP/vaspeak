import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { waitlistLimiter } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	if (!waitlistLimiter.allow(getClientAddress())) {
		return json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
	}


	let email: string;

	try {
		const body = await request.json();
		email = (body.email ?? '').trim().toLowerCase();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	// Basic email validation
	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ error: 'Please provide a valid email address.' }, { status: 400 });
	}

	try {
		await db.execute({
			sql: `INSERT INTO newsletter_subscribers (id, email, subscribed_at)
			      VALUES (lower(hex(randomblob(16))), ?, CURRENT_TIMESTAMP)`,
			args: [email]
		});

		return json({
			message: "You're on the list! We'll notify you when VASpeak launches. 🎉"
		});
	} catch (err: unknown) {
		// SQLite UNIQUE constraint violation — already subscribed
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('UNIQUE') || msg.includes('unique')) {
			return json({ error: 'This email is already on the waitlist!' }, { status: 409 });
		}
		console.error('[waitlist] DB error:', err);
		return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
	}
};
