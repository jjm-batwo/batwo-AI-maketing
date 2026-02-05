# AX Quick Start Guide

Quick reference for getting started with AI Experience optimization components.

## 10-Minute Setup

### 1. Import the Hook

```typescript
import { useAIStream } from '@/presentation/hooks/useAIStream'
```

### 2. Use in Component

```typescript
export function MyComponent() {
  const {
    text,
    isLoading,
    error,
    stage,
    progress,
    stream,
    stop
  } = useAIStream({
    onComplete: (text) => console.log('Done:', text)
  })

  return (
    <div>
      {isLoading && <ProgressBar stage={stage} percent={progress} />}
      <div>{text}</div>
      <button onClick={() => stream('/api/ai/chat', {
        body: JSON.stringify({ message: 'Hello' })
      })}>
        Ask AI
      </button>
    </div>
  )
}
```

### 3. Add Loading Indicator

```typescript
import { AILoadingIndicator } from '@/presentation/components/ai'

<AILoadingIndicator
  stage={stage}
  progress={progress}
  variant="inline"
/>
```

### 4. Add Confidence Display

```typescript
import { ConfidenceIndicator } from '@/presentation/components/ai'

<ConfidenceIndicator
  confidence={85}
  showPercentage
  size="md"
/>
```

## Key Components

### Streaming
- `useAIStream` - Hook for raw streaming
- `StreamingText` - Display streamed text

### Loading
- `AILoadingIndicator` - 3 variants (inline, overlay, minimal)
- `StreamingProgress` - Stage-by-stage progress
- `SkeletonAI` - Skeleton loader with AI branding

### Confidence
- `ConfidenceIndicator` - Badge/inline/tooltip confidence display
- `ConfidenceHighlight` - Color-coded text highlighting
- `EvidencePanel` - Show reasoning and sources

### Graceful Degradation
- `ErrorRecoveryDisplay` - Retry and fallback options
- `PartialSuccessUI` - Show partial results

### Ambient AI
- `AmbientInsightToast` - Non-intrusive insights
- `AISuggestionBubble` - Contextual suggestions
- `ContextualAIProvider` - Context detection wrapper

## API Endpoints

### Chat with Streaming

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Why is my ROAS dropping?",
    "stream": true
  }'
```

### Ad Copy with Streaming

```bash
curl -X POST http://localhost:3000/api/ai/copy \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Nike Shoes",
    "targetAudience": "Athletes",
    "stream": true
  }'
```

### Science-Backed Copy with Streaming

```bash
curl -X POST http://localhost:3000/api/ai/science-copy \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Nike Shoes",
    "scienceContext": "Performance metrics",
    "stream": true
  }'
```

## Verifying Installation

```bash
# Check types
npm run type-check

# Run tests
npm test -- streaming

# Build
npm run build
```

## Debugging

### Check if streaming is working

```typescript
const { stream } = useAIStream({
  onToken: (token) => console.log('Token:', token),
  onProgress: (stage, progress) => console.log('Progress:', stage, progress),
  onError: (error) => console.error('Error:', error)
})
```

### Monitor First Token Time

```typescript
let startTime: number

const { stream } = useAIStream({
  onStart: () => { startTime = Date.now() },
  onToken: (token) => {
    if (token) {
      const ftt = Date.now() - startTime
      console.log('First Token Time:', ftt, 'ms')
    }
  }
})
```

### Test fallback system

```typescript
import { AIFallbackManager } from '@/application/services/AIFallbackManager'

const mgr = new AIFallbackManager()
const result = await mgr.executeWithFallback(
  () => fetch('/api/expensive'),
  () => fetch('/api/cheap'),
  () => ({ cached: 'response' })
)

console.log('Used tier:', result.tier)
console.log('Was downgraded:', result.wasDowngraded)
```

## Common Tasks

### Add streaming to existing component

Before:
```typescript
const response = await fetch('/api/ai/chat', { ... })
const data = await response.json()
setResponse(data.message)
```

After:
```typescript
const { stream, text, isLoading } = useAIStream()

await stream('/api/ai/chat', {
  body: JSON.stringify({ message: 'Hello', stream: true })
})

// text updates automatically as tokens arrive
```

### Show confidence for AI response

```typescript
const confidenceScores = [95, 87, 92, 78] // Per sentence

<div>
  <ConfidenceIndicator
    confidence={Math.avg(...confidenceScores)}
  />
  <ConfidenceHighlight
    text={aiResponse}
    confidenceData={confidenceScores.map((score, i) => ({
      start: i * 20,
      end: (i + 1) * 20,
      score
    }))}
  />
</div>
```

### Implement graceful degradation

```typescript
import { AIFallbackManager } from '@/application/services/AIFallbackManager'

const fallback = new AIFallbackManager()

async function generateCopy(product) {
  const result = await fallback.executeWithFallback(
    () => aiService.advanced(product),
    () => aiService.basic(product),
    () => templates.defaultCopy(product)
  )

  if (result.wasDowngraded) {
    toast.warning(`Using ${result.tier} AI tier`)
  }

  return result.data
}
```

## File Locations

| Component | Location |
|-----------|----------|
| useAIStream | `src/presentation/hooks/useAIStream.ts` |
| StreamingText | `src/presentation/components/ai/StreamingText.tsx` |
| ConfidenceIndicator | `src/presentation/components/ai/ConfidenceIndicator.tsx` |
| AIFallbackManager | `src/application/services/AIFallbackManager.ts` |
| StreamingAIService | `src/infrastructure/external/openai/streaming/StreamingAIService.ts` |
| IStreamingAIService | `src/application/ports/IStreamingAIService.ts` |

## Helpful Resources

- Full documentation: `.omc/docs/AX_OPTIMIZATION_SUMMARY.md`
- Plan document: `.omc/plans/ax-experience-optimization.md`
- Component examples: `src/presentation/components/ai/*.example.tsx`
- Hook examples: `src/presentation/hooks/*.example.tsx`
- Tests: `tests/unit/` and `tests/e2e/`

## Performance Targets

- First Token Time: < 500ms ✅
- Full response: < 10 seconds
- Bundle size addition: ~97 KB

## Troubleshooting

| Issue | Solution |
|-------|----------|
| First token slow | Check OpenAI API status, reduce prompt |
| Streaming not starting | Ensure `stream: true` in request body |
| Memory leak | Verify component unmounting clears listeners |
| Type errors | Run `npm run type-check` |
| Tests failing | Check test setup in `vitest.config.ts` |

## Next Steps

1. Read full documentation: `.omc/docs/AX_OPTIMIZATION_SUMMARY.md`
2. Review component examples in `src/presentation/components/ai/`
3. Check test files for usage patterns
4. Run `npm test -- streaming` to verify setup
5. Build a simple streaming example

---

**Last Updated:** 2026-01-29
**Version:** 1.0
