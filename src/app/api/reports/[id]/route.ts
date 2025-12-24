import { NextRequest, NextResponse } from 'next/server'

// Mock report detail data
const mockReportDetails = new Map([
  ['1', {
    id: '1',
    type: 'WEEKLY',
    status: 'GENERATED',
    dateRange: {
      startDate: '2024-06-10',
      endDate: '2024-06-16',
    },
    summaryMetrics: {
      totalImpressions: 450000,
      totalClicks: 13500,
      totalConversions: 360,
      totalSpend: 1050000,
      totalRevenue: 3360000,
      averageRoas: 3.2,
      averageCtr: 3.0,
      averageCpa: 2917,
    },
    aiInsights: [
      {
        type: 'POSITIVE',
        message: '전주 대비 ROAS가 15% 향상되었습니다. 특히 "여름 시즌 프로모션" 캠페인의 전환율이 크게 개선되었습니다.',
        confidence: 0.92,
      },
      {
        type: 'SUGGESTION',
        message: '25-34세 여성 타겟에서 높은 전환율을 보이고 있습니다. 해당 세그먼트에 예산을 더 배분하는 것을 권장합니다.',
        confidence: 0.85,
      },
      {
        type: 'NEGATIVE',
        message: '모바일 기기에서의 CTR이 데스크톱 대비 40% 낮습니다. 모바일 크리에이티브 최적화가 필요합니다.',
        confidence: 0.88,
      },
    ],
    sections: [
      {
        title: '주요 성과 요약',
        content: '<p>이번 주 광고 캠페인은 전반적으로 좋은 성과를 보였습니다. 총 <strong>1,050,000원</strong>의 예산으로 <strong>360건</strong>의 전환을 달성했으며, ROAS <strong>3.2x</strong>를 기록했습니다.</p>',
      },
      {
        title: '캠페인별 분석',
        content: '<p><strong>여름 시즌 프로모션</strong>: 가장 높은 성과를 보인 캠페인으로, ROAS 4.1x를 달성했습니다.</p><p><strong>신규 고객 유입</strong>: 클릭률은 높으나 전환율 개선이 필요합니다.</p>',
      },
      {
        title: '다음 주 권장 사항',
        content: '<ul><li>모바일 크리에이티브 A/B 테스트 진행</li><li>25-34세 여성 타겟 예산 20% 증액</li><li>저녁 시간대 광고 노출 강화</li></ul>',
      },
    ],
    campaigns: [
      {
        id: '1',
        name: '여름 시즌 프로모션',
        metrics: {
          spend: 500000,
          impressions: 200000,
          clicks: 7000,
          conversions: 200,
          roas: 4.1,
        },
      },
      {
        id: '2',
        name: '신규 고객 유입',
        metrics: {
          spend: 350000,
          impressions: 150000,
          clicks: 4500,
          conversions: 110,
          roas: 2.8,
        },
      },
    ],
    generatedAt: '2024-06-17T09:00:00Z',
  }],
])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = mockReportDetails.get(id)

    if (!report) {
      return NextResponse.json(
        { message: '보고서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Failed to fetch report:', error)
    return NextResponse.json(
      { message: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}
