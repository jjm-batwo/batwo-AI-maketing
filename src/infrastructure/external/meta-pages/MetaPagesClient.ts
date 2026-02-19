/**
 * Meta Pages API Client
 * pages_show_list와 pages_read_engagement 권한 사용
 */

import { fetchWithTimeout } from '@lib/utils/timeout'

const META_API_BASE = 'https://graph.facebook.com/v25.0'
const META_API_TIMEOUT_MS = 30000 // 30 seconds for Meta API calls

export interface MetaPage {
  id: string
  name: string
  category: string
  access_token: string
  tasks?: string[]
  fan_count?: number
  followers_count?: number
  picture?: {
    data: {
      url: string
    }
  }
}

export interface PageInsight {
  name: string
  period: string
  values: Array<{
    value: number | Record<string, number>
    end_time: string
  }>
  title: string
  description: string
  id: string
}

export interface PageEngagement {
  page_fans: number
  page_engaged_users: number
  page_impressions: number
  page_post_engagements: number
  page_consumptions: number
  page_views_total: number
}

export class MetaPagesClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * 사용자가 관리하는 페이지 목록 조회
   * 권한: pages_show_list
   */
  async listPages(): Promise<MetaPage[]> {
    const fields = 'id,name,category,access_token,tasks,fan_count,followers_count,picture'
    const response = await fetchWithTimeout(
      `${META_API_BASE}/me/accounts?fields=${fields}&access_token=${this.accessToken}`,
      {},
      META_API_TIMEOUT_MS
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch pages: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.data || []
  }

  /**
   * 페이지 상세 정보 조회
   * 권한: pages_show_list
   */
  async getPage(pageId: string): Promise<MetaPage> {
    const fields = 'id,name,category,access_token,tasks,fan_count,followers_count,picture'
    const response = await fetchWithTimeout(
      `${META_API_BASE}/${pageId}?fields=${fields}&access_token=${this.accessToken}`,
      {},
      META_API_TIMEOUT_MS
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch page: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  /**
   * 페이지 인사이트 조회
   * 권한: pages_read_engagement
   */
  async getPageInsights(
    pageId: string,
    pageAccessToken: string,
    metrics: string[] = [
      'page_fans',
      'page_engaged_users',
      'page_impressions',
      'page_post_engagements',
      'page_consumptions',
      'page_views_total'
    ],
    period: 'day' | 'week' | 'days_28' = 'days_28'
  ): Promise<PageInsight[]> {
    const response = await fetchWithTimeout(
      `${META_API_BASE}/${pageId}/insights?metric=${metrics.join(',')}&period=${period}&access_token=${pageAccessToken}`,
      {},
      META_API_TIMEOUT_MS
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch page insights: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.data || []
  }

  /**
   * 페이지 게시물 목록 조회
   * 권한: pages_read_engagement
   */
  async getPagePosts(
    pageId: string,
    pageAccessToken: string,
    limit: number = 10
  ): Promise<Array<{
    id: string
    message?: string
    created_time: string
    likes?: { summary: { total_count: number } }
    comments?: { summary: { total_count: number } }
    shares?: { count: number }
  }>> {
    const fields = 'id,message,created_time,likes.summary(true),comments.summary(true),shares'
    const response = await fetchWithTimeout(
      `${META_API_BASE}/${pageId}/posts?fields=${fields}&limit=${limit}&access_token=${pageAccessToken}`,
      {},
      META_API_TIMEOUT_MS
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch page posts: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.data || []
  }

  /**
   * 페이지 참여 요약 데이터 조회
   * 권한: pages_read_engagement
   */
  async getEngagementSummary(
    pageId: string,
    pageAccessToken: string
  ): Promise<PageEngagement> {
    const insights = await this.getPageInsights(pageId, pageAccessToken)

    const engagement: PageEngagement = {
      page_fans: 0,
      page_engaged_users: 0,
      page_impressions: 0,
      page_post_engagements: 0,
      page_consumptions: 0,
      page_views_total: 0
    }

    insights.forEach((insight) => {
      const latestValue = insight.values[insight.values.length - 1]
      if (latestValue && typeof latestValue.value === 'number') {
        const key = insight.name as keyof PageEngagement
        if (key in engagement) {
          engagement[key] = latestValue.value
        }
      }
    })

    return engagement
  }
}

export default MetaPagesClient
