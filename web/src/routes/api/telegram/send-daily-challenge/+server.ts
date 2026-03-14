/**
 * POST /api/telegram/send-daily-challenge — Cron-triggered daily vocab challenges.
 * Sends to all linked users whose reminder_hour matches current hour in their timezone.
 * Auth: Bearer CRON_SECRET header.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import { sendVocabChallenge } from '$lib/server/telegram';

export const POST: RequestHandler = async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    const cronSecret = env.CRON_SECRET || 'vaspeak-cron-trigger';
    if (authHeader !== `Bearer ${cronSecret}`) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current UTC hour
    const nowUtc = new Date();
    const utcHour = nowUtc.getUTCHours();

    // Get all linked users with reminders enabled (reminder_hour >= 0)
    const links = await db.execute(`
        SELECT tl.user_id, tl.telegram_chat_id, tl.reminder_hour, tl.timezone, p.display_name
        FROM telegram_links tl
        JOIN profiles p ON p.id = tl.user_id
        WHERE tl.telegram_chat_id IS NOT NULL AND tl.reminder_hour >= 0
    `);

    let sent = 0, skipped = 0, errors = 0;

    for (const row of links.rows) {
        try {
            const tz = String(row.timezone || 'Asia/Ho_Chi_Minh');
            const reminderHour = Number(row.reminder_hour ?? 8);

            // Calculate what hour it is in the user's timezone
            const userNow = new Date(nowUtc.toLocaleString('en-US', { timeZone: tz }));
            const userHour = userNow.getHours();

            // Only send if current hour matches their reminder hour
            if (userHour !== reminderHour) { skipped++; continue; }

            const userId = String(row.user_id);
            const chatId = String(row.telegram_chat_id);
            const name = String(row.display_name || 'bạn');

            await sendVocabChallenge(userId, chatId, name);
            sent++;
        } catch (err) {
            console.error(`[daily-challenge] Error for ${row.user_id}:`, err);
            errors++;
        }
    }

    return json({ sent, skipped, errors, total: links.rows.length });
};
