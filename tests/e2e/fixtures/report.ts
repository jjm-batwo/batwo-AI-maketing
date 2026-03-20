/**
 * 보고서 E2E 테스트용 Mock 데이터 Fixture
 */

/** 보고서 목록 API 응답 */
export interface ReportListItem {
  id: string
  type: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  status: 'PENDING' | 'GENERATED' | 'SENT'
  dateRange: { startDate: string; endDate: string }
  generatedAt?: string
  campaignCount: number
}

/** ChangeRate — 실제 DTO와 동일 */
interface ChangeRate {
  value: number
  direction: 'up' | 'down' | 'flat'
  isPositive: boolean
}

type FatigueLevel = 'healthy' | 'warning' | 'critical'

/** 보고서 상세 API 응답 (enhanced sections 포함) */
export interface ReportDetailData {
  id: string
  type: string
  dateRange: { startDate: string; endDate: string }
  shareToken?: string | null
  shareExpiresAt?: string | null
  summaryMetrics: {
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalSpend: number
    totalRevenue: number
    averageRoas: number
    averageCtr: number
    averageCpa: number
  }
  aiInsights: Array<{
    type: 'POSITIVE' | 'NEGATIVE' | 'SUGGESTION'
    message: string
    confidence: number
  }>
  sections: Array<{
    title: string
    content: string
  }>
  overallSummary?: {
    totalSpend: number
    totalRevenue: number
    roas: number
    ctr: number
    totalConversions: number
    changes: {
      spend: ChangeRate
      revenue: ChangeRate
      roas: ChangeRate
      ctr: ChangeRate
      conversions: ChangeRate
    }
  }
  dailyTrend?: {
    days: Array<{
      date: string
      spend: number
      revenue: number
      roas: number
      impressions: number
      clicks: number
      conversions: number
    }>
  }
  campaignPerformance?: {
    campaigns: Array<{
      campaignId: string
      name: string
      objective: string
      status: string
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
      roas: number
      ctr: number
    }>
  }
  creativePerformance?: {
    topN: number
    creatives: Array<{
      creativeId: string
      name: string
      format: string
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
      roas: number
      ctr: number
    }>
  }
  creativeFatigue?: {
    creatives: Array<{
      creativeId: string
      name: string
      format: string
      frequency: number
      ctr: number
      ctrTrend: number[]
      fatigueScore: number
      fatigueLevel: FatigueLevel
      activeDays: number
      recommendation: string
    }>
  }
  formatComparison?: {
    formats: Array<{
      format: string
      formatLabel: string
      adCount: number
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
      roas: number
      ctr: number
      avgFrequency: number
    }>
  }
  funnelPerformance?: {
    stages: Array<{
      stage: 'tofu' | 'mofu' | 'bofu' | 'auto'
      stageLabel: string
      campaignCount: number
      spend: number
      budgetRatio: number
      impressions: number
      clicks: number
      conversions: number
      revenue: number
      roas: number
      ctr: number
    }>
    totalBudget: number
  }
  performanceAnalysis?: {
    summary: string
    positiveFactors: Array<{
      title: string
      description: string
      impact: 'high' | 'medium' | 'low'
    }>
    negativeFactors: Array<{
      title: string
      description: string
      impact: 'high' | 'medium' | 'low'
    }>
  }
  recommendations?: {
    actions: Array<{
      priority: 'high' | 'medium' | 'low'
      category: 'budget' | 'creative' | 'targeting' | 'funnel' | 'general'
      title: string
      description: string
      expectedImpact: string
      deadline?: string
    }>
  }
}

/** 공유 API 응답 */
export interface ShareResponse {
  shareToken: string
  shareExpiresAt: string
  shareUrl: string
}

/**
 * Mock 보고서 목록 데이터
 */
export function mockReportList(): { reports: ReportListItem[]; total: number; page: number; pageSize: number } {
  return {
    reports: [
      {
        id: 'report-001',
        type: 'WEEKLY',
        status: 'GENERATED',
        dateRange: { startDate: '2026-03-10', endDate: '2026-03-16' },
        generatedAt: '2026-03-17T00:00:00.000Z',
        campaignCount: 3,
      },
      {
        id: 'report-002',
        type: 'MONTHLY',
        status: 'GENERATED',
        dateRange: { startDate: '2026-02-01', endDate: '2026-02-28' },
        generatedAt: '2026-03-01T00:00:00.000Z',
        campaignCount: 5,
      },
      {
        id: 'report-003',
        type: 'WEEKLY',
        status: 'PENDING',
        dateRange: { startDate: '2026-03-17', endDate: '2026-03-23' },
        campaignCount: 2,
      },
    ],
    total: 3,
    page: 1,
    pageSize: 10,
  }
}

/**
 * Mock 보고서 상세 데이터 (enhanced sections 포함)
 */
export function mockReportDetail(id: string = 'report-001'): ReportDetailData {
  return {
    id,
    type: 'WEEKLY',
    dateRange: { startDate: '2026-03-10', endDate: '2026-03-16' },
    shareToken: null,
    shareExpiresAt: null,
    summaryMetrics: {
      totalImpressions: 125340,
      totalClicks: 3456,
      totalConversions: 123,
      totalSpend: 450000,
      totalRevenue: 2025000,
      averageRoas: 4.5,
      averageCtr: 2.76,
      averageCpa: 3658,
    },
    aiInsights: [
      {
        type: 'POSITIVE',
        message: 'ROAS가 지난주 대비 15% 상승했습니다.',
        confidence: 0.92,
      },
      {
        type: 'NEGATIVE',
        message: 'CTR이 업계 평균보다 낮습니다.',
        confidence: 0.85,
      },
      {
        type: 'SUGGESTION',
        message: '크리에이티브 A/B 테스트를 권장합니다.',
        confidence: 0.78,
      },
    ],
    sections: [
      { title: '캠페인 성과 요약', content: '<p>이번 주 캠페인 성과가 양호합니다.</p>' },
      { title: '크리에이티브 분석', content: '<p>이미지 광고가 동영상보다 높은 CTR을 기록했습니다.</p>' },
    ],
    overallSummary: {
      totalSpend: 450000,
      totalRevenue: 2025000,
      roas: 4.5,
      ctr: 2.76,
      totalConversions: 123,
      changes: {
        spend: { value: 5, direction: 'up', isPositive: false },
        revenue: { value: 12, direction: 'up', isPositive: true },
        roas: { value: 15, direction: 'up', isPositive: true },
        ctr: { value: 3, direction: 'down', isPositive: false },
        conversions: { value: 8, direction: 'up', isPositive: true },
      },
    },
    dailyTrend: {
      days: [
        { date: '2026-03-10', spend: 65000, revenue: 290000, roas: 4.46, impressions: 18000, clicks: 500, conversions: 18 },
        { date: '2026-03-11', spend: 63000, revenue: 285000, roas: 4.52, impressions: 17500, clicks: 480, conversions: 17 },
        { date: '2026-03-12', spend: 67000, revenue: 300000, roas: 4.48, impressions: 19000, clicks: 520, conversions: 19 },
      ],
    },
    campaignPerformance: {
      campaigns: [
        { campaignId: 'camp-001', name: '신규 고객 캠페인', objective: 'CONVERSIONS', status: 'ACTIVE', impressions: 50000, clicks: 1400, conversions: 52, spend: 180000, revenue: 850000, roas: 4.72, ctr: 2.8 },
        { campaignId: 'camp-002', name: '리타겟팅 캠페인', objective: 'CONVERSIONS', status: 'ACTIVE', impressions: 40000, clicks: 1100, conversions: 45, spend: 150000, revenue: 700000, roas: 4.67, ctr: 2.75 },
        { campaignId: 'camp-003', name: '브랜드 인지도', objective: 'AWARENESS', status: 'PAUSED', impressions: 35340, clicks: 956, conversions: 26, spend: 120000, revenue: 475000, roas: 3.96, ctr: 2.71 },
      ],
    },
    creativePerformance: {
      topN: 5,
      creatives: [
        { creativeId: 'cr-001', name: '이미지 A', format: 'IMAGE', impressions: 40000, clicks: 1200, conversions: 45, spend: 150000, revenue: 680000, roas: 4.53, ctr: 3.0 },
        { creativeId: 'cr-002', name: '동영상 B', format: 'VIDEO', impressions: 35000, clicks: 900, conversions: 35, spend: 130000, revenue: 560000, roas: 4.31, ctr: 2.57 },
      ],
    },
    creativeFatigue: {
      creatives: [
        {
          creativeId: 'cr-002',
          name: '동영상 B',
          format: 'VIDEO',
          frequency: 3.8,
          ctr: 2.57,
          ctrTrend: [3.2, 3.1, 2.9, 2.8, 2.7, 2.6, 2.57],
          fatigueScore: 65,
          fatigueLevel: 'warning',
          activeDays: 14,
          recommendation: '소재 교체를 권장합니다',
        },
      ],
    },
    formatComparison: {
      formats: [
        { format: 'IMAGE', formatLabel: '이미지', adCount: 5, impressions: 60000, clicks: 1800, conversions: 60, spend: 200000, revenue: 900000, roas: 4.5, ctr: 3.0, avgFrequency: 2.1 },
        { format: 'VIDEO', formatLabel: '동영상', adCount: 3, impressions: 45000, clicks: 1200, conversions: 40, spend: 150000, revenue: 630000, roas: 4.2, ctr: 2.67, avgFrequency: 2.8 },
        { format: 'CAROUSEL', formatLabel: '캐러셀', adCount: 2, impressions: 20340, clicks: 456, conversions: 23, spend: 100000, revenue: 395000, roas: 3.95, ctr: 2.24, avgFrequency: 1.9 },
      ],
    },
    funnelPerformance: {
      stages: [
        { stage: 'tofu', stageLabel: '인지 (TOFU)', campaignCount: 2, spend: 150000, budgetRatio: 33.3, impressions: 80000, clicks: 2200, conversions: 30, revenue: 500000, roas: 3.33, ctr: 2.75 },
        { stage: 'mofu', stageLabel: '고려 (MOFU)', campaignCount: 1, spend: 120000, budgetRatio: 26.7, impressions: 25000, clicks: 700, conversions: 35, revenue: 525000, roas: 4.38, ctr: 2.8 },
        { stage: 'bofu', stageLabel: '전환 (BOFU)', campaignCount: 2, spend: 180000, budgetRatio: 40.0, impressions: 20340, clicks: 556, conversions: 58, revenue: 1000000, roas: 5.56, ctr: 2.73 },
      ],
      totalBudget: 450000,
    },
    performanceAnalysis: {
      summary: '전체적으로 양호한 성과를 보이고 있습니다.',
      positiveFactors: [
        { title: 'ROAS 상승', description: 'ROAS가 지난주 대비 15% 상승했습니다.', impact: 'high' },
      ],
      negativeFactors: [
        { title: 'CTR 하락', description: 'CTR이 업계 평균보다 낮습니다.', impact: 'medium' },
      ],
    },
    recommendations: {
      actions: [
        {
          priority: 'high',
          category: 'creative',
          title: '크리에이티브 교체',
          description: '피로도가 높은 동영상 B를 새로운 소재로 교체하세요.',
          expectedImpact: 'CTR 20% 개선 예상',
        },
        {
          priority: 'medium',
          category: 'budget',
          title: '예산 재배분',
          description: 'ROAS가 높은 신규 고객 캠페인에 예산을 집중하세요.',
          expectedImpact: 'ROAS 10% 개선 예상',
        },
      ],
    },
  }
}

/**
 * Mock 공유 링크 생성 응답
 */
export function mockShareResponse(_reportId: string): ShareResponse {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  return {
    shareToken: 'test-share-token-abc123',
    shareExpiresAt: expiresAt,
    shareUrl: `http://localhost:3000/reports/share/test-share-token-abc123`,
  }
}

/**
 * Mock 보고서 생성 응답
 */
export function mockCreateReportResponse() {
  return {
    id: 'report-new-001',
    type: 'WEEKLY',
    status: 'GENERATED',
    dateRange: { startDate: '2026-03-10', endDate: '2026-03-16' },
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Mock 샘플 보고서 API 응답
 */
export function mockSampleReportResponse(): { success: boolean; data: ReportDetailData } {
  return {
    success: true,
    data: mockReportDetail('sample-report'),
  }
}

/**
 * Mock 공유 토큰으로 보고서 조회 응답
 */
export function mockSharedReportResponse(): ReportDetailData {
  return mockReportDetail('shared-report')
}
