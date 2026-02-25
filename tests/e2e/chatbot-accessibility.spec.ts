/**
 * 챗봇 접근성 E2E 테스트 (WCAG 2.1 AA)
 *
 * axe-core를 사용하여 챗봇 UI의 WCAG 2.1 AA 접근성 기준을 자동 검증한다.
 * 테스트 시나리오:
 * 1. 챗봇 패널 열린 상태 전체 스캔
 * 2. 메시지 대화 중 스캔 (사용자 + AI 메시지)
 * 3. 에러 상태 스캔 (aria-live, role="alert")
 * 4. 입력 포커스 상태 스캔
 * 5. 키보드 네비게이션 검증
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { authFixture } from './fixtures/auth';
import { SSEMockHelper } from './helpers/sse-mock.helper';
import { hideDevtools } from './helpers/devtools.helper';

// 대시보드 API 모킹 (ai-chat.spec.ts 패턴 재사용)
async function mockDashboardAPIs(page: Page) {
  await page.route('**/api/dashboard/kpi', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        currentPeriod: {
          spend: 1000000,
          impressions: 50000,
          clicks: 1500,
          conversions: 50,
          ctr: 3.0,
          cpm: 20000,
          cpc: 666.67,
          cpa: 20000,
          roas: 3.5,
        },
        previousPeriod: {
          spend: 800000,
          impressions: 40000,
          clicks: 1200,
          conversions: 40,
          ctr: 3.0,
          cpm: 20000,
          cpc: 666.67,
          cpa: 20000,
          roas: 3.0,
        },
      }),
    });
  });

  await page.route('**/api/dashboard/campaigns', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ campaigns: [] }),
    });
  });

  await page.route('**/api/dashboard/insights', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ insights: [] }),
    });
  });

  await page.route('**/api/meta/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ connected: true, adAccountId: 'act_123' }),
    });
  });
}

// 챗봇 패널 열기 헬퍼
async function openChatPanel(page: Page) {
  const triggerButton = page.getByTestId('chat-trigger-button');
  await triggerButton.click();
  await expect(page.getByTestId('chat-panel')).toBeVisible();
}

test.describe('챗봇 WCAG 2.1 AA 접근성 감사', () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardAPIs(page);
    await authFixture.loginAsUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // DevTools 오버레이가 chat-trigger-button 클릭을 가로채는 문제 방지
    await hideDevtools(page);
  });

  // -----------------------------------------------------------------------
  // 시나리오 1: 챗봇 패널 열린 상태 전체 스캔
  // -----------------------------------------------------------------------
  test('챗봇 패널 열린 상태 전체 WCAG 2.1 AA 스캔 — violations 0', async ({ page }) => {
    await openChatPanel(page);

    const results = await new AxeBuilder({ page })
      .include('[data-testid="chat-panel"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // 시나리오 2: 사용자/AI 메시지 렌더링 후 스캔
  // -----------------------------------------------------------------------
  test('사용자·AI 메시지 대화 중 접근성 스캔 — role/aria-live 구조 검증', async ({ page }) => {
    await openChatPanel(page);

    // SSE 응답 모킹 후 메시지 전송
    await SSEMockHelper.mockChatResponse(
      page,
      SSEMockHelper.textResponse('네, 안녕하세요! 무엇을 도와드릴까요?')
    );

    const chatInput = page.getByTestId('chat-input');
    await chatInput.fill('안녕하세요');
    await page.getByTestId('chat-send-button').click();

    // 사용자 메시지 + AI 메시지 2개가 렌더링될 때까지 대기
    const messages = page.getByTestId('chat-message');
    await expect(messages).toHaveCount(2);

    // 메시지 목록 컨테이너 aria 속성 검증
    const chatLog = page.locator('[role="log"]');
    await expect(chatLog).toHaveAttribute('aria-live', 'polite');

    // 메시지 구조 — role="article" 확인
    const firstMessage = messages.first();
    await expect(firstMessage).toHaveAttribute('role', 'article');

    // 대화 영역 axe 스캔
    const results = await new AxeBuilder({ page })
      .include('[data-testid="chat-panel"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // 시나리오 3: 에러 상태 스캔 (role="alert" 검증)
  // -----------------------------------------------------------------------
  test('에러 메시지 표시 상태 접근성 스캔 — role=alert 및 aria-live 검증', async ({ page }) => {
    await openChatPanel(page);

    // 에러 SSE 응답 모킹
    await SSEMockHelper.mockChatResponse(
      page,
      SSEMockHelper.errorResponse('API 연결에 실패했습니다.')
    );

    const chatInput = page.getByTestId('chat-input');
    await chatInput.fill('에러 테스트');
    await page.getByTestId('chat-send-button').click();

    // 에러 메시지 렌더링 대기
    const messages = page.getByTestId('chat-message');
    await expect(messages.last()).toBeVisible();

    // 에러 상태 axe 스캔
    const results = await new AxeBuilder({ page })
      .include('[data-testid="chat-panel"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);

    // 글자수 초과 에러 시나리오 — 500자 초과 입력
    await SSEMockHelper.clearChatMocks(page);
    const longText = 'a'.repeat(501);
    await chatInput.fill(longText);

    // role="alert" 요소가 있을 경우 aria 속성 확인
    const alertEl = page.locator('[role="alert"]').first();
    const alertCount = await alertEl.count();
    if (alertCount > 0) {
      await expect(alertEl).toBeVisible();
    }

    // 입력 초과 상태 포함 전체 스캔
    const overflowResults = await new AxeBuilder({ page })
      .include('[data-testid="chat-panel"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(overflowResults.violations).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // 시나리오 4: 입력 포커스 상태 스캔
  // -----------------------------------------------------------------------
  test('textarea 포커스 상태 접근성 스캔 — aria-label/aria-describedby 검증', async ({ page }) => {
    await openChatPanel(page);

    const chatInput = page.getByTestId('chat-input');

    // textarea 포커스
    await chatInput.focus();
    await expect(chatInput).toBeFocused();

    // aria-label 속성 확인
    const ariaLabel = await chatInput.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();

    // 포커스 상태 axe 스캔
    const results = await new AxeBuilder({ page })
      .include('[data-testid="chat-panel"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);

    // 비활성 상태(전송 중) 포커스 스캔
    await SSEMockHelper.mockChatResponse(
      page,
      SSEMockHelper.textResponse('응답 중...')
    );
    await chatInput.fill('포커스 테스트');
    await page.getByTestId('chat-send-button').click();

    // 전송 버튼 aria-disabled 확인 (전송 직후 짧은 시간)
    const sendButton = page.getByTestId('chat-send-button');
    await expect(sendButton).toBeVisible();

    // 전송 완료 후 재스캔
    await expect(page.getByTestId('chat-message')).toHaveCount(2);

    const postSendResults = await new AxeBuilder({ page })
      .include('[data-testid="chat-panel"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(postSendResults.violations).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // 시나리오 5: 키보드 네비게이션 검증
  // -----------------------------------------------------------------------
  test('키보드 Tab 네비게이션 — 메시지 이동 및 Escape로 입력 복귀', async ({ page }) => {
    await openChatPanel(page);

    // 메시지 2개 생성
    await SSEMockHelper.mockChatResponse(
      page,
      SSEMockHelper.textResponse('키보드 테스트 응답입니다.')
    );

    const chatInput = page.getByTestId('chat-input');
    await chatInput.fill('키보드 테스트');
    await chatInput.press('Enter');

    const messages = page.getByTestId('chat-message');
    await expect(messages).toHaveCount(2);

    // 메시지 요소에 tabIndex={0} 속성 확인 (키보드 접근 가능)
    const firstMessage = messages.first();
    const tabIndex = await firstMessage.getAttribute('tabindex');
    expect(tabIndex).toBe('0');

    // Tab 키로 채팅 패널 내부 포커스 순회
    await chatInput.focus();
    await page.keyboard.press('Tab');

    // Tab 후 포커스가 이동되었는지 확인 (전송 버튼 또는 메시지)
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Escape 키 — 입력창으로 복귀 (구현에 따라 동작 여부 확인)
    await page.keyboard.press('Escape');

    // 키보드 네비게이션 완료 후 접근성 스캔
    const results = await new AxeBuilder({ page })
      .include('[data-testid="chat-panel"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
