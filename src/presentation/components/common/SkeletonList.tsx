import { cn } from '@/lib/utils'

interface SkeletonListProps {
  /** 스켈레톤 항목 수 */
  count?: number
  /** 레이아웃 변형 */
  variant?: 'row' | 'card' | 'card-grid'
  className?: string
}

/**
 * 공통 로딩 스켈레톤
 * CampaignList, AIInsights, AnomalyAlert 등 여러 곳에 분산된 animate-pulse 패턴 통합
 *
 * - row: 목록형 스켈레톤 행
 * - card: 단일 카드 내부 스켈레톤 행들
 * - card-grid: 카드 그리드 레이아웃 (캠페인 목록 등)
 */
export function SkeletonList({ count = 3, variant = 'row', className }: SkeletonListProps) {
  if (variant === 'card-grid') {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-12 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
            <div className="h-3 w-full rounded bg-muted" />
            <div className="mt-1 h-3 w-3/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  // row variant
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border p-4">
          <div className="mb-2 h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
