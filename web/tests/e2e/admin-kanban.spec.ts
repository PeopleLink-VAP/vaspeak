import { test, expect } from '@playwright/test';

/**
 * Admin Kanban Board UI tests.
 * Tests the board renders columns and the new task form interaction.
 */
test.describe('Admin Kanban Board @smoke', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/kanban', { waitUntil: 'networkidle' });
		// Wait for the board to fully render
		await page.waitForSelector('.column', { state: 'visible' });
		// Ensure the New Task button is in view
		await page.locator('.btn-new').scrollIntoViewIfNeeded();
	});

	test('renders page title', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible();
	});

	test('renders all 5 columns', async ({ page }) => {
		const columns = page.locator('.column');
		await expect(columns).toHaveCount(5);
	});

	test('column headers are visible', async ({ page }) => {
		// Use column-title class to avoid collision with other text on mobile
		const titles = page.locator('.column-title');
		await expect(titles).toHaveCount(5);
		// Check each column dot is visible (the column is rendered)
		const dots = page.locator('.column-dot');
		await expect(dots).toHaveCount(5);
	});

	test('New Task button is visible', async ({ page }) => {
		await expect(page.locator('.btn-new')).toBeVisible();
	});

	test('clicking New Task shows form', async ({ page }) => {
		await page.locator('.btn-new').click();
		// Use waitForSelector with a longer timeout — Svelte reactive DOM update may be slightly delayed
		await page.waitForSelector('.new-task-form', { state: 'visible', timeout: 10000 });
		await expect(page.getByPlaceholder('Task title...')).toBeVisible();
	});

	test('clicking Cancel hides form', async ({ page }) => {
		await page.locator('.btn-new').click();
		await expect(page.locator('.new-task-form')).toBeVisible({ timeout: 5000 });

		// Click the same toggle button again (it shows "✕ Cancel" when form is open)
		await page.locator('.btn-new').click();
		await expect(page.locator('.new-task-form')).not.toBeVisible();
	});

	test('Create Task button is disabled when title is empty', async ({ page }) => {
		await page.locator('.btn-new').click();
		await page.waitForSelector('.new-task-form', { state: 'visible', timeout: 10000 });
		await expect(page.locator('.btn-create')).toBeDisabled();
	});

	test('Create Task button enables after entering a title', async ({ page }) => {
		await page.locator('.btn-new').click();
		await page.waitForSelector('.new-task-form', { state: 'visible', timeout: 10000 });
		await page.getByPlaceholder('Task title...').fill('Test task title');
		await expect(page.locator('.btn-create')).toBeEnabled();
	});
});
