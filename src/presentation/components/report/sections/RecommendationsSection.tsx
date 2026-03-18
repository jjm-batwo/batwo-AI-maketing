'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecommendationsSection as RecsData } from '@application/dto/report/EnhancedReportSections'

const PRIORITY_STYLES = {
  high: { bg: 'bg-red-100', text: 'text-red-800', label: '긴급' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '중간' },
  low: { bg: 'bg-blue-100', text: 'text-blue-800', label: '낮음' },
}

const CATEGORY_LABELS: Record<string, string> = {
  budget: '예산', creative: '소재', targeting: '타겟팅', funnel: '퍼널', general: '일반',
}

interface RecommendationsSectionProps {
  data: RecsData
}

export function RecommendationsSection({ data }: RecommendationsSectionProps) {
  if (data.actions.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>추천 액션</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {data.actions.map((a, i) => {
          const priority = PRIORITY_STYLES[a.priority]
          return (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.bg} ${priority.text}`}>
                  {priority.label}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {CATEGORY_LABELS[a.category] ?? a.category}
                </span>
              </div>
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{a.description}</p>
              {a.expectedImpact && (
                <p className="text-xs text-primary mt-1">예상 효과: {a.expectedImpact}</p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
