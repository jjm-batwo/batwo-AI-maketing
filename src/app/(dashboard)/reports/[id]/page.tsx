'use client'

import { useParams, useRouter } from 'next/navigation'
import { ReportDetail } from '@/presentation/components/report'
import { useReport, useDownloadReport, useShareReport } from '@/presentation/hooks'
import { useUIStore } from '@/presentation/stores'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useUIStore()

  const reportId = params.id as string
  const { data: report, isLoading, error } = useReport(reportId)
  const downloadReport = useDownloadReport()
  const shareReport = useShareReport()

  const handleDownload = async () => {
    try {
      await downloadReport.mutateAsync(reportId)
      addToast({
        type: 'success',
        message: '보고서가 다운로드되었습니다',
      })
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : '다운로드에 실패했습니다',
      })
    }
  }

  const handleShare = async () => {
    // In production, this would open a modal to enter email
    const email = prompt('보고서를 공유할 이메일 주소를 입력하세요:')
    if (!email) return

    try {
      await shareReport.mutateAsync({ id: reportId, email })
      addToast({
        type: 'success',
        message: `${email}로 보고서가 공유되었습니다`,
      })
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : '공유에 실패했습니다',
      })
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            보고서를 불러오는데 실패했습니다: {error.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로가기
      </Button>

      {report && (
        <ReportDetail
          report={report}
          isLoading={isLoading}
          onDownload={handleDownload}
          onShare={handleShare}
        />
      )}

      {isLoading && !report && (
        <ReportDetail
          report={{
            id: '',
            type: 'WEEKLY',
            dateRange: { startDate: '', endDate: '' },
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
            aiInsights: [],
            sections: [],
          }}
          isLoading={true}
        />
      )}
    </div>
  )
}
