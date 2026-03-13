import { test, expect } from '@playwright/test';

const TEST_EMAIL = `vocab-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123';
const TEST_NAME = 'Vocab User';

test.describe('Vocabulary Bank @smoke', () => {
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

	test('navigate to vocabulary page', async ({ page }) => {
		await page.goto('/vocabulary');
		await expect(page.getByRole('heading', { name: 'Vocabulary Bank' })).toBeVisible();
		// Empty state is rendered since they are a new user
		await expect(page.getByText('Ngân hàng từ vựng trống')).toBeVisible();
	});

	test('add a new vocabulary word', async ({ page }) => {
		await page.goto('/vocabulary');

		// Click add button
		await page.locator('button:has-text("Thêm từ mới")').click();
		
		// Fill out the modal
		await page.fill('input[name="word"]', 'Appreciate');
		await page.fill('input[name="definition"]', 'Đánh giá cao, trân trọng');
		await page.fill('textarea[name="context"]', 'I appreciate your help.');
		
		// Submit
		await page.locator('button:has-text("Lưu từ vựng")').click();

		// Modal should close and word should appear in the list
		await expect(page.locator('h3:has-text("Appreciate")')).toBeVisible();
		await expect(page.locator('p:has-text("Đánh giá cao, trân trọng")')).toBeVisible();
		await expect(page.locator('p:has-text("I appreciate your help.")')).toBeVisible();
	});

	test('toggle mastered state on a word', async ({ page }) => {
		await page.goto('/vocabulary');
		
		// Mark as mastered
		const checkButton = page.locator('button[title="Đánh dấu thành thạo"]');
		await expect(checkButton).toBeVisible();
		await checkButton.click();

		// Since there isn't an explicit loading spinner, we check the title has changed to "Đã thành thạo"
		// or wait for the check button color classes to swap
		const masteredButton = page.locator('button[title="Đã thành thạo"]');
		await expect(masteredButton).toBeVisible();
		await expect(page.getByText('1 đã thành thạo')).toBeVisible();

		// Unmark as mastered
		await masteredButton.click();
		await expect(page.locator('button[title="Đánh dấu thành thạo"]')).toBeVisible();
		await expect(page.getByText('0 đã thành thạo')).toBeVisible();
	});

	test('delete a word', async ({ page }) => {
		await page.goto('/vocabulary');
		
		await expect(page.locator('h3:has-text("Appreciate")')).toBeVisible();

		// Delete
		await page.locator('button:has-text("✕")').click();

		// Empty state should be visible again
		await expect(page.getByText('Ngân hàng từ vựng trống')).toBeVisible();
		await expect(page.locator('h3:has-text("Appreciate")')).not.toBeVisible();
	});

	test('unauthenticated /vocabulary redirects to /login', async ({ browser }) => {
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		await page.goto('/vocabulary');
		await expect(page).toHaveURL(/\/login/);
		await ctx.close();
	});
});
