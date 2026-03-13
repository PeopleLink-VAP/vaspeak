/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * VASpeak Playwright Test Configuration
 * Dev server runs on port 19301 (beta) or 19300 (prod).
 * Tests target the local dev server on port 5173 (default vite dev port).
 */
export default defineConfig({
	testDir: './tests',
	testIgnore: ['**/unit/**'],
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
	timeout: 30_000,
	use: {
		baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		// Admin basic auth credentials (matches .env)
		httpCredentials: {
			username: 'admin',
			password: 'virtualassistantpro!vn'
		}
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'mobile-chrome',
			use: { ...devices['Pixel 5'] }
		}
	],
	webServer: {
		command: 'npx vite dev --port 5173 --config vite.config.ts',
		url: 'http://localhost:5173',
		reuseExistingServer: true,
		timeout: 60_000
	}
});
