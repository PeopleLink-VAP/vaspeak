/**
 * Barrel exports for $lib — import commonly used utilities from a single location.
 *
 * Usage:
 *   import { formatElapsed, slugify, creditsRemaining } from '$lib';
 */

// Utility helpers (pure functions — safe to import in both server and client)
export {
	// Credit system
	creditsRemaining,
	hasEnoughCredits,
	creditStatusLabel,
	MONTHLY_CREDIT_ALLOWANCE,

	// Kanban utilities
	statusLabel,
	isValidStatus,
	KANBAN_STATUSES,
	type KanbanStatus,

	// User utilities
	getInitials,
	isAgent,

	// Date / time
	formatElapsed,
	hoursSince,
	formatUptime,

	// String utilities
	truncate,
	slugify,
	parseJsonArray
} from './utils';
