/**
 * Layout data for /office admin portal.
 *
 * Basic Auth is handled in hooks.server.ts.
 * This just returns authorized status for the layout.
 */

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
    return { authorized: true };
};
