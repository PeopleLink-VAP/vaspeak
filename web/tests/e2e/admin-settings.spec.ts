import { test, expect } from '@playwright/test';

/**
 * Admin Settings page E2E tests.
 * Admin credentials are passed via httpCredentials in playwright.config.ts.
 */
test.describe('Admin Settings Page @smoke', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/settings', { waitUntil: 'networkidle' });
	});

	test('renders page title', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Server Settings' })).toBeVisible();
	});

	test('shows environment badges', async ({ page }) => {
		// At least one badge row visible
		await expect(page.locator('.badge-row')).toBeVisible();
		// Groq badge should be visible (configured or not)
		await expect(page.locator('.badge').filter({ hasText: 'Groq API' })).toBeVisible();
	});

	test('shows system section with memory bar', async ({ page }) => {
		await expect(page.locator('text=System')).toBeVisible();
		await expect(page.locator('.bar-bg')).toBeVisible();
		// Bar fill is rendered
		await expect(page.locator('.bar-fill')).toBeVisible();
	});

	test('shows database section with table list', async ({ page }) => {
		// DB section heading
		await expect(page.locator('text=Database').first()).toBeVisible();
		// Table shows core table names
		await expect(page.locator('.db-table td.mono').filter({ hasText: 'profiles' })).toBeVisible();
	});

	test('shows download backup button', async ({ page }) => {
		const btn = page.locator('.btn-primary', { hasText: 'Download Backup' });
		await expect(btn).toBeVisible();
		await expect(btn).toBeEnabled();
	});

	test('shows deployment section with git info', async ({ page }) => {
		await expect(page.locator('text=Deployment')).toBeVisible();
		await expect(page.locator('text=Last commit')).toBeVisible();
	});

	test('shows services section', async ({ page }) => {
		await expect(page.locator('text=External Services')).toBeVisible();
		await expect(page.locator('.service-row').first()).toBeVisible();
	});

	test('settings link appears in admin sidebar', async ({ page }) => {
		await page.goto('/admin');
		await expect(page.locator('a[href="/admin/settings"]')).toBeVisible();
	});
});
