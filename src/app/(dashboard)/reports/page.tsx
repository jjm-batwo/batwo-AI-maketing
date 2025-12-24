'use client'

import { ReportList } from '@/presentation/components/report'
import { useReports, useDownloadReport } from '@/presentation/hooks'
import { useUIStore } from '@/presentation/stores'

export default function ReportsPage() {
  const { data, isLoading, error } = useReports()
  const downloadReport = useDownloadReport()
  const { addToast } = useUIStore()

  const reports = data?.reports || []

  const handleDownload = async (id: string) => {
    try {
      await downloadReport.mutateAsync(id)
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">보고서</h1>
        <p className="text-muted-foreground">
          AI가 생성한 성과 보고서를 확인하세요
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            보고서를 불러오는데 실패했습니다: {error.message}
          </p>
        </div>
      )}

      {/* Report List */}
      <ReportList
        reports={reports}
        isLoading={isLoading}
        onDownload={handleDownload}
      />
    </div>
  )
}
