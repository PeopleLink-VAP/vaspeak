/**
 * POST /api/auth/reset-password
 *
 * Reset password using a valid reset token.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hashPassword } from '$lib/server/auth';
import { validatePassword } from '$lib/server/validation';
import { spacetimeCallReducer } from '$lib/server/spacetimedb';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { token, password } = body;

        if (!token || typeof token !== 'string') {
            return json({ success: false, error: 'Reset token is required' }, { status: 400 });
        }

        // Validate new password
        const passwordResult = validatePassword(password);
        if (!passwordResult.valid) {
            return json({ success: false, error: passwordResult.error }, { status: 400 });
        }

        // Hash the new password
        const newPasswordHash = await hashPassword(password);

        // Call SpacetimeDB reducer to reset password
        await spacetimeCallReducer('reset_password', {
            token,
            newPasswordHash,
        });

        return json({ success: true, message: 'Password has been reset. You can now sign in.' });
    } catch (error) {
        console.error('[Reset Password] Error:', error);

        // Check for common reducer errors
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('Invalid') || errorMessage.includes('expired') || errorMessage.includes('used')) {
            return json(
                { success: false, error: 'This reset link is invalid or has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        return json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
};
