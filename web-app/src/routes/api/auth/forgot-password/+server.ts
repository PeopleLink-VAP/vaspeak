/**
 * POST /api/auth/forgot-password
 *
 * Request a password reset email.
 * Always returns success to prevent email enumeration.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateToken } from '$lib/server/auth';
import { sendPasswordResetEmail } from '$lib/server/email';
import { validateEmail } from '$lib/server/validation';
import { spacetimeCallReducer, findUserByEmail } from '$lib/server/spacetimedb';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email format
        const emailResult = validateEmail(email?.trim()?.toLowerCase());
        if (!emailResult.valid) {
            // Still return success to prevent enumeration
            return json({ success: true, message: 'If this email exists, a reset link has been sent.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Wrap DB calls — endpoint must always return success (anti-enumeration)
        try {
            const user = await findUserByEmail(normalizedEmail);

            if (user) {
                const resetToken = generateToken();
                const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

                await spacetimeCallReducer('request_password_reset', {
                    userId: user.id,
                    token: resetToken,
                    expiresAt,
                });

                try {
                    await sendPasswordResetEmail(normalizedEmail, resetToken);
                } catch (emailError) {
                    console.error('[Forgot Password] Failed to send reset email:', emailError);
                }
            }
        } catch (dbError) {
            // Silently swallow DB errors — never reveal whether user exists
            console.error('[Forgot Password] DB error (swallowed):', dbError);
        }

        // Always return success
        return json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('[Forgot Password] Error:', error);
        return json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
};
