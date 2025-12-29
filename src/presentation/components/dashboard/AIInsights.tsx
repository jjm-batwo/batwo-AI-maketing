'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type InsightType = 'opportunity' | 'warning' | 'tip' | 'success'

interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

interface AIInsightsProps {
  insights?: Insight[]
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

const typeConfig: Record<InsightType, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  opportunity: {
    icon: TrendingUp,
    className: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  tip: {
    icon: Lightbulb,
    className: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  success: {
    icon: TrendingUp,
    className: 'bg-green-50 border-green-200 text-green-700',
  },
}

// Mock insights for demonstration
const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'ROAS 개선 기회 발견',
    description: '캠페인 A의 주말 성과가 평일 대비 32% 높습니다. 주말 예산을 15% 증가시키면 전체 ROAS가 약 0.3x 상승할 것으로 예상됩니다.',
    action: {
      label: '예산 조정하기',
      href: '/campaigns',
    },
  },
  {
    id: '2',
    type: 'warning',
    title: '예산 소진 예상',
    description: '현재 지출 속도로는 캠페인 B의 일일 예산이 오후 3시경 소진될 예정입니다. 예산 증액을 고려해주세요.',
    action: {
      label: '예산 확인',
      href: '/campaigns',
    },
  },
  {
    id: '3',
    type: 'tip',
    title: '타겟팅 최적화 제안',
    description: '25-34세 여성 타겟의 전환율이 다른 그룹 대비 2.1배 높습니다. 이 타겟에 대한 입찰가 상향을 권장합니다.',
  },
  {
    id: '4',
    type: 'success',
    title: '이번 주 성과 우수',
    description: '지난주 대비 CTR이 18% 상승했습니다. 새로운 크리에이티브 전략이 효과를 보이고 있습니다.',
  },
]

export function AIInsights({
  insights = mockInsights,
  isLoading = false,
  onRefresh,
  className,
}: AIInsightsProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI 인사이트</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border p-4">
                <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="mt-1 h-3 w-3/4 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI 인사이트</CardTitle>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => {
            const config = typeConfig[insight.type]
            const Icon = config.icon
            return (
              <div
                key={insight.id}
                className={cn(
                  'rounded-lg border p-4 transition-colors hover:bg-opacity-80',
                  config.className
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm opacity-90">{insight.description}</p>
                    {insight.action && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-current underline"
                        asChild
                      >
                        <a href={insight.action.href}>{insight.action.label} →</a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
