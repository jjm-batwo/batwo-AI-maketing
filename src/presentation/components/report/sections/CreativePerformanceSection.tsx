'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CreativePerformanceSection as CreativeData } from '@application/dto/report/EnhancedReportSections'

interface CreativePerformanceSectionProps {
  data: CreativeData
}

export function CreativePerformanceSection({ data }: CreativePerformanceSectionProps) {
  if (data.creatives.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>소재별 성과 TOP {data.topN}</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">소재</th>
                <th className="pb-2 pr-4">포맷</th>
                <th className="pb-2 pr-4 text-right">ROAS</th>
                <th className="pb-2 pr-4 text-right">CTR</th>
                <th className="pb-2 pr-4 text-right">전환</th>
                <th className="pb-2 text-right">지출</th>
              </tr>
            </thead>
            <tbody>
              {data.creatives.map((c, i) => (
                <tr key={c.creativeId} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{i + 1}. {c.name}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">{c.format}</td>
                  <td className="py-2 pr-4 text-right font-medium">{c.roas.toFixed(2)}x</td>
                  <td className="py-2 pr-4 text-right">{c.ctr.toFixed(2)}%</td>
                  <td className="py-2 pr-4 text-right">{c.conversions}</td>
                  <td className="py-2 text-right whitespace-nowrap">{c.spend.toLocaleString('ko-KR')}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
