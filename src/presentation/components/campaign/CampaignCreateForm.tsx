'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { MousePointerClick, Target, Eye, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CampaignFormData {
  name: string
  objective: string
  targetAudience: {
    ageMin: number
    ageMax: number
    gender: 'ALL' | 'MALE' | 'FEMALE'
    locations: string[]
    interests?: string[]
  }
  dailyBudget: number
  startDate: string
  endDate?: string
}

interface CampaignCreateFormProps {
  onSubmit: (data: CampaignFormData) => void
  onCancel: () => void
  quotaExceeded?: boolean
  isSubmitting?: boolean
}

const objectives = [
  {
    id: 'TRAFFIC',
    label: '트래픽',
    description: '웹사이트 방문 유도',
    icon: MousePointerClick,
  },
  {
    id: 'CONVERSIONS',
    label: '전환',
    description: '구매, 가입 등 전환 유도',
    icon: Target,
  },
  {
    id: 'BRAND_AWARENESS',
    label: '브랜드 인지도',
    description: '브랜드 인지도 향상',
    icon: Eye,
  },
]

const genderOptions = [
  { id: 'ALL', label: '전체' },
  { id: 'MALE', label: '남성' },
  { id: 'FEMALE', label: '여성' },
]

const locationOptions = [
  { id: 'KR', label: '대한민국' },
  { id: 'US', label: '미국' },
  { id: 'JP', label: '일본' },
]

export function CampaignCreateForm({
  onSubmit,
  onCancel,
  quotaExceeded = false,
  isSubmitting = false,
}: CampaignCreateFormProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 4

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CampaignFormData>({
    defaultValues: {
      name: '',
      objective: '',
      targetAudience: {
        ageMin: 18,
        ageMax: 65,
        gender: 'ALL',
        locations: ['KR'],
        interests: [],
      },
      dailyBudget: 10000,
      startDate: new Date().toISOString().split('T')[0],
    },
  })

  const selectedObjective = watch('objective')
  const formData = watch()

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await trigger('name')
      if (!isValid || !formData.objective) {
        return
      }
    }
    if (step === 3) {
      const isValid = await trigger('dailyBudget')
      if (!isValid) {
        return
      }
    }
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const onFormSubmit = (data: CampaignFormData) => {
    onSubmit(data)
  }

  const getObjectiveLabel = (id: string) => {
    return objectives.find((o) => o.id === id)?.label || id
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">캠페인 이름</Label>
        <Input
          id="name"
          placeholder="예: 2024년 크리스마스 프로모션"
          {...register('name', {
            required: '캠페인 이름을 입력해주세요',
            validate: (value) => value.trim() !== '' || '캠페인 이름을 입력해주세요'
          })}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message || '캠페인 이름을 입력해주세요'}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>캠페인 목표</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {objectives.map((objective) => {
            const Icon = objective.icon
            const isSelected = selectedObjective === objective.id
            return (
              <button
                key={objective.id}
                type="button"
                onClick={() => setValue('objective', objective.id)}
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
                  {objective.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {objective.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">타겟 오디언스</h3>

      <div className="space-y-2">
        <Label>연령대</Label>
        <div className="flex items-center gap-4">
          <Input
            type="number"
            className="w-24"
            {...register('targetAudience.ageMin', { valueAsNumber: true })}
          />
          <span>~</span>
          <Input
            type="number"
            className="w-24"
            {...register('targetAudience.ageMax', { valueAsNumber: true })}
          />
          <span>세</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>성별</Label>
        <div className="flex gap-3">
          {genderOptions.map((gender) => (
            <button
              key={gender.id}
              type="button"
              onClick={() =>
                setValue(
                  'targetAudience.gender',
                  gender.id as 'ALL' | 'MALE' | 'FEMALE'
                )
              }
              className={cn(
                'rounded-lg border px-4 py-2 text-sm transition-all',
                formData.targetAudience?.gender === gender.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {gender.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>지역</Label>
        <div className="flex flex-wrap gap-2">
          {locationOptions.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => {
                const current = formData.targetAudience?.locations || []
                if (current.includes(location.id)) {
                  setValue(
                    'targetAudience.locations',
                    current.filter((l) => l !== location.id)
                  )
                } else {
                  setValue('targetAudience.locations', [...current, location.id])
                }
              }}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm transition-all',
                formData.targetAudience?.locations?.includes(location.id)
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {location.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">예산 설정</h3>

      <div className="space-y-2">
        <Label htmlFor="dailyBudget">일일 예산</Label>
        <div className="flex items-center gap-2">
          <Input
            id="dailyBudget"
            type="number"
            className="w-40"
            {...register('dailyBudget', {
              valueAsNumber: true,
              min: { value: 10000, message: '최소 일일 예산은 10,000원입니다' },
            })}
          />
          <span>원</span>
        </div>
        {(errors.dailyBudget || formData.dailyBudget < 10000) && (
          <p className="text-sm text-red-500">최소 일일 예산은 10,000원입니다</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">시작일</Label>
        <Input
          id="startDate"
          type="date"
          className="w-48"
          {...register('startDate')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">종료일 (선택)</Label>
        <Input
          id="endDate"
          type="date"
          className="w-48"
          {...register('endDate')}
        />
      </div>
    </div>
  )

  const renderStep4Review = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">최종 확인</h3>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">캠페인명</span>
            <span className="font-medium">{formData.name}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">목표</span>
            <span className="font-medium">
              {getObjectiveLabel(formData.objective)}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">타겟 연령</span>
            <span className="font-medium">
              {formData.targetAudience?.ageMin} - {formData.targetAudience?.ageMax}세
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">일일 예산</span>
            <span className="font-medium">
              {formData.dailyBudget?.toLocaleString()}원
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {step}/{totalSteps}
        </div>
      </div>

      {quotaExceeded && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <span>이번 주 캠페인 생성 횟수를 모두 사용했어요</span>
        </div>
      )}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4Review()}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>

        <div className="flex gap-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handlePrev}>
              이전
            </Button>
          )}
          {step < totalSteps ? (
            <Button type="button" onClick={handleNext}>
              다음
            </Button>
          ) : (
            <Button type="submit" disabled={quotaExceeded || isSubmitting}>
              캠페인 생성
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
