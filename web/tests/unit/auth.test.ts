/**
 * Unit tests for auth helpers (bcrypt + JWT, no DB).
 * Run: npm run test:unit
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock the db module BEFORE importing auth (which imports db at module load)
vi.mock('$lib/server/db', () => ({ db: {} }));

// Also mock $env/static/private which auth.ts doesn't use directly,
// but db.ts import chain might need it in some configs
vi.mock('$env/static/private', () => ({
	ADMIN_AUTH_USER: 'admin',
	ADMIN_AUTH_PASSWORD: 'test',
	JWT_SECRET: 'test-secret'
}));

// Import after mocks are set up
import { hashPassword, verifyPassword, signToken, verifyToken } from '$lib/server/auth';

describe('hashPassword / verifyPassword', () => {
	it('hashes and verifies a correct password', async () => {
		const hash = await hashPassword('correcthorse');
		expect(hash).not.toBe('correcthorse');
		expect(hash.startsWith('$2')).toBe(true);
		await expect(verifyPassword('correcthorse', hash)).resolves.toBe(true);
	});

	it('rejects a wrong password', async () => {
		const hash = await hashPassword('correcthorse');
		await expect(verifyPassword('wrongpassword', hash)).resolves.toBe(false);
	});

	it('hashes are unique (salted)', async () => {
		const h1 = await hashPassword('same');
		const h2 = await hashPassword('same');
		expect(h1).not.toBe(h2);
	});
});

describe('signToken / verifyToken', () => {
	const user = {
		id: 'abc123',
		email: 'test@example.com',
		displayName: 'Test User',
		role: 'user'
	};

	it('signs and verifies a valid token', () => {
		const token = signToken(user);
		expect(typeof token).toBe('string');
		expect(token.split('.')).toHaveLength(3); // JWT structure
		const payload = verifyToken(token);
		expect(payload).not.toBeNull();
		expect(payload?.sub).toBe('abc123');
		expect(payload?.email).toBe('test@example.com');
		expect(payload?.role).toBe('user');
	});

	it('returns null for an invalid token', () => {
		expect(verifyToken('not.a.jwt')).toBeNull();
		expect(verifyToken('')).toBeNull();
		expect(verifyToken('eyJhbGc.bad.token')).toBeNull();
	});

	it('returns null for a tampered token', () => {
		const token = signToken(user);
		// Tamper the signature (last segment)
		const parts = token.split('.');
		parts[2] = parts[2].slice(0, -4) + 'XXXX';
		expect(verifyToken(parts.join('.'))).toBeNull();
	});

	it('payload contains expected claims', () => {
		const token = signToken(user);
		const payload = verifyToken(token);
		expect(payload?.displayName).toBe('Test User');
	});

	it('token expires in ~7 days', () => {
		const token = signToken(user);
		const payload = verifyToken(token);
		const sevenDays = 7 * 24 * 60 * 60;
		const diff = (payload?.exp ?? 0) - Math.floor(Date.now() / 1000);
		expect(diff).toBeGreaterThan(sevenDays - 120);
		expect(diff).toBeLessThan(sevenDays + 120);
	});
});
