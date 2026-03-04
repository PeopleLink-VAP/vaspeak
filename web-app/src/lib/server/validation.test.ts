/**
 * Unit tests for validation utilities.
 *
 * These run without SpacetimeDB — pure function tests.
 */

import { describe, it, expect } from 'vitest';
import {
    validateEmail,
    validatePassword,
    extractDomain,
    isDisposableDomain,
    validateRegistrationEmail,
} from '$lib/server/validation';

// ─── validateEmail ──────────────────────────────────────────────────────────

describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
        expect(validateEmail('user@example.com')).toEqual({ valid: true });
        expect(validateEmail('user.name@example.co.uk')).toEqual({ valid: true });
        expect(validateEmail('user+tag@gmail.com')).toEqual({ valid: true });
        expect(validateEmail('UPPER@CASE.COM')).toEqual({ valid: true });
    });

    it('rejects empty or missing emails', () => {
        expect(validateEmail('')).toEqual({ valid: false, error: 'Email is required' });
        expect(validateEmail(null as unknown as string)).toEqual({ valid: false, error: 'Email is required' });
        expect(validateEmail(undefined as unknown as string)).toEqual({ valid: false, error: 'Email is required' });
    });

    it('rejects invalid email formats', () => {
        expect(validateEmail('notanemail')).toEqual({ valid: false, error: 'Invalid email format' });
        expect(validateEmail('@missing-local.com')).toEqual({ valid: false, error: 'Invalid email format' });
        expect(validateEmail('missing-at.com')).toEqual({ valid: false, error: 'Invalid email format' });
    });

    it('rejects emails exceeding 254 characters', () => {
        const longEmail = 'a'.repeat(243) + '@example.com'; // 255 chars
        expect(validateEmail(longEmail)).toEqual({ valid: false, error: 'Email is too long' });
    });
});

// ─── validatePassword ───────────────────────────────────────────────────────

describe('validatePassword', () => {
    it('accepts valid passwords meeting all criteria', () => {
        expect(validatePassword('MyPass1!')).toEqual({ valid: true });
        expect(validatePassword('StrongPassword123')).toEqual({ valid: true });
        expect(validatePassword('abcDEF789')).toEqual({ valid: true });
    });

    it('rejects empty or missing passwords', () => {
        expect(validatePassword('')).toEqual({ valid: false, error: 'Password is required' });
        expect(validatePassword(null as unknown as string)).toEqual({ valid: false, error: 'Password is required' });
    });

    it('rejects passwords shorter than 8 characters', () => {
        expect(validatePassword('Ab1')).toEqual({ valid: false, error: 'Password must be at least 8 characters' });
        expect(validatePassword('Abcde1!')).toEqual({ valid: false, error: 'Password must be at least 8 characters' });
    });

    it('rejects passwords exceeding 128 characters', () => {
        const longPassword = 'Aa1' + 'x'.repeat(126);
        expect(validatePassword(longPassword)).toEqual({ valid: false, error: 'Password is too long' });
    });

    it('rejects passwords without lowercase letters', () => {
        expect(validatePassword('ALLCAPS123')).toEqual({
            valid: false,
            error: 'Password must contain at least one lowercase letter',
        });
    });

    it('rejects passwords without uppercase letters', () => {
        expect(validatePassword('alllower123')).toEqual({
            valid: false,
            error: 'Password must contain at least one uppercase letter',
        });
    });

    it('rejects passwords without numbers', () => {
        expect(validatePassword('NoNumbers!')).toEqual({
            valid: false,
            error: 'Password must contain at least one number',
        });
    });
});

// ─── extractDomain ──────────────────────────────────────────────────────────

describe('extractDomain', () => {
    it('extracts domain from email', () => {
        expect(extractDomain('user@example.com')).toBe('example.com');
        expect(extractDomain('user@sub.domain.org')).toBe('sub.domain.org');
    });

    it('lowercases the domain', () => {
        expect(extractDomain('user@EXAMPLE.COM')).toBe('example.com');
    });

    it('returns empty string for invalid emails', () => {
        expect(extractDomain('no-at-sign')).toBe('');
    });
});

// ─── isDisposableDomain ─────────────────────────────────────────────────────

describe('isDisposableDomain', () => {
    it('detects known disposable domains', () => {
        expect(isDisposableDomain('mailinator.com')).toBe(true);
        expect(isDisposableDomain('guerrillamail.com')).toBe(true);
        expect(isDisposableDomain('yopmail.com')).toBe(true);
        expect(isDisposableDomain('trashmail.com')).toBe(true);
        expect(isDisposableDomain('sharklasers.com')).toBe(true);
    });

    it('is case insensitive', () => {
        expect(isDisposableDomain('MAILINATOR.COM')).toBe(true);
        expect(isDisposableDomain('Yopmail.Com')).toBe(true);
    });

    it('allows legitimate domains', () => {
        expect(isDisposableDomain('gmail.com')).toBe(false);
        expect(isDisposableDomain('yahoo.com')).toBe(false);
        expect(isDisposableDomain('outlook.com')).toBe(false);
        expect(isDisposableDomain('company.co.uk')).toBe(false);
        expect(isDisposableDomain('eskills.virtualassistanpro.vn')).toBe(false);
    });
});

// ─── validateRegistrationEmail ──────────────────────────────────────────────

describe('validateRegistrationEmail', () => {
    it('accepts valid non-disposable emails', () => {
        expect(validateRegistrationEmail('user@gmail.com')).toEqual({ valid: true });
        expect(validateRegistrationEmail('user@company.org')).toEqual({ valid: true });
    });

    it('rejects invalid email format', () => {
        const result = validateRegistrationEmail('not-an-email');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid email format');
    });

    it('rejects disposable email domains', () => {
        const result = validateRegistrationEmail('user@mailinator.com');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Disposable email addresses are not allowed');
    });

    it('rejects disposable emails case-insensitively', () => {
        const result = validateRegistrationEmail('user@MAILINATOR.COM');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Disposable email addresses are not allowed');
    });
});
