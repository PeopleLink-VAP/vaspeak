import { test, expect } from '@playwright/test';

/**
 * Admin authentication tests.
 * The /admin section is protected by HTTP Basic Auth via hooks.server.ts.
 */
test.describe('Admin Authentication @smoke @auth', () => {
	test('redirects to 401 without credentials', async ({ browser }) => {
		// Create a context with NO credentials
		const ctx = await browser.newContext({ httpCredentials: undefined });
		const page = await ctx.newPage();

		const response = await page.goto('/admin');
		expect(response?.status()).toBe(401);

		await ctx.close();
	});

	test('returns 403 with wrong credentials', async ({ browser }) => {
		const ctx = await browser.newContext({
			httpCredentials: { username: 'admin', password: 'wrongpassword' }
		});
		const page = await ctx.newPage();

		const response = await page.goto('/admin');
		expect(response?.status()).toBe(403);

		await ctx.close();
	});

	test('grants access with correct credentials', async ({ page }) => {
		// Uses the httpCredentials from playwright.config.ts (correct creds)
		const response = await page.goto('/admin');
		expect(response?.status()).toBe(200);
	});

	test('admin layout renders brand name', async ({ page }) => {
		await page.goto('/admin');
		await expect(page.getByText('VASpeak Admin')).toBeVisible();
	});

	test('admin layout has nav links (by href)', async ({ page }) => {
		await page.goto('/admin');
		// On mobile, nav labels are hidden via CSS — check by href instead of text
		await expect(page.locator('a[href="/admin"]')).toBeVisible();
		await expect(page.locator('a[href="/admin/kanban"]')).toBeVisible();
	});
});
