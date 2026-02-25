'use client'

import { useState, useCallback, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { Send, Loader2 } from 'lucide-react'

// 최대 입력 글자 수
const MAX_LENGTH = 2000

// 접근성 ID 상수
const COUNTER_ID = 'chat-input-counter'
const ERROR_ID = 'chat-input-error'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = '메시지를 입력하세요...',
}: ChatInputProps) {
  const [input, setInput] = useState('')

  // 2000자 초과 여부
  const isOverLimit = input.length > MAX_LENGTH

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    // 글자 수 초과 시 전송 차단
    if (!trimmed || isLoading || isOverLimit) return
    onSend(trimmed)
    setInput('')
  }, [input, isLoading, isOverLimit, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // aria-describedby: 에러가 있으면 에러 ID를, 없으면 카운터 ID를 가리킴
  const describedBy = isOverLimit ? `${COUNTER_ID} ${ERROR_ID}` : COUNTER_ID

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <textarea
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            aria-label="Chat input"
            aria-describedby={describedBy}
            aria-disabled={isLoading ? 'true' : undefined}
            rows={1}
            className={cn(
              'resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'max-h-32 min-h-[44px]',
              isOverLimit && 'border-destructive focus:border-destructive focus:ring-destructive/20'
            )}
            style={{ overflow: 'hidden' }}
          />
          {/* 글자 수 카운터 */}
          <span
            id={COUNTER_ID}
            className={cn(
              'text-xs text-right pr-1',
              isOverLimit ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {input.length}/{MAX_LENGTH}
          </span>
          {/* 2000자 초과 시 에러 메시지 */}
          {isOverLimit && (
            <span
              id={ERROR_ID}
              role="alert"
              className="text-xs text-destructive"
            >
              메시지는 {MAX_LENGTH}자를 초과할 수 없습니다.
            </span>
          )}
        </div>
        <button
          data-testid="chat-send-button"
          onClick={handleSend}
          disabled={!input.trim() || isLoading || isOverLimit}
          aria-label={isLoading ? '전송 중' : '메시지 전송'}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}
