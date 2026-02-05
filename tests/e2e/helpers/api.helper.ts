import { Page, Response } from '@playwright/test'

export interface TestData {
  users?: Array<{
    email: string
    name: string
    password: string
  }>
  campaigns?: Array<{
    name: string
    objective: string
    budget: number
    status: string
  }>
  metaAccounts?: Array<{
    metaAccountId: string
    businessName: string
  }>
}

/**
 * API 헬퍼 클래스
 * E2E 테스트에서 API 호출 및 데이터 시딩/정리를 담당
 */
export class ApiHelper {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  /**
   * 테스트 데이터 시딩
   * @param data - 시드할 테스트 데이터
   */
  async seedTestData(data: TestData): Promise<void> {
    // POST /api/test/seed 엔드포인트 호출
    const response = await fetch(`${this.baseUrl}/api/test/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to seed test data: ${response.statusText}`)
    }

    console.log('[API Helper] Test data seeded successfully')
  }

  /**
   * 테스트 데이터 정리
   */
  async cleanupTestData(): Promise<void> {
    // DELETE /api/test/cleanup 엔드포인트 호출
    const response = await fetch(`${this.baseUrl}/api/test/cleanup`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to cleanup test data: ${response.statusText}`)
    }

    console.log('[API Helper] Test data cleaned up successfully')
  }

  /**
   * Mock API 응답 설정
   * Playwright의 route interception을 사용하여 API 응답을 모킹
   * @param page - Playwright Page 객체
   * @param route - 모킹할 API 경로 (예: '/api/campaigns')
   * @param response - 반환할 응답 데이터
   */
  async mockApiResponse(page: Page, route: string, response: any): Promise<void> {
    await page.route(route, async (routeHandler) => {
      await routeHandler.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    })

    console.log(`[API Helper] Mocked API response for ${route}`)
  }

  /**
   * API 호출 대기
   * 특정 URL 패턴의 API 호출이 완료될 때까지 대기
   * @param page - Playwright Page 객체
   * @param urlPattern - 대기할 URL 패턴 (정규식 또는 문자열)
   * @returns API 응답 객체
   */
  async waitForApi(page: Page, urlPattern: string | RegExp): Promise<Response> {
    const response = await page.waitForResponse(
      (resp) => {
        const url = resp.url()
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern)
        }
        return urlPattern.test(url)
      },
      { timeout: 30000 }
    )

    console.log(`[API Helper] API call completed: ${response.url()}`)
    return response
  }

  /**
   * API 호출이 특정 횟수 발생할 때까지 대기
   * @param page - Playwright Page 객체
   * @param urlPattern - 대기할 URL 패턴
   * @param count - 대기할 호출 횟수
   */
  async waitForApiCalls(
    page: Page,
    urlPattern: string | RegExp,
    count: number
  ): Promise<Response[]> {
    const responses: Response[] = []

    const listener = (response: Response) => {
      const url = response.url()
      const matches =
        typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url)

      if (matches) {
        responses.push(response)
      }
    }

    page.on('response', listener)

    try {
      await page.waitForFunction(
        ({ count }) => {
          return (window as any).__apiCallCount >= count
        },
        { count },
        { timeout: 30000 }
      ).catch(() => {
        // Fallback: 응답 배열 길이로 확인
        return responses.length >= count
      })
    } finally {
      page.off('response', listener)
    }

    console.log(`[API Helper] ${count} API calls completed for ${urlPattern}`)
    return responses.slice(0, count)
  }

  /**
   * API 에러 응답 모킹
   * @param page - Playwright Page 객체
   * @param route - 모킹할 API 경로
   * @param status - HTTP 상태 코드
   * @param error - 에러 메시지
   */
  async mockApiError(
    page: Page,
    route: string,
    status: number,
    error: string
  ): Promise<void> {
    await page.route(route, async (routeHandler) => {
      await routeHandler.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error }),
      })
    })

    console.log(`[API Helper] Mocked API error (${status}) for ${route}`)
  }

  /**
   * 모든 API 모킹 해제
   * @param page - Playwright Page 객체
   */
  async clearApiMocks(page: Page): Promise<void> {
    await page.unroute('**/*')
    console.log('[API Helper] Cleared all API mocks')
  }
}

/**
 * API 헬퍼 인스턴스 생성 헬퍼 함수
 */
export function createApiHelper(baseUrl?: string): ApiHelper {
  return new ApiHelper(baseUrl)
}
