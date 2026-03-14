/**
 * POST /api/notifications/subscribe — Register a Web Push subscription.
 * Body: { endpoint, keys: { p256dh, auth }, reminderHour?, timezone? }
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
    const userId = locals.user.id;

    const body = await request.json();
    const { endpoint, keys, reminderHour, timezone } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return json({ error: 'Missing subscription data' }, { status: 400 });
    }

    const hour = typeof reminderHour === 'number' ? reminderHour : 8;
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

    await db.execute({
        sql: `INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth, reminder_hour, timezone, active, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
        args: [userId, endpoint, keys.p256dh, keys.auth, hour, tz]
    });

    return json({ ok: true });
};

/**
 * DELETE /api/notifications/subscribe — Remove a push subscription.
 * Body: { endpoint }
 */
export const DELETE: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
    const userId = locals.user.id;

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
        return json({ error: 'Missing endpoint' }, { status: 400 });
    }

    await db.execute({
        sql: 'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
        args: [userId, endpoint]
    });

    return json({ ok: true });
};

/**
 * GET /api/notifications/subscribe — Check if user has active subscriptions.
 */
export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
    const userId = locals.user.id;

    const rows = await db.execute({
        sql: 'SELECT endpoint, reminder_hour, timezone, active FROM push_subscriptions WHERE user_id = ? AND active = 1',
        args: [userId]
    });

    return json({
        subscribed: rows.rows.length > 0,
        subscriptions: rows.rows.map(r => ({
            endpoint: String(r.endpoint),
            reminderHour: Number(r.reminder_hour),
            timezone: String(r.timezone)
        }))
    });
};
