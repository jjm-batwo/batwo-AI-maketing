# Graceful Degradation System - 사용 가이드

## 개요

AI 기능이 실패해도 핵심 기능은 항상 작동하도록 보장하는 3단계 폴백 시스템입니다.

### 폴백 계층

```
Advanced AI (Opus) → Basic AI (Haiku) → Static Templates
     고급 분석            기본 분석           정적 템플릿
```

## 1. AIFallbackManager 사용법

### 기본 사용

```typescript
import { AIFallbackManager } from '@/application/services'

const fallbackManager = new AIFallbackManager({
  maxRetries: 2,
  timeoutMs: 30000,
  enabledTiers: ['advanced', 'basic', 'template']
})

// AI 작업 실행 (자동 폴백)
const result = await fallbackManager.executeWithFallback(
  // Advanced: OpenAI GPT-4 분석
  async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    })
    return parseAdvancedResponse(response)
  },

  // Basic: GPT-3.5 분석
  async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    })
    return parseBasicResponse(response)
  },

  // Template: 정적 템플릿
  () => {
    return getDefaultTemplate()
  }
)

// 결과 확인
console.log('Data:', result.data)
console.log('Tier:', result.tier) // 'advanced' | 'basic' | 'template'
console.log('Was degraded:', result.wasDowngraded)
if (result.originalError) {
  console.log('Original error:', result.originalError)
}
```

### 실전 예제: 캠페인 카피 생성

```typescript
import { AIFallbackManager } from '@/application/services'

class CampaignCopyGenerator {
  private fallbackManager = new AIFallbackManager()

  async generateCopy(product: string, audience: string) {
    return await this.fallbackManager.executeWithFallback(
      // Advanced: 페르소나 기반 카피 생성
      async () => {
        const copy = await this.generatePersonalizedCopy(product, audience)
        return {
          headline: copy.headline,
          body: copy.body,
          cta: copy.cta,
          personalized: true
        }
      },

      // Basic: 기본 템플릿 기반 생성
      async () => {
        const copy = await this.generateBasicCopy(product)
        return {
          headline: `${product} 특별 할인`,
          body: `지금 ${product}를 구매하세요`,
          cta: '자세히 보기',
          personalized: false
        }
      },

      // Template: 정적 템플릿
      () => ({
        headline: '특별 프로모션',
        body: '한정된 기간 동안 특별 혜택을 만나보세요',
        cta: '지금 확인',
        personalized: false
      })
    )
  }
}
```

### Health Monitoring

```typescript
// 현재 AI 시스템 상태 확인
const health = fallbackManager.getHealthStatus()

console.log('Advanced AI:', health.advanced ? '정상' : '장애')
console.log('Basic AI:', health.basic ? '정상' : '장애')
console.log('Advanced 실패 횟수:', health.advancedFailCount)
console.log('Basic 실패 횟수:', health.basicFailCount)
console.log('마지막 확인:', health.lastChecks)

// 수동으로 티어 제어
fallbackManager.disableTier('advanced') // 유지보수 모드
fallbackManager.enableTier('advanced')  // 재활성화
fallbackManager.resetHealth()           // 전체 리셋
```

## 2. PartialSuccessUI 사용법

### 기본 사용

```tsx
import { PartialSuccessUI, PartialResult } from '@/presentation/components/ai'

function CampaignCreator() {
  const [results, setResults] = useState<PartialResult[]>([
    {
      field: '헤드라인',
      value: '여름 시즌 특가 세일',
      status: 'success'
    },
    {
      field: '본문',
      value: null,
      status: 'failed',
      error: 'AI 타임아웃'
    },
    {
      field: 'CTA',
      value: '지금 확인',
      status: 'fallback'
    }
  ])

  const handleRetry = async (field: string) => {
    // 실패한 필드 재시도
    const newValue = await retryAIGeneration(field)
    setResults(prev =>
      prev.map(r => r.field === field
        ? { ...r, value: newValue, status: 'success' }
        : r
      )
    )
  }

  return (
    <PartialSuccessUI
      results={results}
      onRetryFailed={handleRetry}
      title="캠페인 생성 결과"
      showSuccessful={true}
    />
  )
}
```

### 실시간 업데이트 예제

```tsx
function LiveAIGeneration() {
  const [results, setResults] = useState<PartialResult[]>([])

  useEffect(() => {
    const fields = ['headline', 'body', 'cta', 'targeting']

    // 각 필드를 병렬로 생성
    Promise.all(
      fields.map(async (field) => {
        try {
          const value = await generateField(field)
          setResults(prev => [...prev, {
            field,
            value,
            status: 'success'
          }])
        } catch (error) {
          setResults(prev => [...prev, {
            field,
            value: null,
            status: 'failed',
            error: error.message
          }])
        }
      })
    )
  }, [])

  return (
    <PartialSuccessUI
      results={results}
      onRetryFailed={(field) => retryField(field)}
    />
  )
}
```

## 3. ErrorRecoveryDisplay 사용법

### 기본 사용

```tsx
import { ErrorRecoveryDisplay, RecoveryOption } from '@/presentation/components/ai'
import { RefreshCw, FileText, Settings } from 'lucide-react'

function AIErrorHandler() {
  const recoveryOptions: RecoveryOption[] = [
    {
      id: 'retry',
      label: '다시 시도',
      description: 'AI 분석을 처음부터 다시 실행합니다',
      action: () => retryAnalysis(),
      recommended: true,
      icon: RefreshCw
    },
    {
      id: 'template',
      label: '템플릿 사용',
      description: '미리 정의된 템플릿으로 계속 진행합니다',
      action: () => useTemplate(),
      icon: FileText
    },
    {
      id: 'settings',
      label: '설정 변경',
      description: 'AI 설정을 조정하여 다시 시도합니다',
      action: () => openSettings(),
      icon: Settings
    }
  ]

  return (
    <ErrorRecoveryDisplay
      error="AI 분석 중 타임아웃이 발생했습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요."
      recoveryOptions={recoveryOptions}
      severity="error"
      onDismiss={() => setShowError(false)}
    />
  )
}
```

### 컨텍스트별 복구 옵션

```tsx
function ContextualErrorRecovery({ context }: { context: 'campaign' | 'analysis' | 'report' }) {
  const getRecoveryOptions = (): RecoveryOption[] => {
    switch (context) {
      case 'campaign':
        return [
          {
            id: 'draft',
            label: '임시 저장',
            description: '현재까지 입력한 내용을 임시 저장합니다',
            action: () => saveDraft(),
            recommended: true
          },
          {
            id: 'manual',
            label: '수동 입력',
            description: 'AI 없이 직접 입력하여 계속 진행합니다',
            action: () => switchToManual()
          }
        ]

      case 'analysis':
        return [
          {
            id: 'basic',
            label: '기본 분석',
            description: '상세 분석 없이 기본 지표만 확인합니다',
            action: () => showBasicMetrics(),
            recommended: true
          },
          {
            id: 'export',
            label: '데이터 내보내기',
            description: '원본 데이터를 다운로드하여 직접 분석합니다',
            action: () => exportData()
          }
        ]

      case 'report':
        return [
          {
            id: 'previous',
            label: '이전 보고서 보기',
            description: '가장 최근 성공한 보고서를 확인합니다',
            action: () => showPreviousReport(),
            recommended: true
          },
          {
            id: 'simple',
            label: '간단한 보고서',
            description: 'AI 없이 기본 요약 보고서를 생성합니다',
            action: () => generateSimpleReport()
          }
        ]
    }
  }

  return (
    <ErrorRecoveryDisplay
      error="AI 서비스에 일시적인 문제가 발생했습니다"
      recoveryOptions={getRecoveryOptions()}
      severity="warning"
    />
  )
}
```

## 4. 통합 예제

### 완전한 AI 기능 컴포넌트

```tsx
import {
  AIFallbackManager,
  PartialSuccessUI,
  ErrorRecoveryDisplay,
  PartialResult,
  RecoveryOption
} from '@/application/services'

function SmartCampaignGenerator() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'partial' | 'error'>('idle')
  const [results, setResults] = useState<PartialResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const fallbackManager = useMemo(() => new AIFallbackManager(), [])

  const generateCampaign = async (product: string) => {
    setStatus('loading')

    const fields = ['headline', 'body', 'cta', 'targeting']
    const newResults: PartialResult[] = []

    for (const field of fields) {
      try {
        const result = await fallbackManager.executeWithFallback(
          () => generateAdvanced(field, product),
          () => generateBasic(field, product),
          () => getTemplate(field)
        )

        newResults.push({
          field: fieldNames[field],
          value: result.data,
          status: result.tier === 'template' ? 'fallback' : 'success'
        })
      } catch (error) {
        newResults.push({
          field: fieldNames[field],
          value: null,
          status: 'failed',
          error: error.message
        })
      }
    }

    setResults(newResults)

    const hasFailures = newResults.some(r => r.status === 'failed')
    setStatus(hasFailures ? 'partial' : 'idle')
  }

  const recoveryOptions: RecoveryOption[] = [
    {
      id: 'retry',
      label: '전체 재시도',
      description: '모든 필드를 처음부터 다시 생성합니다',
      action: () => generateCampaign(product),
      recommended: true
    },
    {
      id: 'manual',
      label: '수동 입력',
      description: '실패한 부분만 직접 입력합니다',
      action: () => setManualMode(true)
    }
  ]

  return (
    <div className="space-y-4">
      {status === 'loading' && <AILoadingIndicator />}

      {status === 'partial' && (
        <PartialSuccessUI
          results={results}
          onRetryFailed={(field) => retryField(field)}
          title="캠페인 생성 결과"
        />
      )}

      {status === 'error' && (
        <ErrorRecoveryDisplay
          error={error}
          recoveryOptions={recoveryOptions}
          severity="error"
        />
      )}

      {/* Health Monitor (개발 모드) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500">
          AI Status: {JSON.stringify(fallbackManager.getHealthStatus())}
        </div>
      )}
    </div>
  )
}
```

## 5. 모범 사례

### ✅ DO

```typescript
// 1. 항상 3단계 폴백 제공
await fallbackManager.executeWithFallback(advanced, basic, template)

// 2. 부분 성공 허용
const results = await Promise.allSettled([
  generateField('headline'),
  generateField('body'),
  generateField('cta')
])

// 3. 사용자에게 상태 표시
<PartialSuccessUI results={results} />

// 4. 복구 옵션 제공
<ErrorRecoveryDisplay recoveryOptions={options} />
```

### ❌ DON'T

```typescript
// 1. AI 없이 작동 불가
if (!aiAvailable) throw new Error('AI required')

// 2. 전부 아니면 전무 (All or Nothing)
await generateAll() // 하나라도 실패하면 전체 실패

// 3. 오류만 표시
<div>Error: AI failed</div> // 복구 방법 없음

// 4. 폴백 없는 타임아웃
await generateWithTimeout(60000) // 실패하면 끝
```

## 6. 성능 최적화

### 병렬 처리 + 폴백

```typescript
// 여러 필드를 병렬로 생성하되, 각각 독립적으로 폴백
const results = await Promise.all(
  fields.map(field =>
    fallbackManager.executeWithFallback(
      () => generateAdvanced(field),
      () => generateBasic(field),
      () => getTemplate(field)
    )
  )
)
```

### 타임아웃 조정

```typescript
// 빠른 응답이 필요한 경우
const quickFallback = new AIFallbackManager({
  timeoutMs: 10000, // 10초
  maxRetries: 1
})

// 정확도가 중요한 경우
const accurateFallback = new AIFallbackManager({
  timeoutMs: 60000, // 60초
  maxRetries: 3
})
```

## 7. 모니터링 및 알림

```typescript
// Health check 주기적 실행
setInterval(() => {
  const health = fallbackManager.getHealthStatus()

  if (!health.advanced && health.advancedFailCount >= 3) {
    notifyAdmin('Advanced AI degraded')
  }

  if (!health.basic) {
    notifyAdmin('Basic AI down - using templates only')
  }
}, 60000)
```
