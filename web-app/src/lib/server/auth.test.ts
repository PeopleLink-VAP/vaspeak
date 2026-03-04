/**
 * Unit tests for auth utilities.
 *
 * Tests password hashing/verification, token generation,
 * and JWT session management. Runs without SpacetimeDB.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SvelteKit env modules before importing auth
vi.mock('$env/static/private', () => ({
    JWT_SECRET: 'test-jwt-secret-that-is-at-least-32-characters-long',
}));

import {
    hashPassword,
    verifyPassword,
    generateToken,
    createSessionToken,
    verifySessionToken,
} from '$lib/server/auth';

// ─── Password Hashing ───────────────────────────────────────────────────────

describe('hashPassword', () => {
    it('returns a bcrypt hash string', async () => {
        const hash = await hashPassword('MyPassword123');
        expect(hash).toBeTruthy();
        expect(hash).not.toBe('MyPassword123');
        expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix
    });

    it('produces different hashes for the same password', async () => {
        const hash1 = await hashPassword('SamePassword1');
        const hash2 = await hashPassword('SamePassword1');
        expect(hash1).not.toBe(hash2); // different salts
    });
});

describe('verifyPassword', () => {
    it('returns true for matching password and hash', async () => {
        const password = 'CorrectHorse42';
        const hash = await hashPassword(password);
        const result = await verifyPassword(password, hash);
        expect(result).toBe(true);
    });

    it('returns false for wrong password', async () => {
        const hash = await hashPassword('RightPassword1');
        const result = await verifyPassword('WrongPassword1', hash);
        expect(result).toBe(false);
    });

    it('returns false for empty password against valid hash', async () => {
        const hash = await hashPassword('SomePassword1');
        const result = await verifyPassword('', hash);
        expect(result).toBe(false);
    });
});

// ─── Token Generation ───────────────────────────────────────────────────────

describe('generateToken', () => {
    it('returns a UUID v4 string', () => {
        const token = generateToken();
        expect(token).toBeTruthy();
        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        expect(token).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
    });

    it('generates unique tokens', () => {
        const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
        expect(tokens.size).toBe(100);
    });
});

// ─── JWT Session ────────────────────────────────────────────────────────────

describe('createSessionToken / verifySessionToken', () => {
    it('creates a valid JWT that can be verified', () => {
        const token = createSessionToken(1, 'user@example.com', 'user');
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');

        const payload = verifySessionToken(token);
        expect(payload).not.toBeNull();
        expect(payload?.userId).toBe(1);
        expect(payload?.email).toBe('user@example.com');
        expect(payload?.role).toBe('user');
    });

    it('preserves all user fields in the token', () => {
        const token = createSessionToken(42, 'admin@company.com', 'admin');
        const payload = verifySessionToken(token);
        expect(payload?.userId).toBe(42);
        expect(payload?.email).toBe('admin@company.com');
        expect(payload?.role).toBe('admin');
    });

    it('returns null for invalid tokens', () => {
        expect(verifySessionToken('invalid-token')).toBeNull();
        expect(verifySessionToken('')).toBeNull();
        expect(verifySessionToken('eyJhbGciOiJIUzI1NiJ9.invalid.payload')).toBeNull();
    });

    it('returns null for tampered tokens', () => {
        const token = createSessionToken(1, 'user@example.com', 'user');
        // Tamper with the token by changing a character
        const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');
        expect(verifySessionToken(tampered)).toBeNull();
    });
});
