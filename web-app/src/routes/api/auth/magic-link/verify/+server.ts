/**
 * GET /api/auth/magic-link/verify?token=...
 *
 * Consume a magic link token and create a session.
 * Redirects to the dashboard on success or homepage on failure.
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSessionToken, setSessionCookie } from '$lib/server/auth';
import { spacetimeCallReducer, findUserByEmail, spacetimeQuery } from '$lib/server/spacetimedb';

export const GET: RequestHandler = async ({ url, cookies }) => {
    const token = url.searchParams.get('token');

    if (!token) {
        return redirect(303, '/?error=missing_token');
    }

    try {
        // Consume the magic link
        await spacetimeCallReducer('consume_magic_link', { token });

        // Look up the magic link to get the email
        // After consuming, the link is marked as used but still exists
        const links = await spacetimeQuery<{ email: string }>(
            `SELECT email FROM magic_links WHERE token = '${token.replace(/'/g, "''")}'`
        );

        if (links.length === 0) {
            return redirect(303, '/?error=invalid_link');
        }

        const email = links[0].email;
        const user = await findUserByEmail(email);

        if (!user) {
            return redirect(303, '/?error=user_not_found');
        }

        // Create session
        const sessionToken = createSessionToken(user.id, user.email, user.role);
        setSessionCookie(cookies, sessionToken);

        return redirect(303, '/');
    } catch (error) {
        console.error('[Magic Link Verify] Error:', error);
        return redirect(303, '/?error=magic_link_failed');
    }
};
