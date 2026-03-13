import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard page tests.
 * Verifies the stat cards, server info, and git commit sections render.
 */
test.describe('Admin Dashboard @smoke', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/admin');
		await page.waitForSelector('.stat-card', { state: 'visible' });
	});

	test('renders page title', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
	});

	test('renders the 4 stat cards', async ({ page }) => {
		const statCards = page.locator('.stat-card');
		await expect(statCards).toHaveCount(4);
	});

	test('stat cards show expected labels', async ({ page }) => {
		await expect(page.getByText('Profiles')).toBeVisible();
		await expect(page.getByText('Lessons')).toBeVisible();
		await expect(page.getByText('Vocab Words')).toBeVisible();
		await expect(page.getByText(/Uptime/i)).toBeVisible();
	});

	test('renders Latest Commit section', async ({ page }) => {
		await expect(page.getByRole('heading', { name: /Latest Commit/i })).toBeVisible();
	});

	test('renders Server Info section', async ({ page }) => {
		await expect(page.getByRole('heading', { name: /Server Info/i })).toBeVisible();
	});

	test('memory bar is visible', async ({ page }) => {
		await expect(page.locator('.mem-bar-fill')).toBeVisible();
	});

	test('back-to-site link is present (by href)', async ({ page }) => {
		// On mobile the label text "Back to Site" is hidden via CSS — check by href
		const backLink = page.locator('a[href="/"]');
		await expect(backLink.first()).toBeVisible();
	});
});
