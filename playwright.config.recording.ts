/**
 * TEST-07: Playwright 녹화용 설정
 *
 * 데모 녹화 시 사용: npx playwright test --config playwright.config.recording.ts
 * - slowMo: 500ms (사람이 볼 수 있는 속도)
 * - video: on (모든 테스트 녹화)
 * - outputDir: 녹화 전용 디렉토리
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // 녹화 시 직렬 실행으로 안정적인 영상
  forbidOnly: !!process.env.CI,
  retries: 0, // 녹화 시 재시도 불필요
  workers: 1, // 녹화 시 단일 워커
  reporter: 'html',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    launchOptions: {
      slowMo: 500, // 녹화용 딜레이
    },
  },
  outputDir: './docs/meta-app-review/recordings',
  projects: [
    {
      name: 'chromium-recording',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/e2e/storage-state.json',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
})
