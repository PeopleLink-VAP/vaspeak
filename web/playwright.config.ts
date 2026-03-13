/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

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
	reporter: [
		['html', { outputFolder: 'playwright-report', open: 'never' }],
		['json', { outputFile: 'test-results/results.json' }],
		['list']
	],
	timeout: 30_000,
	use: {
		baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		// Admin basic auth credentials (must match ADMIN_AUTH_USER/PASSWORD in .env)
		httpCredentials: {
			username: process.env.ADMIN_AUTH_USER ?? 'admin',
			password: process.env.ADMIN_AUTH_PASSWORD ?? ''
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
		},
		// ── Recording project ── used by run-e2e-record.sh ─────────────────────
		// Low-quality 800×450 webm to keep file sizes small for the admin viewer.
		{
			name: 'record',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1024, height: 640 },
				video: {
					mode: 'on',
					size: { width: 800, height: 450 }
				},
				screenshot: 'on'
			}
		}
	],
	webServer: {
		command: 'npx vite dev --port 5173 --config vite.config.ts',
		url: 'http://localhost:5173',
		reuseExistingServer: true,
		timeout: 60_000
	}
});
