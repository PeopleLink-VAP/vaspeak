import { describe, it, expect } from 'vitest';
import {
	creditsRemaining,
	hasEnoughCredits,
	creditStatusLabel,
	MONTHLY_CREDIT_ALLOWANCE
} from '$lib/utils';

describe('creditsRemaining', () => {
	it('returns allowance minus used', () => {
		expect(creditsRemaining(30)).toBe(70);
	});

	it('returns 0 when all credits are used', () => {
		expect(creditsRemaining(100)).toBe(0);
	});

	it('never returns negative (overspent)', () => {
		expect(creditsRemaining(150)).toBe(0);
	});

	it('uses custom allowance correctly', () => {
		expect(creditsRemaining(40, 200)).toBe(160);
	});

	it('returns full allowance when none used', () => {
		expect(creditsRemaining(0)).toBe(MONTHLY_CREDIT_ALLOWANCE);
	});
});

describe('hasEnoughCredits', () => {
	it('returns true when user has enough credits', () => {
		expect(hasEnoughCredits(50, 10)).toBe(true); // 50 remaining, needs 10
	});

	it('returns true when cost exactly equals remaining', () => {
		expect(hasEnoughCredits(90, 10)).toBe(true); // exactly 10 remaining
	});

	it('returns false when not enough credits', () => {
		expect(hasEnoughCredits(95, 10)).toBe(false); // only 5 remaining
	});

	it('returns false when no credits left', () => {
		expect(hasEnoughCredits(100, 1)).toBe(false);
	});
});

describe('creditStatusLabel', () => {
	it('returns "healthy" when over 50% remains', () => {
		expect(creditStatusLabel(0)).toBe('healthy');   // 100% remaining
		expect(creditStatusLabel(40)).toBe('healthy');  // 60% remaining
	});

	it('returns "low" when 20–50% remains', () => {
		expect(creditStatusLabel(60)).toBe('low');  // 40% remaining
		expect(creditStatusLabel(79)).toBe('low');  // 21% remaining
	});

	it('returns "critical" when ≤20% remains', () => {
		expect(creditStatusLabel(80)).toBe('critical');  // 20% remaining
		expect(creditStatusLabel(99)).toBe('critical');
	});

	it('returns "critical" when all credits used', () => {
		expect(creditStatusLabel(100)).toBe('critical');
	});
});
