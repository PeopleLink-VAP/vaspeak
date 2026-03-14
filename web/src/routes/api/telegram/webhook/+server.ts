/**
 * POST /api/telegram/webhook — Telegram Bot webhook handler.
 * 
 * Commands: /start, /word, /status, /time, /stop, A/B/C/D answers
 * All messages logged to telegram_messages.
 * Uses shared helpers from $lib/server/telegram.ts for testability.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { earnCredits } from '$lib/server/credits';
import { sendTelegramMessage, sendVocabChallenge } from '$lib/server/telegram';

async function getUserIdByChatId(chatId: string): Promise<string | null> {
    const row = await db.execute({
        sql: 'SELECT user_id FROM telegram_links WHERE telegram_chat_id = ?',
        args: [chatId]
    });
    return row.rows[0]?.user_id ? String(row.rows[0].user_id) : null;
}

async function logMessage(
    userId: string | null, chatId: string,
    direction: 'in' | 'out', text: string,
    type: string, metadata?: object
) {
    await db.execute({
        sql: `INSERT INTO telegram_messages (user_id, telegram_chat_id, direction, message_text, message_type, metadata)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [userId, chatId, direction, text, type, metadata ? JSON.stringify(metadata) : null]
    });
}

async function reply(chatId: string, userId: string | null, text: string, extra?: object) {
    await sendTelegramMessage(chatId, text, extra);
    await logMessage(userId, chatId, 'out', text, 'bot_reply');
}

export const POST: RequestHandler = async ({ request }) => {
    const update = await request.json();
    const message = update.message;
    if (!message?.text) return json({ ok: true });

    const chatId = String(message.chat.id);
    const text = message.text.trim();
    const username = message.from?.username || null;
    const userId = await getUserIdByChatId(chatId);

    // Log incoming
    await logMessage(userId, chatId, 'in', text, 'user_message', { from: message.from, date: message.date });

    // ===== /start {token} — Account Linking =====
    if (text.startsWith('/start ') && text.length > 7) {
        const token = text.replace('/start ', '').trim();
        const row = await db.execute({
            sql: 'SELECT user_id FROM telegram_links WHERE link_token = ? AND telegram_chat_id IS NULL',
            args: [token]
        });
        if (row.rows.length === 0) {
            await reply(chatId, userId, '❌ Token không tìm thấy hoặc đã được sử dụng.\n\nVui lòng tạo link mới từ trang profile VASpeak.');
            return json({ ok: true });
        }
        await db.execute({
            sql: `UPDATE telegram_links SET telegram_chat_id = ?, telegram_username = ?, linked_at = datetime('now'), link_token = NULL WHERE link_token = ?`,
            args: [chatId, username, token]
        });
        const userRow = await db.execute({ sql: 'SELECT display_name FROM profiles WHERE id = ?', args: [row.rows[0].user_id] });
        const name = userRow.rows[0]?.display_name || 'bạn';

        await reply(chatId, String(row.rows[0].user_id),
            `✅ <b>Liên kết thành công!</b>\n\n` +
            `Xin chào ${name}! Tài khoản VASpeak đã được kết nối.\n\n` +
            `🎯 Gõ /word để nhận thử thách từ vựng đầu tiên (+1 credit nếu đúng!)\n` +
            `⏰ Gõ <code>/time 8</code> để đặt giờ nhắc nhở hàng ngày\n` +
            `📊 /status — Xem tiến độ\n` +
            `🔕 /stop — Tắt nhắc nhở`
        );
        return json({ ok: true });
    }

    // ===== /start =====
    if (text === '/start') {
        await reply(chatId, userId,
            `👋 <b>Chào mừng đến với VASpeak Bot!</b>\n\nĐể liên kết tài khoản, vào Profile trên VASpeak và nhấn "Kết nối Telegram".\n\n🔗 https://vaspeak.alphabits.team/profile`
        );
        return json({ ok: true });
    }

    // ===== /word — On-demand vocab challenge =====
    if (text === '/word') {
        if (!userId) {
            await reply(chatId, null, '❌ Tài khoản chưa được liên kết. Vui lòng kết nối từ trang profile.');
            return json({ ok: true });
        }
        // Check for unanswered challenge
        const pending = await db.execute({
            sql: 'SELECT word FROM telegram_challenges WHERE user_id = ? AND answered = 0 ORDER BY created_at DESC LIMIT 1',
            args: [userId]
        });
        if (pending.rows.length > 0) {
            await reply(chatId, userId, `⚠️ Bạn còn thử thách chưa trả lời! Hãy chọn A, B, C hoặc D trước nhé.`);
            return json({ ok: true });
        }
        try {
            const profileRow = await db.execute({ sql: 'SELECT display_name FROM profiles WHERE id = ?', args: [userId] });
            const name = String(profileRow.rows[0]?.display_name || 'bạn');
            await sendVocabChallenge(userId, chatId, name);
            await logMessage(userId, chatId, 'out', '[vocab_challenge_sent]', 'challenge');
        } catch (err) {
            console.error('[telegram /word]', err);
            await reply(chatId, userId, '❌ Có lỗi khi tạo thử thách. Vui lòng thử lại sau.');
        }
        return json({ ok: true });
    }

    // ===== /status =====
    if (text === '/status') {
        if (!userId) { await reply(chatId, null, '❌ Tài khoản chưa được liên kết.'); return json({ ok: true }); }
        const [profileRow, challengeRow] = await Promise.all([
            db.execute({ sql: 'SELECT display_name, streak_count FROM profiles WHERE id = ?', args: [userId] }),
            db.execute({ sql: 'SELECT COUNT(*) as total, SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as wins FROM telegram_challenges WHERE user_id = ?', args: [userId] })
        ]);
        const p = profileRow.rows[0]; const ch = challengeRow.rows[0];
        await reply(chatId, userId,
            `📊 <b>Tiến độ của ${p?.display_name || 'bạn'}</b>\n\n🔥 Streak: ${p?.streak_count || 0} ngày\n📚 Từ vựng: ${ch?.total || 0} từ (${ch?.wins || 0} đúng)\n\n💪 Gõ /word để thử thách thêm!`
        );
        return json({ ok: true });
    }

    // ===== /stop =====
    if (text === '/stop') {
        if (userId) await db.execute({ sql: 'UPDATE telegram_links SET reminder_hour = -1 WHERE user_id = ?', args: [userId] });
        await reply(chatId, userId, `🔕 Đã tắt nhắc nhở.\nGõ <code>/time 8</code> để bật lại.`);
        return json({ ok: true });
    }

    // ===== /time HH =====
    if (text.startsWith('/time')) {
        const hour = parseInt(text.replace('/time', '').trim(), 10);
        if (isNaN(hour) || hour < 0 || hour > 23) {
            await reply(chatId, userId, '⚠️ Nhập giờ từ 0-23.\nVí dụ: <code>/time 8</code> = 8h sáng');
            return json({ ok: true });
        }
        if (userId) await db.execute({ sql: 'UPDATE telegram_links SET reminder_hour = ? WHERE user_id = ?', args: [hour, userId] });
        const label = hour < 12 ? `${hour || 12}:00 sáng` : `${hour === 12 ? 12 : hour - 12}:00 chiều`;
        await reply(chatId, userId, `⏰ Nhắc nhở lúc <b>${label}</b> mỗi ngày.`);
        return json({ ok: true });
    }

    // ===== A/B/C/D — Challenge answer =====
    const upper = text.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(upper) && userId) {
        const answerIdx = 'ABCD'.indexOf(upper);
        const ch = await db.execute({
            sql: 'SELECT word, correct_index, options FROM telegram_challenges WHERE user_id = ? AND answered = 0 ORDER BY created_at DESC LIMIT 1',
            args: [userId]
        });
        if (ch.rows.length === 0) {
            await reply(chatId, userId, '🤔 Không có thử thách đang chờ. Gõ /word để nhận từ mới!');
            return json({ ok: true });
        }
        const { word, correct_index, options: optStr } = ch.rows[0];
        const correctIdx = Number(correct_index);
        const options = JSON.parse(String(optStr));
        const isCorrect = answerIdx === correctIdx;

        await db.execute({
            sql: `UPDATE telegram_challenges SET answered = 1, user_answer = ?, answered_at = datetime('now'), correct = ?, credits_earned = ? WHERE user_id = ? AND word = ?`,
            args: [upper, isCorrect ? 1 : 0, isCorrect ? 1 : 0, userId, word]
        });

        // Send reply FIRST — credit bookkeeping is secondary and must not block the response
        if (isCorrect) {
            await reply(chatId, userId,
                `🎉 <b>Chính xác!</b> ${upper}. ${options[correctIdx]}\n\n📝 "<b>${word}</b>" → đã thuộc ✅\n⚡ <b>+1 credit!</b>\n\nGõ /word để thử từ tiếp theo!`,
                { reply_markup: { remove_keyboard: true } }
            );
            // Credit bookkeeping — wrapped to never crash the handler
            try {
                await earnCredits(userId, 1, 'daily_vocab_challenge');
                await db.execute({ sql: 'UPDATE vocabulary_bank SET mastered = 1 WHERE user_id = ? AND word = ?', args: [userId, word] });
            } catch (creditErr) {
                console.error('[telegram answer] credit update failed (non-fatal):', creditErr);
            }
        } else {
            await reply(chatId, userId,
                `❌ Sai rồi! Đáp án: <b>${'ABCD'[correctIdx]}. ${options[correctIdx]}</b>\n\n📝 "<b>${word}</b>" → ôn tập 📖\n\n💪 Gõ /word để thử từ khác!`,
                { reply_markup: { remove_keyboard: true } }
            );
        }
        return json({ ok: true });
    }

    // ===== Default =====
    await reply(chatId, userId,
        `🤖 <b>VASpeak Bot</b>\n\n📌 Lệnh:\n/word — Nhận thử thách từ vựng\n/status — Xem tiến độ\n/time 8 — Đặt giờ nhắc nhở\n/stop — Tắt nhắc nhở\n\n💡 Trả lời A, B, C, D khi có thử thách.`
    );
    return json({ ok: true });
};
