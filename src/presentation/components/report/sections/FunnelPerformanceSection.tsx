'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FunnelPerformanceSection as FunnelData } from '@application/dto/report/EnhancedReportSections'

interface FunnelPerformanceSectionProps {
  data: FunnelData
}

export function FunnelPerformanceSection({ data }: FunnelPerformanceSectionProps) {
  if (data.stages.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>퍼널 단계별 성과</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {data.stages.map((s) => (
          <div key={s.stage} className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold">{s.stageLabel}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.campaignCount}개 캠페인</span>
              </div>
              <span className="text-sm text-muted-foreground">예산 비중 {s.budgetRatio.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(s.budgetRatio, 100)}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div><p className="text-xs text-muted-foreground">지출</p><p className="font-medium">{s.spend.toLocaleString('ko-KR')}원</p></div>
              <div><p className="text-xs text-muted-foreground">ROAS</p><p className="font-medium">{s.roas.toFixed(2)}x</p></div>
              <div><p className="text-xs text-muted-foreground">CTR</p><p className="font-medium">{s.ctr.toFixed(2)}%</p></div>
              <div><p className="text-xs text-muted-foreground">전환</p><p className="font-medium">{s.conversions}</p></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
