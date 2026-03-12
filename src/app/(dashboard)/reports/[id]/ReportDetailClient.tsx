'use client'

import { ReportDetail } from '@/presentation/components/report'
import { useDownloadReport } from '@/presentation/hooks'
import { useUIStore } from '@/presentation/stores'

interface ReportDetailClientProps {
  report: Parameters<typeof ReportDetail>[0]['report']
  reportId: string
}

export function ReportDetailClient({ report, reportId }: ReportDetailClientProps) {
  const { addToast } = useUIStore()
  const downloadReport = useDownloadReport()

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

  return (
    <ReportDetail
      report={report}
      isLoading={false}
      onDownload={handleDownload}
      onShareCreated={(_url) => {
        addToast({ type: 'success', message: '공유 링크가 생성되었습니다.' })
      }}
      onShareRevoked={() => {
        addToast({ type: 'success', message: '공유 링크가 취소되었습니다.' })
      }}
      onScheduleCreated={() => {
        addToast({ type: 'success', message: '보고서 일정이 등록되었습니다.' })
      }}
    />
  )
}
