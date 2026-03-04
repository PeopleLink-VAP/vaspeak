/**
 * POST /api/auth/register
 *
 * Register a new user with email and password.
 * Validates email format, hashes password, creates user in SpacetimeDB,
 * sends verification email.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hashPassword, generateToken } from '$lib/server/auth';
import { sendVerificationEmail } from '$lib/server/email';
import { validateRegistrationEmail, validatePassword, extractDomain } from '$lib/server/validation';
import { spacetimeCallReducer, findUserByEmail } from '$lib/server/spacetimedb';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate email
        const emailResult = validateRegistrationEmail(email?.trim()?.toLowerCase());
        if (!emailResult.valid) {
            return json({ success: false, error: emailResult.error }, { status: 400 });
        }

        // Validate password
        const passwordResult = validatePassword(password);
        if (!passwordResult.valid) {
            return json({ success: false, error: passwordResult.error }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const domain = extractDomain(normalizedEmail);


        // Check if user already exists
        const existingUser = await findUserByEmail(normalizedEmail);
        if (existingUser) {
            // Don't reveal that the email exists — generic error
            return json(
                { success: false, error: 'Unable to register with this email. Please try another or sign in.' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate verification token (24 hour expiry)
        const verificationToken = generateToken();
        const tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create user + verification token in SpacetimeDB
        await spacetimeCallReducer('register_user', {
            email: normalizedEmail,
            passwordHash,
            verificationToken,
            tokenExpiresAt,
        });

        // Send verification email (don't block registration on email failure)
        try {
            await sendVerificationEmail(normalizedEmail, verificationToken);
        } catch (emailError) {
            console.error('[Register] Failed to send verification email:', emailError);
            // User is created but email failed — they can request a new one later
        }

        return json({ success: true, message: 'Account created. Please check your email to verify.' });
    } catch (error) {
        console.error('[Register] Error:', error);
        return json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
};
