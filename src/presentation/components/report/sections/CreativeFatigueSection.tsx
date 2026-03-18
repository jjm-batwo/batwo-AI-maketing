'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CreativeFatigueSection as FatigueData, FatigueLevel } from '@application/dto/report/EnhancedReportSections'

const LEVEL_STYLES: Record<FatigueLevel, { bg: string; text: string; label: string }> = {
  healthy: { bg: 'bg-green-100', text: 'text-green-800', label: '양호' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '주의' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', label: '위험' },
}

export function CreativeFatigueSection({ data }: { data: FatigueData }) {
  if (data.creatives.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>소재 피로도</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {data.creatives.map((c) => {
          const style = LEVEL_STYLES[c.fatigueLevel]
          return (
            <div key={c.creativeId} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">Frequency: {c.frequency.toFixed(1)} · CTR: {c.ctr.toFixed(2)}% · {c.activeDays}일 운영</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">피로도</p>
                  <p className="font-bold">{c.fatigueScore}/100</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
