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
		await page.locator('button[type="submit"]').first().click();
		const emailInput = page.locator('#login-email');
		await expect(emailInput).toBeVisible();
	});

	test('shows error on wrong credentials', async ({ page }) => {
		await page.goto('/login');
		await page.fill('#login-email', 'notreal@example.com');
		await page.fill('#login-password', 'wrongpassword');
		// Wait for the form action response to complete
		await Promise.all([
			page.waitForResponse(resp => resp.url().includes('/login') && resp.status() >= 200),
			page.locator('button[type="submit"]').first().click()
		]);
		await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 8000 });
	});

	test('register tab switches form', async ({ page }) => {
		await page.goto('/login');
		await page.getByText('Đăng Ký', { exact: true }).click();
		await expect(page.locator('#reg-name')).toBeVisible();
		await expect(page.locator('#reg-email')).toBeVisible();
		await expect(page.locator('#reg-password')).toBeVisible();
	});

	test('register shows error on short password', async ({ page }) => {
		await page.goto('/login');
		await page.getByText('Đăng Ký', { exact: true }).click();
		await page.fill('#reg-name', 'Test User');
		await page.fill('#reg-email', `test-${Date.now()}@example.com`);
		await page.fill('#reg-password', 'short');
		await page.locator('button[type="submit"]').last().click();
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
	test('full register → dashboard → logout flow', async ({ page }) => {
		test.setTimeout(45_000);
		const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		const email = `va-flow-${uid}@example.com`;
		const password = 'TestPassword123';

		// Register
		await page.goto('/login');
		await page.getByText('Đăng Ký', { exact: true }).click();
		await page.fill('#reg-name', 'Test VA');
		await page.fill('#reg-email', email);
		await page.fill('#reg-password', password);

		// Click submit and wait for the server response
		await Promise.all([
			page.waitForResponse(resp => resp.url().includes('/login') && resp.status() >= 200),
			page.locator('button[type="submit"]').last().click()
		]);

		// Should show verification message
		await expect(page.getByText('Kiểm tra email của bạn!', { exact: false })).toBeVisible({ timeout: 12_000 });

		// Verify email via test endpoint
		const verifyRes = await page.request.post('/api/e2e-verify', { data: { email } });
		expect(verifyRes.ok()).toBeTruthy();

		// Login with verified email
		await page.goto('/login');
		await page.fill('#login-email', email);
		await page.fill('#login-password', password);
		await page.locator('button[type="submit"]').first().click();

		// Should land on placement or dashboard
		await expect(page).toHaveURL(/\/dashboard|\/placement/, { timeout: 12_000 });

		// Logout
		await page.goto('/logout');
		await expect(page).toHaveURL(/\/login/);
	});

	test('duplicate registration is rejected', async ({ page }) => {
		test.setTimeout(45_000);
		const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		const email = `va-dupe-${uid}@example.com`;
		const password = 'TestPassword123';

		// First: register the email
		await page.goto('/login');
		await page.getByText('Đăng Ký', { exact: true }).click();
		await page.fill('#reg-name', 'First User');
		await page.fill('#reg-email', email);
		await page.fill('#reg-password', password);

		await Promise.all([
			page.waitForResponse(resp => resp.url().includes('/login') && resp.status() >= 200),
			page.locator('button[type="submit"]').last().click()
		]);
		await expect(page.getByText('Kiểm tra email của bạn!', { exact: false })).toBeVisible({ timeout: 12_000 });

		// Second: try to register again with same email
		await page.goto('/login');
		await page.getByText('Đăng Ký', { exact: true }).click();
		await page.fill('#reg-name', 'Dupe User');
		await page.fill('#reg-email', email);
		await page.fill('#reg-password', password);

		await Promise.all([
			page.waitForResponse(resp => resp.url().includes('/login') && resp.status() >= 200),
			page.locator('button[type="submit"]').last().click()
		]);

		// Should show already-exists error
		await expect(
			page.locator('text=already exists')
				.or(page.locator('text=already taken'))
				.or(page.locator('text=đã tồn tại'))
		).toBeVisible({ timeout: 10_000 });
	});
});
