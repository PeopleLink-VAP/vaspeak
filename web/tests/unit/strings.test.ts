import { describe, it, expect } from 'vitest';
import { truncate, slugify } from '$lib/utils';

describe('truncate', () => {
	it('returns the string unchanged when within limit', () => {
		expect(truncate('hello', 10)).toBe('hello');
	});

	it('returns the string unchanged when exactly at limit', () => {
		expect(truncate('hello', 5)).toBe('hello');
	});

	it('appends ellipsis when over limit', () => {
		expect(truncate('hello world', 5)).toBe('hello…');
	});

	it('handles empty string', () => {
		expect(truncate('', 10)).toBe('');
	});

	it('truncates to 1 character correctly', () => {
		expect(truncate('abcdef', 1)).toBe('a…');
	});
});

describe('slugify', () => {
	it('lowercases the input', () => {
		expect(slugify('Hello World')).toBe('hello-world');
	});

	it('replaces spaces with hyphens', () => {
		expect(slugify('va speak app')).toBe('va-speak-app');
	});

	it('removes special characters', () => {
		expect(slugify('VASpeak: English for VAs!')).toBe('vaspeak-english-for-vas');
	});

	it('collapses multiple spaces into one hyphen', () => {
		expect(slugify('hello   world')).toBe('hello-world');
	});

	it('trims leading/trailing hyphens', () => {
		expect(slugify('  hello  ')).toBe('hello');
	});

	it('handles empty string', () => {
		expect(slugify('')).toBe('');
	});

	it('converts underscores to hyphens', () => {
		expect(slugify('my_lesson_title')).toBe('my-lesson-title');
	});
});
