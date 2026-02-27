'use client'

import { ReportList } from '@/presentation/components/report'
import { useDownloadReport } from '@/presentation/hooks'
import { useUIStore } from '@/presentation/stores'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

interface ReportsClientProps {
  initialReports: Parameters<typeof ReportList>[0]['reports']
}

export function ReportsClient({ initialReports }: ReportsClientProps) {
  const downloadReport = useDownloadReport()
  const { addToast, openChatPanel } = useUIStore()

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
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">보고서</h1>
          <p className="text-muted-foreground mt-2">AI가 분석한 주간 성과 보고서를 확인하세요</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
          onClick={openChatPanel}
        >
          <Sparkles className="h-4 w-4 text-primary" />
          AI 인사이트
        </Button>
      </div>

      {/* Report List */}
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <ReportList reports={initialReports} isLoading={false} onDownload={handleDownload} />
      </div>
    </div>
  )
}
