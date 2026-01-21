'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MINIMUM_DAILY_BUDGET, formatBudget } from '@domain/value-objects/BudgetRecommendation'
import { BudgetRecommender } from '../BudgetRecommender'
import type { CampaignFormData } from './index'

export function Step3Budget() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CampaignFormData>()

  const dailyBudget = watch('dailyBudget')
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  // Calculate estimated total budget
  const calculateTotalBudget = () => {
    if (!startDate || !dailyBudget) return 0
    if (!endDate) return dailyBudget
    const days = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    return dailyBudget * Math.max(days, 1)
  }

  const totalBudget = calculateTotalBudget()

  // Handle budget selection from recommender
  const handleBudgetSelect = (budget: number) => {
    setValue('dailyBudget', budget, { shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      {/* 예산 추천 컴포넌트 */}
      <BudgetRecommender
        onBudgetSelect={handleBudgetSelect}
        selectedBudget={dailyBudget}
      />

      {/* 일일 예산 직접 입력 */}
      <div className="space-y-2">
        <Label htmlFor="dailyBudget">일일 예산</Label>
        <div className="flex items-center gap-2">
          <Input
            id="dailyBudget"
            type="number"
            step="10000"
            min={MINIMUM_DAILY_BUDGET}
            className="w-40"
            {...register('dailyBudget', {
              valueAsNumber: true,
              required: '일일 예산을 입력해주세요',
              min: {
                value: MINIMUM_DAILY_BUDGET,
                message: `최소 일일 예산은 ${formatBudget(MINIMUM_DAILY_BUDGET)}입니다`,
              },
            })}
          />
          <span className="text-muted-foreground">원</span>
        </div>
        {errors.dailyBudget && (
          <p className="text-sm text-red-500">{errors.dailyBudget.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          최소 일일 예산: {formatBudget(MINIMUM_DAILY_BUDGET)}
        </p>
      </div>

      {/* 기간 설정 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">시작일</Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate', {
              required: '시작일을 선택해주세요',
            })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">종료일 (선택)</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
          <p className="text-xs text-muted-foreground">
            비워두면 무기한 진행
          </p>
        </div>
      </div>

      {/* 예상 총 예산 */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">예상 총 예산</span>
          <span className="text-lg font-semibold">
            {totalBudget.toLocaleString()}원
          </span>
        </div>
        {!endDate && (
          <p className="mt-1 text-xs text-muted-foreground">
            * 종료일 미설정 시 일일 예산만 표시됩니다
          </p>
        )}
      </div>

      {/* 참고 사항 */}
      <div className="rounded-lg bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>참고</strong>: 실제 지출은 Meta의 입찰 시스템에 따라
          일일 예산과 약간 다를 수 있습니다.
        </p>
      </div>
    </div>
  )
}
