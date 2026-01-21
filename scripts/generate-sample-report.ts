/**
 * 예시 PDF 보고서 생성 스크립트
 *
 * 가상의 "플로라 뷰티" 쇼핑몰 데이터로 주간 마케팅 보고서를 생성합니다.
 *
 * 실행 방법:
 *   npx tsx scripts/generate-sample-report.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { ReportPDFGenerator } from '../src/infrastructure/pdf/ReportPDFGenerator'
import type { ReportDTO } from '../src/application/dto/report/ReportDTO'
import { ReportType, type ReportSection, type AIInsight, type ReportSummaryMetrics } from '../src/domain/entities/Report'

// 예시 캠페인 섹션 데이터
const sampleSections: ReportSection[] = [
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
const sampleAIInsights: AIInsight[] = [
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
function calculateSummaryMetrics(sections: ReportSection[]): ReportSummaryMetrics {
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

// 예시 보고서 DTO 생성
const sampleReport: ReportDTO = {
  id: 'sample-001',
  type: ReportType.WEEKLY,
  userId: 'sample-user-001',
  campaignIds: ['campaign-001', 'campaign-002', 'campaign-003'],
  dateRange: {
    startDate: '2025-01-13',
    endDate: '2025-01-19',
  },
  sections: sampleSections,
  aiInsights: sampleAIInsights,
  summaryMetrics: calculateSummaryMetrics(sampleSections),
  status: 'GENERATED',
  generatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

async function main() {
  console.log('🚀 예시 PDF 보고서 생성 시작...\n')

  // 보고서 요약 출력
  console.log('📊 보고서 정보:')
  console.log(`   기간: ${sampleReport.dateRange.startDate} ~ ${sampleReport.dateRange.endDate}`)
  console.log(`   캠페인 수: ${sampleReport.sections.length}개`)
  console.log(`   AI 인사이트: ${sampleReport.aiInsights.length}개\n`)

  console.log('📈 성과 요약:')
  console.log(`   총 노출: ${sampleReport.summaryMetrics.totalImpressions.toLocaleString('ko-KR')}`)
  console.log(`   총 클릭: ${sampleReport.summaryMetrics.totalClicks.toLocaleString('ko-KR')}`)
  console.log(`   총 전환: ${sampleReport.summaryMetrics.totalConversions.toLocaleString('ko-KR')}`)
  console.log(
    `   총 지출: ${sampleReport.summaryMetrics.totalSpend.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW' })}`
  )
  console.log(
    `   총 매출: ${sampleReport.summaryMetrics.totalRevenue.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW' })}`
  )
  console.log(`   ROAS: ${sampleReport.summaryMetrics.overallROAS.toFixed(2)}x`)
  console.log(`   평균 CTR: ${sampleReport.summaryMetrics.averageCTR.toFixed(2)}%`)
  console.log(`   평균 CVR: ${sampleReport.summaryMetrics.averageCVR.toFixed(2)}%\n`)

  // PDF 생성
  console.log('📄 PDF 생성 중...')
  const generator = new ReportPDFGenerator()
  const result = await generator.generateWeeklyReport(sampleReport)

  // 파일 저장
  const outputPath = path.join(process.cwd(), result.filename)
  fs.writeFileSync(outputPath, result.buffer)

  console.log(`\n✅ PDF 생성 완료!`)
  console.log(`   파일명: ${result.filename}`)
  console.log(`   경로: ${outputPath}`)
  console.log(`   크기: ${(result.buffer.length / 1024).toFixed(2)} KB`)
}

main().catch((error) => {
  console.error('❌ 오류 발생:', error)
  process.exit(1)
})
