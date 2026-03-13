/**
 * Email verification token helpers.
 * - createVerificationToken(): stores a single-use token in email_verifications
 * - verifyEmailToken(): validates token, marks profile as email_verified=1, cleans up
 */

import { db } from '$lib/server/db';
import { randomBytes } from 'crypto';

const EXPIRES_MINUTES = 60; // 1 hour

/** Create a scoped verification token for a user. Returns the token string. */
export async function createVerificationToken(userId: string, email: string): Promise<string> {
	const token = randomBytes(32).toString('hex');
	const id    = randomBytes(8).toString('hex');
	const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000).toISOString();

	// Clean up any old tokens for this user first
	await db.execute({
		sql: `DELETE FROM email_verifications WHERE user_id = ?`,
		args: [userId]
	});

	await db.execute({
		sql: `INSERT INTO email_verifications (id, user_id, email, code, expires_at)
		      VALUES (?, ?, ?, ?, ?)`,
		args: [id, userId, email, token, expiresAt]
	});

	return token;
}

/**
 * Consume a verification token.
 * Returns 'ok' | 'expired' | 'invalid'
 */
export async function verifyEmailToken(token: string): Promise<'ok' | 'expired' | 'invalid'> {
	const result = await db.execute({
		sql: `SELECT ev.user_id, ev.expires_at
		      FROM email_verifications ev
		      WHERE ev.code = ?`,
		args: [token]
	});

	const row = result.rows[0];
	if (!row) return 'invalid';

	const expiresAt = new Date(String(row.expires_at));
	if (expiresAt < new Date()) {
		// Clean up expired token
		await db.execute({ sql: `DELETE FROM email_verifications WHERE code = ?`, args: [token] });
		return 'expired';
	}

	// Mark profile as verified + consume token atomically
	await db.batch([
		{
			sql: `UPDATE profiles SET email_verified = 1 WHERE id = ?`,
			args: [row.user_id]
		},
		{
			sql: `DELETE FROM email_verifications WHERE code = ?`,
			args: [token]
		}
	]);

	return 'ok';
}

export const VERIFICATION_EXPIRY_MINUTES = EXPIRES_MINUTES;
