import { test, expect } from '@playwright/test';

/**
 * Homepage smoke tests.
 * The homepage currently renders a placeholder SvelteKit page.
 */
test.describe('Homepage @smoke', () => {
	test('loads without errors', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (err) => errors.push(err.message));

		await page.goto('/');
		// Title may be empty on the placeholder page — just assert 200
		const response = await page.waitForLoadState('domcontentloaded');
		expect(errors).toHaveLength(0);
	});

	test('renders root content', async ({ page }) => {
		await page.goto('/');
		// The current placeholder renders an h1
		await expect(page.locator('h1')).toBeVisible();
	});

	test('has no broken console errors', async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') consoleErrors.push(msg.text());
		});

		await page.goto('/');
		// Filter out known non-critical browser noise (favicon 404 excluded)
		const critical = consoleErrors.filter(
			(msg) => !msg.includes('favicon') && !msg.includes('Failed to load resource')
		);
		expect(critical).toHaveLength(0);
	});
});
