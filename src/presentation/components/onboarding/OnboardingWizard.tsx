'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@presentation/stores/onboardingStore'
import { WelcomeStep } from './steps/WelcomeStep'
import { MetaConnectStep } from './steps/MetaConnectStep'
import { PixelSetupStep } from './steps/PixelSetupStep'
import { CompletionStep } from './steps/CompletionStep'

interface OnboardingWizardProps {
  onComplete?: () => void
}

const stepTitles = ['시작하기', 'Meta 연결', '픽셀 설치', '완료']

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const {
    currentStep,
    totalSteps,
    isCompleted,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
    checkOnboardingStatus,
  } = useOnboardingStore()

  useEffect(() => {
    checkOnboardingStatus()
  }, [checkOnboardingStatus])

  if (isCompleted) {
    return null
  }

  const handleNext = () => {
    if (currentStep === totalSteps) {
      completeOnboarding()
      onComplete?.()
    } else {
      nextStep()
    }
  }

  const handleSkip = () => {
    skipOnboarding()
    onComplete?.()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />
      case 2:
        return <MetaConnectStep />
      case 3:
        return <PixelSetupStep />
      case 4:
        return <CompletionStep />
      default:
        return null
    }
  }

  const getNextButtonText = () => {
    if (currentStep === totalSteps) {
      return '시작하기'
    }
    return '다음'
  }

  return (
    <Dialog open={!isCompleted}>
      <DialogContent
        className="sm:max-w-lg"
        aria-describedby="onboarding-description"
        role="dialog"
        aria-label="온보딩 위저드"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{stepTitles[currentStep - 1]}</DialogTitle>
            <span
              className="text-sm text-muted-foreground"
              aria-label="온보딩 진행률"
            >
              {currentStep}/{totalSteps}
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label="온보딩 진행률"
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div id="onboarding-description" className="py-6">
          {renderStep()}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-500"
          >
            건너뛰기
          </Button>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                이전
              </Button>
            )}
            <Button type="button" onClick={handleNext}>
              {getNextButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
