import { test, expect, Page } from '@playwright/test';
import { authFixture } from './fixtures/auth';
import { SSEMockHelper } from './helpers/sse-mock.helper';
import { hideDevtools } from './helpers/devtools.helper';

/**
 * AI 챗봇 고급 기능 E2E 테스트
 *
 * 피드백 UI, 의도 기반 가이드 질문, 대화 요약, 글자수 제한 등
 * 신규 기능들의 통합 동작을 검증한다.
 *
 * 주의: 피드백 버튼 테스트(TC-1, TC-2, TC-3)는 ChatPanel에
 * ChatMessageFeedback 컴포넌트가 연결된 후 활성화된다.
 */

// 대시보드 API 모킹 헬퍼 (ai-chat.spec.ts 패턴 재사용)
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
      body: JSON.stringify({
        campaigns: [
          {
            id: 'test-campaign-1',
            name: '테스트 캠페인',
            status: 'ACTIVE',
            budget: 500000,
            spend: 300000,
            impressions: 25000,
            clicks: 750,
            conversions: 25,
            ctr: 3.0,
            roas: 3.5,
          },
        ],
      }),
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
      body: JSON.stringify({ connected: true, adAccountId: 'act_123456789' }),
    });
  });
}

// 피드백 API 모킹 헬퍼
async function mockFeedbackAPI(page: Page) {
  await page.route('**/api/ai/feedback', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'feedback-1', messageId: 'msg-1', rating: 'positive' }),
    });
  });
}

// 챗 패널을 열고 AI 응답을 받기까지의 공통 흐름
async function openPanelAndSendMessage(
  page: Page,
  message: string,
  responseChunks: Parameters<typeof SSEMockHelper.mockChatResponse>[1]
) {
  const triggerButton = page.getByTestId('chat-trigger-button');
  await triggerButton.click();
  await expect(page.getByTestId('chat-panel')).toBeVisible();

  await SSEMockHelper.mockChatResponse(page, responseChunks);

  const chatInput = page.getByTestId('chat-input');
  await chatInput.fill(message);
  await page.getByTestId('chat-send-button').click();
}

test.describe('AI 챗봇 고급 기능 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardAPIs(page);
    await authFixture.loginAsUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // DevTools 오버레이가 chat-trigger-button 클릭을 가로채는 문제 방지
    await hideDevtools(page);
  });

  // =========================================================================
  // TC-1: 피드백 버튼 표시
  // =========================================================================
  test('TC-1: AI 응답 후 👍/👎 피드백 버튼이 표시되어야 한다', async ({ page }) => {
    await mockFeedbackAPI(page);

    await openPanelAndSendMessage(
      page,
      '광고 성과 분석해줘',
      SSEMockHelper.textResponse('현재 ROAS는 3.5로 양호합니다.')
    );

    // AI 어시스턴트 메시지가 표시될 때까지 대기
    const messages = page.getByTestId('chat-message');
    await expect(messages).toHaveCount(2);

    // 마지막 어시스턴트 메시지 영역에서 피드백 버튼 확인
    const positiveBtn = page.getByTestId('feedback-positive').first();
    const negativeBtn = page.getByTestId('feedback-negative').first();

    await expect(positiveBtn).toBeVisible();
    await expect(negativeBtn).toBeVisible();
  });

  // =========================================================================
  // TC-2: 긍정 피드백 제출 → 버튼 비활성화
  // =========================================================================
  test('TC-2: 👍 클릭 시 피드백 API가 호출되고 버튼이 비활성화되어야 한다', async ({ page }) => {
    await mockFeedbackAPI(page);

    // 피드백 API 호출 감지용 요청 추적
    const feedbackRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/ai/feedback')) {
        feedbackRequests.push(req.url());
      }
    });

    await openPanelAndSendMessage(
      page,
      '캠페인 효율 분석',
      SSEMockHelper.textResponse('캠페인 효율을 분석했습니다.')
    );

    const messages = page.getByTestId('chat-message');
    await expect(messages).toHaveCount(2);

    // 👍 버튼 클릭
    const positiveBtn = page.getByTestId('feedback-positive').first();
    await expect(positiveBtn).toBeVisible();
    await positiveBtn.click();

    // 제출 후 버튼이 비활성화되어야 함
    await expect(positiveBtn).toBeDisabled();

    // 피드백 API가 호출되었는지 확인
    expect(feedbackRequests.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // TC-3: 부정 피드백 + 코멘트 제출
  // =========================================================================
  test('TC-3: 👎 클릭 시 코멘트 입력 폼이 표시되고 제출이 가능해야 한다', async ({ page }) => {
    await mockFeedbackAPI(page);

    await openPanelAndSendMessage(
      page,
      '예산 최적화 방법은?',
      SSEMockHelper.textResponse('예산 최적화를 위해 다음을 권장합니다.')
    );

    const messages = page.getByTestId('chat-message');
    await expect(messages).toHaveCount(2);

    // 👎 버튼 클릭
    const negativeBtn = page.getByTestId('feedback-negative').first();
    await expect(negativeBtn).toBeVisible();
    await negativeBtn.click();

    // 코멘트 입력 폼이 표시되어야 함
    const commentTextarea = page.getByTestId('feedback-comment');
    await expect(commentTextarea).toBeVisible();

    // 코멘트 입력 후 제출
    await commentTextarea.fill('답변이 너무 일반적이에요.');
    await commentTextarea.press('Enter');

    // 폼 제출 버튼 클릭 (Enter가 동작 안 할 경우 대비)
    const submitBtn = page.locator('[data-testid="feedback-comment"]').locator('..').locator('button[type="submit"]');
    if (await submitBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await submitBtn.click();
    }

    // 제출 후 코멘트 폼이 사라져야 함
    await expect(commentTextarea).not.toBeVisible();
  });

  // =========================================================================
  // TC-4: 1500자 메시지 정상 전송
  // =========================================================================
  test('TC-4: 1500자 메시지 입력 시 정상적으로 전송되어야 한다', async ({ page }) => {
    const triggerButton = page.getByTestId('chat-trigger-button');
    await triggerButton.click();
    await expect(page.getByTestId('chat-panel')).toBeVisible();

    await SSEMockHelper.mockChatResponse(
      page,
      SSEMockHelper.textResponse('긴 메시지를 받았습니다.')
    );

    // 정확히 1500자 메시지 생성
    const longMessage = 'A'.repeat(1500);
    const chatInput = page.getByTestId('chat-input');
    await chatInput.fill(longMessage);

    // 글자 수 카운터가 1500/2000으로 표시되어야 함
    await expect(page.locator('#chat-input-counter')).toContainText('1500/2000');

    // 전송 버튼이 활성화되어 있어야 함
    const sendButton = page.getByTestId('chat-send-button');
    await expect(sendButton).toBeEnabled();

    // 전송
    await sendButton.click();

    // 사용자 메시지가 전송되었는지 확인
    const messages = page.getByTestId('chat-message');
    await expect(messages.first()).toBeVisible();
  });

  // =========================================================================
  // TC-5: 2001자 입력 시 전송 버튼 비활성화 + 경고 메시지
  // =========================================================================
  test('TC-5: 2001자 입력 시 전송 버튼이 비활성화되고 경고 메시지가 표시되어야 한다', async ({ page }) => {
    const triggerButton = page.getByTestId('chat-trigger-button');
    await triggerButton.click();
    await expect(page.getByTestId('chat-panel')).toBeVisible();

    // 2001자 메시지 생성 (MAX_LENGTH=2000 초과)
    const overLimitMessage = 'B'.repeat(2001);
    const chatInput = page.getByTestId('chat-input');
    await chatInput.fill(overLimitMessage);

    // 글자 수 카운터가 2001/2000으로 표시되어야 함
    await expect(page.locator('#chat-input-counter')).toContainText('2001/2000');

    // 전송 버튼이 비활성화되어야 함
    const sendButton = page.getByTestId('chat-send-button');
    await expect(sendButton).toBeDisabled();

    // 경고 메시지가 표시되어야 함
    const errorAlert = page.locator('#chat-input-error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('2000자를 초과할 수 없습니다');
  });

  // =========================================================================
  // TC-6: 3턴 대화 후 추천 질문 표시
  // =========================================================================
  test('TC-6: 3턴 대화 후 마지막 AI 응답의 추천 질문이 표시되어야 한다', async ({ page }) => {
    const triggerButton = page.getByTestId('chat-trigger-button');
    await triggerButton.click();
    await expect(page.getByTestId('chat-panel')).toBeVisible();

    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('chat-send-button');

    // 1턴: 일반 텍스트 응답
    await SSEMockHelper.mockChatResponse(page, SSEMockHelper.textResponse('첫 번째 응답입니다.'));
    await chatInput.fill('첫 번째 질문');
    await sendButton.click();
    await expect(page.getByTestId('chat-message')).toHaveCount(2);

    // 2턴: 일반 텍스트 응답
    await SSEMockHelper.remockChatResponse(page, SSEMockHelper.textResponse('두 번째 응답입니다.'));
    await chatInput.fill('두 번째 질문');
    await sendButton.click();
    await expect(page.getByTestId('chat-message')).toHaveCount(4);

    // 3턴: 추천 질문 포함 응답
    const chunksWithSuggestions = [
      { type: 'text', content: '세 번째 응답입니다.' },
      {
        type: 'suggested_questions',
        questions: ['예산을 어떻게 최적화할까요?', '성과가 좋은 캠페인은?'],
      },
      { type: 'done' },
    ];
    await SSEMockHelper.remockChatResponse(page, chunksWithSuggestions);
    await chatInput.fill('세 번째 질문');
    await sendButton.click();
    await expect(page.getByTestId('chat-message')).toHaveCount(6);

    // 추천 질문 섹션이 표시되어야 함
    const suggestedQuestions = page.getByTestId('suggested-questions');
    await expect(suggestedQuestions).toBeVisible();

    // 추천 질문 버튼들이 표시되어야 함
    const questionButtons = page.getByTestId('suggested-question-button');
    await expect(questionButtons.first()).toBeVisible();
    await expect(questionButtons.first()).toContainText('예산을 어떻게 최적화할까요?');
  });

  // =========================================================================
  // TC-7: 패널 닫기/열기 후 대화 내용 유지
  // =========================================================================
  test('TC-7: 패널을 닫았다가 다시 열어도 이전 대화 내용이 유지되어야 한다', async ({ page }) => {
    // 대화 시작
    await openPanelAndSendMessage(
      page,
      '광고 예산 최적화 조언 부탁해',
      SSEMockHelper.textResponse('예산 최적화를 위해 ROAS 기준으로 재배분을 권장합니다.')
    );

    const messages = page.getByTestId('chat-message');
    await expect(messages).toHaveCount(2);

    // 어시스턴트 메시지 내용 저장
    const assistantBubble = messages.last().getByTestId('chat-message-bubble');
    await expect(assistantBubble).toContainText('ROAS 기준');

    // 패널 닫기 (ChatHeader의 닫기 버튼)
    const chatPanel = page.getByTestId('chat-panel');
    const closeButton = chatPanel.locator('button[aria-label*="close"], button[aria-label*="닫기"]').first();

    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
    } else {
      // aria-label이 없는 경우 X 아이콘 버튼 탐색
      const headerCloseBtn = chatPanel.locator('header button, [data-testid="chat-header"] button').last();
      await headerCloseBtn.click();
    }

    // 패널이 닫혔는지 확인
    await expect(chatPanel).not.toBeVisible();

    // 패널 다시 열기
    const triggerButton = page.getByTestId('chat-trigger-button');
    await triggerButton.click();
    await expect(chatPanel).toBeVisible();

    // 이전 대화 내용이 유지되어야 함 (메시지 2개)
    const restoredMessages = page.getByTestId('chat-message');
    await expect(restoredMessages).toHaveCount(2);

    // 어시스턴트 메시지 내용도 유지되어야 함
    const restoredAssistantBubble = restoredMessages.last().getByTestId('chat-message-bubble');
    await expect(restoredAssistantBubble).toContainText('ROAS 기준');
  });
});
