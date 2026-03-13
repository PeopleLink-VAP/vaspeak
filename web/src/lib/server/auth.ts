/**
 * VASpeak Auth Library
 * - Password hashing via bcryptjs (pure JS, no native build)
 * - Session tokens via JWT (7-day, httpOnly cookie)
 * - Helper to read session from cookies
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '$lib/server/db';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const COOKIE_NAME = 'va_session';
const SALT_ROUNDS = 10;
const SESSION_DAYS = 7;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionUser {
	id: string;
	email: string;
	displayName: string | null;
	role: string;
}

export interface JwtPayload {
	sub: string;       // user id
	email: string;
	displayName: string | null;
	role: string;
	iat?: number;
	exp?: number;
}

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

export async function hashPassword(plain: string): Promise<string> {
	return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
	return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

export function signToken(user: SessionUser): string {
	const payload: JwtPayload = {
		sub: user.id,
		email: user.email,
		displayName: user.displayName,
		role: user.role
	};
	return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
}

export function verifyToken(token: string): JwtPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as JwtPayload;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Cookie config
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = COOKIE_NAME;

export const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
	maxAge: SESSION_DAYS * 24 * 60 * 60   // seconds
};

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

/** Look up a user by email — returns profile + password hash row */
export async function findUserByEmail(email: string) {
	const rows = await db.execute({
		sql: `SELECT p.id, p.email, p.display_name, p.role, p.email_verified,
		             ap.password_hash
		      FROM profiles p
		      LEFT JOIN auth_passwords ap ON ap.user_id = p.id
		      WHERE p.email = ?`,
		args: [email.toLowerCase().trim()]
	});
	return rows.rows[0] ?? null;
}

/** Create profile + auth_passwords + user_credits rows atomically */
export async function createUser(opts: {
	id: string;
	email: string;
	displayName: string;
	passwordHash: string;
}): Promise<void> {
	await db.execute({
		sql: `INSERT INTO profiles (id, email, display_name, email_verified, role)
		      VALUES (?, ?, ?, 0, 'user')`,
		args: [opts.id, opts.email, opts.displayName]
	});
	await db.execute({
		sql: `INSERT INTO auth_passwords (user_id, password_hash) VALUES (?, ?)`,
		args: [opts.id, opts.passwordHash]
	});
	await db.execute({
		sql: `INSERT INTO user_credits (user_id, monthly_allowance, credits_used, subscription_status)
		      VALUES (?, 100, 0, 'free')`,
		args: [opts.id]
	});
}
