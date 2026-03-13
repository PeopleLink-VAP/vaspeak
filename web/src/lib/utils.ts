/**
 * VASpeak utility functions — pure, testable, no side effects.
 * These helpers are used across server routes and Svelte components.
 */

// ---------------------------------------------------------------------------
// Credit system
// ---------------------------------------------------------------------------

export const MONTHLY_CREDIT_ALLOWANCE = 100;

/**
 * Returns the number of credits remaining for a user.
 */
export function creditsRemaining(used: number, allowance = MONTHLY_CREDIT_ALLOWANCE): number {
	return Math.max(0, allowance - used);
}

/**
 * Returns true if the user has enough credits for an action.
 */
export function hasEnoughCredits(used: number, cost: number, allowance = MONTHLY_CREDIT_ALLOWANCE): boolean {
	return creditsRemaining(used, allowance) >= cost;
}

/**
 * Returns a label for the credit status.
 */
export function creditStatusLabel(used: number, allowance = MONTHLY_CREDIT_ALLOWANCE): string {
	const remaining = creditsRemaining(used, allowance);
	const pct = (remaining / allowance) * 100;
	if (pct > 50) return 'healthy';
	if (pct > 20) return 'low';
	return 'critical';
}

// ---------------------------------------------------------------------------
// Kanban / Task utilities
// ---------------------------------------------------------------------------

export const KANBAN_STATUSES = ['backlog', 'todo', 'in_progress', 'review_blocked', 'done'] as const;
export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

const STATUS_LABELS: Record<KanbanStatus, string> = {
	backlog: 'Backlog',
	todo: 'To Do',
	in_progress: 'In Progress',
	review_blocked: 'Blocked',
	done: 'Done'
};

/**
 * Returns the human-readable label for a kanban status.
 */
export function statusLabel(status: string): string {
	return STATUS_LABELS[status as KanbanStatus] ?? status;
}

/**
 * Returns true if the given string is a valid kanban status.
 */
export function isValidStatus(status: string): status is KanbanStatus {
	return KANBAN_STATUSES.includes(status as KanbanStatus);
}

/**
 * Returns up to 2 uppercase initials from a name string.
 */
export function getInitials(name: string): string {
	if (!name?.trim()) return '?';
	return name.trim().slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Date / time
// ---------------------------------------------------------------------------

/**
 * Returns the number of whole hours since the given ISO timestamp.
 */
export function hoursSince(isoDate: string): number {
	const diff = Date.now() - new Date(isoDate).getTime();
	return Math.floor(diff / (1000 * 60 * 60));
}

/**
 * Formats server uptime (seconds) as a human-readable string.
 * e.g. 90061 → "1d 1h 1m"
 */
export function formatUptime(seconds: number): string {
	const d = Math.floor(seconds / 86400);
	const h = Math.floor((seconds % 86400) / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const parts: string[] = [];
	if (d > 0) parts.push(`${d}d`);
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);
	return parts.length > 0 ? parts.join(' ') : '< 1m';
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

/**
 * Truncates a string to maxLength and appends "…" if truncated.
 */
export function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return str.slice(0, maxLength) + '…';
}

/**
 * Slugifies a string for use in URLs.
 */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
