/**
 * AI Insights Demo Page
 *
 * Demonstrates the AIInsights component with real API data
 */

import { AIInsights } from '@/presentation/components/ai/AIInsights'

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
        <AIInsights enabled />
      </section>

      {/* E-commerce industry */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">E-commerce Focus</h2>
        <AIInsights industry="ecommerce" enabled />
      </section>

      {/* With auto-refresh */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Auto-Refresh (30s)</h2>
        <AIInsights industry="fashion" enabled refetchInterval={30000} />
      </section>
    </div>
  )
}
