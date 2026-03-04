/**
 * Server-side authentication utilities.
 *
 * Handles password hashing, JWT session management, and secure cookies.
 * These functions run ONLY on the server (SvelteKit API routes / hooks).
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JWT_SECRET } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';

const SALT_ROUNDS = 12;
const SESSION_COOKIE_NAME = 'vaspeak_session';
const SESSION_EXPIRY = '7d'; // 7 days

export interface SessionPayload {
    userId: number;
    email: string;
    role: string;
}

// ─── Password Hashing ───────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ─── Token Generation ───────────────────────────────────────────────────────

/**
 * Generate a cryptographically random token (UUID v4).
 * Used for email verification, magic links, and password reset tokens.
 */
export function generateToken(): string {
    return uuidv4();
}

// ─── JWT Session Management ─────────────────────────────────────────────────

export function createSessionToken(userId: number, email: string, role: string): string {
    const payload: SessionPayload = { userId, email, role };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY });
}

export function verifySessionToken(token: string): SessionPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch {
        return null;
    }
}

// ─── Cookie Management ──────────────────────────────────────────────────────

export function setSessionCookie(cookies: Cookies, token: string): void {
    cookies.set(SESSION_COOKIE_NAME, token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });
}

export function getSessionCookie(cookies: Cookies): string | undefined {
    return cookies.get(SESSION_COOKIE_NAME);
}

export function clearSessionCookie(cookies: Cookies): void {
    cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}
