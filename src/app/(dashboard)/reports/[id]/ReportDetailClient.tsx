'use client'

import { ReportDetail } from '@/presentation/components/report'
import { useDownloadReport, useShareReport } from '@/presentation/hooks'
import { useUIStore } from '@/presentation/stores'

interface ReportDetailClientProps {
  report: any
  reportId: string
}

export function ReportDetailClient({ report, reportId }: ReportDetailClientProps) {
  const { addToast } = useUIStore()
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

  return (
    <ReportDetail
      report={report}
      isLoading={false}
      onDownload={handleDownload}
      onShare={handleShare}
    />
  )
}
