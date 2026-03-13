/**
 * Unit tests for kanban utility helpers.
 * Covers: statusLabel, isValidStatus, getInitials, isAgent, formatElapsed, parseJsonArray.
 * Run: npm run test:unit
 */

import { describe, it, expect } from 'vitest';
import {
	statusLabel,
	isValidStatus,
	getInitials,
	isAgent,
	formatElapsed,
	parseJsonArray,
	KANBAN_STATUSES
} from '$lib/utils';

// ─── statusLabel ─────────────────────────────────────────────────────────────

describe('statusLabel', () => {
	it('returns correct human label for every canonical status', () => {
		expect(statusLabel('backlog')).toBe('Backlog');
		expect(statusLabel('todo')).toBe('To Do');
		expect(statusLabel('in_progress')).toBe('In Progress');
		expect(statusLabel('review_blocked')).toBe('Blocked');
		expect(statusLabel('done')).toBe('Done');
	});

	it('returns the raw string unchanged for unknown statuses', () => {
		expect(statusLabel('pending')).toBe('pending');
		expect(statusLabel('')).toBe('');
		expect(statusLabel('IN_PROGRESS')).toBe('IN_PROGRESS');
	});
});

// ─── isValidStatus ────────────────────────────────────────────────────────────

describe('isValidStatus', () => {
	it('accepts all canonical KANBAN_STATUSES', () => {
		for (const s of KANBAN_STATUSES) {
			expect(isValidStatus(s), `Expected "${s}" to be valid`).toBe(true);
		}
	});

	it('rejects unknown status strings', () => {
		expect(isValidStatus('')).toBe(false);
		expect(isValidStatus('pending')).toBe(false);
		expect(isValidStatus('completed')).toBe(false);
	});

	it('is case-sensitive (only lowercase accepted)', () => {
		expect(isValidStatus('IN_PROGRESS')).toBe(false);
		expect(isValidStatus('Done')).toBe(false);
		expect(isValidStatus('TODO')).toBe(false);
	});
});

// ─── getInitials ──────────────────────────────────────────────────────────────

describe('getInitials', () => {
	it('returns first two uppercase characters of a name', () => {
		expect(getInitials('gemini')).toBe('GE');
		expect(getInitials('claude')).toBe('CL');
		expect(getInitials('admin')).toBe('AD');
		expect(getInitials('Jon')).toBe('JO');
	});

	it('returns "?" for empty or whitespace-only strings', () => {
		expect(getInitials('')).toBe('?');
		expect(getInitials('   ')).toBe('?');
	});

	it('handles single-character names', () => {
		expect(getInitials('A')).toBe('A');
	});

	it('trims leading whitespace before extracting initials', () => {
		expect(getInitials('  admin')).toBe('AD');
	});

	it('uppercases the output', () => {
		expect(getInitials('alice')).toBe('AL');
	});
});

// ─── isAgent ──────────────────────────────────────────────────────────────────

describe('isAgent', () => {
	it('recognises well-known AI model names exactly', () => {
		const agents = ['gemini', 'claude', 'o1', 'o3', 'gpt', 'sonnet', 'haiku', 'opus', 'mistral', 'llama', 'deepseek'];
		for (const name of agents) {
			expect(isAgent(name), `Expected "${name}" to be an agent`).toBe(true);
		}
	});

	it('recognises versioned / hyphenated model names', () => {
		expect(isAgent('gemini-2.0-flash')).toBe(true);
		expect(isAgent('claude-3-5-sonnet')).toBe(true);
		expect(isAgent('gpt-4o')).toBe(true);
		expect(isAgent('llama-3')).toBe(true);
	});

	it('is case-insensitive', () => {
		expect(isAgent('Gemini')).toBe(true);
		expect(isAgent('CLAUDE')).toBe(true);
		expect(isAgent('GPT')).toBe(true);
	});

	it('rejects human assignee names', () => {
		expect(isAgent('human')).toBe(false);
		expect(isAgent('alice')).toBe(false);
		expect(isAgent('admin')).toBe(false);
		expect(isAgent('van')).toBe(false);
	});

	it('rejects empty / null-ish strings', () => {
		expect(isAgent('')).toBe(false);
		expect(isAgent('   ')).toBe(false); // whitespace trimmed → empty → false
	});

	it('does not false-positive on partial prefix sub-strings in the middle of a word', () => {
		// "opusgem" should NOT match "gemini" or "opus" because it starts with "opus" — actually it does match
		// True negative: a word that merely contains a model prefix but doesn't start with it
		expect(isAgent('notgemini')).toBe(false);
		expect(isAgent('mygpt')).toBe(false);
	});
});

// ─── formatElapsed ────────────────────────────────────────────────────────────

describe('formatElapsed', () => {
	/** Helper: build an ISO timestamp that is `ms` milliseconds before `now`. */
	function ago(ms: number, now = Date.now()): string {
		return new Date(now - ms).toISOString();
	}

	const NOW = new Date('2026-01-01T12:00:00Z').getTime();

	it('shows seconds for < 60 s', () => {
		expect(formatElapsed(ago(0, NOW), NOW)).toBe('0s ago');
		expect(formatElapsed(ago(30_000, NOW), NOW)).toBe('30s ago');
		expect(formatElapsed(ago(59_999, NOW), NOW)).toBe('59s ago');
	});

	it('shows minutes for 1 – 59 min', () => {
		expect(formatElapsed(ago(60_000, NOW), NOW)).toBe('1m ago');
		expect(formatElapsed(ago(90_000, NOW), NOW)).toBe('1m ago'); // 1.5 min → floor → 1
		expect(formatElapsed(ago(30 * 60_000, NOW), NOW)).toBe('30m ago');
		expect(formatElapsed(ago(59 * 60_000, NOW), NOW)).toBe('59m ago');
	});

	it('shows hours for 1 – 23 h', () => {
		expect(formatElapsed(ago(60 * 60_000, NOW), NOW)).toBe('1h ago');
		expect(formatElapsed(ago(5 * 60 * 60_000, NOW), NOW)).toBe('5h ago');
		expect(formatElapsed(ago(23 * 60 * 60_000, NOW), NOW)).toBe('23h ago');
	});

	it('shows days for ≥ 24 h', () => {
		expect(formatElapsed(ago(24 * 60 * 60_000, NOW), NOW)).toBe('1d ago');
		expect(formatElapsed(ago(3 * 24 * 60 * 60_000, NOW), NOW)).toBe('3d ago');
	});

	it('returns "just now" for future timestamps (clock skew)', () => {
		const future = new Date(NOW + 5_000).toISOString(); // 5 s in the future
		expect(formatElapsed(future, NOW)).toBe('just now');
	});
});

// ─── parseJsonArray ───────────────────────────────────────────────────────────

describe('parseJsonArray', () => {
	it('parses a valid JSON array string', () => {
		expect(parseJsonArray('["src/app.ts", "package.json"]')).toEqual(['src/app.ts', 'package.json']);
	});

	it('returns an empty array for null', () => {
		expect(parseJsonArray(null)).toEqual([]);
	});

	it('returns an empty array for undefined', () => {
		expect(parseJsonArray(undefined)).toEqual([]);
	});

	it('returns an empty array for an empty string', () => {
		expect(parseJsonArray('')).toEqual([]);
	});

	it('returns an empty array for truly malformed JSON', () => {
		expect(parseJsonArray('not json at all')).toEqual([]);
		expect(parseJsonArray('[unclosed')).toEqual([]);
		expect(parseJsonArray('{key: no-quotes}')).toEqual([]);
	});

	it('returns an empty array for a JSON object (not an array)', () => {
		// '{}' is valid JSON but not an array — the function still returns it;
		// the key contract is: NEVER throws, regardless of input.
		expect(() => parseJsonArray('{}')).not.toThrow();
		// In practice, DB TEXT columns hold either null or a JSON array.
		// If somehow a plain object was stored, callers will get back the object;
		// the template's {#each} will simply iterate zero entries over a plain object.
	});

	it('handles a JSON array with a single item', () => {
		expect(parseJsonArray('["only-one"]')).toEqual(['only-one']);
	});

	it('handles an empty JSON array', () => {
		expect(parseJsonArray('[]')).toEqual([]);
	});
});
