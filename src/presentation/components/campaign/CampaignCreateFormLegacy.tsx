'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { MousePointerClick, Target, Eye, AlertTriangle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemplateSelector } from './TemplateSelector'
import { CampaignTemplate, CampaignTemplateId } from '@domain/value-objects/CampaignTemplate'
import { ScienceScore } from '@/presentation/components/ai'
import { useScienceScore } from '@/presentation/hooks/useMarketingIntelligence'

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
  const [step, setStep] = useState(0) // 0 = template selection, 1-4 = form steps
  const [selectedTemplateId, setSelectedTemplateId] = useState<CampaignTemplateId | undefined>()
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

  // Science score preview for the review step
  const objectiveMap: Record<string, 'awareness' | 'consideration' | 'conversion'> = {
    'TRAFFIC': 'consideration',
    'CONVERSIONS': 'conversion',
    'BRAND_AWARENESS': 'awareness',
  }

  const scienceInput = step === 4 ? {
    content: {
      brand: formData.name,
    },
    context: {
      targetAudience: `${formData.targetAudience?.ageMin}-${formData.targetAudience?.ageMax}세 ${formData.targetAudience?.gender === 'ALL' ? '전체' : formData.targetAudience?.gender === 'MALE' ? '남성' : '여성'}`,
      objective: objectiveMap[formData.objective] || 'conversion' as const,
    },
  } : undefined

  const { data: scienceData, isLoading: scienceLoading } = useScienceScore(scienceInput)

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplateId(template.id)
    // Pre-fill form with template values
    setValue('objective', template.objective)
    setValue('dailyBudget', template.suggestedDailyBudget)
    if (template.suggestedTargetAudience.ageMin) {
      setValue('targetAudience.ageMin', template.suggestedTargetAudience.ageMin)
    }
    if (template.suggestedTargetAudience.ageMax) {
      setValue('targetAudience.ageMax', template.suggestedTargetAudience.ageMax)
    }
    if (template.suggestedTargetAudience.genders) {
      // Convert template genders array to form gender value
      const genders = template.suggestedTargetAudience.genders
      if (genders.includes('all')) {
        setValue('targetAudience.gender', 'ALL')
      } else if (genders.includes('male') && !genders.includes('female')) {
        setValue('targetAudience.gender', 'MALE')
      } else if (genders.includes('female') && !genders.includes('male')) {
        setValue('targetAudience.gender', 'FEMALE')
      }
    }
    // Move to step 1
    setStep(1)
  }

  const handleSkipTemplate = () => {
    setStep(1)
  }

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
    if (step > 0) {
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
    <div className="space-y-6" role="group" aria-labelledby="step1-heading">
      <h2 id="step1-heading" className="sr-only">
        1단계: 기본 정보
      </h2>
      <div className="space-y-2">
        <Label htmlFor="name">
          캠페인 이름 <span className="text-red-500" aria-label="필수">*</span>
        </Label>
        <Input
          id="name"
          placeholder="예: 2024년 크리스마스 프로모션"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : 'name-hint'}
          {...register('name', {
            required: '캠페인 이름을 입력해주세요',
            validate: (value) => value.trim() !== '' || '캠페인 이름을 입력해주세요'
          })}
        />
        {!errors.name && (
          <p id="name-hint" className="text-sm text-muted-foreground">
            고객에게 보여지지 않는 내부 관리용 이름입니다
          </p>
        )}
        {errors.name && (
          <p id="name-error" className="text-sm text-red-500" role="alert" aria-live="polite">
            {errors.name.message || '캠페인 이름을 입력해주세요'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label id="objective-label">
          캠페인 목표 <span className="text-red-500" aria-label="필수">*</span>
        </Label>
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-labelledby="objective-label"
          aria-required="true"
        >
          {objectives.map((objective) => {
            const Icon = objective.icon
            const isSelected = selectedObjective === objective.id
            return (
              <button
                key={objective.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${objective.label}: ${objective.description}`}
                onClick={() => setValue('objective', objective.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setValue('objective', objective.id)
                  }
                }}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
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
                  aria-hidden="true"
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
    <div className="space-y-6" role="group" aria-labelledby="step2-heading">
      <h2 id="step2-heading" className="text-lg font-medium">
        2단계: 타겟 오디언스
      </h2>

      <fieldset className="space-y-2">
        <legend className="sr-only">연령대 설정</legend>
        <Label id="age-label">연령대</Label>
        <div className="flex items-center gap-4" role="group" aria-labelledby="age-label">
          <div>
            <Label htmlFor="ageMin" className="sr-only">최소 연령</Label>
            <Input
              id="ageMin"
              type="number"
              className="w-24"
              aria-label="최소 연령"
              min="13"
              max="65"
              {...register('targetAudience.ageMin', { valueAsNumber: true })}
            />
          </div>
          <span aria-hidden="true">~</span>
          <div>
            <Label htmlFor="ageMax" className="sr-only">최대 연령</Label>
            <Input
              id="ageMax"
              type="number"
              className="w-24"
              aria-label="최대 연령"
              min="13"
              max="65"
              {...register('targetAudience.ageMax', { valueAsNumber: true })}
            />
          </div>
          <span>세</span>
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="sr-only">성별 선택</legend>
        <Label id="gender-label">성별</Label>
        <div
          className="flex gap-3"
          role="radiogroup"
          aria-labelledby="gender-label"
        >
          {genderOptions.map((gender) => {
            const isSelected = formData.targetAudience?.gender === gender.id
            return (
              <button
                key={gender.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={gender.label}
                onClick={() =>
                  setValue(
                    'targetAudience.gender',
                    gender.id as 'ALL' | 'MALE' | 'FEMALE'
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setValue(
                      'targetAudience.gender',
                      gender.id as 'ALL' | 'MALE' | 'FEMALE'
                    )
                  }
                }}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {gender.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="sr-only">지역 선택</legend>
        <Label id="location-label">지역</Label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="location-label"
          aria-describedby="location-hint"
        >
          {locationOptions.map((location) => {
            const isSelected = formData.targetAudience?.locations?.includes(location.id)
            return (
              <button
                key={location.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={location.label}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    const current = formData.targetAudience?.locations || []
                    if (current.includes(location.id)) {
                      setValue(
                        'targetAudience.locations',
                        current.filter((l) => l !== location.id)
                      )
                    } else {
                      setValue('targetAudience.locations', [...current, location.id])
                    }
                  }
                }}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {location.label}
              </button>
            )
          })}
        </div>
        <p id="location-hint" className="text-sm text-muted-foreground">
          복수 선택 가능합니다
        </p>
      </fieldset>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6" role="group" aria-labelledby="step3-heading">
      <h2 id="step3-heading" className="text-lg font-medium">
        3단계: 예산 설정
      </h2>

      <div className="space-y-2">
        <Label htmlFor="dailyBudget">
          일일 예산 <span className="text-red-500" aria-label="필수">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="dailyBudget"
            type="number"
            className="w-40"
            aria-required="true"
            aria-invalid={!!errors.dailyBudget || formData.dailyBudget < 10000}
            aria-describedby={errors.dailyBudget || formData.dailyBudget < 10000 ? 'budget-error' : 'budget-hint'}
            min="10000"
            step="1000"
            {...register('dailyBudget', {
              valueAsNumber: true,
              min: { value: 10000, message: '최소 일일 예산은 10,000원입니다' },
            })}
          />
          <span>원</span>
        </div>
        {!(errors.dailyBudget || formData.dailyBudget < 10000) && (
          <p id="budget-hint" className="text-sm text-muted-foreground">
            최소 10,000원 이상 설정해주세요
          </p>
        )}
        {(errors.dailyBudget || formData.dailyBudget < 10000) && (
          <p id="budget-error" className="text-sm text-red-500" role="alert" aria-live="polite">
            최소 일일 예산은 10,000원입니다
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">
          시작일 <span className="text-red-500" aria-label="필수">*</span>
        </Label>
        <Input
          id="startDate"
          type="date"
          className="w-48"
          aria-required="true"
          {...register('startDate')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">종료일 (선택)</Label>
        <Input
          id="endDate"
          type="date"
          className="w-48"
          aria-describedby="endDate-hint"
          {...register('endDate')}
        />
        <p id="endDate-hint" className="text-sm text-muted-foreground">
          종료일을 설정하지 않으면 수동으로 종료할 때까지 계속 진행됩니다
        </p>
      </div>
    </div>
  )

  const renderStep0Template = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">빠른 시작</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        템플릿을 선택하면 목표, 예산, 타겟이 자동으로 설정됩니다
      </p>
      <TemplateSelector
        onSelect={handleTemplateSelect}
        selectedTemplateId={selectedTemplateId}
        showTips
      />
      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={handleSkipTemplate}
          className="text-muted-foreground"
        >
          템플릿 없이 직접 설정하기
        </Button>
      </div>
    </div>
  )

  const renderStep4Review = () => (
    <div className="space-y-6" role="group" aria-labelledby="step4-heading">
      <h2 id="step4-heading" className="text-lg font-medium">
        4단계: 최종 확인
      </h2>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">캠페인명</span>
            <span className="font-medium" aria-label={`캠페인명: ${formData.name}`}>
              {formData.name}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">목표</span>
            <span
              className="font-medium"
              aria-label={`캠페인 목표: ${getObjectiveLabel(formData.objective)}`}
            >
              {getObjectiveLabel(formData.objective)}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">타겟 연령</span>
            <span
              className="font-medium"
              aria-label={`타겟 연령: ${formData.targetAudience?.ageMin}세부터 ${formData.targetAudience?.ageMax}세까지`}
            >
              {formData.targetAudience?.ageMin} - {formData.targetAudience?.ageMax}세
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">일일 예산</span>
            <span
              className="font-medium"
              aria-label={`일일 예산: ${formData.dailyBudget?.toLocaleString()}원`}
            >
              {formData.dailyBudget?.toLocaleString()}원
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Science Score Preview */}
      <Card className="mt-4 border-indigo-200/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">과학 기반 분석 미리보기</span>
          </div>
          <div className="flex justify-center">
            <ScienceScore
              score={scienceData?.score?.overall ?? 0}
              grade={scienceData?.score?.grade ?? 'F'}
              analyzedDomains={scienceData?.score?.analyzedDomains}
              totalDomains={6}
              isLoading={scienceLoading || !scienceData}
              size="sm"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            캠페인 설정 기반의 예상 과학 신뢰도 점수입니다
          </p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-6"
      aria-label="캠페인 생성 폼"
    >
      {step > 0 && (
        <div className="flex items-center justify-between">
          <div
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
            aria-label={`현재 ${step}/${totalSteps} 단계`}
          >
            {step}/{totalSteps}
          </div>
        </div>
      )}

      {quotaExceeded && (
        <div
          className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          <span>이번 주 캠페인 생성 횟수를 모두 사용했어요</span>
        </div>
      )}

      {step === 0 && renderStep0Template()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4Review()}

      {step > 0 && (
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            aria-label="캠페인 생성 취소"
          >
            취소
          </Button>

          <div className="flex gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                aria-label="이전 단계로 이동"
              >
                이전
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                aria-label="다음 단계로 이동"
              >
                다음
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={quotaExceeded || isSubmitting}
                aria-label={isSubmitting ? '캠페인 생성 중...' : '캠페인 생성하기'}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? '생성 중...' : '캠페인 생성'}
              </Button>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
