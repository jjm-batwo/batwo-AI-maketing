# Contextual AI Suggestion System - Implementation Summary

## Overview

A complete, non-intrusive AI suggestion system that offers help at contextually appropriate moments. The system learns from user interactions and adapts its behavior to respect user preferences.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Actions                              │
│         (page views, clicks, form inputs, errors)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ContextDetectionEngine                          │
│  - Tracks actions and metadata                               │
│  - Detects patterns (creating, analyzing, stuck, etc.)       │
│  - Emits context signals with confidence scores              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AISuggestionTiming                              │
│  - Controls suggestion frequency                             │
│  - Learns from user responses                                │
│  - Adapts timing based on acceptance/dismissal               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AISuggestionBubble                              │
│  - Non-intrusive UI component                                │
│  - Smooth animations                                         │
│  - Easy to dismiss                                           │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

### 1. Core Services

#### `/src/application/services/ContextDetectionEngine.ts`
**Purpose:** Detects user context based on actions

**Key Features:**
- Tracks user actions with metadata
- Detects 6 context types:
  - `creating_campaign` - User creating a campaign
  - `analyzing_metrics` - User viewing metrics
  - `writing_copy` - User editing copy
  - `reviewing_performance` - User viewing reports
  - `stuck_on_task` - User appears stuck (repeated actions, errors)
  - `idle` - User inactive
- Emits context signals with confidence scores
- Observable pattern (subscribe to context changes)
- Keeps last 50 actions in memory

**API:**
```typescript
const engine = getContextDetectionEngine()
engine.trackAction('view_campaign', { duration: 5000 })
const context = engine.getCurrentContext()
engine.onContextChange((context) => { /* ... */ })
```

#### `/src/application/services/AISuggestionTiming.ts`
**Purpose:** Controls when and how often to show suggestions

**Key Features:**
- Configurable timing (min time between suggestions, max per session)
- Adaptive learning:
  - High acceptance rate → Suggest more frequently
  - High dismissal rate → Suggest less frequently
- Records user responses for analytics
- Prevents suggestion fatigue

**API:**
```typescript
const timing = getAISuggestionTiming()
if (timing.canSuggestNow()) {
  timing.recordSuggestion()
  // Show suggestion
}
timing.recordResponse(true) // accepted
```

### 2. UI Components

#### `/src/presentation/components/ai/AISuggestionBubble.tsx`
**Purpose:** Non-intrusive suggestion UI

**Components:**
1. **AISuggestionBubble** - Full floating bubble with glow effect
2. **CompactAISuggestion** - Inline banner style
3. **TooltipAISuggestion** - Small tooltip style
4. **useSuggestionState** - Hook for managing suggestion state

**Features:**
- Smooth entrance/exit animations
- Never jumps or distracts
- Easy dismiss button
- Gradient background with glow effect
- Korean language ("AI가 도움을 드릴까요?")

**API:**
```tsx
<AISuggestionBubble
  suggestion="성과를 분석해 드릴까요?"
  context="메트릭 분석 중"
  onAccept={() => router.push('/ai/analysis')}
  onDismiss={() => setShow(false)}
  position="bottom-right"
/>
```

#### `/src/presentation/components/ai/ContextualAIProvider.tsx`
**Purpose:** Global provider for contextual suggestions

**Features:**
- Monitors user context globally
- Shows suggestions at appropriate moments
- Customizable suggestion mappings
- Tracks page navigation automatically
- Provides hooks for manual control

**Hooks:**
- `useContextTracking()` - Track actions in components
- `useSuggestionTiming()` - Access timing controls
- `useManualSuggestion()` - Show suggestions manually

**API:**
```tsx
<ContextualAIProvider enabled={true}>
  <App />
</ContextualAIProvider>

// In components:
const { trackAction } = useContextTracking()
trackAction('edit_copy', { repeatCount: 3 })
```

### 3. Documentation

#### `/src/presentation/components/ai/CONTEXTUAL_SUGGESTION_USAGE.md`
Complete usage guide with examples covering:
- Component overview
- Integration patterns
- Configuration options
- Best practices
- Testing strategies
- Performance considerations

#### `/src/presentation/components/ai/examples/ContextualAIIntegration.example.tsx`
12 practical examples:
1. Global provider setup
2. Custom suggestions
3. Campaign form tracking
4. Stuck detection
5. Manual triggers
6. Copy editor tracking
7. Page duration tracking
8. Statistics viewing
9. Conditional display
10. Dashboard integration
11. Error recovery
12. A/B testing

#### `/src/presentation/components/ai/CONTEXTUAL_SUGGESTION_SUMMARY.md`
This file - complete overview of the system

### 4. Exports

#### Updated `/src/application/services/index.ts`
```typescript
export * from './ContextDetectionEngine'
export * from './AISuggestionTiming'
```

#### Updated `/src/presentation/components/ai/index.ts`
```typescript
export {
  AISuggestionBubble,
  CompactAISuggestion,
  TooltipAISuggestion,
  ContextualAIProvider,
  useContextTracking,
  useSuggestionTiming,
  useManualSuggestion
}
```

## Quick Start

### 1. Add Provider to Root Layout

```tsx
// app/layout.tsx
import { ContextualAIProvider } from '@/presentation/components/ai'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ContextualAIProvider enabled={true}>
          {children}
        </ContextualAIProvider>
      </body>
    </html>
  )
}
```

### 2. Track Actions in Components

```tsx
// components/CampaignForm.tsx
import { useContextTracking } from '@/presentation/components/ai'

export function CampaignForm() {
  const { trackAction } = useContextTracking()

  useEffect(() => {
    trackAction('view_campaign_creator')
  }, [])

  const handleSubmit = () => {
    trackAction('submit_campaign')
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### 3. Manual Suggestions

```tsx
// components/Dashboard.tsx
import { useManualSuggestion, CompactAISuggestion } from '@/presentation/components/ai'

export function Dashboard() {
  const { isShowing, showSuggestion, hideSuggestion } = useManualSuggestion()

  const handleComplexAction = () => {
    // Do something complex
    showSuggestion() // Show suggestion after
  }

  return (
    <div>
      <button onClick={handleComplexAction}>작업 실행</button>

      {isShowing && (
        <CompactAISuggestion
          suggestion="다음 단계를 도와드릴까요?"
          onAccept={() => hideSuggestion(true)}
          onDismiss={() => hideSuggestion(false)}
        />
      )}
    </div>
  )
}
```

## Key Design Decisions

### 1. Non-Intrusive
- Suggestions appear only when contextually appropriate
- Easy to dismiss
- Smooth animations (no jarring transitions)
- Fixed position (doesn't shift content)

### 2. Adaptive Learning
- Tracks acceptance/dismissal rates
- Adjusts frequency based on user preference
- High acceptance → Suggest more often
- High dismissal → Suggest less often

### 3. Context-Aware
- Detects 6 distinct user contexts
- Confidence-based triggering
- Pattern recognition (stuck detection)
- Metadata-rich tracking

### 4. Performance
- Lightweight (no network calls)
- Efficient memory usage (max 50 actions)
- Client-side only
- No persistence (yet)

### 5. Flexible
- Customizable suggestions
- Multiple UI variants
- Manual override controls
- Configurable timing

## Configuration

### Default Configuration
```typescript
{
  minTimeBetweenSuggestions: 5 * 60 * 1000,  // 5 minutes
  maxSuggestionsPerSession: 3,                // Max 3 per session
  contextThreshold: 0.6                       // Min 60% confidence
}
```

### Custom Configuration
```typescript
import { getAISuggestionTiming } from '@/application/services'

const timing = getAISuggestionTiming()
timing.updateConfig({
  minTimeBetweenSuggestions: 10 * 60 * 1000, // 10 minutes
  maxSuggestionsPerSession: 5,
  contextThreshold: 0.7
})
```

## Metrics & Analytics

### Available Statistics
```typescript
const stats = timing.getStats()
// {
//   shown: 5,
//   accepted: 3,
//   dismissed: 2,
//   acceptanceRate: 0.6
// }
```

### Session Data Export
```typescript
const sessionData = timing.exportSessionData()
// {
//   config: { ... },
//   stats: { ... },
//   sessionDuration: 123456,
//   suggestions: [{ timestamp, accepted }, ...]
// }
```

## Testing

### Unit Tests
```typescript
import { ContextDetectionEngine } from '@/application/services'

describe('Context Detection', () => {
  it('detects campaign creation', () => {
    const engine = new ContextDetectionEngine()
    engine.trackAction('view_campaign_creator')
    engine.trackAction('input_campaign_name')

    const context = engine.getCurrentContext()
    expect(context?.type).toBe('creating_campaign')
  })
})
```

### Integration Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextualAIProvider } from '@/presentation/components/ai'

describe('Contextual Suggestions', () => {
  it('shows suggestion on context change', async () => {
    render(
      <ContextualAIProvider>
        <TestComponent />
      </ContextualAIProvider>
    )

    // Trigger actions...
    // Wait for suggestion...
    expect(screen.getByText(/AI가 도움을 드릴까요/)).toBeInTheDocument()
  })
})
```

## Future Enhancements

### Planned Features
- [ ] Persistence across sessions (localStorage)
- [ ] Machine learning for better context detection
- [ ] A/B testing framework
- [ ] Analytics integration
- [ ] Custom context rules API
- [ ] Multi-language support
- [ ] Mobile optimization
- [ ] Accessibility improvements

### Potential Integrations
- [ ] Google Analytics event tracking
- [ ] Segment/Amplitude integration
- [ ] Feature flag integration (LaunchDarkly)
- [ ] User preference storage
- [ ] Backend suggestion orchestration

## Troubleshooting

### Suggestions not appearing?
1. Check if provider is enabled: `<ContextualAIProvider enabled={true}>`
2. Check timing: `timing.getTimeUntilNextSuggestion()`
3. Check context confidence: `engine.getCurrentContext()`
4. Check action history: `engine.getHistory()`

### Too many suggestions?
```typescript
timing.updateConfig({
  minTimeBetweenSuggestions: 15 * 60 * 1000, // Increase to 15 min
  maxSuggestionsPerSession: 2 // Reduce to 2
})
```

### Not enough suggestions?
```typescript
timing.updateConfig({
  minTimeBetweenSuggestions: 2 * 60 * 1000, // Reduce to 2 min
  contextThreshold: 0.5 // Lower threshold
})
```

## Support

For questions or issues:
- See usage guide: `CONTEXTUAL_SUGGESTION_USAGE.md`
- See examples: `examples/ContextualAIIntegration.example.tsx`
- Check implementation: Source files in this directory

## License

Part of the Batwo AI Marketing Solution
Proprietary - All rights reserved
