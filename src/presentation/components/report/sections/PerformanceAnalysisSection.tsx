'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import type { PerformanceAnalysisSection as AnalysisData } from '@application/dto/report/EnhancedReportSections'

const IMPACT_STYLES = {
  high: 'border-l-4 border-l-red-500',
  medium: 'border-l-4 border-l-yellow-500',
  low: 'border-l-4 border-l-blue-500',
}

interface PerformanceAnalysisSectionProps {
  data: AnalysisData
}

export function PerformanceAnalysisSection({ data }: PerformanceAnalysisSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI 성과 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.summary && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{data.summary}</p>
        )}

        {data.positiveFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-2">잘된 점</h4>
            <div className="space-y-2">
              {data.positiveFactors.map((f, i) => (
                <div key={i} className={`rounded-lg bg-green-50 p-3 ${IMPACT_STYLES[f.impact]}`}>
                  <p className="text-sm font-medium text-green-900">{f.title}</p>
                  <p className="text-xs text-green-700 mt-1 whitespace-pre-line">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.negativeFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-2">개선 필요</h4>
            <div className="space-y-2">
              {data.negativeFactors.map((f, i) => (
                <div key={i} className={`rounded-lg bg-red-50 p-3 ${IMPACT_STYLES[f.impact]}`}>
                  <p className="text-sm font-medium text-red-900">{f.title}</p>
                  <p className="text-xs text-red-700 mt-1 whitespace-pre-line">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
