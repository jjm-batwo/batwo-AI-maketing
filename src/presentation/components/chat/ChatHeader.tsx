'use client'

import { cn } from '@/lib/utils'
import { MessageSquare, Plus, X } from 'lucide-react'

interface ChatHeaderProps {
  title?: string
  onNewChat: () => void
  onClose: () => void
}

export function ChatHeader({ title, onNewChat, onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
        <h2 className="text-sm font-semibold text-foreground truncate">
          {title || 'AI 마케팅 어시스턴트'}
        </h2>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onNewChat}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            'transition-colors'
          )}
          title="새 대화"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={onClose}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            'transition-colors'
          )}
          title="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
