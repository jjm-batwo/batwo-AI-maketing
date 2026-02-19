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
        <h1 className="text-3xl font-bold mb-2">AI Insights Demo</h1>
        <p className="text-muted-foreground">
          Real-time anomaly detection and trend analysis
        </p>
      </div>

      {/* Default industry */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">All Industries</h2>
        <Suspense fallback={<InsightsSkeleton />}>
          <AIInsights enabled />
        </Suspense>
      </section>

      {/* E-commerce industry */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">E-commerce Focus</h2>
        <Suspense fallback={<InsightsSkeleton />}>
          <AIInsights industry="ecommerce" enabled />
        </Suspense>
      </section>

      {/* With auto-refresh */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Auto-Refresh (30s)</h2>
        <Suspense fallback={<InsightsSkeleton />}>
          <AIInsights industry="fashion" enabled refetchInterval={30000} />
        </Suspense>
      </section>
    </div>
  )
}
