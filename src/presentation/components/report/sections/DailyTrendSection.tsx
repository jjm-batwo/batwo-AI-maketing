'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyTrendSection as TrendData } from '@application/dto/report/EnhancedReportSections'

interface DailyTrendSectionProps {
  data: TrendData
}

export function DailyTrendSection({ data }: DailyTrendSectionProps) {
  if (data.days.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>일별 성과 추이</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">날짜</th>
                <th className="pb-2 pr-4 text-right">지출</th>
                <th className="pb-2 pr-4 text-right">매출</th>
                <th className="pb-2 pr-4 text-right">ROAS</th>
                <th className="pb-2 text-right">전환</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((d) => (
                <tr key={d.date} className="border-b last:border-0">
                  <td className="py-1.5 pr-4">{d.date}</td>
                  <td className="py-1.5 pr-4 text-right whitespace-nowrap">{d.spend.toLocaleString('ko-KR')}원</td>
                  <td className="py-1.5 pr-4 text-right whitespace-nowrap">{d.revenue.toLocaleString('ko-KR')}원</td>
                  <td className="py-1.5 pr-4 text-right">{d.roas.toFixed(2)}x</td>
                  <td className="py-1.5 text-right">{d.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
