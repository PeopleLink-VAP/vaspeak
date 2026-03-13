import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { signToken, SESSION_COOKIE, cookieOptions } from '$lib/server/auth';

/**
 * GET /auth/verify-email?token=xxx
 * Validates the token, marks profile verified, creates a session, redirects to dashboard.
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
	const token = url.searchParams.get('token') ?? '';

	if (!token) throw redirect(302, '/login?verified=invalid');

	// Look up token
	const result = await db.execute({
		sql: `SELECT ev.id, ev.user_id, ev.expires_at,
		             p.email, p.display_name, p.role
		      FROM email_verifications ev
		      JOIN profiles p ON p.id = ev.user_id
		      WHERE ev.code = ?`,
		args: [token]
	});

	const row = result.rows[0];
	if (!row) throw redirect(302, '/login?verified=invalid');

	const expiresAt = new Date(String(row.expires_at));
	if (expiresAt < new Date()) {
		await db.execute({ sql: `DELETE FROM email_verifications WHERE id = ?`, args: [row.id] });
		throw redirect(302, '/login?verified=expired');
	}

	// Consume token + mark verified atomically
	await db.batch([
		{
			sql: `UPDATE profiles SET email_verified = 1 WHERE id = ?`,
			args: [row.user_id]
		},
		{
			sql: `DELETE FROM email_verifications WHERE id = ?`,
			args: [row.id]
		}
	]);

	// Auto-login: create a session so the user goes straight to the dashboard
	const sessionToken = signToken({
		id:          String(row.user_id),
		email:       String(row.email),
		displayName: row.display_name ? String(row.display_name) : null,
		role:        String(row.role ?? 'user')
	});
	cookies.set(SESSION_COOKIE, sessionToken, cookieOptions);

	throw redirect(302, '/dashboard?welcome=1');
};
