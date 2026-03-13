import { test, expect } from '@playwright/test';

test.describe('Placement Test Flow', () => {
    const email = `placement-test-${Date.now()}@example.com`;
    const password = 'TestPassword123';

    test('new user goes through placement after login', async ({ page }) => {
        // Register a new user
        test.setTimeout(60000);
        await page.goto('/login');
        await page.getByText('Đăng Ký', { exact: true }).click();
        await page.fill('#reg-name', 'Placement Tester');
        await page.fill('#reg-email', email);
        await page.fill('#reg-password', password);
        await page.locator('button[type="submit"]').last().click();

        await expect(page.getByText('Kiểm tra email của bạn!', { exact: false })).toBeVisible({ timeout: 8000 });

        // Verify email using test API
        await page.request.post('/api/e2e-verify', { data: { email } });

        // Login
        await page.goto('/login');
        await page.fill('#login-email', email);
        await page.fill('#login-password', password);
        await page.locator('button[type="submit"]').first().click();

        // Wait for login to finish explicitly
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });

        // Go directly to placement page
        await page.goto('/placement');

        // Wait for JS Hydration so Svelte $state is ready before Playwright speed-runs the clicks
        await page.waitForTimeout(1000);

        // Step 1: Experience
        await expect(page.getByRole('heading', { name: /Bạn đã từng làm/i })).toBeVisible();
        await page.getByText('Chưa (Beginner)').click();
        await expect(page.getByRole('button', { name: 'Tiếp tục →' })).toBeEnabled();
        await page.getByRole('button', { name: 'Tiếp tục →' }).click();

        // Step 2: Speaking
        await expect(page.getByText('Bồi Ngoại Ngữ', { exact: false })).toBeVisible();
        await page.getByText('Bồi Ngoại Ngữ (Cơ bản)').click();
        await expect(page.getByRole('button', { name: 'Tiếp tục →' })).toBeEnabled();
        await page.getByRole('button', { name: 'Tiếp tục →' }).click();

        // Step 3: Niche
        await expect(page.getByText('Mục tiêu công việc', { exact: false })).toBeVisible();
        await page.locator('select[name="niche"]').selectOption('customer_support');
        await page.getByRole('button', { name: 'Bắt đầu ngay' }).click();

        // Should be on dashboard
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    });
});
