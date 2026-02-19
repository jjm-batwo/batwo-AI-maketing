'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Calendar, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Report {
  id: string
  type: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  status: 'PENDING' | 'GENERATED' | 'SENT'
  dateRange: { startDate: string; endDate: string }
  generatedAt?: string
  campaignCount: number
}

interface ReportListProps {
  reports: Report[]
  isLoading?: boolean
  onDownload?: (id: string) => void
}

const typeLabels = {
  WEEKLY: '주간 보고서',
  MONTHLY: '월간 보고서',
  CUSTOM: '맞춤 보고서',
}

const statusConfig = {
  PENDING: { label: '생성 중', className: 'bg-yellow-500/15 text-yellow-500' },
  GENERATED: { label: '생성 완료', className: 'bg-green-500/15 text-green-500' },
  SENT: { label: '발송됨', className: 'bg-blue-500/15 text-blue-500' },
}

export function ReportList({ reports, isLoading = false, onDownload }: ReportListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">아직 보고서가 없어요</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          캠페인을 운영하면 자동으로 주간 보고서가 생성됩니다
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => {
        const status = statusConfig[report.status]
        return (
          <Card key={report.id} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {typeLabels[report.type]}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {report.dateRange.startDate} ~ {report.dateRange.endDate}
                    </span>
                    <span>·</span>
                    <span>캠페인 {report.campaignCount}개</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    status.className
                  )}
                >
                  {status.label}
                </span>
                {report.status === 'GENERATED' && onDownload && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(report.id)}
                  >
                    <Download className="mr-1 h-4 w-4" />
                    다운로드
                  </Button>
                )}
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/reports/${report.id}`}>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
