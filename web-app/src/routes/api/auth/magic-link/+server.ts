/**
 * POST /api/auth/magic-link
 *
 * Request a magic link for passwordless login.
 * Creates a magic link token and sends it via email.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateToken } from '$lib/server/auth';
import { sendMagicLinkEmail } from '$lib/server/email';
import { validateEmail } from '$lib/server/validation';
import { spacetimeCallReducer, findUserByEmail } from '$lib/server/spacetimedb';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { email } = body;

        const emailResult = validateEmail(email?.trim()?.toLowerCase());
        if (!emailResult.valid) {
            // Still return success to prevent email enumeration
            return json({ success: true, message: 'If this email exists, a magic link has been sent.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Wrap DB calls — endpoint must always return success (anti-enumeration)
        try {
            const user = await findUserByEmail(normalizedEmail);

            if (user) {
                const magicToken = generateToken();
                const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

                await spacetimeCallReducer('create_magic_link', {
                    email: normalizedEmail,
                    token: magicToken,
                    expiresAt,
                });

                try {
                    await sendMagicLinkEmail(normalizedEmail, magicToken);
                } catch (emailError) {
                    console.error('[Magic Link] Failed to send email:', emailError);
                }
            }
        } catch (dbError) {
            // Silently swallow DB errors — never reveal whether user exists
            console.error('[Magic Link] DB error (swallowed):', dbError);
        }

        return json({ success: true, message: 'If this email exists, a magic link has been sent.' });
    } catch (error) {
        console.error('[Magic Link] Error:', error);
        return json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
};
