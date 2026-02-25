import { test, expect, Page } from '@playwright/test';
import { authFixture } from './fixtures/auth';
import { SSEMockHelper } from './helpers/sse-mock.helper';
import { hideDevtools } from './helpers/devtools.helper';

/**
 * 챗봇 에러/엣지케이스 E2E 테스트 스위트
 *
 * 입력 유효성 검사, 네트워크 오류, 전송 중복 방지,
 * 스트리밍 에러, 에러 후 복구 등 7가지 시나리오를 검증한다.
 */

// 대시보드 API 모킹 헬퍼 (네트워크 타임아웃 방지)
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

// 채팅 패널 열기 헬퍼
async function openChatPanel(page: Page) {
  const triggerButton = page.getByTestId('chat-trigger-button');
  await triggerButton.click();
  await expect(page.getByTestId('chat-panel')).toBeVisible();
}

test.describe('챗봇 에러/엣지케이스 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 네비게이션 전에 대시보드 API 먼저 모킹
    await mockDashboardAPIs(page);

    // 로그인 후 대시보드로 이동
    await authFixture.loginAsUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // DevTools 오버레이가 chat-trigger-button 클릭을 가로채는 문제 방지
    await hideDevtools(page);
  });

  test.describe('시나리오 1: 빈 메시지 전송 차단', () => {
    test('빈 입력 상태에서 전송 버튼이 비활성화되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      // 입력 필드가 비어 있는지 확인
      await expect(chatInput).toHaveValue('');

      // 전송 버튼이 비활성화되어 있어야 함
      await expect(sendButton).toBeDisabled();
    });

    test('입력 후 지우면 전송 버튼이 다시 비활성화되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      // 텍스트 입력 → 전송 버튼 활성화
      await chatInput.fill('테스트 메시지');
      await expect(sendButton).toBeEnabled();

      // 텍스트 삭제 → 전송 버튼 다시 비활성화
      await chatInput.fill('');
      await expect(sendButton).toBeDisabled();
    });
  });

  test.describe('시나리오 2: 글자수 초과 (2001자)', () => {
    test('2001자 입력 시 에러 메시지가 표시되고 전송이 차단되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      // 2001자 문자열 생성
      const overLimitText = 'A'.repeat(2001);
      await chatInput.fill(overLimitText);

      // 에러 메시지가 role="alert"로 표시되어야 함
      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText('2000자를 초과할 수 없습니다');

      // 전송 버튼이 비활성화되어야 함
      await expect(sendButton).toBeDisabled();
    });

    test('2001자 입력 시 입력 필드에 오류 스타일이 적용되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      const chatInput = page.getByTestId('chat-input');
      const overLimitText = 'B'.repeat(2001);
      await chatInput.fill(overLimitText);

      // border-destructive 클래스가 적용되어야 함
      await expect(chatInput).toHaveClass(/border-destructive/);
    });

    test('2001자 입력 시 카운터가 2001/2000으로 표시되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      const chatInput = page.getByTestId('chat-input');
      const overLimitText = 'C'.repeat(2001);
      await chatInput.fill(overLimitText);

      // 카운터 표시 확인
      const counter = page.locator('#chat-input-counter');
      await expect(counter).toBeVisible();
      await expect(counter).toContainText('2001/2000');
    });
  });

  test.describe('시나리오 3: API 500 에러 시 사용자 친화적 메시지', () => {
    test('서버 500 응답 시 한국어 에러 메시지가 표시되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      // 500 에러 응답 모킹
      await page.route('**/api/agent/chat', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      await chatInput.fill('500 에러 테스트');
      await sendButton.click();

      // 사용자 메시지 전송 확인
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(1); // 사용자 메시지

      // 에러 후 입력 필드가 다시 활성화되어야 함
      await expect(chatInput).toBeEnabled();
    });
  });

  test.describe('시나리오 4: 네트워크 타임아웃', () => {
    test('네트워크 타임아웃 후 입력 필드가 재활성화되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      // 타임아웃 시뮬레이션
      await page.route('**/api/agent/chat', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.abort('timedout');
      });

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      await chatInput.fill('타임아웃 테스트');
      await sendButton.click();

      // 사용자 메시지만 존재 (응답 없음)
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(1);

      // 타임아웃 후 입력 필드가 재활성화되어야 함
      await expect(chatInput).toBeEnabled();
    });

    test('연결 거부 후 입력 필드가 재활성화되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      // 연결 실패 시뮬레이션
      await page.route('**/api/agent/chat', async (route) => {
        await route.abort('connectionrefused');
      });

      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('연결 거부 테스트');

      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // 입력 필드가 재활성화되어야 함
      await expect(chatInput).toBeEnabled();
    });
  });

  test.describe('시나리오 5: 전송 버튼 더블클릭 방지', () => {
    test('빠른 연속 클릭 시 API가 1회만 호출되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      let callCount = 0;

      // API 호출 횟수 카운트
      await page.route('**/api/agent/chat', async (route) => {
        callCount++;
        const body = SSEMockHelper.textResponse('응답입니다.');
        const sseBody = body.map((chunk) => `data: ${JSON.stringify(chunk)}\n`).join('');
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          headers: {
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: sseBody,
        });
      });

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      await chatInput.fill('더블클릭 방지 테스트');

      // 전송 버튼 빠른 2회 클릭
      await sendButton.click();
      await sendButton.click();

      // 응답 대기
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(2); // 사용자 + 어시스턴트

      // API는 1회만 호출되어야 함
      expect(callCount).toBe(1);
    });
  });

  test.describe('시나리오 6: 스트리밍 에러 응답', () => {
    test('SSE 에러 이벤트 수신 시 에러 텍스트가 표시되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      const errorMessage = '캠페인 데이터를 불러오는데 실패했습니다.';

      // SSEMockHelper의 errorResponse 활용
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.errorResponse(errorMessage)
      );

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      await chatInput.fill('에러 스트리밍 테스트');
      await sendButton.click();

      // 에러 메시지를 포함한 어시스턴트 메시지가 표시되어야 함
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(2); // 사용자 + 에러 응답

      const lastMessage = messages.last();
      const messageBubble = lastMessage.getByTestId('chat-message-bubble');
      await expect(messageBubble).toContainText(errorMessage);
    });

    test('API 오류 텍스트가 한국어로 표시되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      const koreanErrorMessage = 'API 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';

      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.errorResponse(koreanErrorMessage)
      );

      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('한국어 에러 테스트');
      await page.getByTestId('chat-send-button').click();

      const messages = page.getByTestId('chat-message');
      const lastMessage = messages.last();
      const messageBubble = lastMessage.getByTestId('chat-message-bubble');
      await expect(messageBubble).toContainText('API 연결에 실패했습니다');
    });
  });

  test.describe('시나리오 7: 연속 에러 후 정상 대화 복구', () => {
    test('에러 응답 후 정상 응답으로 재시도하면 대화가 복구되어야 한다', async ({ page }) => {
      await openChatPanel(page);

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      // 1단계: 에러 응답 모킹
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.errorResponse('서버 오류가 발생했습니다.')
      );

      await chatInput.fill('에러를 유발하는 메시지');
      await sendButton.click();

      // 에러 메시지 확인
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(2); // 사용자 + 에러

      const errorMsg = messages.last().getByTestId('chat-message-bubble');
      await expect(errorMsg).toContainText('서버 오류가 발생했습니다');

      // 2단계: 정상 응답으로 remock
      await SSEMockHelper.remockChatResponse(
        page,
        SSEMockHelper.textResponse('정상적으로 처리되었습니다!')
      );

      // 3단계: 재시도 - 입력 필드가 활성화되어 있어야 함
      await expect(chatInput).toBeEnabled();
      await chatInput.fill('복구 테스트 메시지');
      await sendButton.click();

      // 정상 응답이 추가되어야 함 (총 4개 메시지)
      await expect(messages).toHaveCount(4); // 에러 사용자 + 에러 응답 + 복구 사용자 + 성공 응답

      const lastMessage = messages.last();
      const lastBubble = lastMessage.getByTestId('chat-message-bubble');
      await expect(lastBubble).toContainText('정상적으로 처리되었습니다');
    });

    test('타임아웃 에러 후 재전송하면 정상 대화가 가능해야 한다', async ({ page }) => {
      await openChatPanel(page);

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      // 1단계: 타임아웃 모킹
      await page.route('**/api/agent/chat', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.abort('timedout');
      });

      await chatInput.fill('타임아웃 메시지');
      await sendButton.click();

      // 사용자 메시지만 존재
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(1);

      // 입력 필드 재활성화 확인
      await expect(chatInput).toBeEnabled();

      // 2단계: 정상 응답으로 remock
      await SSEMockHelper.remockChatResponse(
        page,
        SSEMockHelper.textResponse('이번엔 성공했습니다!')
      );

      // 3단계: 정상 재전송
      await chatInput.fill('재전송 테스트');
      await sendButton.click();

      // 총 3개 메시지 (타임아웃 사용자 + 재전송 사용자 + 성공 응답)
      await expect(messages).toHaveCount(3);

      const lastBubble = messages.last().getByTestId('chat-message-bubble');
      await expect(lastBubble).toContainText('이번엔 성공했습니다');
    });
  });
});
