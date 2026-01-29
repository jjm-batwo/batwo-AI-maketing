'use client'

import { X, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * AISuggestionBubble
 *
 * Non-intrusive AI suggestion that appears at the right moment.
 *
 * Design Philosophy:
 * - Subtle and elegant
 * - Easy to dismiss
 * - Never jumps or distracts
 * - Smooth animations
 */

export interface AISuggestionBubbleProps {
  suggestion: string
  context: string
  onAccept: () => void
  onDismiss: () => void
  position?: 'bottom-right' | 'inline' | 'tooltip'
  className?: string
}

export function AISuggestionBubble({
  suggestion,
  context,
  onAccept,
  onDismiss,
  position = 'bottom-right',
  className
}: AISuggestionBubbleProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Smooth entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss()
    }, 300) // Match animation duration
  }

  const handleAccept = () => {
    setIsExiting(true)
    setTimeout(() => {
      onAccept()
    }, 200)
  }

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6 z-50 max-w-sm',
    inline: 'relative w-full',
    tooltip: 'absolute bottom-full left-0 mb-2 z-50 max-w-xs'
  }

  return (
    <div
      className={cn(
        positionClasses[position],
        'transition-all duration-300 ease-out',
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4',
        className
      )}
    >
      {/* Backdrop for better visibility */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-2xl" />

        {/* Main bubble */}
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Header with sparkle icon */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b border-gray-200 dark:border-gray-800">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                AI가 도움을 드릴까요?
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {context}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {suggestion}
            </p>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm"
            >
              도움받기
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              괜찮아요
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact variant for inline use
 */
export interface CompactAISuggestionProps {
  suggestion: string
  onAccept: () => void
  onDismiss: () => void
  className?: string
}

export function CompactAISuggestion({
  suggestion,
  onAccept,
  onDismiss,
  className
}: CompactAISuggestionProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-900',
        className
      )}
    >
      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
        {suggestion}
      </p>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onAccept}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
        >
          도움받기
        </button>
        <button
          onClick={onDismiss}
          className="w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
          aria-label="닫기"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  )
}

/**
 * Tooltip variant for contextual help
 */
export interface TooltipAISuggestionProps {
  suggestion: string
  onAccept: () => void
  onDismiss: () => void
  className?: string
}

export function TooltipAISuggestion({
  suggestion,
  onAccept,
  onDismiss,
  className
}: TooltipAISuggestionProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-3',
        className
      )}
    >
      <div className="flex items-start gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          {suggestion}
        </p>
        <button
          onClick={onDismiss}
          className="w-4 h-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="닫기"
        >
          <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      <button
        onClick={onAccept}
        className="w-full px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-medium rounded transition-all"
      >
        도움받기
      </button>
    </div>
  )
}

/**
 * Hook for managing suggestion state
 */
export interface UseSuggestionStateProps {
  onAccept: () => void
  onDismiss: () => void
  autoHideDelay?: number // Auto-hide after ms (0 = never)
}

export function useSuggestionState({
  onAccept,
  onDismiss,
  autoHideDelay = 0
}: UseSuggestionStateProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss()
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHideDelay, onDismiss])

  const handleAccept = () => {
    setIsVisible(false)
    onAccept()
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
  }

  return {
    isVisible,
    handleAccept,
    handleDismiss
  }
}
