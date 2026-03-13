import { describe, it, expect } from 'vitest';
import { hoursSince, formatUptime } from '$lib/utils';

describe('hoursSince', () => {
	it('returns 0 for a very recent timestamp', () => {
		const recent = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago
		expect(hoursSince(recent)).toBe(0);
	});

	it('returns 1 for a timestamp 1h ago', () => {
		const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
		expect(hoursSince(oneHourAgo)).toBe(1);
	});

	it('returns 24 for a timestamp exactly 1 day ago', () => {
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
		expect(hoursSince(oneDayAgo)).toBe(24);
	});

	it('floors partial hours', () => {
		const ninetyMinAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString(); // 1.5h ago
		expect(hoursSince(ninetyMinAgo)).toBe(1);
	});
});

describe('formatUptime', () => {
	it('formats seconds less than 1 minute as "< 1m"', () => {
		expect(formatUptime(30)).toBe('< 1m');
	});

	it('formats exactly 1 minute', () => {
		expect(formatUptime(60)).toBe('1m');
	});

	it('formats exactly 1 hour', () => {
		expect(formatUptime(3600)).toBe('1h');
	});

	it('formats 1 day 1 hour 1 minute', () => {
		expect(formatUptime(90061)).toBe('1d 1h 1m');
	});

	it('omits zero units', () => {
		expect(formatUptime(7200)).toBe('2h');   // no days, no minutes
		expect(formatUptime(86400)).toBe('1d');  // no hours, no minutes
	});

	it('formats a realistic uptime (2 days 6 hours 30 min)', () => {
		const uptime = 2 * 86400 + 6 * 3600 + 30 * 60;
		expect(formatUptime(uptime)).toBe('2d 6h 30m');
	});
});
