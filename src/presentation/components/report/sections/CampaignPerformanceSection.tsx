'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CampaignPerformanceSection as CampaignData } from '@application/dto/report/EnhancedReportSections'

interface CampaignPerformanceSectionProps {
  data: CampaignData
}

export function CampaignPerformanceSection({ data }: CampaignPerformanceSectionProps) {
  if (data.campaigns.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>캠페인별 성과</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">캠페인</th>
                <th className="pb-2 pr-4 text-right">지출</th>
                <th className="pb-2 pr-4 text-right">매출</th>
                <th className="pb-2 pr-4 text-right">ROAS</th>
                <th className="pb-2 pr-4 text-right">CTR</th>
                <th className="pb-2 text-right">전환</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr key={c.campaignId} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.objective} · {c.status}</p>
                  </td>
                  <td className="py-2 pr-4 text-right whitespace-nowrap">{c.spend.toLocaleString('ko-KR')}원</td>
                  <td className="py-2 pr-4 text-right whitespace-nowrap">{c.revenue.toLocaleString('ko-KR')}원</td>
                  <td className="py-2 pr-4 text-right">{c.roas.toFixed(2)}x</td>
                  <td className="py-2 pr-4 text-right">{c.ctr.toFixed(2)}%</td>
                  <td className="py-2 text-right">{c.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
