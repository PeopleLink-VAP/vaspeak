/**
 * GET /office/logout
 *
 * Clear admin cookie and redirect to login.
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearAdminCookie } from '$lib/server/admin-auth';

export const GET: RequestHandler = async ({ cookies }) => {
    clearAdminCookie(cookies);
    throw redirect(303, '/office/login');
};
