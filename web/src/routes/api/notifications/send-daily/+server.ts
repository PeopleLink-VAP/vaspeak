/**
 * POST /api/notifications/send-daily — Cron-triggered daily push notifications.
 * 
 * Sends Web Push notifications to all subscribed users whose reminder_hour matches
 * the current hour in their timezone. Deep-links to /games/word-of-the-day.
 * 
 * Auth: Bearer CRON_SECRET header (same as Telegram daily challenge).
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import webpush from 'web-push';

export const POST: RequestHandler = async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    const cronSecret = env.CRON_SECRET || 'vaspeak-cron-trigger';
    if (authHeader !== `Bearer ${cronSecret}`) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Configure VAPID
    const vapidPublic = env.VAPID_PUBLIC_KEY;
    const vapidPrivate = env.VAPID_PRIVATE_KEY;
    const vapidEmail = env.VAPID_EMAIL || 'admin@alphabits.team';

    if (!vapidPublic || !vapidPrivate) {
        return json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublic, vapidPrivate);

    const nowUtc = new Date();
    const utcHour = nowUtc.getUTCHours();

    // Get all active push subscriptions
    const subs = await db.execute(`
        SELECT ps.user_id, ps.endpoint, ps.p256dh, ps.auth, ps.reminder_hour, ps.timezone, p.display_name
        FROM push_subscriptions ps
        JOIN profiles p ON p.id = ps.user_id
        WHERE ps.active = 1 AND ps.reminder_hour >= 0
    `);

    let sent = 0, skipped = 0, errors = 0, cleaned = 0;

    for (const row of subs.rows) {
        try {
            const tz = String(row.timezone || 'Asia/Ho_Chi_Minh');
            const reminderHour = Number(row.reminder_hour ?? 8);

            // Calculate what hour it is in the user's timezone
            const userNow = new Date(nowUtc.toLocaleString('en-US', { timeZone: tz }));
            const userHour = userNow.getHours();

            // Only send if current hour matches their reminder hour
            if (userHour !== reminderHour) { skipped++; continue; }

            const name = String(row.display_name || 'bạn');
            const payload = JSON.stringify({
                title: `📚 Từ vựng hôm nay!`,
                body: `Chào ${name}! Mở VASpeak để kiếm +1 credit với từ mới.`,
                url: '/games/word-of-the-day'
            });

            const subscription = {
                endpoint: String(row.endpoint),
                keys: {
                    p256dh: String(row.p256dh),
                    auth: String(row.auth)
                }
            };

            await webpush.sendNotification(subscription, payload);
            sent++;
        } catch (err: unknown) {
            const statusCode = (err as { statusCode?: number })?.statusCode;
            // 404 or 410 means the subscription is expired/invalid — clean it up
            if (statusCode === 404 || statusCode === 410) {
                await db.execute({
                    sql: 'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
                    args: [row.user_id, row.endpoint]
                });
                cleaned++;
            } else {
                console.error(`[push-daily] Error for ${row.user_id}:`, err);
                errors++;
            }
        }
    }

    return json({ sent, skipped, errors, cleaned, total: subs.rows.length });
};
