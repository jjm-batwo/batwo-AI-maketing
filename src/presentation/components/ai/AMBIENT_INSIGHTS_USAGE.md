# Ambient/Proactive AI Insights System

## Overview

The ambient insights system provides background analysis that appears automatically without user action. It's designed to be non-intrusive and helpful, showing AI-generated insights at the right time.

## Components

### 1. BackgroundAnalysisService

Queue-based background analysis service that processes tasks and emits results.

```typescript
import { BackgroundAnalysisService } from '@application/services'

const service = new BackgroundAnalysisService()

// Queue a task
const taskId = service.queueTask({
  type: 'anomaly',
  context: {
    campaignId: '123',
    metric: 'ctr',
    changePercent: -25.3
  },
  priority: 'high'
})

// Subscribe to results
const unsubscribe = service.onResult((result) => {
  console.log('New insight:', result.insight)
})
```

### 2. useProactiveInsights Hook

React hook that manages insight display and provides control functions.

```typescript
import { useProactiveInsights } from '@presentation/hooks'

function Dashboard() {
  const { insights, dismiss, queueTask } = useProactiveInsights({
    maxVisible: 3,
    minConfidence: 70,
    autoDismissDelay: 30000 // 30 seconds
  })

  // Queue analysis when data changes
  useEffect(() => {
    if (campaignData.ctr < previousCtr) {
      queueTask('anomaly', {
        campaignId: campaignData.id,
        metric: 'ctr',
        changePercent: ((campaignData.ctr - previousCtr) / previousCtr) * 100
      }, 'high')
    }
  }, [campaignData])

  return (
    <div>
      {/* Your dashboard content */}

      {/* Insights appear in bottom-right */}
      {insights.map(insight => (
        <AmbientInsightToast
          key={insight.id}
          insight={insight}
          onDismiss={dismiss}
        />
      ))}
    </div>
  )
}
```

### 3. AmbientInsightToast Component

Non-intrusive toast that appears in the bottom-right corner.

```typescript
import { AmbientInsightToast } from '@presentation/components/ai'

<AmbientInsightToast
  insight={insight}
  onDismiss={handleDismiss}
  onSeen={handleSeen}
/>
```

## Usage Examples

### Example 1: Anomaly Detection

```typescript
function CampaignMonitor({ campaign }: { campaign: Campaign }) {
  const { queueTask } = useProactiveInsights()
  const previousMetrics = usePrevious(campaign.metrics)

  useEffect(() => {
    if (!previousMetrics) return

    // Check for significant changes
    const ctrChange =
      ((campaign.metrics.ctr - previousMetrics.ctr) / previousMetrics.ctr) * 100

    if (Math.abs(ctrChange) > 20) {
      queueTask('anomaly', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        metric: 'ctr',
        changePercent: ctrChange,
        previousValue: previousMetrics.ctr,
        currentValue: campaign.metrics.ctr
      }, 'high')
    }
  }, [campaign.metrics])

  return <div>{/* Campaign UI */}</div>
}
```

### Example 2: Opportunity Detection

```typescript
function BudgetOptimizer() {
  const { queueTask } = useProactiveInsights()
  const campaigns = useCampaigns()

  useEffect(() => {
    // Analyze for opportunities
    const highPerformers = campaigns.filter(c => c.roas > 3.0)
    const underbudgeted = highPerformers.filter(
      c => c.budget < c.averageSpend * 1.2
    )

    if (underbudgeted.length > 0) {
      queueTask('opportunity', {
        opportunityType: '예산 증액',
        campaigns: underbudgeted.map(c => c.id),
        potentialGain: calculatePotentialGain(underbudgeted)
      }, 'medium')
    }
  }, [campaigns])

  return <div>{/* Budget UI */}</div>
}
```

### Example 3: Trend Analysis

```typescript
function TrendWatcher() {
  const { queueTask } = useProactiveInsights()
  const timeSeriesData = useTimeSeriesData()

  useEffect(() => {
    const trend = detectTrend(timeSeriesData)

    if (trend.significance > 0.8) {
      queueTask('trend', {
        metric: 'cvr',
        direction: trend.direction,
        duration: trend.durationDays,
        significance: trend.significance
      }, 'low')
    }
  }, [timeSeriesData])

  return <div>{/* Trend charts */}</div>
}
```

### Example 4: Complete Dashboard Integration

```typescript
'use client'

import { useProactiveInsights } from '@presentation/hooks'
import { AmbientInsightToast } from '@presentation/components/ai'
import { useCampaigns } from '@presentation/hooks'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { insights, dismiss, markSeen, queueTask } = useProactiveInsights({
    maxVisible: 2,
    minConfidence: 75,
    autoDismissDelay: 45000,
    enableAutoDismiss: true
  })

  const campaigns = useCampaigns()

  // Analyze campaigns on load
  useEffect(() => {
    campaigns.forEach(campaign => {
      if (campaign.status === 'active' && campaign.metrics.spend > campaign.budget * 0.9) {
        queueTask('recommendation', {
          action: '예산 증액 또는 일시 정지',
          campaignId: campaign.id,
          reason: 'budget_near_limit'
        }, 'high')
      }
    })
  }, [campaigns, queueTask])

  return (
    <div>
      {children}

      {/* Ambient insights container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {insights.map((insight, index) => (
          <div
            key={insight.id}
            style={{
              transform: `translateY(-${index * 120}px)`,
              transition: 'transform 0.3s ease-out'
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
```

## Configuration Options

### BackgroundAnalysisService

No configuration required. It's a stateless service that processes tasks on-demand.

### useProactiveInsights Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxVisible` | number | 3 | Maximum insights shown at once |
| `minConfidence` | number | 70 | Minimum confidence (0-100) to show |
| `autoDismissDelay` | number | 30000 | Auto-dismiss after N milliseconds |
| `enableAutoDismiss` | boolean | true | Enable auto-dismiss |

### AmbientInsightToast Features

- Subtle slide-in animation from bottom-right
- Confidence indicator bar at top
- Type-specific colors and icons
- Optional action button
- Manual dismiss button
- Pulse animation on first render
- Hover scale effect

## Task Types

| Type | Icon | Use Case | Example |
|------|------|----------|---------|
| `anomaly` | Alert Triangle | Significant metric changes | CTR drops 25% |
| `trend` | Trending Up | Pattern detection | Upward CVR trend |
| `opportunity` | Target | Growth opportunities | Underbudgeted high performer |
| `recommendation` | Lightbulb | AI suggestions | Pause low ROAS campaign |

## Priority Levels

- **high**: Processed first, for urgent insights
- **medium**: Standard priority
- **low**: Processed last, for informational insights

## Best Practices

1. **Queue tasks sparingly** - Only for significant events
2. **Use appropriate priorities** - Reserve 'high' for urgent issues
3. **Provide context** - Include relevant data in task context
4. **Handle actions gracefully** - Implement suggested action handlers
5. **Respect user attention** - Don't spam with too many insights
6. **Test confidence thresholds** - Find the right balance for your use case

## Performance Considerations

- Tasks are processed asynchronously (non-blocking)
- Automatic deduplication prevents duplicate insights
- Subscribers use observer pattern (efficient)
- Insights auto-dismiss to prevent memory leaks
- Service is singleton to share state across app

## Accessibility

- Uses `role="alert"` and `aria-live="polite"` for screen readers
- Keyboard accessible dismiss button
- High contrast colors for visibility
- Non-blocking UI (doesn't require user action)
