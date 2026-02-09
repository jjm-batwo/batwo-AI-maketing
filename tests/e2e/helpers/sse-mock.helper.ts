/**
 * SSE Mock Helper for AI Chat E2E Tests
 * Mocks the /api/agent/chat SSE endpoint for deterministic testing.
 *
 * The actual implementation in useAgentChat.ts uses:
 * - fetch() with response.body.getReader() and TextDecoder
 * - SSE line format: "data: {JSON}\n" where each line starts with "data: " prefix
 * - JSON parsed via line.slice(6) (removing "data: " prefix)
 */
import { Page, Route } from '@playwright/test'

interface SSEChunk {
  type: string
  [key: string]: unknown
}

export class SSEMockHelper {
  /**
   * Mock the /api/agent/chat endpoint with a sequence of SSE chunks.
   * Uses page.route() to intercept the POST request and return
   * a streaming response in the exact format useAgentChat.ts expects.
   */
  static async mockChatResponse(page: Page, chunks: SSEChunk[]): Promise<void> {
    await page.route('**/api/agent/chat', async (route: Route) => {
      const body = chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n`).join('')
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body,
      })
    })
  }

  /**
   * Remove all chat route mocks to allow re-mocking with different responses
   */
  static async clearChatMocks(page: Page): Promise<void> {
    await page.unroute('**/api/agent/chat')
  }

  /**
   * Re-mock with new response (clear then set)
   */
  static async remockChatResponse(page: Page, chunks: SSEChunk[]): Promise<void> {
    await SSEMockHelper.clearChatMocks(page)
    await SSEMockHelper.mockChatResponse(page, chunks)
  }

  // =========================================================================
  // Predefined Response Sequences
  // =========================================================================

  /** Simple text response */
  static textResponse(text: string): SSEChunk[] {
    return [
      { type: 'text', content: text },
      { type: 'done' },
    ]
  }

  /** Text + KPI data card + suggested questions (query tool result) */
  static queryResponse(): SSEChunk[] {
    return [
      { type: 'text', content: '이번 주 캠페인 성과를 분석했습니다.' },
      {
        type: 'data_card',
        cardType: 'kpi_summary',
        data: {
          period: '이번 주',
          metrics: [
            { label: 'ROAS', value: '4.52', change: 12.3 },
            { label: '총 지출', value: '₩89,500', change: -5.2 },
            { label: '전환수', value: '123', change: 8.1 },
            { label: 'CTR', value: '2.76%', change: 3.4 },
          ],
        },
      },
      {
        type: 'suggested_questions',
        questions: [
          '예산을 어떻게 최적화할까요?',
          '성과가 좋은 캠페인은?',
        ],
      },
      { type: 'done' },
    ]
  }

  /** Mutation with confirmation card */
  static mutationResponse(): SSEChunk[] {
    return [
      { type: 'text', content: '새 캠페인을 생성하겠습니다. 아래 내용을 확인해주세요.' },
      {
        type: 'action_confirmation',
        actionId: 'test-action-001',
        toolName: 'createCampaign',
        summary: '새 전환 캠페인을 생성합니다',
        details: [
          { label: '캠페인 이름', value: '신규 전환 캠페인', changed: false },
          { label: '예산', value: '₩50,000/일', changed: false },
          { label: '목표', value: '전환', changed: false },
        ],
        warnings: ['예산이 설정되면 즉시 광고가 시작됩니다.'],
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
      { type: 'done' },
    ]
  }

  /** Campaign list data card response */
  static campaignListResponse(): SSEChunk[] {
    return [
      { type: 'text', content: '현재 활성 캠페인 목록입니다.' },
      {
        type: 'data_card',
        cardType: 'campaign_list',
        data: {
          campaigns: [
            { name: '신규 고객 확보', status: '진행중', spend: '₩50,000', roas: '4.2x' },
            { name: '리타겟팅', status: '진행중', spend: '₩30,000', roas: '5.8x' },
          ],
          total: 2,
        },
      },
      { type: 'done' },
    ]
  }

  /** Error response */
  static errorResponse(errorMessage: string): SSEChunk[] {
    return [
      { type: 'error', error: errorMessage },
      { type: 'done' },
    ]
  }

  // =========================================================================
  // Action Endpoint Mocks
  // =========================================================================

  /** Mock the action confirm endpoint */
  static async mockActionConfirm(page: Page, actionId: string, message: string): Promise<void> {
    await page.route(`**/api/agent/actions/${actionId}/confirm`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message }),
      })
    })
  }

  /** Mock the action cancel endpoint */
  static async mockActionCancel(page: Page, actionId: string): Promise<void> {
    await page.route(`**/api/agent/actions/${actionId}/cancel`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: '작업이 취소되었습니다.' }),
      })
    })
  }
}
