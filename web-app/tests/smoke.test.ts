import { expect, test } from '@playwright/test';

test('index page has expected h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('VASpeak');
});

test('start lesson button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /start lesson/i })).toBeVisible();
});
