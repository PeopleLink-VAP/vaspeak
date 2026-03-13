import { db } from '$lib/server/db';
import { randomBytes } from 'crypto';

export const MONTHLY_ALLOWANCE = 100;
export const ROLEPLAY_CREDIT_COST = 3; // per turn

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Returns remaining credits for a user.
 * Returns the full allowance if no credits record exists yet (new user).
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
 * Returns the full credits row for display purposes (used, allowance, resetDate).
 */
export async function getCreditsRow(userId: string): Promise<{ used: number; allowance: number; resetDate: string }> {
    try {
        const rows = await db.execute({
            sql: 'SELECT credits_used, monthly_allowance, reset_date FROM user_credits WHERE user_id = ?',
            args: [userId]
        });
        if (rows.rows.length > 0) {
            return {
                used:       Number(rows.rows[0].credits_used ?? 0),
                allowance:  Number(rows.rows[0].monthly_allowance ?? MONTHLY_ALLOWANCE),
                resetDate:  String(rows.rows[0].reset_date ?? '')
            };
        }
    } catch (err) {
        console.error('[credits] getCreditsRow error:', err);
    }
    return { used: 0, allowance: MONTHLY_ALLOWANCE, resetDate: '' };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Deducts credits atomically with a single conditional UPDATE.
 * Throws if the user doesn't have enough credits.
 * Also resets credits if the reset_date has passed (monthly renewal).
 */
export async function spendCredits(userId: string, cost: number, reason = 'roleplay'): Promise<void> {
    // Auto-reset monthly allowance if reset_date has passed
    await db.execute({
        sql: `UPDATE user_credits
              SET credits_used = 0, reset_date = date('now', 'start of month', '+1 month')
              WHERE user_id = ? AND reset_date IS NOT NULL AND reset_date <= date('now')`,
        args: [userId]
    });

    // Atomic conditional deduction — no separate read needed, avoids TOCTOU race.
    const result = await db.execute({
        sql: `UPDATE user_credits
              SET credits_used = credits_used + ?
              WHERE user_id = ? AND (monthly_allowance - credits_used) >= ?
              RETURNING credits_used, monthly_allowance`,
        args: [cost, userId, cost]
    });

    if (result.rows.length === 0) {
        // Row didn't update — either no row exists or insufficient balance
        const remaining = await getCreditsRemaining(userId);
        throw new Error(`Insufficient credits: ${remaining} remaining, ${cost} required`);
    }

    // Append to audit log
    const eventId = randomBytes(8).toString('hex');
    await db.execute({
        sql: `INSERT INTO credit_events (id, user_id, delta, reason) VALUES (?, ?, ?, ?)`,
        args: [eventId, userId, -cost, reason]
    }).catch(err => console.error('[credits] Failed to log credit_event:', err));
}

/**
 * Add credits to a user (bonus, refund, top-up, etc.)
 * Writes to the audit log.
 */
export async function earnCredits(userId: string, amount: number, reason: string): Promise<void> {
    await db.execute({
        sql: `UPDATE user_credits SET credits_used = MAX(0, credits_used - ?) WHERE user_id = ?`,
        args: [amount, userId]
    });

    const eventId = randomBytes(8).toString('hex');
    await db.execute({
        sql: `INSERT INTO credit_events (id, user_id, delta, reason) VALUES (?, ?, ?, ?)`,
        args: [eventId, userId, amount, reason]
    }).catch(err => console.error('[credits] Failed to log credit_event:', err));
}

/**
 * Read the credit event ledger for a user (most recent first).
 */
export async function getCreditLedger(
    userId: string,
    limit = 30
): Promise<Array<{ id: string; delta: number; reason: string; createdAt: string }>> {
    try {
        const rows = await db.execute({
            sql: `SELECT id, delta, reason, created_at FROM credit_events
                  WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
            args: [userId, limit]
        });
        return rows.rows.map(r => ({
            id:        String(r.id),
            delta:     Number(r.delta),
            reason:    String(r.reason),
            createdAt: String(r.created_at)
        }));
    } catch (err) {
        console.error('[credits] getCreditLedger error:', err);
        return [];
    }
}
