/**
 * Telegram-specific helpers: sending messages and vocab challenges via Bot API.
 * Core challenge generation logic lives in $lib/server/vocab.ts (shared with in-app game).
 */
import { env } from '$env/dynamic/private';
import { createVocabChallengeForUser } from '$lib/server/vocab';

// Re-export shared types/functions for backward compat
export { generateVocabChallenge, type VocabChallenge } from '$lib/server/vocab';

const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '';

export async function sendTelegramMessage(chatId: string, text: string, extra?: object) {
    if (!BOT_TOKEN) return;
    const body: Record<string, unknown> = { chat_id: chatId, text, parse_mode: 'HTML', ...extra };
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

/**
 * Generate and send a vocab challenge to a specific user via Telegram.
 * Uses shared createVocabChallengeForUser() then formats for Telegram display.
 */
export async function sendVocabChallenge(userId: string, chatId: string, displayName: string): Promise<boolean> {
    const challenge = await createVocabChallengeForUser(userId);

    // Format and send via Telegram
    const labels = ['A', 'B', 'C', 'D'];
    const optionsText = challenge.options.map((o: string, i: number) => `${labels[i]}. ${o}`).join('\n');

    await sendTelegramMessage(chatId,
        `📚 <b>Từ Vựng Thử Thách</b>\n\n` +
        `Chào ${displayName}! Thử từ mới này nhé:\n\n` +
        `❓ <b>${challenge.question}</b>\n\n` +
        `${optionsText}\n\n` +
        `💡 Trả lời: A, B, C hoặc D\n` +
        `✅ Đúng = <b>+1 credit!</b>`,
        {
            reply_markup: {
                keyboard: [[{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );

    return true;
}
