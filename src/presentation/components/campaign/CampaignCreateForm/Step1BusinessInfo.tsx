'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Target, MousePointerClick, Eye, Users, Heart } from 'lucide-react'
import type { CampaignFormData } from './index'

const objectives = [
  { value: 'TRAFFIC', label: '트래픽', icon: MousePointerClick, description: '웹사이트 방문 유도' },
  { value: 'CONVERSIONS', label: '전환', icon: Target, description: '구매, 가입 등 행동 유도' },
  { value: 'BRAND_AWARENESS', label: '브랜드 인지도', icon: Eye, description: '브랜드 노출 최대화' },
  { value: 'REACH', label: '도달', icon: Users, description: '최대한 많은 사람에게 노출' },
  { value: 'ENGAGEMENT', label: '참여', icon: Heart, description: '좋아요, 댓글, 공유 유도' },
] as const

export function Step1BusinessInfo() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CampaignFormData>()

  const selectedObjective = watch('objective')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">캠페인 이름</Label>
        <Input
          id="name"
          placeholder="예: 2024년 크리스마스 프로모션"
          {...register('name', {
            required: '캠페인 이름을 입력해주세요',
            maxLength: {
              value: 100,
              message: '캠페인 이름은 100자 이하로 입력해주세요',
            },
          })}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>캠페인 목표</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {objectives.map((obj) => {
            const Icon = obj.icon
            const isSelected = selectedObjective === obj.value
            return (
              <button
                key={obj.value}
                type="button"
                onClick={() => setValue('objective', obj.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6',
                    isSelected ? 'text-primary' : 'text-gray-500'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-primary' : 'text-gray-700'
                  )}
                >
                  {obj.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {obj.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
