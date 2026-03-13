import { test, expect } from '@playwright/test';

/**
 * Credits Ledger page E2E tests.
 * Requires an authenticated session → uses the register+login flow helper.
 */

// Shared credentials created once per test file run
const TEST_EMAIL    = `credits-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123';
const TEST_NAME     = 'Credits Test User';

test.describe('Credits Ledger @smoke', () => {
	// Register a fresh user before the suite
	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		await page.goto('/login');
		await page.locator('button:has-text("Đăng Ký")').click();
		await page.fill('#reg-name', TEST_NAME);
		await page.fill('#reg-email', TEST_EMAIL);
		await page.fill('#reg-password', TEST_PASSWORD);
		await page.locator('button[type="submit"]').first().click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
		await page.close();
	});

	test.beforeEach(async ({ page }) => {
		// Log in before each test
		await page.goto('/login');
		await page.fill('#login-email', TEST_EMAIL);
		await page.fill('#login-password', TEST_PASSWORD);
		await page.locator('button[type="submit"]').first().click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
	});

	test('dashboard shows credits widget linking to /credits', async ({ page }) => {
		const widget = page.locator('#credits-widget');
		await expect(widget).toBeVisible();
		await expect(widget).toHaveAttribute('href', '/credits');

		// Shows the remaining credit number
		const value = page.locator('#credits-remaining-value');
		await expect(value).toBeVisible();
		const text = await value.innerText();
		expect(Number(text)).toBeGreaterThanOrEqual(0);
	});

	test('credits widget navigates to /credits page', async ({ page }) => {
		await page.locator('#credits-widget').click();
		await expect(page).toHaveURL(/\/credits/);
	});

	test('/credits page shows balance card', async ({ page }) => {
		await page.goto('/credits');
		await expect(page.locator('#credits-balance-card')).toBeVisible();
		await expect(page.locator('#credits-remaining')).toBeVisible();
	});

	test('/credits page shows correct remaining balance (100 for new user)', async ({ page }) => {
		await page.goto('/credits');
		const remaining = page.locator('#credits-remaining');
		await expect(remaining).toBeVisible();
		const text = await remaining.innerText();
		// New user = full allowance (100)
		expect(Number(text)).toBe(100);
	});

	test('/credits page shows empty history for new user', async ({ page }) => {
		await page.goto('/credits');
		// Should render the empty-state message, not the history list
		await expect(page.locator('text=Chưa có lịch sử')).toBeVisible();
	});

	test('/credits page back link returns to dashboard', async ({ page }) => {
		await page.goto('/credits');
		await page.locator('a[href="/dashboard"]').first().click();
		await expect(page).toHaveURL(/\/dashboard/);
	});

	test('unauthenticated /credits redirects to /login', async ({ browser }) => {
		// Use a fresh context with no session cookie
		const ctx  = await browser.newContext();
		const page = await ctx.newPage();
		await page.goto('/credits');
		await expect(page).toHaveURL(/\/login/);
		await ctx.close();
	});

	test('bottom nav on dashboard has Credits link', async ({ page }) => {
		const creditsNav = page.locator('nav a[href="/credits"]');
		await expect(creditsNav).toBeVisible();
	});
});
