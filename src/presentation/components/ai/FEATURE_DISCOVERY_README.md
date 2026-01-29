# AI Feature Discovery & Onboarding Components

Progressive disclosure system to help users discover and learn AI features naturally.

## Components

### 1. AIFeatureTour

Guided tour with spotlight effect highlighting specific UI elements.

```tsx
import { AIFeatureTour, TourStep } from '@/presentation/components/ai'

const steps: TourStep[] = [
  {
    id: 'copy-generation',
    target: '[data-tour="copy-generation"]', // CSS selector
    title: 'AI 광고 카피 생성',
    description: '과학적 마케팅 원칙을 기반으로...',
    feature: 'AI 카피 생성',
    position: 'bottom', // 'top' | 'bottom' | 'left' | 'right'
    offset: { x: 0, y: 0 } // Optional positioning adjustment
  },
  // ... more steps
]

function MyComponent() {
  const [isTourOpen, setIsTourOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsTourOpen(true)}>
        투어 시작
      </button>

      <AIFeatureTour
        steps={steps}
        isOpen={isTourOpen}
        onComplete={() => {
          setIsTourOpen(false)
          // Mark features as discovered
        }}
        onSkip={() => setIsTourOpen(false)}
      />
    </>
  )
}
```

**Features:**
- Spotlight effect with backdrop blur
- Step-by-step navigation
- Progress indicators
- Skip and complete actions
- Auto-scroll target into view
- Responsive positioning

---

### 2. FirstUseGuide

Modal or inline guide shown when user first uses a feature.

```tsx
import { FirstUseGuide } from '@/presentation/components/ai'

function MyFeature() {
  const [showGuide, setShowGuide] = useState(false)
  const { isDiscovered, markDiscovered } = useFeatureDiscovery()

  useEffect(() => {
    // Show guide on first use
    if (!isDiscovered('copy_generation')) {
      setShowGuide(true)
    }
  }, [])

  return (
    <>
      {/* Your feature UI */}

      {showGuide && (
        <FirstUseGuide
          feature="copy_generation"
          variant="modal" // or 'inline'
          onDismiss={() => {
            setShowGuide(false)
            markDiscovered('copy_generation')
          }}
          onStartTour={() => {
            setShowGuide(false)
            // Start full tour
          }}
        />
      )}
    </>
  )
}
```

**Features:**
- Modal or inline variants
- Feature capabilities list
- Usage tips
- "다시 보지 않기" checkbox
- Optional tour CTA

**Supported Features:**
- `copy_generation` - AI 광고 카피 생성
- `analysis` - AI 캠페인 분석
- `chat` - AI 마케팅 어시스턴트
- `insights` - AI 인사이트
- `proactive_insights` - 능동적 인사이트
- `science_score` - 과학 신뢰도 점수
- `contextual_suggestions` - 맥락 기반 제안
- `ambient_insights` - 앰비언트 인사이트
- `error_recovery` - AI 오류 복구
- `confidence_indicator` - 신뢰도 표시

---

### 3. FeatureDiscoveryHint

Subtle hint for undiscovered features.

```tsx
import { FeatureDiscoveryHint } from '@/presentation/components/ai'

function MyFeature() {
  const { isDiscovered, markDiscovered } = useFeatureDiscovery()

  return (
    <div>
      {/* Badge style - compact indicator */}
      {!isDiscovered('insights') && (
        <FeatureDiscoveryHint
          feature="insights"
          hint="NEW"
          position="badge"
          onDismiss={() => markDiscovered('insights')}
          showOnce={true}
        />
      )}

      {/* Inline style - full message */}
      {!isDiscovered('analysis') && (
        <FeatureDiscoveryHint
          feature="analysis"
          hint="새로운 AI 분석 기능이 추가되었습니다. 캠페인 성과를 자동으로 분석합니다."
          position="inline"
          onDismiss={() => markDiscovered('analysis')}
        />
      )}

      {/* Tooltip style - positioned absolutely */}
      {!isDiscovered('chat') && (
        <FeatureDiscoveryHint
          feature="chat"
          hint="AI와 대화하며 마케팅 아이디어를 얻으세요"
          position="tooltip"
          onDismiss={() => markDiscovered('chat')}
          className="absolute top-full left-0 mt-2"
        />
      )}
    </div>
  )
}
```

**Positions:**
- `badge` - Compact "NEW" badge with pulsing animation
- `inline` - Full-width message with gradient background
- `tooltip` - Floating tooltip (requires manual positioning)

**Features:**
- Three visual styles
- Auto-dismiss on click
- Optional show-once behavior
- Pulsing animation for badges
- Dismissible with X button

---

### 4. useFeatureDiscovery Hook

Track which AI features users have discovered.

```tsx
import { useFeatureDiscovery, AIFeatureType } from '@/presentation/hooks/useFeatureDiscovery'

function MyComponent() {
  const {
    isLoaded,                    // Boolean: localStorage loaded
    discoveredFeatures,          // Object: all discovered features
    markDiscovered,              // Function: mark feature as discovered
    isDiscovered,                // Function: check if discovered
    getViewCount,                // Function: get view count
    getDiscoveryDate,            // Function: get discovery date
    getUndiscoveredFeatures,     // Function: list undiscovered
    resetAll,                    // Function: reset all (for testing)
    getTotalDiscoveredCount,     // Function: count discovered
    getDiscoveryProgress,        // Function: percentage discovered
  } = useFeatureDiscovery()

  // Wait for localStorage to load
  if (!isLoaded) return <div>Loading...</div>

  // Check discovery status
  if (!isDiscovered('copy_generation')) {
    // Show first-use guide
  }

  // Mark as discovered
  const handleFeatureUse = () => {
    markDiscovered('copy_generation')
    // Increments view count
  }

  // Get statistics
  const viewCount = getViewCount('copy_generation')
  const discoveryDate = getDiscoveryDate('copy_generation')
  const progress = getDiscoveryProgress() // 0-100

  return (
    <div>
      <p>발견한 기능: {getTotalDiscoveredCount()} / 10</p>
      <p>진행률: {progress}%</p>
    </div>
  )
}
```

**Storage:**
- Persists to `localStorage` under key `batwo_discovered_features`
- Format: `{ [feature]: { discoveredAt: ISO8601, viewCount: number } }`

**AI Feature Types:**
```typescript
type AIFeatureType =
  | 'copy_generation'
  | 'analysis'
  | 'chat'
  | 'insights'
  | 'proactive_insights'
  | 'science_score'
  | 'contextual_suggestions'
  | 'ambient_insights'
  | 'error_recovery'
  | 'confidence_indicator'
```

---

## Design Philosophy

### Progressive Disclosure
Don't overwhelm users with all features at once. Introduce them gradually:

1. **First Visit**: Show 1-2 core features
2. **After First Success**: Hint at related features
3. **Week 1**: Introduce advanced features
4. **Ongoing**: Ambient hints for undiscovered features

### Natural Discovery
Let users discover features through normal usage:

```tsx
// BAD: Force tutorial on every page
<ForcedTutorial />

// GOOD: Show hint when relevant
{isOnCampaignPage && !isDiscovered('analysis') && (
  <FeatureDiscoveryHint
    feature="analysis"
    hint="AI가 이 캠페인을 분석할 수 있습니다"
    position="inline"
  />
)}
```

### Respectful Interruption
Use the right level of intrusiveness:

- **Badge**: Passive, doesn't block workflow
- **Inline hint**: Noticeable but skippable
- **Modal guide**: Only on explicit feature activation
- **Full tour**: User-initiated only

---

## Best Practices

### 1. Wait for First Success
```tsx
// Wait until user creates their first campaign
useEffect(() => {
  if (hasCampaigns && !isDiscovered('analysis')) {
    setShowAnalysisHint(true)
  }
}, [hasCampaigns])
```

### 2. Context-Aware Hints
```tsx
// Show copy generation hint on campaign creation page
{isCreatingCampaign && !isDiscovered('copy_generation') && (
  <FeatureDiscoveryHint
    feature="copy_generation"
    hint="AI가 광고 카피를 자동으로 생성할 수 있습니다"
  />
)}
```

### 3. Respect User Preferences
```tsx
// Don't show if user dismissed "다시 보지 않기"
if (!isDiscovered('feature') && showAgain) {
  // Show guide
}
```

### 4. Group Related Features
```tsx
// After discovering basic analysis, hint at advanced features
useEffect(() => {
  if (isDiscovered('analysis') && !isDiscovered('insights')) {
    setTimeout(() => setShowInsightsHint(true), 3000)
  }
}, [isDiscovered])
```

### 5. Use Data Attributes for Tours
```tsx
// Make tour targets explicit
<button data-tour="copy-generation">
  AI 카피 생성
</button>
```

---

## Implementation Checklist

- [ ] Add `data-tour` attributes to key UI elements
- [ ] Create tour steps for main user journey
- [ ] Implement first-use guides for each AI feature
- [ ] Add discovery hints at natural trigger points
- [ ] Test discovery flow from fresh user perspective
- [ ] Verify localStorage persistence
- [ ] Add analytics tracking for discovery events
- [ ] Test skip/dismiss functionality
- [ ] Verify mobile responsiveness
- [ ] Add accessibility labels (aria-label)

---

## Example: Complete Onboarding Flow

```tsx
function CampaignPage() {
  const { isDiscovered, markDiscovered } = useFeatureDiscovery()
  const [showCopyGuide, setShowCopyGuide] = useState(false)
  const [isTourActive, setIsTourActive] = useState(false)

  // 1. Check if user should see onboarding
  useEffect(() => {
    const totalDiscovered = getTotalDiscoveredCount()
    if (totalDiscovered === 0) {
      // First time user - start tour
      setIsTourActive(true)
    }
  }, [])

  // 2. Show feature-specific guide on first use
  const handleCopyButtonClick = () => {
    if (!isDiscovered('copy_generation')) {
      setShowCopyGuide(true)
    } else {
      // Execute feature
      generateCopy()
    }
  }

  return (
    <div>
      {/* 3. Discovery hints for undiscovered features */}
      {!isDiscovered('analysis') && (
        <FeatureDiscoveryHint
          feature="analysis"
          hint="AI 분석으로 캠페인 성과를 개선하세요"
          position="inline"
          className="mb-4"
        />
      )}

      {/* Feature UI with tour target */}
      <button
        data-tour="copy-generation"
        onClick={handleCopyButtonClick}
      >
        AI 카피 생성
        {!isDiscovered('copy_generation') && (
          <FeatureDiscoveryHint
            feature="copy_generation"
            hint="NEW"
            position="badge"
          />
        )}
      </button>

      {/* 4. First-use guide */}
      {showCopyGuide && (
        <FirstUseGuide
          feature="copy_generation"
          onDismiss={() => {
            setShowCopyGuide(false)
            markDiscovered('copy_generation')
          }}
          onStartTour={() => {
            setShowCopyGuide(false)
            setIsTourActive(true)
          }}
        />
      )}

      {/* 5. Full feature tour */}
      <AIFeatureTour
        steps={tourSteps}
        isOpen={isTourActive}
        onComplete={() => setIsTourActive(false)}
        onSkip={() => setIsTourActive(false)}
      />
    </div>
  )
}
```

---

## Analytics Integration

Track discovery metrics:

```typescript
import { trackEvent } from '@/lib/analytics'

// Track feature discovery
markDiscovered(feature)
trackEvent('feature_discovered', {
  feature,
  discoveryMethod: 'tour' | 'organic' | 'hint',
  daysSinceSignup: calculateDays(),
})

// Track tour completion
trackEvent('onboarding_tour_completed', {
  stepsCompleted: steps.length,
  timeSpent: duration,
})

// Track hint dismissals
trackEvent('discovery_hint_dismissed', {
  feature,
  showAgain: !checkbox,
})
```

---

## See Also

- [Example Implementation](./examples/FeatureOnboardingExample.tsx)
- [Design System - AI Components](/src/presentation/components/ai/README.md)
- [UX Guidelines](/docs/ux-guidelines.md)
