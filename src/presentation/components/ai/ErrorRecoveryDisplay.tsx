/**
 * Error Recovery Display
 *
 * User-friendly error display with actionable recovery options.
 * Highlights recommended actions and provides clear explanations.
 */

'use client'

import { AlertTriangle, X, Info, ChevronRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RecoveryOption {
  id: string
  label: string
  description: string
  action: () => void
  recommended?: boolean
  icon?: React.ElementType
}

export interface ErrorRecoveryDisplayProps {
  error: string
  recoveryOptions: RecoveryOption[]
  onDismiss?: () => void
  title?: string
  severity?: 'error' | 'warning' | 'info'
  className?: string
}

const SEVERITY_CONFIG = {
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    icon: AlertTriangle,
  },
  warning: {
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    icon: AlertTriangle,
  },
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    icon: Info,
  },
} as const

export function ErrorRecoveryDisplay({
  error,
  recoveryOptions,
  onDismiss,
  title = 'AI 처리 중 문제가 발생했습니다',
  severity = 'error',
  className,
}: ErrorRecoveryDisplayProps) {
  const config = SEVERITY_CONFIG[severity]
  const StatusIcon = config.icon

  const recommendedOption = recoveryOptions.find((opt) => opt.recommended)
  const otherOptions = recoveryOptions.filter((opt) => !opt.recommended)

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-sm',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <StatusIcon className={cn('mt-0.5 h-6 w-6 flex-shrink-0', config.iconColor)} />
          <div className="flex-1 min-w-0">
            <h3 className={cn('font-semibold text-lg', config.titleColor)}>{title}</h3>
            <p className="mt-1 text-sm text-gray-700 break-words">{error}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/50 rounded-md transition-colors flex-shrink-0"
            aria-label="닫기"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Recovery Options */}
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-gray-900">해결 방법:</p>

        {/* Recommended Option */}
        {recommendedOption && (
          <button
            onClick={recommendedOption.action}
            className={cn(
              'w-full text-left p-3 rounded-lg border-2',
              'bg-white hover:bg-gray-50',
              'border-blue-300 hover:border-blue-400',
              'transition-all group'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 flex-1">
                {recommendedOption.icon && (
                  <recommendedOption.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {recommendedOption.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      <Star className="h-3 w-3" />
                      추천
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {recommendedOption.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </div>
          </button>
        )}

        {/* Other Options */}
        {otherOptions.length > 0 && (
          <div className="space-y-2">
            {otherOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.action}
                className={cn(
                  'w-full text-left p-3 rounded-lg border',
                  'bg-white hover:bg-gray-50',
                  'border-gray-200 hover:border-gray-300',
                  'transition-all group'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    {option.icon && (
                      <option.icon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          문제가 계속되면 고객 지원팀에 문의하거나 잠시 후 다시 시도해주세요.
        </p>
      </div>
    </div>
  )
}
