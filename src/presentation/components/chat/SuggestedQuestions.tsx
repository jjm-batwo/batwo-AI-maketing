'use client'

import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface SuggestedQuestionsProps {
  questions: string[]
  onSelect: (question: string) => void
  className?: string
}

export function SuggestedQuestions({ questions, onSelect, className }: SuggestedQuestionsProps) {
  if (!questions.length) return null

  return (
    <div className={cn('px-4 py-3', className)}>
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">추천 질문</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelect(question)}
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1.5 text-xs',
              'border border-border bg-background',
              'hover:bg-primary/5 hover:border-primary/30 hover:text-primary',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/20'
            )}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
