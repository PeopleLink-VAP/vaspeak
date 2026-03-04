/**
 * SvelteKit server hooks.
 *
 * Runs on every request. Reads the session cookie, verifies the JWT,
 * and populates event.locals.user for downstream route handlers.
 */

import type { Handle } from '@sveltejs/kit';
import { getSessionCookie, verifySessionToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
    const token = getSessionCookie(event.cookies);

    if (token) {
        const payload = verifySessionToken(token);
        if (payload) {
            event.locals.user = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
            };
        }
    }

    return resolve(event);
};
