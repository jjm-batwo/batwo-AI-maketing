'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { CampaignFormData } from './index'

const genderOptions = [
  { value: 'ALL', label: '전체' },
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
] as const

const locationOptions = [
  '대한민국',
  '서울',
  '경기',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
]

export function Step2TargetAudience() {
  const { register, watch, setValue } = useFormContext<CampaignFormData>()

  const targetAudience = watch('targetAudience')

  const toggleLocation = (location: string) => {
    const current = targetAudience.locations
    const updated = current.includes(location)
      ? current.filter((l) => l !== location)
      : [...current, location]
    setValue('targetAudience.locations', updated)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>연령대</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="w-20"
              min={13}
              max={65}
              {...register('targetAudience.ageMin', { valueAsNumber: true })}
            />
            <span className="text-muted-foreground">세</span>
          </div>
          <span className="text-muted-foreground">~</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="w-20"
              min={13}
              max={65}
              {...register('targetAudience.ageMax', { valueAsNumber: true })}
            />
            <span className="text-muted-foreground">세</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>성별</Label>
        <div className="flex gap-3">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue('targetAudience.gender', option.value)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                targetAudience.gender === option.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>지역</Label>
        <div className="flex flex-wrap gap-2">
          {locationOptions.map((location) => {
            const isSelected = targetAudience.locations.includes(location)
            return (
              <button
                key={location}
                type="button"
                onClick={() => toggleLocation(location)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {location}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>AI 추천</strong>: 타겟 설정을 건너뛰시면 Meta의 Advantage+
          타겟팅이 자동으로 최적의 오디언스를 찾아드립니다.
        </p>
      </div>
    </div>
  )
}
