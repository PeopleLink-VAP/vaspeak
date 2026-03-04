/**
 * Basic Auth protection for /office admin portal.
 *
 * Uses HTTP Basic Auth with credentials:
 * - Username: superadmin
 * - Password: virtualassistantpro.vn
 */

import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const BASIC_AUTH_USER = 'superadmin';
const BASIC_AUTH_PASS = 'virtualassistantpro.vn';

function parseBasicAuth(authHeader: string): { username: string; password: string } | null {
    if (!authHeader.startsWith('Basic ')) return null;
    
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

export const load: LayoutServerLoad = async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    const creds = authHeader ? parseBasicAuth(authHeader) : null;

    if (!creds || creds.username !== BASIC_AUTH_USER || creds.password !== BASIC_AUTH_PASS) {
        throw error(401, {
            message: 'Unauthorized',
            headers: { 'WWW-Authenticate': 'Basic realm="VASpeak Admin Portal"' }
        });
    }

    return { authorized: true };
};
