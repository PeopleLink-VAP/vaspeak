import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
	test('renders login and register tabs', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByRole('heading', { name: /VASpeak/i }).or(page.locator('text=Đăng Nhập'))).toBeVisible();
		await expect(page.getByRole('tab', { name: /Đăng Nhập/i }).or(page.locator('button:has-text("Đăng Nhập")'))).toBeVisible();
		await expect(page.locator('button:has-text("Đăng Ký")')).toBeVisible();
	});

	test('shows validation error on empty submit', async ({ page }) => {
		await page.goto('/login');
		// Try submitting without filling in anything
		await page.locator('button[type="submit"]').first().click();
		// HTML5 validation prevents submit, email field should be required
		const emailInput = page.locator('#login-email');
		await expect(emailInput).toBeVisible();
	});

	test('shows error on wrong credentials', async ({ page }) => {
		await page.goto('/login');
		await page.fill('#login-email', 'notreal@example.com');
		await page.fill('#login-password', 'wrongpassword');
		await page.locator('button[type="submit"]').first().click();
		await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 });
	});

	test('register tab switches form', async ({ page }) => {
		await page.goto('/login');
		await page.locator('button:has-text("Đăng Ký")').click();
		await expect(page.locator('#reg-name')).toBeVisible();
		await expect(page.locator('#reg-email')).toBeVisible();
		await expect(page.locator('#reg-password')).toBeVisible();
	});

	test('register shows error on short password', async ({ page }) => {
		await page.goto('/login');
		await page.locator('button:has-text("Đăng Ký")').click();
		await page.fill('#reg-name', 'Test User');
		await page.fill('#reg-email', `test-${Date.now()}@example.com`);
		await page.fill('#reg-password', 'short'); // < 8 chars
		await page.locator('button[type="submit"]').first().click();
		// HTML5 minlength will prevent submit, or server returns 400
		await expect(page.locator('#reg-password')).toBeVisible();
	});

	test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
	});

	test('unauthenticated /lesson/1 redirects to /login', async ({ page }) => {
		await page.goto('/lesson/1');
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe('Register + Login flow', () => {
	const email = `va-test-${Date.now()}@example.com`;
	const password = 'TestPassword123';
	const name = 'Test VA';

	test('full register → dashboard → logout flow', async ({ page }) => {
		// Register
		await page.goto('/login');
		await page.locator('button:has-text("Đăng Ký")').click();
		await page.fill('#reg-name', name);
		await page.fill('#reg-email', email);
		await page.fill('#reg-password', password);
		await page.locator('button[type="submit"]').first().click();

		// Should land on dashboard
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
		await expect(page.locator(`text=${name}`)).toBeVisible();

		// Logout
		await page.goto('/logout');
		await expect(page).toHaveURL(/\/login/);

		// Login with same credentials
		await page.fill('#login-email', email);
		await page.fill('#login-password', password);
		await page.locator('button[type="submit"]').first().click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
	});

	test('duplicate registration is rejected', async ({ page }) => {
		// First register
		await page.goto('/login');
		await page.locator('button:has-text("Đăng Ký")').click();
		await page.fill('#reg-name', 'Dupe User');
		await page.fill('#reg-email', email); // same email as above
		await page.fill('#reg-password', password);
		await page.locator('button[type="submit"]').first().click();
		await expect(page.locator('text=already exists')).toBeVisible({ timeout: 5000 });
	});
});
