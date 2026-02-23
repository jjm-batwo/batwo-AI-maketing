'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, PieChart, Sparkles } from 'lucide-react'
import { usePortfolioAnalysis, usePortfolioSimulation } from '@/presentation/hooks/usePortfolio'
import type { SimulationResult } from '@/presentation/hooks/usePortfolio'
import { AllocationTable } from '@/presentation/components/portfolio/AllocationTable'
import { ImpactCard } from '@/presentation/components/portfolio/ImpactCard'
import { BudgetSimulator } from '@/presentation/components/portfolio/BudgetSimulator'
import { useUIStore } from '@/presentation/stores'

function scoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (score >= 50) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

export default function PortfolioPage() {
  const { data, isLoading, isError } = usePortfolioAnalysis()
  const simulation = usePortfolioSimulation()
  const { openChatPanel } = useUIStore()
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)

  function handleSimulate(totalBudget: number) {
    simulation.mutate(totalBudget, {
      onSuccess: (result) => setSimulationResult(result),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="로딩 중" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          포트폴리오 데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
        <PieChart className="mb-3 h-10 w-10 opacity-30" aria-hidden="true" />
        <p className="text-sm">활성 캠페인이 없어 포트폴리오 분석을 할 수 없습니다.</p>
        <p className="mt-1 text-xs">캠페인을 먼저 생성하고 활성화해 주세요.</p>
      </div>
    )
  }

  const displayAllocations = simulationResult?.allocations ?? data.allocations
  const displayImpact = simulationResult?.expectedImpact ?? data.expectedImpact

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">포트폴리오 최적화</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI가 분석한 캠페인 예산 배분 최적화 전략입니다
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
            onClick={openChatPanel}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI 배분 전략
          </Button>
          <Badge className={scoreBadgeClass(data.efficiencyScore)}>
            효율성 {data.efficiencyScore}점
          </Badge>
          <Badge className={scoreBadgeClass(data.diversificationScore)}>
            다양성 {data.diversificationScore}점
          </Badge>
        </div>
      </div>

      {/* 예산 시뮬레이터 */}
      <BudgetSimulator
        currentBudget={data.totalBudget}
        onSimulate={handleSimulate}
        simulationResult={simulationResult}
        isLoading={simulation.isPending}
      />

      {/* 기대 효과 */}
      <ImpactCard
        expectedImpact={displayImpact}
        efficiencyScore={data.efficiencyScore}
        diversificationScore={data.diversificationScore}
      />

      {/* 예산 배분 테이블 */}
      <div>
        <h2 className="mb-3 text-base font-semibold">캠페인별 예산 배분</h2>
        <AllocationTable allocations={displayAllocations} />
      </div>

      {/* 추천사항 */}
      {data.recommendations.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold">AI 추천사항</h2>
          <ul className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
