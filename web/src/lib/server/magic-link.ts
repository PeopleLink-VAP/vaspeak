/**
 * Magic link helpers — generate, store, verify, and consume tokens.
 * Tokens are 32 random bytes (hex), stored in the magic_links table,
 * expire in 15 minutes, and are single-use.
 */

import { randomBytes } from 'crypto';
import { db } from '$lib/server/db';
import { findUserByEmail } from '$lib/server/auth';

const EXPIRY_MINUTES = 15;

export interface MagicLinkPayload {
	userId: string;
	email: string;
}

/**
 * Create a magic link token for an existing user.
 * Returns the token, or null if the email is not registered.
 */
export async function createMagicLink(email: string): Promise<string | null> {
	const user = await findUserByEmail(email.toLowerCase().trim());
	if (!user) return null;

	const token = randomBytes(32).toString('hex');
	const id = randomBytes(8).toString('hex');
	const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString();

	// Invalidate any previous tokens for this user
	await db.execute({
		sql: `DELETE FROM magic_links WHERE user_id = ?`,
		args: [String(user.id)]
	});

	await db.execute({
		sql: `INSERT INTO magic_links (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
		args: [id, String(user.id), token, expiresAt]
	});

	return token;
}

/**
 * Verify and consume a magic link token.
 * Returns the user payload if valid, or null if invalid/expired.
 */
export async function consumeMagicLink(token: string): Promise<MagicLinkPayload | null> {
	if (!token || token.length < 32) return null;

	const result = await db.execute({
		sql: `SELECT ml.user_id, ml.expires_at, p.email
		      FROM magic_links ml
		      JOIN profiles p ON p.id = ml.user_id
		      WHERE ml.token = ?`,
		args: [token]
	});

	const row = result.rows[0];
	if (!row) return null;

	// Check expiry
	const expiresAt = new Date(String(row.expires_at));
	if (expiresAt < new Date()) {
		// Clean up expired token
		await db.execute({ sql: `DELETE FROM magic_links WHERE token = ?`, args: [token] });
		return null;
	}

	// Consume — delete immediately so it can't be reused
	await db.execute({ sql: `DELETE FROM magic_links WHERE token = ?`, args: [token] });

	return {
		userId: String(row.user_id),
		email: String(row.email)
	};
}

/**
 * Purge expired magic links (call periodically or on each request).
 */
export async function purgeExpiredMagicLinks(): Promise<void> {
	await db.execute({
		sql: `DELETE FROM magic_links WHERE expires_at < datetime('now')`,
		args: []
	});
}
