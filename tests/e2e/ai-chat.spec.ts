import { test, expect, Page } from '@playwright/test';
import { authFixture } from './fixtures/auth';
import { SSEMockHelper } from './helpers/sse-mock.helper';

/**
 * AI Chat E2E Test Suite
 *
 * Tests conversational AI chat functionality:
 * - Panel opening/closing
 * - Text conversations
 * - Query responses with data cards
 * - Mutation confirmations
 * - Error handling
 * - Suggested questions
 */

// Helper to mock all dashboard API endpoints to prevent timeouts
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
            name: 'Test Campaign',
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
      body: JSON.stringify({
        insights: [
          {
            id: 'insight-1',
            type: 'BUDGET_ALERT',
            message: '캠페인 예산의 80%를 사용했습니다.',
            severity: 'WARNING',
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    });
  });

  await page.route('**/api/meta/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        connected: true,
        adAccountId: 'act_123456789',
      }),
    });
  });
}

test.describe('AI Chat E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock dashboard APIs BEFORE navigation
    await mockDashboardAPIs(page);

    // Login and navigate to dashboard
    await authFixture.loginAsUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Chat Panel Opening/Closing', () => {
    test('should open chat panel when clicking trigger button', async ({ page }) => {
      // Panel should be closed initially
      const chatPanel = page.getByTestId('chat-panel');
      await expect(chatPanel).not.toBeVisible();

      // Click trigger button
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Panel should open
      await expect(chatPanel).toBeVisible();
    });

    test('should close chat panel when clicking close button', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      const chatPanel = page.getByTestId('chat-panel');
      await expect(chatPanel).toBeVisible();

      // Find and click close button (assuming it has a close/X icon)
      const closeButton = chatPanel.locator('button').filter({ hasText: /close|×/i }).first();
      await closeButton.click();

      // Panel should close
      await expect(chatPanel).not.toBeVisible();
    });

    test('should show empty state with suggestions when no messages', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Check for suggested questions
      const suggestedQuestions = page.getByTestId('suggested-questions');
      await expect(suggestedQuestions).toBeVisible();

      // Should have at least one suggested question button
      const questionButtons = page.getByTestId('suggested-question-button');
      await expect(questionButtons.first()).toBeVisible();
    });
  });

  test.describe('Text Conversation', () => {
    test('should send a message and receive text response', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock SSE response
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.textResponse('안녕하세요! 무엇을 도와드릴까요?')
      );

      // Type message
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('안녕하세요');

      // Send message
      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // Wait for assistant message
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(2); // User + Assistant

      // Check assistant message content
      const assistantMessage = messages.last();
      const messageBubble = assistantMessage.getByTestId('chat-message-bubble');
      await expect(messageBubble).toContainText('안녕하세요! 무엇을 도와드릴까요?');
    });

    test('should send message with Enter key', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock SSE response
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.textResponse('네, Enter로 보내셨네요!')
      );

      // Type message and press Enter
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('테스트 메시지');
      await chatInput.press('Enter');

      // Wait for assistant message
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(2);
    });
  });

  test.describe('Query Response with Data Card', () => {
    test('should display KPI summary card after query', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock query response with KPI data
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.queryResponse()
      );

      // Send query
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('현재 광고 성과를 보여주세요');
      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // Wait for KPI card
      const kpiCard = page.getByTestId('kpi-summary-card');
      await expect(kpiCard).toBeVisible();

      // Verify card contains data
      await expect(kpiCard).toContainText('지출');
      await expect(kpiCard).toContainText('노출');
      await expect(kpiCard).toContainText('클릭');
    });
  });

  test.describe('Mutation with Confirmation', () => {
    test('should show confirmation card for mutation actions', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock mutation response
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.mutationResponse()
      );

      // Send mutation request
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('새 캠페인을 생성해주세요');
      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // Wait for confirmation card
      const confirmationCard = page.getByTestId('confirmation-card');
      await expect(confirmationCard).toBeVisible();

      // Verify buttons exist
      const confirmButton = page.getByTestId('confirm-action-button');
      const cancelButton = page.getByTestId('cancel-action-button');
      await expect(confirmButton).toBeVisible();
      await expect(cancelButton).toBeVisible();
    });

    test('should handle confirm action', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock mutation response
      const actionId = 'test-action-123';
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.mutationResponse()
      );

      // Send mutation request
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('새 캠페인을 생성해주세요');
      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // Wait for confirmation card
      const confirmationCard = page.getByTestId('confirmation-card');
      await expect(confirmationCard).toBeVisible();

      // Mock action confirm response
      await SSEMockHelper.mockActionConfirm(page, actionId, '캠페인이 생성되었습니다.');

      // Click confirm
      const confirmButton = page.getByTestId('confirm-action-button');
      await confirmButton.click();

      // Wait for confirmation to disappear
      await expect(confirmationCard).not.toBeVisible();

      // Check for success message
      const messages = page.getByTestId('chat-message');
      const lastMessage = messages.last();
      await expect(lastMessage).toContainText('캠페인이 생성되었습니다');
    });

    test('should handle cancel action', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock mutation response
      const actionId = 'test-action-456';
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.mutationResponse()
      );

      // Send mutation request
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('새 캠페인을 생성해주세요');
      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // Wait for confirmation card
      const confirmationCard = page.getByTestId('confirmation-card');
      await expect(confirmationCard).toBeVisible();

      // Mock action cancel response
      await SSEMockHelper.mockActionCancel(page, actionId);

      // Click cancel
      const cancelButton = page.getByTestId('cancel-action-button');
      await cancelButton.click();

      // Wait for confirmation to disappear
      await expect(confirmationCard).not.toBeVisible();

      // Check for cancellation message
      const messages = page.getByTestId('chat-message');
      const lastMessage = messages.last();
      await expect(lastMessage).toContainText('취소');
    });
  });

  test.describe('Campaign List Card', () => {
    test('should display campaign list card', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock campaign list response
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.campaignListResponse()
      );

      // Send query
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('활성 캠페인 목록을 보여주세요');
      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // Wait for campaign list card
      const campaignCard = page.getByTestId('campaign-list-card');
      await expect(campaignCard).toBeVisible();

      // Verify card contains campaign data
      await expect(campaignCard).toContainText('여름 신상품 프로모션');
      await expect(campaignCard).toContainText('ACTIVE');
    });
  });

  test.describe('Error Handling', () => {
    test('should display error message on failure', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock error response
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.errorResponse('API 연결에 실패했습니다.')
      );

      // Send message
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('에러 테스트');
      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // Wait for error message
      const messages = page.getByTestId('chat-message');
      const lastMessage = messages.last();
      const messageBubble = lastMessage.getByTestId('chat-message-bubble');
      await expect(messageBubble).toContainText('API 연결에 실패했습니다');
    });

    test('should handle network timeout gracefully', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock network timeout (abort request after delay)
      await page.route('**/api/agent/chat', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.abort('timedout');
      });

      // Send message
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('타임아웃 테스트');
      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // Wait for error indication (message should still appear)
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(1); // Only user message

      // Input should be re-enabled
      await expect(chatInput).toBeEnabled();
    });
  });

  test.describe('Suggested Questions', () => {
    test('should show and click suggested questions', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Get suggested questions
      const suggestedQuestions = page.getByTestId('suggested-questions');
      await expect(suggestedQuestions).toBeVisible();

      const questionButtons = page.getByTestId('suggested-question-button');
      const firstQuestion = questionButtons.first();
      await expect(firstQuestion).toBeVisible();

      // Mock response
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.textResponse('여기 현재 광고 성과입니다.')
      );

      // Click suggested question
      const questionText = await firstQuestion.textContent();
      await firstQuestion.click();

      // Verify message was sent
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(2); // User + Assistant

      const userMessage = messages.first();
      await expect(userMessage).toContainText(questionText || '');

      // Suggested questions should disappear after first message
      await expect(suggestedQuestions).not.toBeVisible();
    });
  });

  test.describe('Multi-turn Conversation', () => {
    test('should handle multiple messages in sequence', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      const chatInput = page.getByTestId('chat-input');
      const sendButton = page.getByTestId('chat-send-button');

      // First message
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.textResponse('첫 번째 응답입니다.')
      );
      await chatInput.fill('첫 번째 질문');
      await sendButton.click();
      await page.waitForTimeout(500);

      // Second message (re-mock required)
      await SSEMockHelper.remockChatResponse(
        page,
        SSEMockHelper.textResponse('두 번째 응답입니다.')
      );
      await chatInput.fill('두 번째 질문');
      await sendButton.click();
      await page.waitForTimeout(500);

      // Third message
      await SSEMockHelper.remockChatResponse(
        page,
        SSEMockHelper.textResponse('세 번째 응답입니다.')
      );
      await chatInput.fill('세 번째 질문');
      await sendButton.click();
      await page.waitForTimeout(500);

      // Should have 6 messages (3 user + 3 assistant)
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(6);
    });
  });

  test.describe('Message Rendering', () => {
    test('should display user and assistant messages with correct styling', async ({ page }) => {
      // Open chat panel
      const triggerButton = page.getByTestId('chat-trigger-button');
      await triggerButton.click();

      // Mock response
      await SSEMockHelper.mockChatResponse(
        page,
        SSEMockHelper.textResponse('Assistant 응답입니다.')
      );

      // Send message
      const chatInput = page.getByTestId('chat-input');
      await chatInput.fill('사용자 메시지입니다.');
      const sendButton = page.getByTestId('chat-send-button');
      await sendButton.click();

      // Wait for messages
      const messages = page.getByTestId('chat-message');
      await expect(messages).toHaveCount(2);

      // Check user message (first)
      const userMessage = messages.first();
      const userBubble = userMessage.getByTestId('chat-message-bubble');
      await expect(userBubble).toContainText('사용자 메시지입니다.');

      // Check assistant message (last)
      const assistantMessage = messages.last();
      const assistantBubble = assistantMessage.getByTestId('chat-message-bubble');
      await expect(assistantBubble).toContainText('Assistant 응답입니다.');
    });
  });
});
