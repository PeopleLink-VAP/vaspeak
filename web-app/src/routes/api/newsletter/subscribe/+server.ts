/**
 * POST /api/newsletter/subscribe
 *
 * Subscribe an email to the newsletter.
 * Validates email and checks for disposable domains.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateRegistrationEmail } from '$lib/server/validation';
import { spacetimeCallReducer } from '$lib/server/spacetimedb';
import { sendNewsletterWelcomeEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { email } = body;

        const emailResult = validateRegistrationEmail(email?.trim()?.toLowerCase());
        if (!emailResult.valid) {
            return json({ success: false, error: emailResult.error }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        await spacetimeCallReducer('subscribe_newsletter', { email: normalizedEmail });

        // Send welcome email (non-blocking — don't fail subscription if email fails)
        sendNewsletterWelcomeEmail(normalizedEmail).catch(err =>
            console.error('[Newsletter] Welcome email failed:', err)
        );

        return json({ success: true, message: 'Successfully subscribed to the newsletter!' });
    } catch (error) {
        console.error('[Newsletter Subscribe] Error:', error);
        return json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
};
