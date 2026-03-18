import { ReportType } from '@domain/entities/Report'
import type { ReportDTO } from '@application/dto/report/ReportDTO'

function getSampleDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 6)
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

export function getSampleEnhancedReportDTO(): ReportDTO {
  const dateRange = getSampleDateRange()

  return {
    id: 'sample-enhanced-001',
    type: ReportType.WEEKLY,
    userId: 'sample-user-001',
    campaignIds: ['campaign-001', 'campaign-002', 'campaign-003'],
    dateRange,
    status: 'GENERATED',

    sections: [],
    aiInsights: [],
    summaryMetrics: {
      totalImpressions: 843000,
      totalClicks: 21620,
      totalConversions: 186,
      totalSpend: 2_450_000,
      totalRevenue: 9_310_000,
      overallROAS: 3.80,
      averageCTR: 2.56,
      averageCVR: 0.86,
    },

    overallSummary: {
      totalSpend: 2_450_000,
      totalRevenue: 9_310_000,
      roas: 3.80,
      ctr: 2.56,
      totalConversions: 186,
      changes: {
        spend:       { value: 5.2,  direction: 'up',   isPositive: false },
        revenue:     { value: 12.8, direction: 'up',   isPositive: true },
        roas:        { value: 7.2,  direction: 'up',   isPositive: true },
        ctr:         { value: -1.3, direction: 'down', isPositive: false },
        conversions: { value: 15.4, direction: 'up',   isPositive: true },
      },
    },

    dailyTrend: {
      days: [
        { date: '2026-03-10', spend: 340000, revenue: 1280000, roas: 3.76, impressions: 120000, clicks: 3100, conversions: 24 },
        { date: '2026-03-11', spend: 355000, revenue: 1350000, roas: 3.80, impressions: 125000, clicks: 3200, conversions: 26 },
        { date: '2026-03-12', spend: 360000, revenue: 1420000, roas: 3.94, impressions: 128000, clicks: 3350, conversions: 28 },
        { date: '2026-03-13', spend: 345000, revenue: 1310000, roas: 3.80, impressions: 122000, clicks: 3100, conversions: 25 },
        { date: '2026-03-14', spend: 350000, revenue: 1350000, roas: 3.86, impressions: 124000, clicks: 3180, conversions: 27 },
        { date: '2026-03-15', spend: 360000, revenue: 1400000, roas: 3.89, impressions: 130000, clicks: 3400, conversions: 29 },
        { date: '2026-03-16', spend: 340000, revenue: 1200000, roas: 3.53, impressions: 118000, clicks: 2950, conversions: 27 },
      ],
    },

    campaignPerformance: {
      campaigns: [
        { campaignId: 'campaign-001', name: '프리미엄 스킨케어 세트 - 전환', objective: 'CONVERSIONS', status: 'ACTIVE', impressions: 425000, clicks: 12750, conversions: 128, spend: 1250000, revenue: 6400000, roas: 5.12, ctr: 3.0 },
        { campaignId: 'campaign-002', name: '신규 고객 유치 - 브랜드 인지도', objective: 'AWARENESS', status: 'ACTIVE', impressions: 318000, clicks: 6360, conversions: 38, spend: 750000, revenue: 1710000, roas: 2.28, ctr: 2.0 },
        { campaignId: 'campaign-003', name: '리타겟팅 - 장바구니 이탈', objective: 'CONVERSIONS', status: 'ACTIVE', impressions: 100000, clicks: 2510, conversions: 20, spend: 450000, revenue: 1200000, roas: 2.67, ctr: 2.51 },
      ],
    },

    creativePerformance: {
      topN: 5,
      creatives: [
        { creativeId: 'cr-001', name: '봄 신상 세트 A', format: 'SINGLE_IMAGE', impressions: 180000, clicks: 5400, conversions: 62, spend: 520000, revenue: 3100000, roas: 5.96, ctr: 3.0 },
        { creativeId: 'cr-002', name: '모델 착용 영상 B', format: 'SINGLE_VIDEO', impressions: 150000, clicks: 4500, conversions: 45, spend: 420000, revenue: 2250000, roas: 5.36, ctr: 3.0 },
        { creativeId: 'cr-003', name: '베스트셀러 카루셀', format: 'CAROUSEL', impressions: 95000, clicks: 2850, conversions: 21, spend: 310000, revenue: 1050000, roas: 3.39, ctr: 3.0 },
        { creativeId: 'cr-004', name: '리뷰 영상 C', format: 'SINGLE_VIDEO', impressions: 100000, clicks: 2000, conversions: 18, spend: 250000, revenue: 900000, roas: 3.60, ctr: 2.0 },
        { creativeId: 'cr-005', name: '할인 배너 D', format: 'SINGLE_IMAGE', impressions: 120000, clicks: 2400, conversions: 15, spend: 300000, revenue: 750000, roas: 2.50, ctr: 2.0 },
      ],
    },

    creativeFatigue: {
      creatives: [
        { creativeId: 'cr-005', name: '할인 배너 D', format: 'SINGLE_IMAGE', frequency: 4.2, ctr: 1.8, ctrTrend: [2.8, 2.5, 2.3, 2.1, 2.0, 1.9, 1.8], fatigueScore: 78, fatigueLevel: 'critical', activeDays: 21, recommendation: 'CTR이 7일간 36% 하락. 즉시 소재 교체 권장.' },
        { creativeId: 'cr-004', name: '리뷰 영상 C', format: 'SINGLE_VIDEO', frequency: 3.1, ctr: 2.0, ctrTrend: [2.4, 2.3, 2.2, 2.1, 2.1, 2.0, 2.0], fatigueScore: 52, fatigueLevel: 'warning', activeDays: 14, recommendation: 'Frequency 3.1 도달. 1주 내 교체 검토 필요.' },
        { creativeId: 'cr-001', name: '봄 신상 세트 A', format: 'SINGLE_IMAGE', frequency: 1.8, ctr: 3.0, ctrTrend: [2.9, 2.9, 3.0, 3.0, 3.1, 3.0, 3.0], fatigueScore: 15, fatigueLevel: 'healthy', activeDays: 7, recommendation: '양호. 현재 소재 유지.' },
      ],
    },

    formatComparison: {
      formats: [
        { format: 'SINGLE_IMAGE', formatLabel: '이미지', adCount: 5, impressions: 300000, clicks: 7800, conversions: 77, spend: 820000, revenue: 3850000, roas: 4.70, ctr: 2.6, avgFrequency: 2.5 },
        { format: 'SINGLE_VIDEO', formatLabel: '동영상', adCount: 3, impressions: 250000, clicks: 6500, conversions: 63, spend: 670000, revenue: 3150000, roas: 4.70, ctr: 2.6, avgFrequency: 2.2, videoViews: 180000, thruPlayRate: 28.5 },
        { format: 'CAROUSEL', formatLabel: '카루셀', adCount: 2, impressions: 95000, clicks: 2850, conversions: 21, spend: 310000, revenue: 1050000, roas: 3.39, ctr: 3.0, avgFrequency: 1.9 },
      ],
    },

    funnelPerformance: {
      stages: [
        { stage: 'tofu', stageLabel: '인지 (ToFu)', campaignCount: 1, spend: 750000, budgetRatio: 30.6, impressions: 318000, clicks: 6360, conversions: 38, revenue: 1710000, roas: 2.28, ctr: 2.0 },
        { stage: 'mofu', stageLabel: '고려 (MoFu)', campaignCount: 0, spend: 0, budgetRatio: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, roas: 0, ctr: 0 },
        { stage: 'bofu', stageLabel: '전환 (BoFu)', campaignCount: 2, spend: 1700000, budgetRatio: 69.4, impressions: 525000, clicks: 15260, conversions: 148, revenue: 7600000, roas: 4.47, ctr: 2.91 },
      ],
      totalBudget: 2450000,
    },

    performanceAnalysis: {
      summary: '이번 주 전체 ROAS 3.80x로 전주(3.55x) 대비 7.2% 상승했습니다. 프리미엄 스킨케어 세트 캠페인이 5.12x ROAS로 전체 수익의 68.7%를 견인했으며, 봄 시즌 수요 증가와 25-34세 여성 타겟의 높은 전환율이 주요 성공 요인입니다.',
      positiveFactors: [
        { title: '시즌 수요 증가', description: '봄 시즌 진입으로 스킨케어 카테고리 검색량 22% 증가. 적시에 프로모션을 배치한 것이 효과적이었습니다.', impact: 'high' },
        { title: '소재 최적화 효과', description: '"봄 신상 세트 A" 소재가 CTR 3.0%로 계정 평균 대비 17% 높은 성과를 기록했습니다.', relatedCreatives: ['cr-001'], impact: 'medium' },
      ],
      negativeFactors: [
        { title: '리타겟팅 효율 저하', description: 'CPC가 전주 대비 15% 상승하여 리타겟팅 캠페인의 ROAS가 2.67x로 목표(3.0x) 미달.', relatedCampaigns: ['campaign-003'], impact: 'high' },
        { title: '소재 피로도 증가', description: '"할인 배너 D" 소재의 CTR이 7일간 36% 하락. Frequency 4.2로 소재 수명 초과.', relatedCreatives: ['cr-005'], impact: 'medium' },
      ],
    },

    recommendations: {
      actions: [
        { priority: 'high', category: 'creative', title: '할인 배너 D 소재 교체', description: 'Frequency 4.2, CTR 36% 하락. 새로운 프로모션 소재로 즉시 교체하세요.', expectedImpact: 'CTR 1.5~2.0% 회복, 전환 10~15건/주 증가 예상' },
        { priority: 'high', category: 'budget', title: '프리미엄 스킨케어 캠페인 예산 증액', description: 'ROAS 5.12x로 우수한 성과. 일 예산 20% 증액 권장.', expectedImpact: '주당 매출 약 1,280,000원 추가 예상' },
        { priority: 'medium', category: 'funnel', title: 'MoFu 캠페인 신설', description: '현재 MoFu 단계 캠페인 부재. 인지 -> 전환 사이 고려 단계 캠페인으로 전환율 개선 가능.', expectedImpact: '전체 퍼널 전환율 15~20% 개선 예상' },
        { priority: 'medium', category: 'targeting', title: '리타겟팅 타겟 세분화', description: '장바구니 이탈 고객 중 최근 7일 이탈자와 30일 이탈자를 분리하여 메시지 차별화.', expectedImpact: 'CPC 10~15% 절감, 전환율 0.3%p 개선 예상' },
        { priority: 'low', category: 'creative', title: '동영상 소재 비중 확대', description: '동영상 포맷이 이미지 대비 동일 ROAS이나, 완전 재생율(thruPlayRate) 28.5%로 브랜드 인지 효과 우수.', expectedImpact: '장기적 브랜드 인지도 향상, 리타겟팅 풀 확대' },
      ],
    },

    generatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
