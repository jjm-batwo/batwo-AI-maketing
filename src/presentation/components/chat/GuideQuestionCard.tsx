'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface GuideOption {
  value: string
  label: string
  description?: string
}

interface GuideQuestionCardProps {
  questionId: string
  question: string
  options: GuideOption[]
  progress: { current: number; total: number }
  onAnswer: (option: GuideOption) => void
  isAnswered?: boolean
  selectedValue?: string
}

export function GuideQuestionCard({
  questionId,
  question,
  options,
  progress,
  onAnswer,
  isAnswered = false,
  selectedValue,
}: GuideQuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(selectedValue ?? null)

  const handleSelect = (option: GuideOption) => {
    if (isAnswered || selected) return
    setSelected(option.value)
    onAnswer(option)
  }

  return (
    <div
      data-testid={`guide-question-${questionId}`}
      className="mx-4 my-2 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 overflow-hidden"
    >
      {/* 헤더 + 진행률 */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-100/50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            캠페인 가이드
          </span>
        </div>
        <span className="text-xs text-blue-500 dark:text-blue-400">
          {progress.current}/{progress.total} 단계
        </span>
      </div>

      {/* 질문 */}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-foreground">{question}</p>
      </div>

      {/* 옵션 버튼 */}
      <div className="px-4 pb-4 grid gap-2">
        {options.map((option) => {
          const isSelected = selected === option.value
          const isDisabled = (isAnswered || selected !== null) && !isSelected

          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option)}
              disabled={isAnswered || selected !== null}
              className={cn(
                'w-full text-left rounded-lg px-4 py-3 text-sm transition-all duration-200',
                'border',
                isSelected
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                  : isDisabled
                    ? 'border-border bg-muted/50 text-muted-foreground opacity-50'
                    : 'border-border bg-background hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
              )}
            >
              <span className="font-medium">{option.label}</span>
              {option.description && (
                <span className="block mt-0.5 text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
