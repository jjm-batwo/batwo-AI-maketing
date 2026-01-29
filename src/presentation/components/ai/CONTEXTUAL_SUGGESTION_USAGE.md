# Contextual AI Suggestion System

A non-intrusive AI suggestion system that offers help at the right moments based on user context and behavior.

## Design Philosophy

1. **Never interrupt** - Suggestions appear only when contextually appropriate
2. **Learn from interactions** - System adapts based on user responses
3. **Subtle and elegant** - Smooth animations, easy to dismiss
4. **Respect attention** - Limited frequency, adaptive timing

## Components

### 1. ContextDetectionEngine

Tracks user actions and detects current context.

```typescript
import { getContextDetectionEngine } from '@/application/services'

const engine = getContextDetectionEngine()

// Track user actions
engine.trackAction('view_dashboard')
engine.trackAction('edit_copy', { duration: 30000, repeatCount: 3 })
engine.trackAction('view_metrics', { errorOccurred: true })

// Get current context
const context = engine.getCurrentContext()
// { type: 'writing_copy', confidence: 0.8, triggers: [...], timestamp: ... }

// Subscribe to context changes
const unsubscribe = engine.onContextChange((context) => {
  console.log('Context changed:', context.type, context.confidence)
})

// Check if should suggest AI
const { suggest, reason } = engine.shouldSuggestAI()
if (suggest) {
  // Show suggestion
}
```

**Detected Contexts:**
- `creating_campaign` - User is creating a new campaign
- `analyzing_metrics` - User is viewing metrics/dashboard
- `writing_copy` - User is editing ad copy
- `reviewing_performance` - User is reviewing reports
- `stuck_on_task` - User appears stuck (repeated actions, errors)
- `idle` - User is inactive

### 2. AISuggestionTiming

Controls when and how often to show suggestions.

```typescript
import { getAISuggestionTiming } from '@/application/services'

const timing = getAISuggestionTiming()

// Check if can suggest now
if (timing.canSuggestNow()) {
  // Show suggestion
  timing.recordSuggestion()
}

// Record user response
timing.recordResponse(true) // accepted
timing.recordResponse(false) // dismissed

// Get statistics
const stats = timing.getStats()
// { shown: 5, accepted: 3, dismissed: 2, acceptanceRate: 0.6 }

// Configure timing
timing.updateConfig({
  minTimeBetweenSuggestions: 10 * 60 * 1000, // 10 minutes
  maxSuggestionsPerSession: 5,
  contextThreshold: 0.7
})
```

**Adaptive Learning:**
- High acceptance rate (>70%) → Suggest more frequently
- High dismissal rate (>70%) → Suggest less frequently
- Recent dismissals → Increase wait time

### 3. AISuggestionBubble

UI component for displaying suggestions.

```tsx
import { AISuggestionBubble } from '@/presentation/components/ai'

function MyComponent() {
  const [showSuggestion, setShowSuggestion] = useState(true)

  if (!showSuggestion) return null

  return (
    <AISuggestionBubble
      suggestion="캠페인 성과를 AI가 분석해 드릴까요?"
      context="메트릭 분석 중"
      onAccept={() => {
        // Handle accept - navigate to AI analysis
        router.push('/ai-analysis')
      }}
      onDismiss={() => {
        setShowSuggestion(false)
      }}
      position="bottom-right"
    />
  )
}
```

**Variants:**

1. **Full Bubble** (default) - Floating bubble with glow effect
2. **Compact** - Inline banner style
3. **Tooltip** - Small tooltip style

```tsx
import {
  AISuggestionBubble,
  CompactAISuggestion,
  TooltipAISuggestion
} from '@/presentation/components/ai'

// Full bubble (floating)
<AISuggestionBubble
  suggestion="..."
  context="..."
  onAccept={() => {}}
  onDismiss={() => {}}
  position="bottom-right" // or "inline" or "tooltip"
/>

// Compact (inline banner)
<CompactAISuggestion
  suggestion="..."
  onAccept={() => {}}
  onDismiss={() => {}}
/>

// Tooltip (small popup)
<TooltipAISuggestion
  suggestion="..."
  onAccept={() => {}}
  onDismiss={() => {}}
/>
```

## Complete Integration Example

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getContextDetectionEngine,
  getAISuggestionTiming
} from '@/application/services'
import { AISuggestionBubble } from '@/presentation/components/ai'

export function ContextualAIProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [suggestion, setSuggestion] = useState<{
    text: string
    context: string
    action: () => void
  } | null>(null)

  useEffect(() => {
    const engine = getContextDetectionEngine()
    const timing = getAISuggestionTiming()

    // Subscribe to context changes
    const unsubscribe = engine.onContextChange((context) => {
      // Check if should suggest
      const { suggest } = engine.shouldSuggestAI()

      if (!suggest || !timing.canSuggestNow()) {
        return
      }

      // Map context to suggestion
      const suggestions = {
        creating_campaign: {
          text: 'AI가 타겟팅을 추천해 드릴까요?',
          context: '캠페인 생성 중',
          action: () => router.push('/ai/targeting')
        },
        analyzing_metrics: {
          text: '성과 데이터를 AI가 분석해 드릴까요?',
          context: '메트릭 분석 중',
          action: () => router.push('/ai/analysis')
        },
        writing_copy: {
          text: 'AI가 더 나은 카피를 제안해 드릴까요?',
          context: '광고 문구 작성 중',
          action: () => router.push('/ai/copywriting')
        },
        stuck_on_task: {
          text: '도움이 필요하신가요? AI에게 물어보세요.',
          context: '작업 진행 중',
          action: () => router.push('/ai/help')
        }
      }

      const suggestionData = suggestions[context.type as keyof typeof suggestions]
      if (suggestionData) {
        setSuggestion(suggestionData)
        timing.recordSuggestion()
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <>
      {children}

      {suggestion && (
        <AISuggestionBubble
          suggestion={suggestion.text}
          context={suggestion.context}
          onAccept={() => {
            const timing = getAISuggestionTiming()
            timing.recordResponse(true)
            suggestion.action()
            setSuggestion(null)
          }}
          onDismiss={() => {
            const timing = getAISuggestionTiming()
            timing.recordResponse(false)
            setSuggestion(null)
          }}
        />
      )}
    </>
  )
}
```

## Tracking User Actions

Track actions throughout your app to build context:

```tsx
// In campaign creation page
useEffect(() => {
  const engine = getContextDetectionEngine()
  engine.trackAction('view_campaign_creator')

  return () => {
    engine.trackAction('exit_campaign_creator', {
      duration: Date.now() - startTime
    })
  }
}, [])

// On form input
const handleCopyChange = (value: string) => {
  const engine = getContextDetectionEngine()
  engine.trackAction('edit_copy', {
    valueChanged: value !== previousValue,
    repeatCount: editCount++
  })
}

// On error
const handleError = (error: Error) => {
  const engine = getContextDetectionEngine()
  engine.trackAction('error_occurred', {
    errorOccurred: true
  })
}
```

## Configuration

### Context Detection Configuration

The engine uses built-in rules but you can extend it:

```typescript
const engine = getContextDetectionEngine()

// Clear history for testing
engine.clearHistory()

// Get action history for debugging
const history = engine.getHistory()
```

### Timing Configuration

```typescript
const timing = getAISuggestionTiming()

timing.updateConfig({
  minTimeBetweenSuggestions: 5 * 60 * 1000,  // 5 minutes
  maxSuggestionsPerSession: 3,                // Max 3 per session
  contextThreshold: 0.6                       // Min 60% confidence
})

// Export session data for analytics
const sessionData = timing.exportSessionData()
```

## Best Practices

1. **Track Actions Consistently**
   - Track page views, form interactions, errors
   - Include relevant metadata (duration, repeat count)

2. **Map Contexts to Helpful Actions**
   - Each context should have a clear, helpful suggestion
   - Suggestions should provide immediate value

3. **Test Timing**
   - Start conservative (longer delays, fewer suggestions)
   - Let system adapt based on user responses

4. **Monitor Analytics**
   - Track acceptance rates per context
   - Adjust suggestions based on data

5. **Respect User Choice**
   - Never force suggestions
   - Always provide easy dismiss
   - Learn from dismissals

## Example User Flows

### Flow 1: Campaign Creation Help

1. User navigates to campaign creator
2. Action tracked: `view_campaign_creator`
3. User fills out form
4. Actions tracked: `input_campaign_name`, `select_objective`
5. Context detected: `creating_campaign` (confidence: 0.8)
6. Timing check: ✓ Can suggest (no recent suggestions)
7. Suggestion shown: "AI가 타겟팅을 추천해 드릴까요?"
8. User accepts → Navigate to AI targeting
9. Response recorded: `accepted = true`

### Flow 2: Stuck on Task

1. User viewing metrics dashboard
2. Same actions repeated 3 times
3. Context detected: `stuck_on_task` (confidence: 0.8)
4. Suggestion shown: "도움이 필요하신가요?"
5. User dismisses
6. Response recorded: `accepted = false`
7. Next suggestion delayed (adaptive timing)

## Testing

```typescript
import {
  ContextDetectionEngine,
  AISuggestionTiming
} from '@/application/services'

describe('Contextual AI Suggestions', () => {
  it('detects campaign creation context', () => {
    const engine = new ContextDetectionEngine()

    engine.trackAction('view_campaign_creator')
    engine.trackAction('input_campaign_name')

    const context = engine.getCurrentContext()
    expect(context?.type).toBe('creating_campaign')
    expect(context?.confidence).toBeGreaterThan(0.5)
  })

  it('respects timing limits', () => {
    const timing = new AISuggestionTiming({
      minTimeBetweenSuggestions: 1000
    })

    timing.recordSuggestion()
    expect(timing.canSuggestNow()).toBe(false)

    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, 1100))
    expect(timing.canSuggestNow()).toBe(true)
  })
})
```

## Performance Considerations

- **Memory**: Engine keeps max 50 recent actions
- **CPU**: Context detection runs on action tracking (debounced internally)
- **Network**: No network calls (fully client-side)
- **Storage**: Optional persistence via localStorage (not implemented yet)

## Future Enhancements

- [ ] Persistence across sessions
- [ ] A/B testing different suggestions
- [ ] Machine learning for better context detection
- [ ] Integration with analytics
- [ ] Custom context rules API
- [ ] Multi-language support
