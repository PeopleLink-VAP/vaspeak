/**
 * POST /api/auth/login
 *
 * Login with email and password.
 * Verifies credentials, checks email verification status,
 * creates JWT session token, sets httpOnly cookie.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPassword, createSessionToken, setSessionCookie } from '$lib/server/auth';
import { validateEmail } from '$lib/server/validation';
import { findUserByEmail } from '$lib/server/spacetimedb';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate email format
        const emailResult = validateEmail(email?.trim()?.toLowerCase());
        if (!emailResult.valid) {
            return json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        if (!password || typeof password !== 'string') {
            return json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Look up user
        const user = await findUserByEmail(normalizedEmail);
        if (!user) {
            return json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        // Verify password
        const passwordValid = await verifyPassword(password, user.password_hash);
        if (!passwordValid) {
            return json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        // Check email verification
        if (!user.email_verified) {
            return json(
                { success: false, error: 'Please verify your email before signing in. Check your inbox.' },
                { status: 403 }
            );
        }

        // Create session
        const sessionToken = createSessionToken(user.id, user.email, user.role);
        setSessionCookie(cookies, sessionToken);

        return json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('[Login] Error:', error);
        return json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
};
