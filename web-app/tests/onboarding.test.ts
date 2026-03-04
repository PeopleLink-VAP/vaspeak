import { expect, test } from '@playwright/test';

// ─── Screen 1: Welcome ─────────────────────────────────────────────────────

test.describe('Onboarding — Welcome Screen', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/onboarding');
    });

    test('renders welcome heading', async ({ page }) => {
        const heading = page.locator('#welcome-heading');
        await expect(heading).toBeVisible();
        await expect(heading).toHaveText('VASpeak');
    });

    test('has Get Started button', async ({ page }) => {
        const btn = page.locator('#get-started-btn');
        await expect(btn).toBeVisible();
        await expect(btn).toContainText('Get Started');
    });

    test('has login link', async ({ page }) => {
        const link = page.locator('#login-link');
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', '/login');
    });

    test('has 5 pagination dots', async ({ page }) => {
        const dots = page.locator('.onboarding-dots > div');
        await expect(dots).toHaveCount(5);
    });

    test('Get Started navigates to level selection', async ({ page }) => {
        await page.locator('#get-started-btn').click();
        await page.waitForURL('/onboarding/level');
        await expect(page.locator('#level-heading')).toBeVisible();
    });
});

// ─── Screen 2: Level Selection ──────────────────────────────────────────────

test.describe('Onboarding — Level Selection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/onboarding/level');
    });

    test('renders level heading', async ({ page }) => {
        await expect(page.locator('#level-heading')).toHaveText("What's your English level?");
    });

    test('displays 4 level cards', async ({ page }) => {
        await expect(page.locator('.selection-card')).toHaveCount(4);
    });

    test('can select a level', async ({ page }) => {
        const workingCard = page.locator('#level-working');
        await workingCard.click();
        await expect(workingCard).toHaveAttribute('aria-pressed', 'true');
    });

    test('continue button is disabled without selection', async ({ page }) => {
        // Clear any prior session state
        await page.evaluate(() => sessionStorage.clear());
        await page.reload();
        const btn = page.locator('#continue-btn');
        await expect(btn).toBeDisabled();
    });

    test('back button navigates to welcome', async ({ page }) => {
        await page.locator('#back-btn').click();
        await page.waitForURL('/onboarding');
    });

    test('skip navigates to goal', async ({ page }) => {
        await page.locator('#skip-btn').click();
        await page.waitForURL('/onboarding/goal');
    });

    test('selecting a level and continuing navigates to goal', async ({ page }) => {
        await page.locator('#level-client').click();
        await page.locator('#continue-btn').click();
        await page.waitForURL('/onboarding/goal');
    });
});

// ─── Screen 3: Daily Goal ───────────────────────────────────────────────────

test.describe('Onboarding — Daily Goal', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/onboarding/goal');
    });

    test('renders goal heading', async ({ page }) => {
        await expect(page.locator('#goal-heading')).toHaveText('Set your daily goal');
    });

    test('displays 3 goal cards', async ({ page }) => {
        await expect(page.locator('.goal-card')).toHaveCount(3);
    });

    test('can select a goal', async ({ page }) => {
        const goal30 = page.locator('#goal-30');
        await goal30.click();
        await expect(goal30).toHaveAttribute('aria-pressed', 'true');
    });

    test('reminder toggle works', async ({ page }) => {
        const toggle = page.locator('#reminder-toggle');
        await expect(toggle).toBeVisible();
        // Toggle it
        const initial = await toggle.getAttribute('aria-checked');
        await toggle.click();
        const updated = await toggle.getAttribute('aria-checked');
        expect(initial).not.toBe(updated);
    });

    test('continue navigates to how-it-works', async ({ page }) => {
        await page.locator('#continue-btn').click();
        await page.waitForURL('/onboarding/how-it-works');
    });
});

// ─── Screen 4: How It Works ─────────────────────────────────────────────────

test.describe('Onboarding — How It Works', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/onboarding/how-it-works');
    });

    test('renders how-it-works heading', async ({ page }) => {
        await expect(page.locator('#how-heading')).toHaveText('How your daily lesson works');
    });

    test('displays 4 timeline steps', async ({ page }) => {
        await expect(page.locator('.timeline-dot')).toHaveCount(4);
    });

    test('displays 4 timeline cards', async ({ page }) => {
        await expect(page.locator('.timeline-card')).toHaveCount(4);
    });

    test('continue navigates to signup', async ({ page }) => {
        await page.locator('#continue-btn').click();
        await page.waitForURL('/onboarding/signup');
    });
});

// ─── Screen 5: Account Creation ─────────────────────────────────────────────

test.describe('Onboarding — Account Creation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/onboarding/signup');
    });

    test('renders signup heading', async ({ page }) => {
        await expect(page.locator('#signup-heading')).toContainText("You're all set!");
    });

    test('displays preference summary card', async ({ page }) => {
        await expect(page.locator('#summary-card')).toBeVisible();
    });

    test('has email and password inputs', async ({ page }) => {
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
    });

    test('has create account button', async ({ page }) => {
        await expect(page.locator('#create-account-btn')).toBeVisible();
        await expect(page.locator('#create-account-btn')).toContainText('Create Account');
    });

    test('has magic link button', async ({ page }) => {
        await expect(page.locator('#magic-link-btn')).toBeVisible();
        await expect(page.locator('#magic-link-btn')).toContainText('Magic Link');
    });

    test('all 5 dots are active', async ({ page }) => {
        const activeDots = page.locator('.onboarding-dot-active');
        await expect(activeDots).toHaveCount(5);
    });
});

// ─── Full Flow ──────────────────────────────────────────────────────────────

test.describe('Onboarding — Full Flow', () => {
    test('can navigate through the entire onboarding', async ({ page }) => {
        // Start at welcome
        await page.goto('/onboarding');
        await expect(page.locator('#welcome-heading')).toBeVisible();

        // Go to level
        await page.locator('#get-started-btn').click();
        await page.waitForURL('/onboarding/level');

        // Select a level
        await page.locator('#level-working').click();
        await page.locator('#continue-btn').click();
        await page.waitForURL('/onboarding/goal');

        // Select goal
        await page.locator('#goal-15').click();
        await page.locator('#continue-btn').click();
        await page.waitForURL('/onboarding/how-it-works');

        // View how it works
        await expect(page.locator('.timeline-dot')).toHaveCount(4);
        await page.locator('#continue-btn').click();
        await page.waitForURL('/onboarding/signup');

        // Verify summary card shows selections
        const summary = page.locator('#summary-card');
        await expect(summary).toContainText('Working VA');
        await expect(summary).toContainText('15 min/day');
    });
});
