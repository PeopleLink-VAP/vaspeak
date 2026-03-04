/**
 * POST /api/newsletter/unsubscribe
 *
 * Unsubscribe from the newsletter.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateEmail } from '$lib/server/validation';
import { spacetimeCallReducer } from '$lib/server/spacetimedb';
import { sendUnsubscribeConfirmationEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { email } = body;

        const emailResult = validateEmail(email?.trim()?.toLowerCase());
        if (!emailResult.valid) {
            return json({ success: false, error: emailResult.error }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        await spacetimeCallReducer('unsubscribe_newsletter', { email: normalizedEmail });

        // Send confirmation (non-blocking)
        sendUnsubscribeConfirmationEmail(normalizedEmail).catch(err =>
            console.error('[Newsletter] Unsubscribe confirmation email failed:', err)
        );

        return json({ success: true, message: 'Successfully unsubscribed from the newsletter.' });
    } catch (error) {
        console.error('[Newsletter Unsubscribe] Error:', error);

        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('not found')) {
            return json(
                { success: false, error: 'Email not found in newsletter subscribers' },
                { status: 404 }
            );
        }

        return json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
};
