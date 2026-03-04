/**
 * SvelteKit server hooks.
 *
 * Runs on every request. Reads the session cookie, verifies the JWT,
 * and populates event.locals.user for downstream route handlers.
 * Also handles Basic Auth for /office admin portal.
 */

import type { Handle, HandleServerError, RequestEvent } from '@sveltejs/kit';
import { getSessionCookie, verifySessionToken } from '$lib/server/auth';

const BASIC_AUTH_USER = 'superadmin';
const BASIC_AUTH_PASS = 'virtualassistantpro.vn';

function parseBasicAuth(authHeader: string | null): { username: string; password: string } | null {
    if (!authHeader || !authHeader.startsWith('Basic ')) return null;
    
    const encoded = authHeader.slice(6);
    let decoded: string;
    try {
        decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    } catch {
        return null;
    }

    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) return null;

    return {
        username: decoded.slice(0, colonIndex),
        password: decoded.slice(colonIndex + 1)
    };
}

function checkBasicAuth(event: RequestEvent): boolean {
    const creds = parseBasicAuth(event.request.headers.get('authorization'));
    return creds !== null && creds.username === BASIC_AUTH_USER && creds.password === BASIC_AUTH_PASS;
}

export const handle: Handle = async ({ event, resolve }) => {
    if (event.url.pathname.startsWith('/office')) {
        if (!checkBasicAuth(event)) {
            return new Response('Unauthorized', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="VASpeak Admin Portal"'
                }
            });
        }
    }

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

export const handleError: HandleServerError = ({ status }) => {
    if (status === 401) {
        return { message: 'Unauthorized' };
    }
    return { message: 'Internal Server Error' };
};
