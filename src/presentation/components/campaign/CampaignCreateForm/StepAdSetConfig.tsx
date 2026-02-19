'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Monitor, LayoutGrid, Lightbulb } from 'lucide-react'
import type { ExtendedCampaignFormData } from './types'

const placementOptions = [
  { value: 'AUTOMATIC', label: '자동 배치', icon: Monitor, description: 'Meta AI가 최적의 배치를 선택합니다' },
  { value: 'MANUAL', label: '수동 배치', icon: LayoutGrid, description: '직접 배치를 선택합니다' },
] as const

const optimizationGoalOptions = [
  { value: 'CONVERSIONS', label: '전환' },
  { value: 'LINK_CLICKS', label: '링크 클릭' },
  { value: 'IMPRESSIONS', label: '노출' },
  { value: 'REACH', label: '도달' },
  { value: 'LANDING_PAGE_VIEWS', label: '랜딩페이지 조회' },
  { value: 'VALUE', label: '가치 최적화' },
]

const bidStrategyOptions = [
  { value: 'LOWEST_COST_WITHOUT_CAP', label: '최저 비용 (자동)' },
  { value: 'COST_CAP', label: '비용 상한' },
  { value: 'LOWEST_COST_WITH_BID_CAP', label: '입찰 상한' },
  { value: 'LOWEST_COST_WITH_MIN_ROAS', label: '최소 ROAS' },
]

const billingEventOptions = [
  { value: 'IMPRESSIONS', label: '노출 (CPM)' },
  { value: 'LINK_CLICKS', label: '링크 클릭 (CPC)' },
]

export function StepAdSetConfig() {
  const { watch, setValue } = useFormContext<ExtendedCampaignFormData>()
  const placements = watch('adSetConfig.placements')

  return (
    <div className="space-y-6">
      {/* 배치 설정 */}
      <div className="space-y-2">
        <Label>배치 설정</Label>
        <div className="grid grid-cols-2 gap-4">
          {placementOptions.map((option) => {
            const Icon = option.icon
            const isSelected = placements === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('adSetConfig.placements', option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-5 text-center transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Icon className={cn('h-6 w-6', isSelected ? 'text-primary' : 'text-gray-400')} />
                <span className={cn('text-sm font-semibold', isSelected ? 'text-primary' : 'text-gray-700')}>{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 최적화 목표 */}
      <div className="space-y-2">
        <Label>최적화 목표</Label>
        <Select
          value={watch('adSetConfig.optimizationGoal')}
          onValueChange={(value) => setValue('adSetConfig.optimizationGoal', value as ExtendedCampaignFormData['adSetConfig']['optimizationGoal'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="최적화 목표를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {optimizationGoalOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 입찰 전략 */}
      <div className="space-y-2">
        <Label>입찰 전략</Label>
        <Select
          value={watch('adSetConfig.bidStrategy')}
          onValueChange={(value) => setValue('adSetConfig.bidStrategy', value as ExtendedCampaignFormData['adSetConfig']['bidStrategy'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="입찰 전략을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {bidStrategyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 과금 이벤트 */}
      <div className="space-y-2">
        <Label>과금 이벤트</Label>
        <Select
          value={watch('adSetConfig.billingEvent')}
          onValueChange={(value) => setValue('adSetConfig.billingEvent', value as ExtendedCampaignFormData['adSetConfig']['billingEvent'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="과금 이벤트를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {billingEventOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 안내 */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <Lightbulb className="h-4 w-4 inline text-amber-500" /> <strong>팁</strong>: 처음이라면 <strong>자동 배치</strong> + <strong>최저 비용(자동)</strong>을 추천합니다.
          Meta AI가 최적의 조합을 찾아줍니다.
        </p>
      </div>
    </div>
  )
}
