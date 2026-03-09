# Graceful Degradation System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AIFallbackManager                               │
│  - Automatic tier fallback                                   │
│  - Health monitoring                                         │
│  - Retry logic with exponential backoff                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  TIER 1      │  │  TIER 2      │  │  TIER 3      │
│  Advanced AI │  │  Basic AI    │  │  Templates   │
│              │  │              │  │              │
│  - GPT-4     │  │  - GPT-3.5   │  │  - Static    │
│  - Claude    │  │  - Haiku     │  │  - Fallback  │
│  - Complex   │  │  - Simple    │  │  - Reliable  │
│              │  │              │  │              │
│  30s timeout │  │  30s timeout │  │  Instant     │
│  2 retries   │  │  2 retries   │  │  No retry    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Result Processing                          │
│                                                              │
│  Success → return data with tier info                       │
│  Partial → PartialSuccessUI                                 │
│  Error   → ErrorRecoveryDisplay                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. AIFallbackManager (Service Layer)

**Location:** `src/application/services/AIFallbackManager.ts`

```typescript
┌─────────────────────────────────────────┐
│       AIFallbackManager                 │
├─────────────────────────────────────────┤
│ Properties:                             │
│  - config: FallbackConfig              │
│  - health: TierHealth                  │
│                                         │
│ Methods:                                │
│  + executeWithFallback<T>()            │
│  + getHealthStatus()                   │
│  + resetHealth()                       │
│  + disableTier()                       │
│  + enableTier()                        │
│                                         │
│ Private:                                │
│  - executeWithTimeout()                │
│  - recordSuccess()                     │
│  - recordFailure()                     │
└─────────────────────────────────────────┘
```

**Key Features:**

- Automatic tier selection based on health
- Exponential backoff retry (1s, 2s, 4s)
- Circuit breaker pattern (5 failures → disable tier)
- Auto-recovery after cooldown (60s)

### 2. PartialSuccessUI (Presentation Layer)

**Location:** `src/presentation/components/ai/PartialSuccessUI.tsx`

```typescript
┌─────────────────────────────────────────┐
│       PartialSuccessUI                  │
├─────────────────────────────────────────┤
│ Props:                                  │
│  - results: PartialResult[]            │
│  - onRetryFailed?: (field) => void     │
│  - title?: string                      │
│  - showSuccessful?: boolean            │
│                                         │
│ Visual Elements:                        │
│  □ Summary header (N/M successful)     │
│  ▬ Overall progress bar                │
│  □ Individual result cards             │
│  🔄 Retry buttons                       │
└─────────────────────────────────────────┘
```

**Status Types:**

- ✅ `success` - Green, completed successfully
- ❌ `failed` - Red, failed with error
- ⚠️ `fallback` - Amber, using fallback value

### 3. ErrorRecoveryDisplay (Presentation Layer)

**Location:** `src/presentation/components/ai/ErrorRecoveryDisplay.tsx`

```typescript
┌─────────────────────────────────────────┐
│     ErrorRecoveryDisplay                │
├─────────────────────────────────────────┤
│ Props:                                  │
│  - error: string                       │
│  - recoveryOptions: RecoveryOption[]   │
│  - severity?: 'error'|'warning'|'info' │
│  - onDismiss?: () => void              │
│                                         │
│ Visual Elements:                        │
│  ⚠️ Status icon with severity color     │
│  📝 Error message                       │
│  ⭐ Recommended action (highlighted)    │
│  📋 Additional recovery options         │
└─────────────────────────────────────────┘
```

**Severity Levels:**

- 🔴 `error` - Red, critical failure
- 🟡 `warning` - Amber, degraded service
- 🔵 `info` - Blue, informational

## Data Flow

### Successful Flow (Advanced Tier)

```
User Action
    ↓
AIFallbackManager.executeWithFallback()
    ↓
Try Advanced AI (GPT-4)
    ↓
[SUCCESS within 30s]
    ↓
recordSuccess('advanced')
    ↓
Return {
  data: result,
  tier: 'advanced',
  wasDowngraded: false
}
    ↓
Display Result
```

### Degraded Flow (Fallback to Basic)

```
User Action
    ↓
AIFallbackManager.executeWithFallback()
    ↓
Try Advanced AI (GPT-4)
    ↓
[TIMEOUT or ERROR]
    ↓
recordFailure('advanced')
    ↓
Try Basic AI (GPT-3.5)
    ↓
[SUCCESS within 30s]
    ↓
recordSuccess('basic')
    ↓
Return {
  data: result,
  tier: 'basic',
  wasDowngraded: true,
  originalError: 'Advanced timeout'
}
    ↓
Display Result (with warning badge)
```

### Full Degradation (Template)

```
User Action
    ↓
AIFallbackManager.executeWithFallback()
    ↓
Try Advanced AI → [FAIL]
    ↓
Try Basic AI → [FAIL]
    ↓
Use Template
    ↓
Return {
  data: templateData,
  tier: 'template',
  wasDowngraded: true,
  originalError: 'All AI tiers failed'
}
    ↓
Display with ErrorRecoveryDisplay
```

### Partial Success Flow

```
User Action: Generate 4 fields
    ↓
Execute parallel for each field:
    ↓
Field 1 → Advanced AI → ✅ Success
Field 2 → Advanced AI → ❌ Failed → Basic AI → ✅ Success (fallback)
Field 3 → Advanced AI → ❌ Failed → Basic AI → ❌ Failed
Field 4 → Advanced AI → ✅ Success
    ↓
Collect results: [success, fallback, failed, success]
    ↓
Display PartialSuccessUI with retry options
```

## Health Monitoring

### Health State Machine

```
┌─────────────────┐
│   HEALTHY       │
│  (0-4 failures) │
└────────┬────────┘
         │
         │ 5th failure
         ▼
┌─────────────────┐
│   DEGRADED      │
│  (tier disabled)│
└────────┬────────┘
         │
         │ 60s cooldown
         ▼
┌─────────────────┐
│   RECOVERING    │
│ (auto re-enable)│
└────────┬────────┘
         │
         │ next success
         ▼
┌─────────────────┐
│   HEALTHY       │
└─────────────────┘
```

### Health Metrics

```typescript
interface TierHealth {
  advanced: boolean // Currently enabled?
  basic: boolean
  lastAdvancedCheck: Date // Last attempt timestamp
  lastBasicCheck: Date
  advancedFailCount: number // Consecutive failures
  basicFailCount: number
}
```

## Configuration

### Default Configuration

```typescript
{
  maxRetries: 2,           // Retry each tier up to 2 times
  timeoutMs: 30000,        // 30 second timeout per attempt
  enabledTiers: ['advanced', 'basic', 'template']
}
```

### Custom Configurations

**Quick Response (Low Latency)**

```typescript
{
  maxRetries: 1,
  timeoutMs: 10000,  // 10s
  enabledTiers: ['basic', 'template']  // Skip advanced
}
```

**High Accuracy (Quality First)**

```typescript
{
  maxRetries: 3,
  timeoutMs: 60000,  // 60s
  enabledTiers: ['advanced', 'basic', 'template']
}
```

**Template Only (Maintenance Mode)**

```typescript
{
  maxRetries: 0,
  timeoutMs: 0,
  enabledTiers: ['template']  // AI disabled
}
```

## Error Handling

### Error Types

1. **Timeout Error**
   - Tier: Advanced/Basic
   - Action: Automatic fallback
   - User: Not notified (transparent)

2. **API Error**
   - Tier: Advanced/Basic
   - Action: Automatic fallback with retry
   - User: Not notified unless all tiers fail

3. **Total Failure**
   - Tier: All (including template)
   - Action: Show ErrorRecoveryDisplay
   - User: Choose recovery option

4. **Partial Failure**
   - Tier: Mixed
   - Action: Show PartialSuccessUI
   - User: Retry failed items

## Performance Characteristics

### Latency (best case → worst case)

| Scenario          | Time   | Tier Used |
| ----------------- | ------ | --------- |
| Advanced success  | 2-5s   | Advanced  |
| Basic fallback    | 5-10s  | Basic     |
| Template fallback | <100ms | Template  |
| Full retry (2x)   | 60-90s | All tiers |

### Throughput

- **Parallel operations**: Unlimited (independent fallbacks)
- **Sequential retry**: 2x per tier (exponential backoff)
- **Circuit breaker**: Disables after 5 failures

## Integration Points

### With Existing Services

```typescript
// CampaignAnalyzer integration
class CampaignAnalyzer {
  private fallback = new AIFallbackManager()

  async analyze(campaign: Campaign) {
    return await this.fallback.executeWithFallback(
      () => this.analyzeWithGPT4(campaign),
      () => this.analyzeWithGPT35(campaign),
      () => this.getBasicMetrics(campaign)
    )
  }
}
```

### With UI Components

```tsx
// Dashboard integration
function CampaignDashboard() {
  const [analysisResult, setResult] = useState<FallbackResult<Analysis>>()

  useEffect(() => {
    analyzer.analyze(campaign).then(setResult)
  }, [campaign])

  if (analysisResult?.wasDowngraded) {
    return (
      <>
        <AnalysisDisplay data={analysisResult.data} />
        <Badge variant="warning">
          {analysisResult.tier === 'basic' ? '기본 분석' : '템플릿 사용'}
        </Badge>
      </>
    )
  }

  return <AnalysisDisplay data={analysisResult?.data} />
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('AIFallbackManager', () => {
  it('should use advanced tier when healthy')
  it('should fallback to basic on advanced failure')
  it('should fallback to template on all AI failures')
  it('should retry with exponential backoff')
  it('should disable tier after 5 failures')
  it('should auto-recover after cooldown')
})
```

### Integration Tests

```typescript
describe('Graceful Degradation', () => {
  it('should handle partial success in multi-field generation')
  it('should allow retry of failed fields')
  it('should preserve successful fields during retry')
  it('should show appropriate UI for each state')
})
```

### E2E Tests

```typescript
describe('User Experience', () => {
  it('should transparently fallback without user notice')
  it('should show recovery options on total failure')
  it('should allow manual retry from UI')
  it('should maintain functionality with templates only')
})
```

## Monitoring & Observability

### Metrics to Track

```typescript
{
  // Success rates
  advancedSuccessRate: 0.95,
  basicSuccessRate: 0.98,
  templateUsageRate: 0.02,

  // Latency
  p50LatencyAdvanced: 2500,  // ms
  p95LatencyAdvanced: 4500,
  p99LatencyAdvanced: 8000,

  // Failures
  advancedFailuresLast24h: 12,
  basicFailuresLast24h: 3,
  consecutiveFailures: 0,

  // Health
  currentTierStatus: {
    advanced: true,
    basic: true
  }
}
```

### Alerts

- **Critical**: Both AI tiers down (template only)
- **Warning**: Advanced tier disabled (basic fallback)
- **Info**: High degradation rate (>10%)

## Future Enhancements

1. **Adaptive Timeout**
   - Adjust based on historical performance
   - Faster timeout during known outages

2. **Smart Tier Selection**
   - Skip advanced tier during peak hours
   - Use user's payment tier to select AI tier

3. **Predictive Fallback**
   - Preemptively use basic tier if advanced is slow
   - A/B test different fallback strategies

4. **Cost Optimization**
   - Track cost per tier
   - Auto-switch to basic if advanced cost spike
