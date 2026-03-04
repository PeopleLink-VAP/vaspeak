/**
 * GET /api/auth/verify-email?token=...
 *
 * Verify a user's email address using the verification token
 * from the link sent during registration.
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { spacetimeCallReducer } from '$lib/server/spacetimedb';

export const GET: RequestHandler = async ({ url }) => {
    const token = url.searchParams.get('token');

    if (!token) {
        return redirect(303, '/?error=missing_token');
    }

    try {
        await spacetimeCallReducer('verify_email', { token });
        return redirect(303, '/?verified=true');
    } catch (error) {
        console.error('[Verify Email] Error:', error);
        return redirect(303, '/?error=verification_failed');
    }
};
