import { expect, test } from '@playwright/test';

test('index page has hero heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('#hero-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Speak English with confidence');
});

test('hero CTA links to onboarding', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#hero-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/onboarding');
});

test('newsletter subscribe form is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#newsletter-email')).toBeVisible();
    await expect(page.locator('#newsletter-submit')).toBeVisible();
});

test('final CTA links to onboarding', async ({ page }) => {
    await page.goto('/');
    const finalCta = page.locator('#final-cta');
    await expect(finalCta).toBeVisible();
    await expect(finalCta).toHaveAttribute('href', '/onboarding');
});
