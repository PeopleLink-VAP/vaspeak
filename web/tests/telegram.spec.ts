/**
 * E2E Test: Telegram Integration
 * Tests the profile page Telegram connect component and API endpoints.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vaspeak-beta.alphabits.team';

test.describe('Telegram Integration', () => {
    // Test API endpoints directly
    test('GET /api/telegram/link requires auth', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/telegram/link`);
        expect(res.status()).toBe(401);
    });

    test('POST /api/telegram/link requires auth', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/link`);
        expect(res.status()).toBe(401);
    });

    test('PATCH /api/telegram/link requires auth', async ({ request }) => {
        const res = await request.patch(`${BASE_URL}/api/telegram/link`, {
            data: { reminderHour: 9, timezone: 'Asia/Ho_Chi_Minh' }
        });
        expect(res.status()).toBe(401);
    });

    test('DELETE /api/telegram/link requires auth', async ({ request }) => {
        const res = await request.delete(`${BASE_URL}/api/telegram/link`);
        expect(res.status()).toBe(401);
    });

    test('POST /api/telegram/send-daily-challenge requires auth', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/send-daily-challenge`);
        expect(res.status()).toBe(401);
    });

    test('POST /api/telegram/send-daily-challenge accepts cron secret', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/send-daily-challenge`, {
            headers: { 'Authorization': 'Bearer vaspeak-cron-trigger' }
        });
        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty('sent');
        expect(data).toHaveProperty('total');
    });

    // Webhook endpoint tests
    test('POST /api/telegram/webhook handles empty body', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/webhook`, {
            data: {}
        });
        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data.ok).toBe(true);
    });

    test('POST /api/telegram/webhook handles /start without token', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/webhook`, {
            data: {
                message: {
                    chat: { id: 999999999 },
                    from: { id: 999999999, username: 'test_user' },
                    text: '/start',
                    date: Math.floor(Date.now() / 1000)
                }
            }
        });
        expect(res.status()).toBe(200);
    });

    test('POST /api/telegram/webhook handles /start with invalid token', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/webhook`, {
            data: {
                message: {
                    chat: { id: 999999999 },
                    from: { id: 999999999, username: 'test_user' },
                    text: '/start invalid_token_12345',
                    date: Math.floor(Date.now() / 1000)
                }
            }
        });
        expect(res.status()).toBe(200);
    });

    test('POST /api/telegram/webhook handles /status for unlinked user', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/webhook`, {
            data: {
                message: {
                    chat: { id: 888888888 },
                    from: { id: 888888888 },
                    text: '/status',
                    date: Math.floor(Date.now() / 1000)
                }
            }
        });
        expect(res.status()).toBe(200);
    });

    test('POST /api/telegram/webhook handles /word for unlinked user', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/webhook`, {
            data: {
                message: {
                    chat: { id: 888888888 },
                    from: { id: 888888888 },
                    text: '/word',
                    date: Math.floor(Date.now() / 1000)
                }
            }
        });
        expect(res.status()).toBe(200);
    });

    test('POST /api/telegram/webhook handles /time with invalid hour', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/webhook`, {
            data: {
                message: {
                    chat: { id: 888888888 },
                    from: { id: 888888888 },
                    text: '/time 25',
                    date: Math.floor(Date.now() / 1000)
                }
            }
        });
        expect(res.status()).toBe(200);
    });

    test('POST /api/telegram/webhook handles random text', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/telegram/webhook`, {
            data: {
                message: {
                    chat: { id: 888888888 },
                    from: { id: 888888888 },
                    text: 'hello there',
                    date: Math.floor(Date.now() / 1000)
                }
            }
        });
        expect(res.status()).toBe(200);
    });

    // UI Tests - Profile page Telegram component
    test.describe('Profile UI', () => {
        const UI_EMAIL = `tg-test-${Date.now()}@example.com`;
        const UI_PASS = 'TestTelegram123';

        test.beforeAll(async ({ browser }) => {
            const page = await browser.newPage();
            await page.goto('/login');
            await page.locator('button:has-text("Đăng Ký")').click();
            await page.fill('#reg-name', 'TG Test User');
            await page.fill('#reg-email', UI_EMAIL);
            await page.fill('#reg-password', UI_PASS);
            await page.locator('button[type="submit"]').first().click();
            await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
            await page.close();
        });

        test.beforeEach(async ({ page }) => {
            await page.goto('/login');
            await page.fill('#login-email', UI_EMAIL);
            await page.fill('#login-password', UI_PASS);
            await page.locator('button[type="submit"]').first().click();
            await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
        });

        test('Profile page shows Telegram connect component', async ({ page }) => {
            await page.goto('/profile');
            await page.waitForSelector('[data-testid="telegram-connect"]', { timeout: 5000 });
            const component = page.locator('[data-testid="telegram-connect"]');
            await expect(component).toBeVisible();
            await expect(component).toContainText('Kết Nối Telegram');
        });

        test('Profile page shows badges section', async ({ page }) => {
            await page.goto('/profile');
            await expect(page.getByText('🏆 Huy Hiệu')).toBeVisible({ timeout: 5000 });
        });

        test('Telegram link button is clickable', async ({ page }) => {
            await page.goto('/profile');
            const linkBtn = page.locator('[data-testid="telegram-link-btn"]');
            await expect(linkBtn).toBeVisible({ timeout: 5000 });
            await linkBtn.click();
            // QR modal should appear
            await expect(page.locator('[data-testid="telegram-qr-modal"]')).toBeVisible({ timeout: 5000 });
        });
    });
});
