import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Meta App Review screencast recording
 *
 * Usage:
 *   npx playwright test --config=playwright.recording.config.ts
 *   npx playwright test --config=playwright.recording.config.ts --headed
 *   npx playwright test --config=playwright.recording.config.ts --headed --grep "Full Flow"
 */
export default defineConfig({
  testDir: './scripts',
  testMatch: '**/meta-app-review-recording.ts',
  fullyParallel: false, // Run tests sequentially for recording
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for recording
  workers: 1, // One worker for consistent recording
  reporter: [
    ['list'],
    ['html', { outputFolder: 'docs/meta-app-review/test-results' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Video recording settings for Meta app review
    video: 'on',
    launchOptions: {
      slowMo: 500, // Slow down for better visibility in recording
    },
  },
  // Video files will be saved here
  outputDir: './docs/meta-app-review/recordings',
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }, // 720p for screencast
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
