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

/** Known AI-model assignee names (lowercase, prefix-matched). */
const AGENT_PREFIXES = ['gemini', 'claude', 'gpt', 'o1', 'o3', 'sonnet', 'haiku', 'opus', 'mistral', 'llama', 'deepseek'];

/**
 * Returns true if the assignee name looks like an AI agent.
 * Matches known model names (case-insensitive, prefix-based).
 */
export function isAgent(assignee: string): boolean {
	if (!assignee) return false;
	const lower = assignee.toLowerCase().trim();
	return AGENT_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(prefix + '-') || lower.startsWith(prefix + ' '));
}

/**
 * Formats the elapsed time since an ISO timestamp as a concise human string.
 * e.g. "5s ago", "12m ago", "3h ago", "2d ago"
 * Accepts an optional `now` param (ms since epoch) for testability.
 */
export function formatElapsed(updatedAt: string, now = Date.now()): string {
	const ms = now - new Date(updatedAt).getTime();
	const s = Math.floor(ms / 1000);
	if (s < 0) return 'just now';
	if (s < 60) return `${s}s ago`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	return `${Math.floor(h / 24)}d ago`;
}

/**
 * Safely parses a JSON-stringified array from a DB TEXT column.
 * Returns an empty array on null, undefined, or invalid JSON.
 */
export function parseJsonArray(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try { return JSON.parse(raw); } catch { return []; }
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
