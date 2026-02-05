/**
 * Mock 데이터 헬퍼
 * E2E 테스트에서 사용할 Mock 데이터 생성
 */

export interface MetaAccountMock {
  id: string
  name: string
  account_id: string
  account_status: number
  currency: string
  timezone_name: string
}

export interface CampaignMock {
  id: string
  name: string
  status: string
  objective: string
  daily_budget?: string
  lifetime_budget?: string
  created_time: string
  updated_time: string
}

export interface KPIMock {
  impressions: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
  cpa: number
  roas: number
}

export interface InsightMock {
  campaign_id: string
  date_start: string
  date_stop: string
  impressions: string
  clicks: string
  spend: string
  actions?: Array<{
    action_type: string
    value: string
  }>
}

/**
 * Mock 데이터 헬퍼 클래스
 */
export class MockHelper {
  /**
   * Mock Meta 광고 계정 데이터 생성
   */
  static metaAccounts(): MetaAccountMock[] {
    return [
      {
        id: 'act_123456789',
        name: 'Test Ad Account 1',
        account_id: '123456789',
        account_status: 1,
        currency: 'KRW',
        timezone_name: 'Asia/Seoul',
      },
      {
        id: 'act_987654321',
        name: 'Test Ad Account 2',
        account_id: '987654321',
        account_status: 1,
        currency: 'USD',
        timezone_name: 'America/Los_Angeles',
      },
    ]
  }

  /**
   * Mock 캠페인 데이터 생성
   */
  static campaigns(): CampaignMock[] {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    return [
      {
        id: '120210000000001',
        name: '신규 고객 확보 캠페인',
        status: 'ACTIVE',
        objective: 'OUTCOME_SALES',
        daily_budget: '50000',
        created_time: yesterday.toISOString(),
        updated_time: now.toISOString(),
      },
      {
        id: '120210000000002',
        name: '브랜드 인지도 캠페인',
        status: 'PAUSED',
        objective: 'OUTCOME_AWARENESS',
        daily_budget: '30000',
        created_time: yesterday.toISOString(),
        updated_time: now.toISOString(),
      },
      {
        id: '120210000000003',
        name: '재타겟팅 캠페인',
        status: 'ACTIVE',
        objective: 'OUTCOME_ENGAGEMENT',
        lifetime_budget: '1000000',
        created_time: yesterday.toISOString(),
        updated_time: now.toISOString(),
      },
    ]
  }

  /**
   * Mock KPI 데이터 생성
   */
  static kpiData(): KPIMock {
    return {
      impressions: 125340,
      clicks: 3456,
      spend: 89500,
      conversions: 123,
      ctr: 2.76,
      cpc: 25.9,
      cpa: 727.64,
      roas: 4.52,
    }
  }

  /**
   * Mock 인사이트 데이터 생성
   */
  static insights(campaignId?: string): InsightMock[] {
    const baseInsight: Omit<InsightMock, 'campaign_id'> = {
      date_start: '2026-02-01',
      date_stop: '2026-02-05',
      impressions: '42000',
      clicks: '1152',
      spend: '29833.33',
      actions: [
        { action_type: 'purchase', value: '41' },
        { action_type: 'add_to_cart', value: '87' },
        { action_type: 'view_content', value: '312' },
      ],
    }

    if (campaignId) {
      return [{ ...baseInsight, campaign_id: campaignId }]
    }

    return MockHelper.campaigns().map((campaign) => ({
      ...baseInsight,
      campaign_id: campaign.id,
    }))
  }

  /**
   * Mock 픽셀 데이터 생성
   */
  static metaPixels() {
    return [
      {
        id: '1234567890',
        name: 'Test Pixel 1',
        code: 'fbq("init", "1234567890");',
      },
      {
        id: '0987654321',
        name: 'Test Pixel 2',
        code: 'fbq("init", "0987654321");',
      },
    ]
  }

  /**
   * Mock 사용자 데이터 생성
   */
  static users() {
    return [
      {
        id: 'user_test_001',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: new Date().toISOString(),
      },
      {
        id: 'user_admin_001',
        email: 'admin@example.com',
        name: 'Admin User',
        emailVerified: new Date().toISOString(),
        globalRole: 'ADMIN',
      },
    ]
  }

  /**
   * Mock AI 카피 생성 응답
   */
  static aiCopyResponse() {
    return {
      headline: '지금 바로 시작하세요! 특별 할인 중',
      primaryText: '당신의 비즈니스를 성장시킬 최고의 솔루션을 만나보세요.',
      description: '간편한 설정, 강력한 기능, 합리적인 가격',
      cta: '자세히 보기',
    }
  }

  /**
   * Mock AI 인사이트 응답
   */
  static aiInsights() {
    return [
      {
        id: 'insight_001',
        type: 'optimization',
        title: '광고 예산 최적화 제안',
        description: '캠페인 A의 ROAS가 평균보다 높습니다. 예산을 20% 증액하면 수익을 극대화할 수 있습니다.',
        priority: 'high',
        impact: '+15% 예상 수익 증가',
      },
      {
        id: 'insight_002',
        type: 'warning',
        title: '캠페인 성과 저하 감지',
        description: '캠페인 B의 CTR이 지난 주 대비 30% 감소했습니다. 크리에이티브 교체를 권장합니다.',
        priority: 'medium',
        impact: '현재 손실: ₩25,000/일',
      },
    ]
  }

  /**
   * Mock 할당량 데이터 생성
   */
  static quotaStatus() {
    return {
      campaignCreation: {
        used: 2,
        limit: 5,
        remaining: 3,
        resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      aiCopyGeneration: {
        used: 8,
        limit: 20,
        remaining: 12,
        resetDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      aiAnalysis: {
        used: 1,
        limit: 5,
        remaining: 4,
        resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }
  }

  /**
   * Mock 구독 정보 생성
   */
  static subscription() {
    return {
      id: 'sub_001',
      plan: 'starter',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    }
  }
}

/**
 * 랜덤 Mock 데이터 생성 유틸리티
 */
export const MockDataGenerator = {
  /**
   * 랜덤 캠페인 이름 생성
   */
  randomCampaignName(): string {
    const prefixes = ['신규', '재타겟팅', '브랜드', '전환', '트래픽']
    const suffixes = ['캠페인', '광고', '프로모션', '이벤트']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    return `${prefix} ${suffix} ${Date.now()}`
  },

  /**
   * 랜덤 예산 생성 (10,000 ~ 100,000)
   */
  randomBudget(): number {
    return Math.floor(Math.random() * 90000) + 10000
  },

  /**
   * 랜덤 날짜 범위 생성
   */
  randomDateRange(daysAgo: number = 7): { start: string; end: string } {
    const end = new Date()
    const start = new Date(end.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  },

  /**
   * 랜덤 KPI 데이터 생성
   */
  randomKPI(): KPIMock {
    const impressions = Math.floor(Math.random() * 100000) + 10000
    const clicks = Math.floor(impressions * (Math.random() * 0.05))
    const spend = Math.floor(Math.random() * 100000) + 10000
    const conversions = Math.floor(clicks * (Math.random() * 0.1))

    return {
      impressions,
      clicks,
      spend,
      conversions,
      ctr: parseFloat(((clicks / impressions) * 100).toFixed(2)),
      cpc: parseFloat((spend / clicks).toFixed(2)),
      cpa: conversions > 0 ? parseFloat((spend / conversions).toFixed(2)) : 0,
      roas: Math.random() * 5 + 1,
    }
  },
}
