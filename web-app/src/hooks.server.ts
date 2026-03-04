/**
 * SvelteKit server hooks.
 *
 * Runs on every request. Reads the session cookie, verifies the JWT,
 * and populates event.locals.user for downstream route handlers.
 */

import type { Handle, HandleServerError } from '@sveltejs/kit';
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

    const response = await resolve(event);

    if (
        event.url.pathname.startsWith('/office') &&
        response.status === 401
    ) {
        response.headers.set('WWW-Authenticate', 'Basic realm="VASpeak Admin Portal"');
    }

    return response;
};

export const handleError: HandleServerError = ({ status }) => {
    if (status === 401) {
        return { message: 'Unauthorized' };
    }
    return { message: 'Internal Server Error' };
};
