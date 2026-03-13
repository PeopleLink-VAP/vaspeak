import { describe, it, expect } from 'vitest';
import {
	statusLabel,
	isValidStatus,
	getInitials,
	KANBAN_STATUSES
} from '$lib/utils';

describe('statusLabel', () => {
	it('returns correct label for each status', () => {
		expect(statusLabel('backlog')).toBe('Backlog');
		expect(statusLabel('todo')).toBe('To Do');
		expect(statusLabel('in_progress')).toBe('In Progress');
		expect(statusLabel('review_blocked')).toBe('Blocked');
		expect(statusLabel('done')).toBe('Done');
	});

	it('returns raw string for unknown statuses', () => {
		expect(statusLabel('unknown_status')).toBe('unknown_status');
	});
});

describe('isValidStatus', () => {
	it('returns true for all valid statuses', () => {
		for (const s of KANBAN_STATUSES) {
			expect(isValidStatus(s)).toBe(true);
		}
	});

	it('returns false for invalid status strings', () => {
		expect(isValidStatus('')).toBe(false);
		expect(isValidStatus('pending')).toBe(false);
		expect(isValidStatus('IN_PROGRESS')).toBe(false); // case-sensitive
	});
});

describe('getInitials', () => {
	it('returns first 2 uppercase characters', () => {
		expect(getInitials('gemini')).toBe('GE');
		expect(getInitials('claude')).toBe('CL');
	});

	it('returns "?" for empty or blank names', () => {
		expect(getInitials('')).toBe('?');
		expect(getInitials('   ')).toBe('?');
	});

	it('handles single character names', () => {
		expect(getInitials('A')).toBe('A');
	});

	it('trims whitespace before extracting initials', () => {
		expect(getInitials('  admin')).toBe('AD');
	});
});
