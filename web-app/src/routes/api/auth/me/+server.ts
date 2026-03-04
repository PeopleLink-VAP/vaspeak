/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user info, or 401 if not logged in.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.user) {
        return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    return json({
        success: true,
        user: locals.user,
    });
};
