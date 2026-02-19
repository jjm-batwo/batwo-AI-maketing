'use client'

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Sparkles } from 'lucide-react'
import { StepCampaignType } from './StepCampaignType'
import { Step2TargetAudience } from './Step2TargetAudience'
import { Step3Budget } from './Step3Budget'
import { StepAdSetConfig } from './StepAdSetConfig'
import { StepCreative } from './StepCreative'
import { StepReviewExtended } from './StepReviewExtended'
import { getStepsForMode } from './stepConfig'
import type { ExtendedCampaignFormData, WizardSubmitStage, UploadedAsset } from './types'
import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { CTAType } from '@domain/value-objects/CTAType'
import { OptimizationGoal } from '@domain/value-objects/OptimizationGoal'
import { BidStrategy } from '@domain/value-objects/BidStrategy'
import { BillingEvent } from '@domain/value-objects/BillingEvent'

// 기존 CampaignFormData를 re-export (하위 호환성)
export type { ExtendedCampaignFormData }
export type CampaignFormData = ExtendedCampaignFormData

interface CampaignCreateFormProps {
  onSubmit: (data: ExtendedCampaignFormData) => void
  onCancel: () => void
  quotaExceeded?: boolean
  isSubmitting?: boolean
  submitStage?: WizardSubmitStage
  onUploadAsset?: (file: File) => Promise<UploadedAsset>
  isUploading?: boolean
  initialData?: Partial<ExtendedCampaignFormData>  // AI 가이드 추천 데이터
  fromGuide?: boolean  // AI 가이드에서 왔는지 여부
}

export function CampaignCreateForm({
  onSubmit,
  onCancel,
  quotaExceeded = false,
  isSubmitting = false,
  submitStage = 'idle',
  onUploadAsset,
  isUploading,
  initialData,
  fromGuide = false,
}: CampaignCreateFormProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const methods = useForm<ExtendedCampaignFormData>({
    defaultValues: {
      name: '',
      objective: 'CONVERSIONS',
      campaignMode: 'ADVANTAGE_PLUS',
      targetAudience: {
        ageMin: 18,
        ageMax: 65,
        gender: 'ALL',
        locations: ['대한민국'],
        interests: [],
      },
      dailyBudget: 10000,
      currency: 'KRW',
      startDate: new Date().toISOString().split('T')[0],
      creative: {
        name: '',
        format: CreativeFormat.SINGLE_IMAGE,
        primaryText: '',
        headline: '',
        description: '',
        callToAction: CTAType.SHOP_NOW,
        linkUrl: '',
        assetIds: [],
      },
      adSetConfig: {
        name: '',
        optimizationGoal: OptimizationGoal.CONVERSIONS,
        bidStrategy: BidStrategy.LOWEST_COST_WITHOUT_CAP,
        billingEvent: BillingEvent.IMPRESSIONS,
        placements: 'AUTOMATIC',
      },
      ...initialData,
    },
  })

  const { handleSubmit, trigger, watch } = methods
  const campaignMode = watch('campaignMode')

  const steps = getStepsForMode(campaignMode)
  const totalSteps = steps.length
  const currentStepDef = steps[currentStep - 1]

  const handleNext = async () => {
    if (!currentStepDef) return

    const fieldsToValidate = currentStepDef.validationFields
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as (keyof ExtendedCampaignFormData)[])
      if (!isValid) return
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // 모드 변경 시 단계 조정 (현재 단계가 새 총 단계수보다 크면 리셋)
  const handleModeChange = () => {
    const newSteps = getStepsForMode(watch('campaignMode'))
    if (currentStep > newSteps.length) {
      setCurrentStep(1)
    }
  }

  // 모드 변경 감지
  methods.watch((_, { name }) => {
    if (name === 'campaignMode') {
      handleModeChange()
    }
  })

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit(data)
  })

  const renderStep = () => {
    if (!currentStepDef) return null

    switch (currentStepDef.key) {
      case 'campaign-type':
        return <StepCampaignType />
      case 'target-audience':
        return <Step2TargetAudience />
      case 'budget':
        return <Step3Budget />
      case 'adset-config':
        return <StepAdSetConfig />
      case 'creative':
        return <StepCreative onUploadAsset={onUploadAsset} isUploading={isUploading} />
      case 'review':
        return <StepReviewExtended submitStage={submitStage} />
      default:
        return null
    }
  }

  const isLastStep = currentStep === totalSteps
  const isSubmitInProgress = submitStage !== 'idle' && submitStage !== 'done' && submitStage !== 'error'

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleFormSubmit}>
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentStepDef?.title}</CardTitle>
              <span className="text-sm text-muted-foreground">
                {currentStep}/{totalSteps}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="min-h-[300px]">
            {fromGuide && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                <Sparkles className="h-5 w-5 shrink-0" />
                <span className="text-sm">AI가 추천한 설정이 적용되었습니다. 필요하면 각 단계에서 수정할 수 있어요.</span>
              </div>
            )}
            {quotaExceeded && isLastStep && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-50 p-4 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <span>이번 주 캠페인 생성 횟수를 모두 사용했어요</span>
              </div>
            )}
            {renderStep()}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitInProgress}>
              취소
            </Button>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitInProgress}>
                  이전
                </Button>
              )}
              {!isLastStep ? (
                <Button type="button" onClick={handleNext}>
                  다음
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={quotaExceeded || isSubmitting || isSubmitInProgress}
                >
                  {isSubmitInProgress ? '생성 중...' : '캠페인 생성'}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  )
}
