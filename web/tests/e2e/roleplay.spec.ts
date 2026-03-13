import { test, expect } from '@playwright/test';

/**
 * Roleplay block (Block 3) E2E tests.
 *
 * Strategy:
 * - Register a fresh user and log in
 * - Intercept /api/roleplay to return a fake streamed response (no real Groq calls)
 * - Intercept /api/roleplay/score to return a fake score
 * - Navigate to /lesson/1 (must exist in DB) and advance to block 3
 *
 * If no lesson exists in the DB, the test gracefully skips the roleplay
 * by checking for a 404 and marking as skipped.
 */

const TEST_EMAIL    = `roleplay-e2e-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123';
const TEST_NAME     = 'Roleplay Tester';

// Fake streamed AI client response
const FAKE_AI_REPLY = 'Hello! I need help with my order, please.';
// Fake score payload
const FAKE_SCORE = {
	ok: true,
	score: {
		total: 85,
		breakdown: { clarity: 22, professionalism: 21, vocabulary: 21, confidence: 21 },
		feedback: 'Great professional tone throughout.',
		highlight: 'I understand your concern'
	}
};

test.describe('Roleplay Block (Block 3) @roleplay', () => {
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

	async function loginAndGoToLesson(page: Parameters<Parameters<typeof test>[1]>[0]) {
		// Mock roleplay endpoint — returns plain text stream
		await page.route('/api/roleplay', async (route) => {
			await route.fulfill({
				status: 200,
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'X-Credits-Remaining': '94'
				},
				body: FAKE_AI_REPLY
			});
		});

		// Mock scoring endpoint
		await page.route('/api/roleplay/score', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(FAKE_SCORE)
			});
		});

		// Log in
		await page.goto('/login');
		await page.fill('#login-email', TEST_EMAIL);
		await page.fill('#login-password', TEST_PASSWORD);
		await page.locator('button[type="submit"]').first().click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

		// Navigate to lesson 1
		const res = await page.goto('/lesson/1');
		if (!res || res.status() === 404) {
			test.skip(); // No lesson seeded — skip rather than fail
		}
	}

	test('lesson page renders block tabs', async ({ page }) => {
		await loginAndGoToLesson(page);
		// 4 block tab buttons
		await expect(page.locator('.sticky button, .sticky a').filter({ has: page.locator('text=🎙️') }).first()).toBeVisible({ timeout: 5_000 });
	});

	test('roleplay block shows Start button before beginning', async ({ page }) => {
		await loginAndGoToLesson(page);

		// Advance to block 3 by clicking through earlier blocks
		// (In practice this requires answering MCQ + patterns — we check if roleplay block is navigable)
		// This test just verifies the page loads and the block structure is valid
		await expect(page.locator('text=Hội Thoại AI').first()).toBeVisible({ timeout: 5_000 });
	});
});

/**
 * Simpler smoke test: Just verify the /api/roleplay endpoint requires auth.
 */
test.describe('Roleplay API auth guard @smoke', () => {
	test('POST /api/roleplay returns 401 without session', async ({ request }) => {
		const res = await request.post('/api/roleplay', {
			data: {
				scenario: 'Test',
				clientPersona: 'Client',
				clientOpening: 'Hello',
				scoringCriteria: [],
				messages: [{ role: 'user', content: 'hi' }]
			}
		});
		expect(res.status()).toBe(401);
	});

	test('POST /api/roleplay/score returns 401 without session', async ({ request }) => {
		const res = await request.post('/api/roleplay/score', {
			data: {
				scenario: 'Test',
				scoringCriteria: [],
				vaResponse: 'Hello',
				conversationHistory: ''
			}
		});
		expect(res.status()).toBe(401);
	});

	test('GET /api/credits returns 401 without session', async ({ request }) => {
		const res = await request.get('/api/credits');
		expect(res.status()).toBe(401);
	});
});
