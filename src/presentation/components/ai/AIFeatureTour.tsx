'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TourStep {
  id: string
  target: string // CSS selector
  title: string
  description: string
  feature: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  offset?: { x: number; y: number }
}

export interface AIFeatureTourProps {
  steps: TourStep[]
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
  currentStep?: number
  className?: string
}

interface TooltipPosition {
  top: number
  left: number
  position: 'top' | 'bottom' | 'left' | 'right'
}

export function AIFeatureTour({
  steps,
  isOpen,
  onComplete,
  onSkip,
  currentStep: initialStep = 0,
  className,
}: AIFeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  useEffect(() => {
    if (!isOpen || !step) return

    const updatePosition = () => {
      const targetElement = document.querySelector(step.target)
      if (!targetElement || !tooltipRef.current) return

      const targetRect = targetElement.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const offset = step.offset || { x: 0, y: 0 }

      let top = 0
      let left = 0
      let position = step.position || 'bottom'

      switch (position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - 16 + offset.y
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2 + offset.x
          break
        case 'bottom':
          top = targetRect.bottom + 16 + offset.y
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2 + offset.x
          break
        case 'left':
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 + offset.y
          left = targetRect.left - tooltipRect.width - 16 + offset.x
          break
        case 'right':
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 + offset.y
          left = targetRect.right + 16 + offset.x
          break
      }

      // Keep tooltip in viewport
      const padding = 16
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))

      setTooltipPosition({ top, left, position })

      // Scroll target into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, step, currentStep])

  if (!isOpen || !step) return null

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleStepClick = (index: number) => {
    setCurrentStep(index)
  }

  const targetElement = document.querySelector(step.target)

  return (
    <>
      {/* Backdrop with spotlight */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        {/* Spotlight */}
        {targetElement && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: targetElement.getBoundingClientRect().top - 8,
              left: targetElement.getBoundingClientRect().left - 8,
              width: targetElement.getBoundingClientRect().width + 16,
              height: targetElement.getBoundingClientRect().height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              borderRadius: '12px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-[101] w-full max-w-sm pointer-events-auto',
            'animate-in fade-in zoom-in-95 duration-300',
            className
          )}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      {step.feature}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {currentStep + 1} / {steps.length}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {step.title}
                  </h3>
                </div>
                <button
                  onClick={onSkip}
                  className="flex-shrink-0 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="투어 종료"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              {/* Step indicators */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      index === currentStep
                        ? 'w-6 bg-purple-600 dark:bg-purple-400'
                        : index < currentStep
                        ? 'w-1.5 bg-purple-300 dark:bg-purple-600'
                        : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                    )}
                    aria-label={`${index + 1}단계로 이동`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={onSkip}
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  건너뛰기
                </button>
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={handlePrevious}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label="이전"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      isLastStep
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    )}
                  >
                    {isLastStep ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>완료</span>
                      </>
                    ) : (
                      <>
                        <span>다음</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow pointing to target */}
          <div
            className={cn(
              'absolute w-3 h-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
              tooltipPosition.position === 'top' && 'bottom-[-6px] left-1/2 -translate-x-1/2 rotate-45 border-t-0 border-l-0',
              tooltipPosition.position === 'bottom' && 'top-[-6px] left-1/2 -translate-x-1/2 rotate-45 border-b-0 border-r-0',
              tooltipPosition.position === 'left' && 'right-[-6px] top-1/2 -translate-y-1/2 rotate-45 border-b-0 border-l-0',
              tooltipPosition.position === 'right' && 'left-[-6px] top-1/2 -translate-y-1/2 rotate-45 border-t-0 border-r-0'
            )}
          />
        </div>
      )}
    </>
  )
}
