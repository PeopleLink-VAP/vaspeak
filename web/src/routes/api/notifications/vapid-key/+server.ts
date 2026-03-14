/**
 * GET /api/notifications/vapid-key — Returns the VAPID public key for the client
 * to use when creating a push subscription.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
    const key = env.VAPID_PUBLIC_KEY;
    if (!key) {
        return json({ error: 'VAPID not configured' }, { status: 500 });
    }
    return json({ publicKey: key });
};
