import { test, expect } from '@playwright/test';

const TEST_EMAIL = `profile-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123';
const TEST_NAME = 'Profile User';

test.describe('Profile Page @smoke', () => {
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

	test('navigate to profile page', async ({ page }) => {
		await page.goto('/profile');
		await expect(page.getByRole('heading', { name: 'Hồ Sơ Của Tôi' })).toBeVisible();
		// Header card shows name and email
		await expect(page.locator('h2', { hasText: TEST_NAME })).toBeVisible();
		await expect(page.getByText(TEST_EMAIL)).toBeVisible();
	});

	test('update user profile niche and display name', async ({ page }) => {
		await page.goto('/profile');

		const newName = 'Updated Profile Name';

		// Change name and dropdown
		await page.fill('input[name="displayName"]', newName);
		await page.selectOption('select[name="niche"]', 'ecommerce');
		
		await page.locator('button:has-text("Lưu Thay Đổi")').click();

		// Check for success banner
		await expect(page.getByText('Cập nhật hồ sơ thành công!')).toBeVisible();
		await expect(page.locator('h2', { hasText: newName })).toBeVisible();

		// Refresh and verify changes are persisted
		await page.reload();
		await expect(page.locator('h2', { hasText: newName })).toBeVisible();
		await expect(page.locator('select[name="niche"]')).toHaveValue('ecommerce');
	});

	test('logout button redirects and clears session', async ({ page }) => {
		await page.goto('/profile');
		await page.locator('button:has-text("Đăng Xuất Khỏi Thiết Bị")').click();
		await expect(page).toHaveURL(/.*\/$/); // Homepage landing
		
		// Attempting to visit /dashboard should bounce to /login
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
	});

	test('unauthenticated /profile redirects to /login', async ({ browser }) => {
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		await page.goto('/profile');
		await expect(page).toHaveURL(/\/login/);
		await ctx.close();
	});
});
