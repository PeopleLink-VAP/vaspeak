/**
 * POST /office/login
 *
 * Admin login endpoint for /office portal.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAdminPassword, setAdminCookie } from '$lib/server/admin-auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password || typeof password !== 'string') {
            return json({ success: false, error: 'Password required' }, { status: 400 });
        }

        const valid = await verifyAdminPassword(password);
        if (!valid) {
            return json({ success: false, error: 'Invalid password' }, { status: 401 });
        }

        setAdminCookie(cookies);
        return json({ success: true });
    } catch (error) {
        console.error('[Admin Login] Error:', error);
        return json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
};
