/**
 * POST   /api/telegram/link — Generate a unique link token for Telegram connection.
 * GET    /api/telegram/link — Check current Telegram connection status.
 * PATCH  /api/telegram/link — Update reminder settings (hour, timezone).
 * DELETE /api/telegram/link — Unlink Telegram.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import crypto from 'crypto';

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.user) return json({ error: 'Not authenticated' }, { status: 401 });
    
    const row = await db.execute({
        sql: 'SELECT telegram_chat_id, telegram_username, link_token, linked_at, reminder_hour, timezone FROM telegram_links WHERE user_id = ?',
        args: [locals.user.id]
    });
    
    const link = row.rows[0];
    if (!link) {
        return json({ linked: false, token: null });
    }
    
    return json({
        linked: !!link.telegram_chat_id,
        username: link.telegram_username || null,
        linkedAt: link.linked_at || null,
        reminderHour: link.reminder_hour ?? 8,
        timezone: link.timezone || 'Asia/Ho_Chi_Minh',
        token: link.telegram_chat_id ? null : link.link_token
    });
};

export const POST: RequestHandler = async ({ locals }) => {
    if (!locals.user) return json({ error: 'Not authenticated' }, { status: 401 });
    
    const token = crypto.randomBytes(16).toString('hex');
    
    // Upsert: create or update the link token (reset if re-linking)
    await db.execute({
        sql: `INSERT INTO telegram_links (user_id, link_token, telegram_chat_id, telegram_username, linked_at)
              VALUES (?, ?, NULL, NULL, NULL)
              ON CONFLICT(user_id) DO UPDATE SET
                link_token = ?,
                telegram_chat_id = NULL,
                telegram_username = NULL,
                linked_at = NULL`,
        args: [locals.user.id, token, token]
    });
    
    return json({ token });
};

export const DELETE: RequestHandler = async ({ locals }) => {
    if (!locals.user) return json({ error: 'Not authenticated' }, { status: 401 });
    await db.execute({ sql: 'DELETE FROM telegram_links WHERE user_id = ?', args: [locals.user.id] });
    return json({ ok: true });
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
    if (!locals.user) return json({ error: 'Not authenticated' }, { status: 401 });
    const { reminderHour, timezone } = await request.json();
    
    await db.execute({
        sql: 'UPDATE telegram_links SET reminder_hour = ?, timezone = ? WHERE user_id = ?',
        args: [reminderHour ?? 8, timezone || 'Asia/Ho_Chi_Minh', locals.user.id]
    });
    
    return json({ ok: true });
};
