import { describe, it, expect } from 'vitest';
import { scorePlacement, validatePlacement, type PlacementInput } from '$lib/placement';

describe('scorePlacement', () => {
	it('beginner speaking → general level', () => {
		const result = scorePlacement({ experience: 'none', speaking: 'beginner', niche: 'general' });
		expect(result.level).toBe('general');
		expect(result.levelLabel).toBe('General Communication');
		expect(result.startDay).toBe(1);
	});

	it('intermediate speaking → working_va level', () => {
		const result = scorePlacement({ experience: 'none', speaking: 'intermediate', niche: 'general' });
		expect(result.level).toBe('working_va');
		expect(result.levelLabel).toBe('Working VA');
	});

	it('advanced speaking → working_va level', () => {
		const result = scorePlacement({ experience: 'yes', speaking: 'advanced', niche: 'ecommerce' });
		expect(result.level).toBe('working_va');
		expect(result.niche).toBe('ecommerce');
	});

	it('experience=yes but beginner speaking → still general', () => {
		const result = scorePlacement({ experience: 'yes', speaking: 'beginner', niche: 'general' });
		expect(result.level).toBe('general');
	});

	it('passes through niche value', () => {
		const result = scorePlacement({ experience: 'none', speaking: 'beginner', niche: 'video_editor' });
		expect(result.niche).toBe('video_editor');
	});

	it('defaults niche to general when empty', () => {
		const result = scorePlacement({ experience: 'none', speaking: 'beginner', niche: '' });
		expect(result.niche).toBe('general');
	});

	it('empty speaking defaults to general level', () => {
		const result = scorePlacement({ experience: 'none', speaking: '', niche: 'general' });
		expect(result.level).toBe('general');
	});
});

describe('validatePlacement', () => {
	it('returns null for valid beginner input', () => {
		expect(validatePlacement({ experience: 'none', speaking: 'beginner', niche: 'general' })).toBeNull();
	});

	it('returns null for valid intermediate input', () => {
		expect(validatePlacement({ experience: 'yes', speaking: 'intermediate', niche: '' })).toBeNull();
	});

	it('returns null for valid advanced input', () => {
		expect(validatePlacement({ experience: 'yes', speaking: 'advanced', niche: 'ecommerce' })).toBeNull();
	});

	it('returns error when speaking is empty', () => {
		const err = validatePlacement({ experience: 'none', speaking: '', niche: 'general' });
		expect(err).toBe('Vui lòng chọn trình độ nói hiện tại của bạn.');
	});

	it('returns error for invalid speaking value', () => {
		const err = validatePlacement({ experience: 'none', speaking: 'fluent' as any, niche: '' });
		expect(err).toBe('Trình độ nói không hợp lệ.');
	});
});
