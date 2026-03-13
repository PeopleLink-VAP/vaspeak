/**
 * Simple in-memory rate limiter.
 * Suitable for single-process deployments (PM2 cluster=1).
 * For multi-process, swap the Map for a Redis/Turso-backed store.
 *
 * Usage:
 *   const limiter = new RateLimiter({ windowMs: 60_000, max: 5 });
 *   if (!limiter.allow(ip)) return json({ error: 'Too many requests' }, { status: 429 });
 */

interface RateLimiterOptions {
	windowMs: number;   // time window in milliseconds
	max: number;        // max requests per window
}

interface Bucket {
	count: number;
	resetAt: number;
}

export class RateLimiter {
	private readonly windowMs: number;
	private readonly max: number;
	private readonly map = new Map<string, Bucket>();
	private cleanupTimer: ReturnType<typeof setInterval>;

	constructor(opts: RateLimiterOptions) {
		this.windowMs = opts.windowMs;
		this.max = opts.max;
		// Purge stale entries every 5 minutes to prevent unbounded memory growth
		this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60_000);
	}

	/**
	 * Returns true if the key is within the rate limit, false if exceeded.
	 */
	allow(key: string): boolean {
		const now = Date.now();
		let bucket = this.map.get(key);

		if (!bucket || now > bucket.resetAt) {
			bucket = { count: 1, resetAt: now + this.windowMs };
			this.map.set(key, bucket);
			return true;
		}

		if (bucket.count >= this.max) {
			return false;
		}

		bucket.count++;
		return true;
	}

	/** How many ms until the rate limit window resets for a key. */
	retryAfterMs(key: string): number {
		const bucket = this.map.get(key);
		if (!bucket) return 0;
		return Math.max(0, bucket.resetAt - Date.now());
	}

	private cleanup() {
		const now = Date.now();
		for (const [key, bucket] of this.map) {
			if (now > bucket.resetAt) this.map.delete(key);
		}
	}
}

// ── Shared rate limiter instances ─────────────────────────────────────────────

/** Login / register — 10 attempts per minute per IP */
export const authLimiter = new RateLimiter({ windowMs: 60_000, max: 10 });

/** Magic link request — 5 per 10 minutes per IP */
export const magicLinkLimiter = new RateLimiter({ windowMs: 10 * 60_000, max: 5 });

/** Waitlist signup — 3 per minute per IP */
export const waitlistLimiter = new RateLimiter({ windowMs: 60_000, max: 3 });

/** Roleplay API — 30 per minute per user (on top of credit gating) */
export const roleplayLimiter = new RateLimiter({ windowMs: 60_000, max: 30 });
