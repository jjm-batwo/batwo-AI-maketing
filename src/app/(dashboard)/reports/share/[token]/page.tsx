import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportDetail } from '@/presentation/components/report'

export const metadata: Metadata = {
  title: '공유 보고서 | 바투',
  description: '공유된 마케팅 성과 보고서를 확인하세요',
}

interface SharedReportPageProps {
  params: Promise<{ token: string }>
}

export default async function SharedReportPage({ params }: SharedReportPageProps) {
  const { token } = await params

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  let report: Parameters<typeof ReportDetail>[0]['report'] | null = null
  let errorMessage: string | null = null

  try {
    const res = await fetch(`${baseUrl}/api/reports/share/${token}`, {
      next: { revalidate: 0 },
    })

    if (res.status === 404) {
      errorMessage = '유효하지 않은 공유 링크입니다'
    } else if (res.status === 410) {
      errorMessage = '공유 링크가 만료되었습니다'
    } else if (!res.ok) {
      errorMessage = '보고서를 불러오는 데 실패했습니다'
    } else {
      const data = await res.json()

      // toCreateInput returns startDate/endDate at top level as ISO strings.
      // Map to the shape ReportDetail expects.
      report = {
        id: data.id,
        type: data.type,
        dateRange: {
          startDate: data.startDate,
          endDate: data.endDate,
        },
        shareToken: data.shareToken ?? null,
        shareExpiresAt: data.shareExpiresAt ?? null,
        sections: Array.isArray(data.sections) ? data.sections : [],
        aiInsights: Array.isArray(data.aiInsights) ? data.aiInsights : [],
        summaryMetrics: {
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalSpend: 0,
          totalRevenue: 0,
          averageRoas: 0,
          averageCtr: 0,
          averageCpa: 0,
        },
        // Enhanced sections from enrichedData (if present)
        ...(data.enrichedData
          ? {
              overallSummary: data.enrichedData.overallSummary,
              dailyTrend: data.enrichedData.dailyTrend,
              campaignPerformance: data.enrichedData.campaignPerformance,
              creativePerformance: data.enrichedData.creativePerformance,
              creativeFatigue: data.enrichedData.creativeFatigue,
              formatComparison: data.enrichedData.formatComparison,
              funnelPerformance: data.enrichedData.funnelPerformance,
              performanceAnalysis: data.enrichedData.performanceAnalysis,
              recommendations: data.enrichedData.recommendations,
            }
          : {}),
      }
    }
  } catch {
    errorMessage = '보고서를 불러오는 데 실패했습니다'
  }

  if (errorMessage) {
    return (
      <div data-testid="shared-report-viewer" className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            보고서 목록
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div data-testid="shared-report-viewer" className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            보고서 목록
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">보고서를 찾을 수 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="shared-report-viewer" className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/reports">
          <ArrowLeft className="mr-2 h-4 w-4" />
          보고서 목록
        </Link>
      </Button>
      <ReportDetail report={report} isLoading={false} />
    </div>
  )
}
