'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@presentation/stores/onboardingStore'
import { useTranslations } from 'next-intl'
import { WelcomeStep } from './steps/WelcomeStep'
import { MetaConnectStep } from './steps/MetaConnectStep'
import { PixelSetupStep } from './steps/PixelSetupStep'
import { CompletionStep } from './steps/CompletionStep'

interface OnboardingWizardProps {
  onComplete?: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const t = useTranslations('onboarding')
  const {
    currentStep,
    totalSteps,
    isCompleted,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
    _hasHydrated,
  } = useOnboardingStore()

  const stepTitles = [
    t('steps.start'),
    t('steps.metaConnect'),
    t('steps.pixelSetup'),
    t('steps.complete'),
  ]

  // Wait for Zustand hydration before rendering
  // This prevents the dialog from flashing open before localStorage is read
  if (!_hasHydrated) {
    return null
  }

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
      return t('buttons.start')
    }
    return t('buttons.next')
  }

  return (
    <Dialog open={!isCompleted}>
      <DialogContent
        className="sm:max-w-lg"
        aria-describedby="onboarding-description"
        role="dialog"
        aria-label={t('aria.wizard')}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{stepTitles[currentStep - 1]}</DialogTitle>
            <span
              className="text-sm text-muted-foreground"
              aria-label={t('aria.progress')}
            >
              {currentStep}/{totalSteps}
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={t('aria.progress')}
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
            {t('buttons.skip')}
          </Button>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                {t('buttons.previous')}
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
