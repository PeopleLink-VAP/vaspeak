/**
 * Password reset helpers.
 * Tokens are stored in `password_resets`, expire in 1 hour, single-use.
 */

import { randomBytes } from 'crypto';
import { db } from '$lib/server/db';
import { findUserByEmail } from '$lib/server/auth';

const EXPIRY_HOURS = 1;

export interface PasswordResetPayload {
	userId: string;
	email: string;
}

/**
 * Create a password reset token for an existing, verified user.
 * Returns the token, or null if the email is not registered.
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
	const user = await findUserByEmail(email.toLowerCase().trim());
	if (!user) return null;

	const token = randomBytes(32).toString('hex');
	const id = randomBytes(8).toString('hex');
	const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

	// Invalidate any previous tokens for this user
	await db.execute({
		sql: `DELETE FROM password_resets WHERE user_id = ?`,
		args: [String(user.id)]
	});

	await db.execute({
		sql: `INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
		args: [id, String(user.id), token, expiresAt]
	});

	return token;
}

/**
 * Consume a password reset token.
 * Returns the user payload if valid, or null if invalid/expired.
 */
export async function consumePasswordResetToken(token: string): Promise<PasswordResetPayload | null> {
	if (!token || token.length < 32) return null;

	const result = await db.execute({
		sql: `SELECT pr.id, pr.user_id, pr.expires_at, p.email
		      FROM password_resets pr
		      JOIN profiles p ON p.id = pr.user_id
		      WHERE pr.token = ?`,
		args: [token]
	});

	const row = result.rows[0];
	if (!row) return null;

	const expiresAt = new Date(String(row.expires_at));
	if (expiresAt < new Date()) {
		await db.execute({ sql: `DELETE FROM password_resets WHERE token = ?`, args: [token] });
		return null;
	}

	// Consume the token — delete so it can't be reused
	await db.execute({ sql: `DELETE FROM password_resets WHERE token = ?`, args: [token] });

	return {
		userId: String(row.user_id),
		email: String(row.email)
	};
}

/**
 * Look up a token WITHOUT consuming it (to show the reset form).
 * Returns basic info or null if invalid/expired.
 */
export async function verifyPasswordResetToken(token: string): Promise<PasswordResetPayload | null> {
	if (!token || token.length < 32) return null;

	const result = await db.execute({
		sql: `SELECT pr.user_id, pr.expires_at, p.email
		      FROM password_resets pr
		      JOIN profiles p ON p.id = pr.user_id
		      WHERE pr.token = ?`,
		args: [token]
	});

	const row = result.rows[0];
	if (!row) return null;

	const expiresAt = new Date(String(row.expires_at));
	if (expiresAt < new Date()) {
		await db.execute({ sql: `DELETE FROM password_resets WHERE token = ?`, args: [token] });
		return null;
	}

	return {
		userId: String(row.user_id),
		email: String(row.email)
	};
}
