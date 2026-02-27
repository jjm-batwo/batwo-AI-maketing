'use client'

import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MousePointerClick, Target, Eye, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CampaignEditFormData {
  name: string
  dailyBudget: number
  startDate: string
  endDate?: string
  targetAudience?: {
    ageMin: number
    ageMax: number
    gender: 'ALL' | 'MALE' | 'FEMALE'
    locations: string[]
    interests?: string[]
  }
}

interface CampaignEditFormProps {
  initialData: {
    id: string
    name: string
    objective: string
    status: string
    dailyBudget: number
    startDate: string
    endDate?: string
    targetAudience?: {
      ageMin: number
      ageMax: number
      gender: 'ALL' | 'MALE' | 'FEMALE'
      locations: string[]
      interests?: string[]
    }
  }
  onSubmit: (data: CampaignEditFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
  error?: string | null
}

const objectives = [
  { id: 'TRAFFIC', label: '트래픽', icon: MousePointerClick },
  { id: 'CONVERSIONS', label: '전환', icon: Target },
  { id: 'BRAND_AWARENESS', label: '브랜드 인지도', icon: Eye },
  { id: 'SALES', label: '매출', icon: Target },
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

const statusLabels: Record<string, string> = {
  ACTIVE: '진행 중',
  PAUSED: '일시정지',
  COMPLETED: '완료',
  DRAFT: '초안',
  PENDING_REVIEW: '검토 중',
}

export function CampaignEditForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
}: CampaignEditFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CampaignEditFormData>({
    defaultValues: {
      name: initialData.name,
      dailyBudget: initialData.dailyBudget,
      startDate: initialData.startDate?.split('T')[0] || '',
      endDate: initialData.endDate?.split('T')[0] || '',
      targetAudience: initialData.targetAudience || {
        ageMin: 18,
        ageMax: 65,
        gender: 'ALL',
        locations: ['KR'],
        interests: [],
      },
    },
  })

  const formData = useWatch({ control })
  const objectiveInfo = objectives.find((o) => o.id === initialData.objective)
  const ObjectiveIcon = objectiveInfo?.icon || Target

  const isCompleted = initialData.status === 'COMPLETED'

  const onFormSubmit = (data: CampaignEditFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {isCompleted && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          완료된 캠페인은 수정할 수 없습니다.
        </div>
      )}

      {/* Read-only Campaign Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">캠페인 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">목표</span>
            <div className="flex items-center gap-2">
              <ObjectiveIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">{objectiveInfo?.label || initialData.objective}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">상태</span>
            <span className="font-medium">{statusLabels[initialData.status] || initialData.status}</span>
          </div>
        </CardContent>
      </Card>

      {/* Editable Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">캠페인 이름</Label>
            <Input
              id="name"
              disabled={isCompleted}
              {...register('name', {
                required: '캠페인 이름을 입력해주세요',
                validate: (value) => value.trim() !== '' || '캠페인 이름을 입력해주세요',
              })}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyBudget">일일 예산</Label>
            <div className="flex items-center gap-2">
              <Input
                id="dailyBudget"
                type="number"
                className="w-40"
                disabled={isCompleted}
                {...register('dailyBudget', {
                  valueAsNumber: true,
                  min: { value: 10000, message: '최소 일일 예산은 10,000원입니다' },
                })}
              />
              <span>원</span>
            </div>
            {errors.dailyBudget && (
              <p className="text-sm text-red-500">{errors.dailyBudget.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                disabled={isCompleted}
                {...register('startDate')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료일 (선택)</Label>
              <Input
                id="endDate"
                type="date"
                disabled={isCompleted}
                {...register('endDate')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Audience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">타겟 오디언스</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>연령대</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                className="w-24"
                disabled={isCompleted}
                {...register('targetAudience.ageMin', { valueAsNumber: true })}
              />
              <span>~</span>
              <Input
                type="number"
                className="w-24"
                disabled={isCompleted}
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
                  disabled={isCompleted}
                  onClick={() =>
                    setValue('targetAudience.gender', gender.id as 'ALL' | 'MALE' | 'FEMALE', { shouldDirty: true })
                  }
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm transition-all',
                    formData.targetAudience?.gender === gender.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300',
                    isCompleted && 'cursor-not-allowed opacity-50'
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
                  disabled={isCompleted}
                  onClick={() => {
                    const current = formData.targetAudience?.locations || []
                    if (current.includes(location.id)) {
                      setValue(
                        'targetAudience.locations',
                        current.filter((l) => l !== location.id),
                        { shouldDirty: true }
                      )
                    } else {
                      setValue('targetAudience.locations', [...current, location.id], { shouldDirty: true })
                    }
                  }}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm transition-all',
                    formData.targetAudience?.locations?.includes(location.id)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300',
                    isCompleted && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {location.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isCompleted || isSubmitting || !isDirty}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            '변경 사항 저장'
          )}
        </Button>
      </div>
    </form>
  )
}
