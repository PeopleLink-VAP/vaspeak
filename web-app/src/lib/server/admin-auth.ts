/**
 * Admin authentication for /office portal.
 *
 * Simple password-based auth with a hardcoded hash.
 */

import bcrypt from 'bcryptjs';
import type { Cookies } from '@sveltejs/kit';

const ADMIN_PASSWORD_HASH = '$2b$12$18pyr7pVV6W1qRLOdS.I5unxwQPG0Yx23.idYUro3w8ccn0PP/kRa';
const ADMIN_COOKIE_NAME = 'vaspeak_admin';
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function verifyAdminPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

export function setAdminCookie(cookies: Cookies): void {
    cookies.set(ADMIN_COOKIE_NAME, 'authenticated', {
        path: '/office',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: ADMIN_COOKIE_MAX_AGE,
    });
}

export function getAdminCookie(cookies: Cookies): string | undefined {
    return cookies.get(ADMIN_COOKIE_NAME);
}

export function clearAdminCookie(cookies: Cookies): void {
    cookies.delete(ADMIN_COOKIE_NAME, { path: '/office' });
}

export function isAdminAuthenticated(cookies: Cookies): boolean {
    return getAdminCookie(cookies) === 'authenticated';
}
