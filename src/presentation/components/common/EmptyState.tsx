import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** 아이콘 컴포넌트 */
  icon?: React.ComponentType<{ className?: string }>
  /** 제목 */
  title: string
  /** 설명 */
  description?: string
  /** 액션 버튼/링크 */
  action?: ReactNode
  /** 테두리 점선 스타일 (목록 빈 상태용) */
  variant?: 'default' | 'dashed'
  className?: string
}

/**
 * 공통 빈 상태 컴포넌트
 * CampaignList, AnomalyAlert, AIInsights 등 여러 곳에서 반복되는 빈 상태 UI 통합
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variant === 'dashed' ? 'rounded-lg border border-dashed p-12' : 'py-8 px-4',
        className
      )}
    >
      {Icon && (
        <Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
      )}
      <h3
        className={cn(
          'font-semibold text-foreground',
          variant === 'dashed' ? 'text-lg' : 'text-base'
        )}
      >
        {title}
      </h3>
      {description && <p className="mt-2 text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
