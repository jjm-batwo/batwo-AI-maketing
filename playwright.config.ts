import { defineConfig, devices } from '@playwright/test'

/**
 * TEST-07: 테스트용 Playwright 설정
 *
 * 빠른 테스트 실행에 최적화 (slowMo, video 제거)
 * 녹화가 필요한 경우: npx playwright test --config playwright.config.recording.ts
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // slowMo/video는 playwright.config.recording.ts로 분리됨
  },
  outputDir: './test-results',
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 기본적으로 storage state 사용 - 인증 테스트를 위해
        storageState: './tests/e2e/storage-state.json',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
