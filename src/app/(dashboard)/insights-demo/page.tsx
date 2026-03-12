/**
 * AI Insights Demo Page
 *
 * Demonstrates the AIInsights component with real API data
 */

import { Suspense } from 'react'
import { AIInsights } from '@/presentation/components/ai/AIInsights'

function InsightsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-48 bg-muted rounded" />
    </div>
  )
}

export default function InsightsDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI 인사이트 데모</h1>
        <p className="text-muted-foreground">실시간 이상 탐지 및 트렌드 분석</p>
      </div>

      {/* 전체 업종 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">전체 업종</h2>
        <Suspense fallback={<InsightsSkeleton />}>
          <AIInsights enabled />
        </Suspense>
      </section>

      {/* 이커머스 집중 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">이커머스 집중</h2>
        <Suspense fallback={<InsightsSkeleton />}>
          <AIInsights industry="ecommerce" enabled />
        </Suspense>
      </section>

      {/* 자동 새로고침 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">자동 새로고침 (30초)</h2>
        <Suspense fallback={<InsightsSkeleton />}>
          <AIInsights industry="fashion" enabled refetchInterval={30000} />
        </Suspense>
      </section>
    </div>
  )
}
