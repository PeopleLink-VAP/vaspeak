/**
 * Playwright E2E tests for auth API endpoints.
 *
 * Tests the HTTP API contract for registration, login, magic links,
 * password reset, email verification, logout, and user info.
 *
 * Note: These tests exercise the API routes directly without requiring
 * a live SpacetimeDB connection. Endpoints that call SpacetimeDB will
 * return 500 errors when the DB is unavailable — we test the validation
 * and contract layers that run BEFORE the DB call.
 */

import { test, expect } from '@playwright/test';

// ─── Registration ───────────────────────────────────────────────────────────

test.describe('POST /api/auth/register', () => {
    const endpoint = '/api/auth/register';

    test('rejects missing email', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { password: 'ValidPass1' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Email');
    });

    test('rejects missing password', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'user@example.com' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Password');
    });

    test('rejects invalid email format', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'not-an-email', password: 'ValidPass1' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('email');
    });

    test('rejects weak passwords (too short)', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'user@example.com', password: 'Ab1' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('8 characters');
    });

    test('rejects passwords without uppercase', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'user@example.com', password: 'alllower123' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('uppercase');
    });

    test('rejects passwords without numbers', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'user@example.com', password: 'NoNumbers!' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('number');
    });

    test('rejects disposable email domains', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'test@tempmail.com', password: 'ValidPass123' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('not allowed');
    });

    test('rejects another disposable domain (mailinator)', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'test@mailinator.com', password: 'ValidPass123' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('not allowed');
    });
});

// ─── Login ──────────────────────────────────────────────────────────────────

test.describe('POST /api/auth/login', () => {
    const endpoint = '/api/auth/login';

    test('rejects missing credentials', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: {},
        });
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    test('rejects invalid email format', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'bad-email', password: 'Password1' },
        });
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Invalid email or password');
    });

    test('rejects missing password', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'user@example.com' },
        });
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
    });
});

// ─── Forgot Password ───────────────────────────────────────────────────────

test.describe('POST /api/auth/forgot-password', () => {
    const endpoint = '/api/auth/forgot-password';

    test('always returns success (prevents email enumeration)', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'nonexistent@example.com' },
        });
        // Should return 200 even if email doesn't exist
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.message).toContain('reset link');
    });

    test('returns success even for invalid email format', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'not-valid' },
        });
        const body = await response.json();
        // Still returns success to not reveal info
        expect(body.success).toBe(true);
    });
});

// ─── Reset Password ────────────────────────────────────────────────────────

test.describe('POST /api/auth/reset-password', () => {
    const endpoint = '/api/auth/reset-password';

    test('rejects missing token', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { password: 'NewPassword1' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('token');
    });

    test('rejects weak new password', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { token: 'some-token', password: 'weak' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('8 characters');
    });
});

// ─── Magic Link Request ────────────────────────────────────────────────────

test.describe('POST /api/auth/magic-link', () => {
    const endpoint = '/api/auth/magic-link';

    test('always returns success (prevents email enumeration)', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'anyone@example.com' },
        });
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.message).toContain('magic link');
    });
});

// ─── Magic Link Verify ─────────────────────────────────────────────────────

test.describe('GET /api/auth/magic-link/verify', () => {
    test('redirects with error when token is missing', async ({ request }) => {
        const response = await request.get('/api/auth/magic-link/verify', {
            maxRedirects: 0,
        });
        expect(response.status()).toBe(303);
        const location = response.headers()['location'];
        expect(location).toContain('error=missing_token');
    });
});

// ─── Email Verification ────────────────────────────────────────────────────

test.describe('GET /api/auth/verify-email', () => {
    test('redirects with error when token is missing', async ({ request }) => {
        const response = await request.get('/api/auth/verify-email', {
            maxRedirects: 0,
        });
        expect(response.status()).toBe(303);
        const location = response.headers()['location'];
        expect(location).toContain('error=missing_token');
    });
});

// ─── Logout ─────────────────────────────────────────────────────────────────

test.describe('POST /api/auth/logout', () => {
    test('returns success and clears session', async ({ request }) => {
        const response = await request.post('/api/auth/logout');
        expect(response.ok()).toBe(true);
        const body = await response.json();
        expect(body.success).toBe(true);
    });
});

// ─── Me (Current User) ─────────────────────────────────────────────────────

test.describe('GET /api/auth/me', () => {
    test('returns 401 when not authenticated', async ({ request }) => {
        const response = await request.get('/api/auth/me');
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Not authenticated');
    });
});

// ─── Newsletter Subscribe ──────────────────────────────────────────────────

test.describe('POST /api/newsletter/subscribe', () => {
    const endpoint = '/api/newsletter/subscribe';

    test('rejects missing email', async ({ request }) => {
        const response = await request.post(endpoint, { data: {} });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Email');
    });

    test('rejects invalid email format', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'not-valid' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    test('rejects disposable email domains', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'test@guerrillamail.com' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('not allowed');
    });
});

// ─── Newsletter Unsubscribe ────────────────────────────────────────────────

test.describe('POST /api/newsletter/unsubscribe', () => {
    const endpoint = '/api/newsletter/unsubscribe';

    test('rejects missing email', async ({ request }) => {
        const response = await request.post(endpoint, { data: {} });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    test('rejects invalid email format', async ({ request }) => {
        const response = await request.post(endpoint, {
            data: { email: 'garbage' },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });
});
