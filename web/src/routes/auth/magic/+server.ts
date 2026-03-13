import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { consumeMagicLink } from '$lib/server/magic-link';
import { findUserByEmail, signToken, SESSION_COOKIE, cookieOptions } from '$lib/server/auth';
import { db } from '$lib/server/db';

/**
 * GET /auth/magic?token=<hex>
 *
 * Validates the magic link token, creates a session, and redirects to /dashboard.
 * On failure, redirects to /login?error=<reason>.
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
	const token = url.searchParams.get('token') ?? '';

	if (!token) {
		throw redirect(302, '/login?error=missing_token');
	}

	const payload = await consumeMagicLink(token);

	if (!payload) {
		// Token invalid or expired
		throw redirect(302, '/login?error=invalid_token');
	}

	// Fetch fresh user data from DB to build session
	const user = await findUserByEmail(payload.email);
	if (!user) {
		throw redirect(302, '/login?error=user_not_found');
	}

	// Mark email as verified since they clicked a link sent to their email
	await db.execute({
		sql: `UPDATE profiles SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		args: [payload.userId]
	});

	const sessionToken = signToken({
		id:          payload.userId,
		email:       payload.email,
		displayName: user.display_name ? String(user.display_name) : null,
		role:        String(user.role ?? 'user')
	});

	cookies.set(SESSION_COOKIE, sessionToken, cookieOptions);
	throw redirect(302, '/dashboard');
};
