'use client'

import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { useFeatureDiscovery, AIFeatureType } from '@/presentation/hooks/useFeatureDiscovery'
import { cn } from '@/lib/utils'

export interface FeatureDiscoveryHintProps {
  feature: AIFeatureType
  hint: string
  position?: 'inline' | 'tooltip' | 'badge'
  onDismiss?: () => void
  showOnce?: boolean
  className?: string
}

export function FeatureDiscoveryHint({
  feature,
  hint,
  position = 'inline',
  onDismiss,
  showOnce = true,
  className,
}: FeatureDiscoveryHintProps) {
  const { isDiscovered, markDiscovered, isLoaded } = useFeatureDiscovery()
  const [isDismissed, setIsDismissed] = useState(false)
  const isVisible = isLoaded && (!showOnce || !isDiscovered(feature)) && !isDismissed

  const handleDismiss = () => {
    setIsDismissed(true)
    markDiscovered(feature)
    onDismiss?.()
  }

  if (!isLoaded || !isVisible || isDismissed) {
    return null
  }

  if (position === 'badge') {
    return (
      <div
        className={cn(
          'relative inline-flex items-center gap-1 px-2 py-1',
          'bg-gradient-to-r from-purple-500/10 to-pink-500/10',
          'border border-purple-500/20 rounded-full',
          'text-xs font-medium text-purple-600 dark:text-purple-400',
          'animate-pulse',
          className
        )}
      >
        <Sparkles className="w-3 h-3" />
        <span>NEW</span>
        <button
          onClick={handleDismiss}
          className="ml-1 hover:bg-purple-500/20 rounded-full p-0.5 transition-colors"
          aria-label="닫기"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  if (position === 'tooltip') {
    return (
      <div
        className={cn(
          'absolute z-50 px-3 py-2 max-w-xs',
          'bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700',
          'text-sm text-gray-700 dark:text-gray-300',
          'animate-in fade-in slide-in-from-top-2 duration-300',
          className
        )}
      >
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="flex-1">{hint}</p>
          <button
            onClick={handleDismiss}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-0.5 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // inline position (default)
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-lg',
        'bg-gradient-to-r from-purple-50 to-pink-50',
        'dark:from-purple-950/20 dark:to-pink-950/20',
        'border border-purple-200 dark:border-purple-800',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className="relative">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div className="absolute inset-0 animate-ping">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 opacity-75" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
          새로운 AI 기능을 발견하셨어요!
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{hint}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded p-1 transition-colors"
        aria-label="닫기"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  )
}
