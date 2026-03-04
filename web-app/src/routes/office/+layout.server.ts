/**
 * Layout data for /office admin portal.
 *
 * Checks for admin authentication cookie.
 */

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isAdminAuthenticated } from '$lib/server/admin-auth';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
    const authenticated = isAdminAuthenticated(cookies);

    if (!authenticated && url.pathname !== '/office/login') {
        return redirect(303, '/office/login');
    }

    return { authenticated };
};
