/**
 * Dashboard Loading State
 *
 * 대시보드 페이지 로딩 중 표시되는 스켈레톤 UI
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="container py-6">
      {/* 헤더 스켈레톤 */}
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* KPI 카드 스켈레톤 */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="mb-1 h-8 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* 차트 스켈레톤 */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* 테이블 스켈레톤 */}
      <div className="rounded-lg border p-6">
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
