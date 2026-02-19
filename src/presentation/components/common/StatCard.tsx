import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon?: ReactNode
  label: string
  value: string | number
  change?: {
    value: string
    positive: boolean
  }
  className?: string
}

/**
 * KPI 통계 카드 공통 컴포넌트
 * 대시보드와 랜딩 페이지 양쪽에서 사용
 */
export function StatCard({ icon, label, value, change, className }: StatCardProps) {
  return (
    <div className={cn(
      'flex flex-col p-6 bg-card rounded-lg border border-border/50 transition-colors hover:border-primary/30',
      className
    )}>
      {icon && (
        <div className="p-2.5 mb-3 bg-primary/10 rounded-lg text-primary w-fit">
          {icon}
        </div>
      )}
      <span className="text-sm text-muted-foreground mb-1">{label}</span>
      <span className="text-2xl md:text-3xl font-bold">{value}</span>
      {change && (
        <span className={cn(
          'text-xs mt-1 font-medium',
          change.positive ? 'text-green-500' : 'text-red-500'
        )}>
          {change.positive ? '+' : ''}{change.value}
        </span>
      )}
    </div>
  )
}
