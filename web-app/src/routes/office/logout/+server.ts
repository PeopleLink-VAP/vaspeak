/**
 * POST /office/logout
 *
 * Clear admin cookie and redirect to login.
 * Uses POST to prevent CSRF via prefetch/img-tag tricks.
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearAdminCookie } from '$lib/server/admin-auth';

export const POST: RequestHandler = async ({ cookies }) => {
    clearAdminCookie(cookies);
    return redirect(303, '/office/login');
};
