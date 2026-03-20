'use client'

import { ReportDetail } from '@/presentation/components/report'
import { useDownloadReport } from '@/presentation/hooks'
import { toast } from 'sonner'

interface ReportDetailClientProps {
  report: Parameters<typeof ReportDetail>[0]['report']
  reportId: string
}

export function ReportDetailClient({ report, reportId }: ReportDetailClientProps) {
  const downloadReport = useDownloadReport()

  const handleDownload = async () => {
    try {
      await downloadReport.mutateAsync(reportId)
      toast.success('보고서가 다운로드되었습니다')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '다운로드에 실패했습니다')
    }
  }

  return (
    <ReportDetail
      report={report}
      isLoading={false}
      onDownload={handleDownload}
      onShareCreated={(_url) => {
        toast.success('공유 링크가 생성되었습니다.')
      }}
      onShareRevoked={() => {
        toast.success('공유 링크가 취소되었습니다.')
      }}
      onScheduleCreated={() => {
        toast.success('보고서 일정이 등록되었습니다.')
      }}
    />
  )
}
