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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border/10 pb-6">
        <h1 className="text-3xl font-bold tracking-tight">보고서</h1>
        <p className="text-muted-foreground mt-2">
          AI가 분석한 주간 성과 보고서를 확인하세요
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
      <div className="glass-card rounded-2xl p-6">
        <ReportList
          reports={reports}
          isLoading={isLoading}
          onDownload={handleDownload}
        />
      </div>
    </div>
  )
}
