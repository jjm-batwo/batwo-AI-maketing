import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'

/**
 * Test Report Seed API
 *
 * E2E 테스트를 위한 보고서 데이터 시드
 * - 프로덕션에서는 비활성화됨
 * - 테스트 환경에서만 사용
 */

const enrichedData = {
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
      {
        date: '2026-03-10',
        spend: 65000,
        revenue: 290000,
        roas: 4.46,
        impressions: 18000,
        clicks: 500,
        conversions: 18,
      },
    ],
  },
  campaignPerformance: {
    campaigns: [
      {
        campaignId: 'camp-001',
        name: '신규 고객 캠페인',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
        impressions: 50000,
        clicks: 1400,
        conversions: 52,
        spend: 180000,
        revenue: 850000,
        roas: 4.72,
        ctr: 2.8,
      },
    ],
  },
  creativePerformance: {
    topN: 5,
    creatives: [
      {
        creativeId: 'cr-001',
        name: '이미지 A',
        format: 'IMAGE',
        impressions: 40000,
        clicks: 1200,
        conversions: 45,
        spend: 150000,
        revenue: 680000,
        roas: 4.53,
        ctr: 3.0,
      },
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
      {
        format: 'IMAGE',
        formatLabel: '이미지',
        adCount: 5,
        impressions: 60000,
        clicks: 1800,
        conversions: 60,
        spend: 200000,
        revenue: 900000,
        roas: 4.5,
        ctr: 3.0,
        avgFrequency: 2.1,
      },
    ],
  },
  funnelPerformance: {
    stages: [
      {
        stage: 'tofu',
        stageLabel: '인지 (TOFU)',
        campaignCount: 2,
        spend: 150000,
        budgetRatio: 33.3,
        impressions: 80000,
        clicks: 2200,
        conversions: 30,
        revenue: 500000,
        roas: 3.33,
        ctr: 2.75,
      },
    ],
    totalBudget: 450000,
  },
  performanceAnalysis: {
    summary: '전체적으로 양호한 성과를 보이고 있습니다.',
    positiveFactors: [
      {
        title: 'ROAS 상승',
        description: 'ROAS가 지난주 대비 15% 상승했습니다.',
        impact: 'high',
      },
    ],
    negativeFactors: [
      {
        title: 'CTR 하락',
        description: 'CTR이 업계 평균보다 낮습니다.',
        impact: 'medium',
      },
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
    ],
  },
}

const aiInsights = [
  { type: 'POSITIVE', message: 'ROAS가 지난주 대비 15% 상승했습니다.', confidence: 0.92 },
  { type: 'NEGATIVE', message: 'CTR이 업계 평균보다 낮습니다.', confidence: 0.85 },
  { type: 'SUGGESTION', message: '크리에이티브 A/B 테스트를 권장합니다.', confidence: 0.78 },
]

const sections = [
  { title: '캠페인 성과 요약', content: '<p>이번 주 캠페인 성과가 양호합니다.</p>' },
  {
    title: '크리에이티브 분석',
    content: '<p>이미지 광고가 동영상보다 높은 CTR을 기록했습니다.</p>',
  },
]

export async function GET() {
  // 프로덕션 환경에서는 차단
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // 개발 환경에서는 dev DB 사용 허용 (E2E 테스트용)

  try {
    console.log('[Seed Reports] Seeding report test data...')

    // 테스트 사용자 조회 (db-init에서 생성됨)
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: new Date(),
        globalRole: 'USER',
      },
    })

    // 기존 보고서 삭제 후 재생성
    await prisma.report.deleteMany({
      where: { userId: testUser.id },
    })

    // 1. WEEKLY GENERATED report (with enrichedData + shareToken)
    // 유니크 토큰으로 동시 시드 충돌 방지 (shareToken에 @unique 제약 있음)
    const shareToken = `test-share-token-e2e-${Date.now()}`
    const shareExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후

    const weeklyGeneratedReport = await prisma.report.create({
      data: {
        userId: testUser.id,
        type: 'WEEKLY',
        campaignIds: ['camp-001', 'camp-002', 'camp-003'],
        startDate: new Date('2026-03-10T00:00:00.000Z'),
        endDate: new Date('2026-03-16T23:59:59.000Z'),
        sections: sections as unknown as Parameters<
          typeof prisma.report.create
        >[0]['data']['sections'],
        aiInsights: aiInsights as unknown as Parameters<
          typeof prisma.report.create
        >[0]['data']['aiInsights'],
        status: 'GENERATED',
        generatedAt: new Date('2026-03-17T09:00:00.000Z'),
        enrichedData: enrichedData as unknown as Parameters<
          typeof prisma.report.create
        >[0]['data']['enrichedData'],
        shareToken,
        shareExpiresAt,
      },
    })

    // 2. MONTHLY GENERATED report (5 campaigns, no shareToken)
    const monthlyGeneratedReport = await prisma.report.create({
      data: {
        userId: testUser.id,
        type: 'MONTHLY',
        campaignIds: ['camp-001', 'camp-002', 'camp-003', 'camp-004', 'camp-005'],
        startDate: new Date('2026-02-01T00:00:00.000Z'),
        endDate: new Date('2026-02-28T23:59:59.000Z'),
        sections: sections as unknown as Parameters<
          typeof prisma.report.create
        >[0]['data']['sections'],
        aiInsights: aiInsights as unknown as Parameters<
          typeof prisma.report.create
        >[0]['data']['aiInsights'],
        status: 'GENERATED',
        generatedAt: new Date('2026-03-01T09:00:00.000Z'),
      },
    })

    // 3. WEEKLY DRAFT report (2 campaigns, pending generation)
    const weeklyDraftReport = await prisma.report.create({
      data: {
        userId: testUser.id,
        type: 'WEEKLY',
        campaignIds: ['camp-001', 'camp-002'],
        startDate: new Date('2026-03-17T00:00:00.000Z'),
        endDate: new Date('2026-03-23T23:59:59.000Z'),
        sections: [],
        aiInsights: [],
        status: 'DRAFT',
      },
    })

    console.log('[Seed Reports] Reports seeded successfully')

    // ISR 캐시 무효화 — 목록 페이지가 새 데이터를 즉시 반영하도록
    revalidateTag('reports', 'default')

    return NextResponse.json({
      success: true,
      message: 'Report test data seeded',
      data: {
        reports: {
          weeklyGenerated: { id: weeklyGeneratedReport.id, type: 'WEEKLY', status: 'GENERATED' },
          monthlyGenerated: { id: monthlyGeneratedReport.id, type: 'MONTHLY', status: 'GENERATED' },
          weeklyPending: { id: weeklyDraftReport.id, type: 'WEEKLY', status: 'DRAFT' },
          withShareToken: {
            id: weeklyGeneratedReport.id,
            shareToken,
            type: 'WEEKLY',
            status: 'GENERATED',
          },
        },
        userId: testUser.id,
      },
    })
  } catch (error) {
    console.error('[Seed Reports] Error seeding report data:', error)

    if (error instanceof Error && error.message.includes('PrismaClient')) {
      return NextResponse.json({
        success: false,
        message: 'Database not available - skipping seed',
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * 보고서 테스트 데이터 정리
 */
export async function DELETE() {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // 개발 환경에서는 dev DB 사용 허용 (E2E 테스트용)

  try {
    console.log('[Seed Reports] Cleaning up report test data...')

    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    })

    if (testUser) {
      await prisma.report.deleteMany({
        where: { userId: testUser.id },
      })
    }

    // ISR 캐시 무효화 — 빈 상태 페이지가 즉시 반영되도록
    revalidateTag('reports', 'default')

    console.log('[Seed Reports] Report test data cleaned up')

    return NextResponse.json({
      success: true,
      message: 'Report test data cleaned up',
    })
  } catch (error) {
    console.error('[Seed Reports] Error cleaning up:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
