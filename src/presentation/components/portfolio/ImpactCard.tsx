'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioExpectedImpact } from '@presentation/hooks/usePortfolio'

interface ImpactCardProps {
  expectedImpact: PortfolioExpectedImpact
  efficiencyScore: number
  diversificationScore: number
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (score >= 50) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

function scoreLabel(score: number): string {
  if (score >= 80) return '우수'
  if (score >= 50) return '보통'
  return '개선 필요'
}

export function ImpactCard({ expectedImpact, efficiencyScore, diversificationScore }: ImpactCardProps) {
  const improvement = expectedImpact.improvement

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
          기대 효과
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ROAS 비교 */}
        <div className="flex items-center justify-center gap-4 rounded-lg bg-muted/50 px-4 py-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">현재 ROAS</p>
            <p className="mt-1 text-2xl font-bold">{expectedImpact.currentTotalROAS.toFixed(2)}x</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">예상 ROAS</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {expectedImpact.projectedTotalROAS.toFixed(2)}x
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">개선율</p>
            <p
              className={cn(
                'mt-1 text-lg font-semibold',
                improvement > 0
                  ? 'text-green-600 dark:text-green-400'
                  : improvement < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              )}
            >
              {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 점수 배지 */}
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border px-3 py-3">
            <p className="text-xs text-muted-foreground">효율성 점수</p>
            <p className="text-xl font-bold">{efficiencyScore}</p>
            <Badge className={cn('text-xs', scoreBadgeClass(efficiencyScore))}>
              {scoreLabel(efficiencyScore)}
            </Badge>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border px-3 py-3">
            <p className="text-xs text-muted-foreground">다양성 점수</p>
            <p className="text-xl font-bold">{diversificationScore}</p>
            <Badge className={cn('text-xs', scoreBadgeClass(diversificationScore))}>
              {scoreLabel(diversificationScore)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
