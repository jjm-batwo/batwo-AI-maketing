'use client'

/**
 * AmbientInsightToast Example
 *
 * This example demonstrates the ambient insights system in action.
 * Run this in Storybook or as a standalone page to see how insights appear.
 */

import { useEffect, useState } from 'react'
import { useProactiveInsights } from '@presentation/hooks/useProactiveInsights'
import { AmbientInsightToast } from './AmbientInsightToast'

export default function AmbientInsightsDemo() {
  const { insights, dismiss, markSeen, queueTask, clearAll } = useProactiveInsights({
    maxVisible: 3,
    minConfidence: 70,
    autoDismissDelay: 15000, // 15 seconds for demo
  })

  const [metrics, setMetrics] = useState({
    ctr: 2.5,
    cvr: 1.2,
    roas: 3.4,
    spend: 150000,
  })

  // Simulate metric changes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ctr: Math.max(0.5, prev.ctr + (Math.random() - 0.5) * 1.0),
        cvr: Math.max(0.3, prev.cvr + (Math.random() - 0.5) * 0.3),
        roas: Math.max(1.0, prev.roas + (Math.random() - 0.5) * 0.8),
        spend: Math.max(50000, prev.spend + (Math.random() - 0.5) * 20000),
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Monitor metrics and queue tasks
  useEffect(() => {
    // Anomaly: CTR drop
    if (metrics.ctr < 1.5) {
      queueTask(
        'anomaly',
        {
          campaignId: 'demo-123',
          campaignName: '여름 신상품 프로모션',
          metric: 'CTR',
          changePercent: -35.2,
          previousValue: 2.5,
          currentValue: metrics.ctr,
        },
        'high'
      )
    }

    // Opportunity: High ROAS
    if (metrics.roas > 4.0) {
      queueTask(
        'opportunity',
        {
          opportunityType: '예산 증액',
          campaignId: 'demo-123',
          potentialGain: '30% 추가 수익 예상',
        },
        'medium'
      )
    }

    // Trend: CVR increase
    if (metrics.cvr > 1.5) {
      queueTask(
        'trend',
        {
          metric: 'CVR',
          direction: 'up',
          durationDays: 7,
          significance: 0.85,
        },
        'low'
      )
    }

    // Recommendation: Budget warning
    if (metrics.spend > 140000) {
      queueTask(
        'recommendation',
        {
          action: '일일 예산 재설정',
          campaignId: 'demo-123',
          reason: 'budget_near_limit',
        },
        'high'
      )
    }
  }, [metrics, queueTask])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ambient AI Insights Demo
          </h1>
          <p className="text-gray-600">
            Watch as AI insights appear automatically based on changing metrics.
            Insights auto-dismiss after 15 seconds.
          </p>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="CTR"
            value={metrics.ctr.toFixed(2) + '%'}
            trend={metrics.ctr > 2.0 ? 'up' : 'down'}
          />
          <MetricCard
            label="CVR"
            value={metrics.cvr.toFixed(2) + '%'}
            trend={metrics.cvr > 1.0 ? 'up' : 'down'}
          />
          <MetricCard
            label="ROAS"
            value={metrics.roas.toFixed(2) + 'x'}
            trend={metrics.roas > 3.0 ? 'up' : 'down'}
          />
          <MetricCard
            label="Spend"
            value={'₩' + (metrics.spend / 1000).toFixed(0) + 'K'}
            trend={metrics.spend > 120000 ? 'up' : 'down'}
          />
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Manual Controls
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                queueTask(
                  'anomaly',
                  {
                    campaignId: 'manual-test',
                    metric: 'CPC',
                    changePercent: 45.3,
                  },
                  'high'
                )
              }
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
            >
              Queue Anomaly
            </button>
            <button
              onClick={() =>
                queueTask(
                  'trend',
                  { metric: 'impressions', direction: 'up' },
                  'low'
                )
              }
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Queue Trend
            </button>
            <button
              onClick={() =>
                queueTask(
                  'opportunity',
                  { opportunityType: '신규 타겟 세그먼트' },
                  'medium'
                )
              }
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              Queue Opportunity
            </button>
            <button
              onClick={() =>
                queueTask(
                  'recommendation',
                  { action: '광고 소재 교체' },
                  'medium'
                )
              }
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              Queue Recommendation
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors ml-auto"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Insights: {insights.length}
          </h2>
          {insights.length === 0 ? (
            <p className="text-gray-500 italic">
              No insights currently showing. Metrics update every 5 seconds.
            </p>
          ) : (
            <div className="space-y-2">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {insight.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {insight.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {insight.confidence}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ambient Insights (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {insights.map((insight, index) => (
          <div
            key={insight.id}
            style={{
              transform: `translateY(-${index * 120}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <AmbientInsightToast
              insight={insight}
              onDismiss={dismiss}
              onSeen={markSeen}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper component for metric cards
function MetricCard({
  label,
  value,
  trend,
}: {
  label: string
  value: string
  trend: 'up' | 'down'
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span
          className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
        >
          {trend === 'up' ? '↑' : '↓'}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}
