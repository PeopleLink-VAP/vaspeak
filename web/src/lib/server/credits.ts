import { db } from '$lib/server/db';

export const MONTHLY_ALLOWANCE = 100;
export const ROLEPLAY_CREDIT_COST = 3; // per turn

/**
 * Returns remaining credits for a user. Returns allowance if no record exists yet.
 */
export async function getCreditsRemaining(userId: string): Promise<number> {
    const rows = await db.execute({
        sql: 'SELECT monthly_allowance, credits_used FROM user_credits WHERE user_id = ? LIMIT 1',
        args: [userId]
    });
    if (rows.rows.length === 0) return MONTHLY_ALLOWANCE;
    const allowance = Number(rows.rows[0].monthly_allowance ?? MONTHLY_ALLOWANCE);
    const used      = Number(rows.rows[0].credits_used ?? 0);
    return Math.max(0, allowance - used);
}

/**
 * Decrements a user's credit balance by `cost`.
 * Upserts a credits row if one doesn't exist yet.
 * Throws if they don't have enough credits.
 */
export async function spendCredits(userId: string, cost: number): Promise<void> {
    const remaining = await getCreditsRemaining(userId);
    if (remaining < cost) {
        throw new Error(`Insufficient credits: ${remaining} remaining, ${cost} required`);
    }

    await db.execute({
        sql: `INSERT INTO user_credits (id, user_id, monthly_allowance, credits_used, subscription_status, reset_date)
              VALUES (lower(hex(randomblob(8))), ?, ?, ?, 'free', date('now', 'start of month', '+1 month'))
              ON CONFLICT(user_id) DO UPDATE SET
                  credits_used = credits_used + ?,
                  updated_at   = CURRENT_TIMESTAMP`,
        args: [userId, MONTHLY_ALLOWANCE, cost, cost]
    });
}
