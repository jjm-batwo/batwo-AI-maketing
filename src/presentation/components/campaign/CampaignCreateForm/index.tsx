'use client'

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Step1BusinessInfo } from './Step1BusinessInfo'
import { Step2TargetAudience } from './Step2TargetAudience'
import { Step3Budget } from './Step3Budget'
import { Step4Review } from './Step4Review'
import { AlertCircle } from 'lucide-react'

export interface CampaignFormData {
  name: string
  objective: 'TRAFFIC' | 'CONVERSIONS' | 'BRAND_AWARENESS' | 'REACH' | 'ENGAGEMENT'
  targetAudience: {
    ageMin: number
    ageMax: number
    gender: 'ALL' | 'MALE' | 'FEMALE'
    locations: string[]
    interests: string[]
  }
  dailyBudget: number
  currency: 'KRW' | 'USD'
  startDate: string
  endDate?: string
}

interface CampaignCreateFormProps {
  onSubmit: (data: CampaignFormData) => void
  onCancel: () => void
  quotaExceeded?: boolean
  isSubmitting?: boolean
}

const TOTAL_STEPS = 4

const stepTitles = [
  '비즈니스 정보',
  '타겟 오디언스',
  '예산 설정',
  '최종 확인',
]

export function CampaignCreateForm({
  onSubmit,
  onCancel,
  quotaExceeded = false,
  isSubmitting = false,
}: CampaignCreateFormProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const methods = useForm<CampaignFormData>({
    defaultValues: {
      name: '',
      objective: 'CONVERSIONS',
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
    },
  })

  const { handleSubmit, trigger } = methods

  const handleNext = async () => {
    let fieldsToValidate: (keyof CampaignFormData)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['name', 'objective']
        break
      case 2:
        fieldsToValidate = ['targetAudience']
        break
      case 3:
        fieldsToValidate = ['dailyBudget', 'startDate']
        break
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit(data)
  })

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BusinessInfo />
      case 2:
        return <Step2TargetAudience />
      case 3:
        return <Step3Budget />
      case 4:
        return <Step4Review />
      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleFormSubmit}>
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{stepTitles[currentStep - 1]}</CardTitle>
              <span className="text-sm text-muted-foreground">
                {currentStep}/{TOTAL_STEPS}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="min-h-[300px]">
            {quotaExceeded && currentStep === 4 && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-50 p-4 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <span>이번 주 캠페인 생성 횟수를 모두 사용했어요</span>
              </div>
            )}
            {renderStep()}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="ghost" onClick={onCancel}>
              취소
            </Button>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  이전
                </Button>
              )}
              {currentStep < TOTAL_STEPS ? (
                <Button type="button" onClick={handleNext}>
                  다음
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={quotaExceeded || isSubmitting}
                >
                  {isSubmitting ? '생성 중...' : '캠페인 생성'}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  )
}
