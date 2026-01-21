/**
 * 예시 보고서 데이터
 *
 * 가상의 "플로라 뷰티" 쇼핑몰 데이터로 웹 프리뷰 및 PDF 생성에 사용됩니다.
 */

import { ReportType, type ReportSection, type AIInsight, type ReportSummaryMetrics } from '@domain/entities/Report'
import type { ReportDTO } from '@application/dto/report/ReportDTO'

// 예시 캠페인 섹션 데이터
export const sampleSections: ReportSection[] = [
  {
    title: '프리미엄 스킨케어 세트 - 전환 캠페인',
    content: '25-45세 여성 타겟, 프리미엄 스킨케어 세트 판매 촉진 캠페인',
    metrics: {
      impressions: 425000,
      clicks: 12750,
      conversions: 128,
      spend: 1250000,
      revenue: 6400000,
    },
  },
  {
    title: '신규 고객 유치 - 브랜드 인지도 캠페인',
    content: '18-35세 여성 신규 고객 유치를 위한 브랜드 인지도 캠페인',
    metrics: {
      impressions: 318000,
      clicks: 6360,
      conversions: 38,
      spend: 750000,
      revenue: 1710000,
    },
  },
  {
    title: '리타겟팅 - 장바구니 이탈 고객',
    content: '최근 30일 내 장바구니에 상품을 담고 이탈한 고객 대상 리타겟팅',
    metrics: {
      impressions: 100000,
      clicks: 2510,
      conversions: 20,
      spend: 450000,
      revenue: 1200000,
    },
  },
]

// 예시 AI 인사이트 데이터
export const sampleAIInsights: AIInsight[] = [
  {
    type: 'performance',
    insight:
      '프리미엄 스킨케어 세트 캠페인이 ROAS 5.12x로 가장 높은 성과를 보이고 있습니다. 특히 25-34세 여성 세그먼트에서 전환율이 평균 대비 40% 높게 나타났습니다.',
    confidence: 0.92,
    recommendations: [
      '해당 세그먼트에 예산을 20% 추가 배분을 권장합니다',
      '유사 타겟 확장을 통해 도달 범위를 넓히세요',
      '최고 성과 크리에이티브를 다른 캠페인에도 적용해 보세요',
    ],
  },
  {
    type: 'recommendation',
    insight:
      '신규 고객 유치 캠페인의 CTR이 2.0%로 양호하나, 전환율(0.6%)이 업계 평균(1.2%) 대비 낮습니다. 랜딩 페이지 최적화가 필요해 보입니다.',
    confidence: 0.85,
    recommendations: [
      '랜딩 페이지 로딩 속도를 3초 이내로 개선하세요',
      '첫 구매 할인 혜택을 더 눈에 띄게 배치하세요',
      '고객 후기 섹션을 상단에 추가하세요',
    ],
  },
  {
    type: 'anomaly',
    insight:
      '리타겟팅 캠페인의 CPC가 전주 대비 15% 상승했습니다. 경쟁사 프로모션 시즌으로 인한 입찰 경쟁이 원인으로 분석됩니다.',
    confidence: 0.78,
    recommendations: [
      '입찰 전략을 Target CPA로 변경하여 비용 효율성을 높이세요',
      '크리에이티브 다양화로 광고 피로도를 낮추세요',
      '프로모션 시즌 종료 후 입찰가 재조정을 계획하세요',
    ],
  },
]

// 요약 지표 계산
export function calculateSummaryMetrics(sections: ReportSection[]): ReportSummaryMetrics {
  let totalImpressions = 0
  let totalClicks = 0
  let totalConversions = 0
  let totalSpend = 0
  let totalRevenue = 0

  for (const section of sections) {
    if (section.metrics) {
      totalImpressions += section.metrics.impressions || 0
      totalClicks += section.metrics.clicks || 0
      totalConversions += section.metrics.conversions || 0
      totalSpend += section.metrics.spend || 0
      totalRevenue += section.metrics.revenue || 0
    }
  }

  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const averageCVR = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

  return {
    totalImpressions,
    totalClicks,
    totalConversions,
    totalSpend,
    totalRevenue,
    overallROAS,
    averageCTR,
    averageCVR,
  }
}

// 예시 보고서 날짜 범위 (최근 1주일 기준으로 동적 생성)
function getSampleDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 6) // 7일 범위

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

// 예시 보고서 DTO 생성
export function getSampleReportDTO(): ReportDTO {
  const dateRange = getSampleDateRange()

  return {
    id: 'sample-001',
    type: ReportType.WEEKLY,
    userId: 'sample-user-001',
    campaignIds: ['campaign-001', 'campaign-002', 'campaign-003'],
    dateRange,
    sections: sampleSections,
    aiInsights: sampleAIInsights,
    summaryMetrics: calculateSummaryMetrics(sampleSections),
    status: 'GENERATED',
    generatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// 웹 뷰어용 변환 (ReportDetail 컴포넌트 호환)
export function getSampleReportForWebViewer() {
  const report = getSampleReportDTO()

  // ReportDetail 컴포넌트에서 사용하는 형식으로 변환
  return {
    id: report.id,
    type: report.type,
    dateRange: report.dateRange,
    summaryMetrics: {
      totalImpressions: report.summaryMetrics.totalImpressions,
      totalClicks: report.summaryMetrics.totalClicks,
      totalConversions: report.summaryMetrics.totalConversions,
      totalSpend: report.summaryMetrics.totalSpend,
      totalRevenue: report.summaryMetrics.totalRevenue,
      averageRoas: report.summaryMetrics.overallROAS,
      averageCtr: report.summaryMetrics.averageCTR,
      averageCpa:
        report.summaryMetrics.totalConversions > 0
          ? report.summaryMetrics.totalSpend / report.summaryMetrics.totalConversions
          : 0,
    },
    aiInsights: report.aiInsights.map((insight) => ({
      type:
        insight.type === 'performance'
          ? ('POSITIVE' as const)
          : insight.type === 'anomaly'
            ? ('NEGATIVE' as const)
            : ('SUGGESTION' as const),
      message: insight.insight,
      confidence: insight.confidence,
    })),
    sections: report.sections.map((section) => ({
      title: section.title,
      content: section.content,
      metrics: section.metrics,
    })),
  }
}
