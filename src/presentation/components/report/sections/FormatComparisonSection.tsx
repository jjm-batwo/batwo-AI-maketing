'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FormatComparisonSection as FormatData } from '@application/dto/report/EnhancedReportSections'

export function FormatComparisonSection({ data }: { data: FormatData }) {
  if (data.formats.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>소재 포맷별 성과</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {data.formats.map((f) => (
            <div key={f.format} className="rounded-lg border p-4">
              <p className="font-semibold">{f.formatLabel}</p>
              <p className="text-xs text-muted-foreground mb-2">{f.adCount}개 광고</p>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">ROAS</span>
                <span className="text-right font-medium">{f.roas.toFixed(2)}x</span>
                <span className="text-muted-foreground">CTR</span>
                <span className="text-right">{f.ctr.toFixed(2)}%</span>
                <span className="text-muted-foreground">지출</span>
                <span className="text-right whitespace-nowrap">{f.spend.toLocaleString('ko-KR')}원</span>
                <span className="text-muted-foreground">전환</span>
                <span className="text-right">{f.conversions}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
