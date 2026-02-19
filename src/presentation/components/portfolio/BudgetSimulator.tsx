'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calculator, Loader2 } from 'lucide-react'
import type { SimulationResult } from '@presentation/hooks/usePortfolio'

interface BudgetSimulatorProps {
  currentBudget: number
  onSimulate: (totalBudget: number) => void
  simulationResult: SimulationResult | null | undefined
  isLoading: boolean
}

function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

export function BudgetSimulator({
  currentBudget,
  onSimulate,
  simulationResult,
  isLoading,
}: BudgetSimulatorProps) {
  const [inputValue, setInputValue] = useState(String(currentBudget))

  function handleSimulate() {
    const parsed = Number(inputValue.replace(/[^0-9]/g, ''))
    if (!parsed || parsed <= 0) return
    onSimulate(parsed)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // 숫자만 허용
    const numeric = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(numeric)
  }

  const comparison = simulationResult?.comparison

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-primary" aria-hidden="true" />
          예산 시뮬레이터
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="총 예산 입력"
              aria-label="시뮬레이션 총 예산"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              원
            </span>
          </div>
          <Button onClick={handleSimulate} disabled={isLoading || !inputValue}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                계산 중...
              </>
            ) : (
              '시뮬레이션'
            )}
          </Button>
        </div>

        {comparison && (
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3 text-center text-sm">
            <div>
              <p className="text-xs text-muted-foreground">현재 예산</p>
              <p className="mt-1 font-semibold">{formatKRW(comparison.currentBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">새 예산</p>
              <p className="mt-1 font-semibold text-primary">{formatKRW(comparison.newBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">변화</p>
              <p
                className={`mt-1 font-semibold ${
                  comparison.budgetChange > 0
                    ? 'text-green-600 dark:text-green-400'
                    : comparison.budgetChange < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-muted-foreground'
                }`}
              >
                {comparison.budgetChange > 0 ? '+' : ''}
                {comparison.budgetChangePercent.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
