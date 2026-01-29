/**
 * Partial Success UI
 *
 * Shows which parts of an AI operation succeeded vs failed.
 * Allows retry of failed parts individually.
 */

'use client'

import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PartialResult {
  field: string
  value: string | null
  status: 'success' | 'failed' | 'fallback'
  error?: string
}

export interface PartialSuccessUIProps {
  results: PartialResult[]
  onRetryFailed?: (field: string) => void
  className?: string
  title?: string
  showSuccessful?: boolean // Show successful fields or hide them
}

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle2,
    label: '성공',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  failed: {
    icon: XCircle,
    label: '실패',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  fallback: {
    icon: AlertCircle,
    label: '대체값',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
} as const

export function PartialSuccessUI({
  results,
  onRetryFailed,
  className,
  title = '처리 결과',
  showSuccessful = true,
}: PartialSuccessUIProps) {
  const stats = {
    success: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'failed').length,
    fallback: results.filter((r) => r.status === 'fallback').length,
    total: results.length,
  }

  const hasFailures = stats.failed > 0
  const hasFallbacks = stats.fallback > 0

  const displayResults = showSuccessful
    ? results
    : results.filter((r) => r.status !== 'success')

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-3 text-sm">
          <span className="text-green-600">
            성공 {stats.success}/{stats.total}
          </span>
          {hasFallbacks && (
            <span className="text-amber-600">대체 {stats.fallback}</span>
          )}
          {hasFailures && <span className="text-red-600">실패 {stats.failed}</span>}
        </div>
      </div>

      {/* Overall Status Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="flex h-full">
          {stats.success > 0 && (
            <div
              className="bg-green-500"
              style={{ width: `${(stats.success / stats.total) * 100}%` }}
            />
          )}
          {stats.fallback > 0 && (
            <div
              className="bg-amber-500"
              style={{ width: `${(stats.fallback / stats.total) * 100}%` }}
            />
          )}
          {stats.failed > 0 && (
            <div
              className="bg-red-500"
              style={{ width: `${(stats.failed / stats.total) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Individual Results */}
      <div className="space-y-2">
        {displayResults.map((result, index) => {
          const config = STATUS_CONFIG[result.status]
          const Icon = config.icon

          return (
            <div
              key={`${result.field}-${index}`}
              className={cn(
                'rounded-lg border p-3 transition-colors',
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{result.field}</span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          config.color,
                          'bg-white/50'
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    {result.value && (
                      <p className="mt-1 text-sm text-gray-700 break-words">
                        {result.value}
                      </p>
                    )}
                    {result.error && (
                      <p className="mt-1 text-xs text-red-600">{result.error}</p>
                    )}
                  </div>
                </div>

                {/* Retry Button for Failed Items */}
                {result.status === 'failed' && onRetryFailed && (
                  <button
                    onClick={() => onRetryFailed(result.field)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md',
                      'bg-white hover:bg-gray-50 border border-gray-200',
                      'transition-colors flex-shrink-0'
                    )}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    재시도
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Footer */}
      {hasFailures && onRetryFailed && (
        <div className="flex items-center justify-end pt-2 border-t">
          <button
            onClick={() => {
              results
                .filter((r) => r.status === 'failed')
                .forEach((r) => onRetryFailed(r.field))
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'transition-colors'
            )}
          >
            <RefreshCw className="h-4 w-4" />
            실패한 항목 모두 재시도
          </button>
        </div>
      )}
    </div>
  )
}
