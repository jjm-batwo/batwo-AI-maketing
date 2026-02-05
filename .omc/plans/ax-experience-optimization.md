# AX (AI Experience) Experience Optimization Plan - Revised

> "물흐르듯 자연스러운 AI 경험" - 사용자가 AI를 인지하지 못하면서도 만족스러운 결과를 얻는 것

**Plan Version:** 2.0
**Revision Date:** 2026-01-29
**Status:** APPROVED (Critic issues addressed, Architect decisions incorporated)

---

## 1. Context

### 1.1 Original Request
사용자가 AI를 인지하지 못하게 물흐르듯이 자연스럽게 AX를 통해 AI 경험을 하고, 그 경험이 만족스러운 상태가 되어야 함.

### 1.2 Interview Summary
- **핵심 목표**: AI-First가 아닌 User-First 경험
- **철학**: "보이지 않는 AI가 최고의 AI"
- **측정 기준**: 사용자 만족도, 작업 완료 시간, AI 기능 사용률

### 1.3 Research Findings

**2026 AX 베스트 프랙티스:**
| 원칙 | 설명 | 적용 우선순위 |
|------|------|--------------|
| AI-Second, User-First | 기술 집착 대신 사용자 니즈 중심 | HIGH |
| Progressive Disclosure | 복잡성 점진적 노출 (Layer 1→2→3) | HIGH |
| Ambient Intelligence | 백그라운드 선제적 인사이트 | MEDIUM |
| Contextual AI | 정확한 순간에 AI 작동 | HIGH |
| Transparency Builds Trust | 불확실성 명확히 전달 | HIGH |
| Graceful Degradation | AI 실패해도 핵심 기능 유지 | MEDIUM |

**성공 사례 참조:**
- Notion AI: 인라인 `/ai` 명령, 컨텍스트 인식
- Jasper: 브랜드 보이스 일관성
- Figma AI: 비침습적 제안

### 1.4 Critical Issues Addressed (Critic Feedback)

| Issue | Resolution |
|-------|------------|
| Vercel AI SDK 미설치 | T1.1에 명시적 설치 명령, 버전, 호환성 확인 추가 |
| ChatService 수정 세부사항 누락 | T1.4에 인터페이스 변경, 응답 DTO 구조 명시 |
| science-* API가 AI 기반 아님 | T2.4 재정의: science-copy만 스트리밍 대상 |
| AIInsights API 검증 누락 | T2.2에 응답 구조 문서화, 매퍼 함수 생성 태스크 추가 |
| src/lib/ai/ 위치 문제 | 클린 아키텍처 준수: infrastructure/external/openai/streaming/ 사용 |

### 1.5 Architect Decisions

**스트리밍 위치:**
```
src/infrastructure/external/openai/
├── AIService.ts                    # Existing
├── ScienceAIService.ts             # Existing
├── streaming/
│   ├── index.ts                    # Public exports
│   ├── StreamingAIService.ts       # Streaming implementation
│   └── streamParser.ts             # SSE/chunk parsing utilities
└── prompts/                        # Existing
```

**서비스 계층:**
- 새로운 `IStreamingAIService` 인터페이스 생성 (기존 수정 X)
- `StreamingAIService` 클래스 신규 생성

**스트리밍 대상 API:**
| Endpoint | AI 사용? | 스트리밍 포함? |
|----------|----------|----------------|
| `/api/ai/chat` | YES | **포함** |
| `/api/ai/copy` | YES | **포함** |
| `/api/ai/science-copy` | YES | **포함** |
| `/api/ai/science-score` | NO | 제외 |
| `/api/ai/science-analyze` | NO | 제외 |

---

## 2. Work Objectives

### 2.1 Core Objective
"**사용자가 AI 기능을 의식하지 않으면서도 AI의 혜택을 최대한 누리는 자연스러운 경험 구현**"

### 2.2 Deliverables

| # | Deliverable | Description | Priority |
|---|-------------|-------------|----------|
| D1 | 스트리밍 AI 응답 시스템 | chat, copy, science-copy API에 스트리밍 적용 | P0 |
| D2 | 프로그레시브 로딩 UX | AI 전용 스켈레톤, 진행 단계 표시 | P0 |
| D3 | 신뢰도 시스템 통합 | 문장별 신뢰도, AI 근거 투명 공개 | P1 |
| D4 | AIInsights 실제 연동 | Mock 제거, 실제 API 연결 (매퍼 함수 포함) | P1 |
| D5 | Ambient AI 시스템 | 백그라운드 선제적 인사이트 | P2 |
| D6 | Contextual AI 트리거 | 컨텍스트 인식 기반 자동 AI 제안 | P2 |
| D7 | Graceful Degradation | 계층적 폴백, 부분 성공 처리 | P1 |
| D8 | AI 온보딩/발견 | 첫 사용자 가이드, 기능 발견성 개선 | P2 |

### 2.3 Definition of Done

- [ ] chat, copy, science-copy API가 스트리밍 응답 지원
- [ ] AI 응답 대기 시간 체감 50% 감소 (First Token Time < 500ms)
- [ ] AI 기능 사용률 30% 증가
- [ ] 사용자 만족도 점수 4.0/5.0 이상 (현재 추정 3.2)
- [ ] 오류 발생 시 100% 폴백 처리
- [ ] 모든 AI 응답에 신뢰도 표시

---

## 3. Guardrails

### 3.1 Must Have (MUST)
- 스트리밍 응답은 Vercel AI SDK 사용 (`ai@^3.x`, `@ai-sdk/openai@^0.x`)
- **새로운 인터페이스 생성** (기존 IAIService 수정 X)
- 모든 AI 오류에 사용자 친화적 메시지
- 신뢰도 색상 코드 (녹색 >= 85%, 노랑 60-84%, 빨강 < 60%)
- 기존 API 계약 유지 (하위 호환성)
- TDD 방식 (테스트 먼저)
- **클린 아키텍처 준수** (streaming 코드는 infrastructure 계층에 위치)

### 3.2 Must NOT Have (MUST NOT)
- AI 로딩 중 UI 블로킹 금지
- "AI가 생성했습니다" 과도한 표시 금지 (자연스러움 저해)
- 신뢰도 없는 AI 응답 노출 금지
- 사용자 입력 없이 자동 실행 금지 (항상 확인)
- **src/lib/ai/ 경로 사용 금지** (클린 아키텍처 위반)

---

## 4. Task Flow and Dependencies

```
Phase 0 (Pre-work): Baseline Measurement
└── T0.1: 현재 상태 측정 및 기록

Phase 1 (Week 1-2): Foundation
├── T1.1: Vercel AI SDK 설치 및 설정
├── T1.2: 스트리밍 인프라 구축
│   ├── T1.2.1: IStreamingAIService 인터페이스 생성
│   ├── T1.2.2: StreamingAIService 구현
│   ├── T1.2.3: streamParser 유틸리티 생성
│   └── T1.2.4: useAIStream 훅 생성
├── T1.3: 프로그레시브 로딩 컴포넌트
│   ├── T1.3.1: StreamingText 컴포넌트
│   ├── T1.3.2: AILoadingIndicator
│   ├── T1.3.3: StreamingProgress
│   └── T1.3.4: SkeletonAI (AI 전용)
├── T1.4: /api/ai/chat 스트리밍 전환
└── T1.5: AI 컴포넌트 index.ts 업데이트

Phase 2 (Week 3-4): Core AX
├── T2.1: 신뢰도 시스템 강화
│   ├── T2.1.1: ConfidenceIndicator 컴포넌트
│   ├── T2.1.2: 문장별 신뢰도 하이라이트
│   └── T2.1.3: AI 근거 패널 (EvidencePanel)
├── T2.2: AIInsights 실제 연동
│   ├── T2.2.1: Anomaly API 응답 매퍼 생성
│   ├── T2.2.2: Trend API 응답 매퍼 생성
│   ├── T2.2.3: useAIInsights 훅 생성
│   └── T2.2.4: AIInsights 컴포넌트 연결
├── T2.3: /api/ai/copy 스트리밍 전환
└── T2.4: /api/ai/science-copy 스트리밍 전환

Phase 3 (Week 5-6): Ambient AI
├── T3.1: Graceful Degradation 시스템
│   ├── T3.1.1: AI 폴백 매니저
│   ├── T3.1.2: 부분 성공 UI
│   └── T3.1.3: 오류 복구 표시
├── T3.2: Ambient Intelligence
│   ├── T3.2.1: 백그라운드 분석 서비스 (Web Worker)
│   ├── T3.2.2: 선제적 인사이트 큐
│   └── T3.2.3: 알림 시스템 연동
├── T3.3: Contextual AI 트리거
│   ├── T3.3.1: 컨텍스트 감지 엔진
│   ├── T3.3.2: AI 제안 타이밍 최적화
│   └── T3.3.3: 비침습적 제안 UI
└── T3.4: 사용자 피드백 저장 (Prisma 스키마 변경)

Phase 4 (Week 7-8): Polish & Onboarding
├── T4.1: AI 온보딩 경험
│   ├── T4.1.1: AI 기능 투어
│   ├── T4.1.2: 첫 사용 가이드
│   └── T4.1.3: 기능 발견 힌트
├── T4.2: 전체 통합 테스트
└── T4.3: 성능 최적화
```

---

## 5. Detailed TODOs

### Phase 0: Baseline Measurement (Pre-work)

#### T0.1: 현재 상태 측정 및 기록
**Priority:** P0 | **Effort:** LOW | **Impact:** HIGH

**Metrics to Capture:**
- 현재 AI API 응답 시간 (p50, p95)
- 현재 AI 기능 사용률 (일별 사용자 수 / 전체 활성 사용자)
- 현재 First Token Time (없음 - 스트리밍 미적용)
- 오류 발생률 및 복구율

**Acceptance Criteria:**
- [ ] 기준점 (baseline) 문서 작성: `.omc/metrics/ax-baseline.md`
- [ ] 측정 방법 및 데이터 소스 명시
- [ ] 목표 대비 현재 갭 분석

---

### Phase 1: Foundation (Week 1-2)

#### T1.1: Vercel AI SDK 설치 및 설정
**Priority:** P0 | **Effort:** LOW | **Impact:** HIGH

**Dependencies Installation:**
```bash
npm install ai@^3.5.0 @ai-sdk/openai@^0.0.72
```

**Version Requirements:**
| Package | Version | Rationale |
|---------|---------|-----------|
| `ai` | `^3.5.0` | Stable streaming API, Next.js 16 지원 |
| `@ai-sdk/openai` | `^0.0.72` | OpenAI provider for Vercel AI SDK |

**Compatibility Check:**
- Next.js 16.1.x: ✅ (App Router, RSC 지원)
- React 19.2.x: ✅ (use hook, streaming 지원)
- TypeScript 5.x: ✅ (타입 추론 지원)

**Files to Modify:**
- `package.json` - 패키지 추가

**Acceptance Criteria:**
- [ ] `npm install` 성공 (에러 없음)
- [ ] `npm run type-check` 통과
- [ ] `npm run build` 성공
- [ ] 기본 스트리밍 테스트: `tests/unit/infrastructure/streaming/sdk.test.ts`

**Test File:** `tests/unit/infrastructure/streaming/sdk.test.ts`
```typescript
// 테스트 내용: SDK import 및 기본 스트리밍 동작 확인
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

describe('Vercel AI SDK', () => {
  it('should import without errors', () => {
    expect(streamText).toBeDefined()
    expect(openai).toBeDefined()
  })
})
```

---

#### T1.2.1: IStreamingAIService 인터페이스 생성
**Priority:** P0 | **Effort:** LOW | **Impact:** HIGH

**File to Create:**
- `src/application/ports/IStreamingAIService.ts`

**Implementation:**
```typescript
import type { AIConfig, GenerateAdCopyInput } from './IAIService'

/**
 * 스트리밍 AI 서비스 인터페이스
 * - 기존 IAIService와 분리 (신규 인터페이스)
 * - AsyncIterable 기반 스트리밍 응답
 */
export interface IStreamingAIService {
  /**
   * 범용 채팅 스트리밍
   */
  streamChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config?: AIConfig
  ): AsyncIterable<StreamChunk>

  /**
   * 광고 카피 스트리밍 생성
   */
  streamAdCopy(
    input: GenerateAdCopyInput
  ): AsyncIterable<AdCopyStreamChunk>
}

export interface StreamChunk {
  type: 'text' | 'progress' | 'done' | 'error'
  content?: string
  stage?: 'analyzing' | 'generating' | 'optimizing'
  progress?: number // 0-100
  error?: string
}

export interface AdCopyStreamChunk {
  type: 'variant' | 'progress' | 'done' | 'error'
  variantIndex?: number
  field?: 'headline' | 'primaryText' | 'description' | 'callToAction'
  content?: string
  stage?: string
  error?: string
}
```

**Acceptance Criteria:**
- [ ] 인터페이스 정의 완료
- [ ] `npm run type-check` 통과
- [ ] IAIService와 독립적 (import 체인 분리)

---

#### T1.2.2: StreamingAIService 구현
**Priority:** P0 | **Effort:** HIGH | **Impact:** HIGH

**File to Create:**
- `src/infrastructure/external/openai/streaming/StreamingAIService.ts`

**Implementation:**
```typescript
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type {
  IStreamingAIService,
  StreamChunk,
  AdCopyStreamChunk,
} from '@application/ports/IStreamingAIService'
import type { AIConfig, GenerateAdCopyInput } from '@application/ports/IAIService'
import { buildAdCopyPrompt, AD_COPY_SYSTEM_PROMPT } from '../prompts/adCopyGeneration'

export class StreamingAIService implements IStreamingAIService {
  private readonly model: string

  constructor(model: string = 'gpt-4o-mini') {
    this.model = model
  }

  async *streamChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config?: AIConfig
  ): AsyncIterable<StreamChunk> {
    const finalModel = config?.model ?? this.model

    yield { type: 'progress', stage: 'analyzing', progress: 10 }

    const result = await streamText({
      model: openai(finalModel),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 2000,
    })

    yield { type: 'progress', stage: 'generating', progress: 30 }

    for await (const chunk of result.textStream) {
      yield { type: 'text', content: chunk }
    }

    yield { type: 'done' }
  }

  async *streamAdCopy(
    input: GenerateAdCopyInput
  ): AsyncIterable<AdCopyStreamChunk> {
    yield { type: 'progress', stage: 'Analyzing product context...' }

    const prompt = buildAdCopyPrompt(input)

    const result = await streamText({
      model: openai(this.model),
      system: AD_COPY_SYSTEM_PROMPT,
      prompt,
      temperature: 0.8,
      maxTokens: 3000,
    })

    yield { type: 'progress', stage: 'Generating copy variants...' }

    let buffer = ''
    for await (const chunk of result.textStream) {
      buffer += chunk
      yield { type: 'variant', content: chunk }
    }

    yield { type: 'done' }
  }
}
```

**Acceptance Criteria:**
- [ ] AsyncIterable 스트리밍 동작
- [ ] 진행 상태 청크 전송
- [ ] 에러 핸들링 (try-catch → error 청크)
- [ ] 테스트 파일: `tests/unit/infrastructure/streaming/StreamingAIService.test.ts`

---

#### T1.2.3: streamParser 유틸리티 생성
**Priority:** P0 | **Effort:** MEDIUM | **Impact:** MEDIUM

**File to Create:**
- `src/infrastructure/external/openai/streaming/streamParser.ts`

**Implementation:**
```typescript
import type { StreamChunk, AdCopyStreamChunk } from '@application/ports/IStreamingAIService'

/**
 * SSE 스트림을 청크로 파싱
 */
export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncIterable<StreamChunk> {
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          yield { type: 'done' }
          return
        }
        try {
          const parsed = JSON.parse(data) as StreamChunk
          yield parsed
        } catch {
          yield { type: 'text', content: data }
        }
      }
    }
  }
}

/**
 * JSON 청크 스트림 파싱 (광고 카피용)
 */
export function parseAdCopyChunk(chunk: string): AdCopyStreamChunk | null {
  try {
    return JSON.parse(chunk) as AdCopyStreamChunk
  } catch {
    return null
  }
}

/**
 * ReadableStream을 AsyncIterable로 변환
 */
export async function* streamToAsyncIterable<T>(
  stream: ReadableStream<T>
): AsyncIterable<T> {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}
```

**Acceptance Criteria:**
- [ ] SSE 스트림 파싱 동작
- [ ] 불완전 청크 버퍼링 처리
- [ ] [DONE] 신호 인식
- [ ] 테스트 파일: `tests/unit/infrastructure/streaming/streamParser.test.ts`

---

#### T1.2.4: useAIStream 훅 생성
**Priority:** P0 | **Effort:** MEDIUM | **Impact:** HIGH

**File to Create:**
- `src/presentation/hooks/useAIStream.ts`

**Implementation:**
```typescript
'use client'

import { useState, useCallback, useRef } from 'react'
import type { StreamChunk } from '@application/ports/IStreamingAIService'

interface UseAIStreamOptions {
  onStart?: () => void
  onToken?: (token: string) => void
  onComplete?: (text: string) => void
  onError?: (error: Error) => void
  onProgress?: (stage: string, progress: number) => void
}

interface UseAIStreamReturn {
  streamText: (endpoint: string, body: Record<string, unknown>) => Promise<void>
  text: string
  isStreaming: boolean
  error: Error | null
  progress: { stage: string; percent: number }
  cancel: () => void
}

export function useAIStream(options: UseAIStreamOptions = {}): UseAIStreamReturn {
  const [text, setText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState({ stage: '', percent: 0 })
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const streamText = useCallback(
    async (endpoint: string, body: Record<string, unknown>) => {
      setIsStreaming(true)
      setError(null)
      setText('')
      setProgress({ stage: 'starting', percent: 0 })

      abortControllerRef.current = new AbortController()
      options.onStart?.()

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, stream: true }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const chunk = JSON.parse(data) as StreamChunk
                if (chunk.type === 'text' && chunk.content) {
                  fullText += chunk.content
                  setText(fullText)
                  options.onToken?.(chunk.content)
                } else if (chunk.type === 'progress') {
                  setProgress({
                    stage: chunk.stage ?? '',
                    percent: chunk.progress ?? 0,
                  })
                  options.onProgress?.(chunk.stage ?? '', chunk.progress ?? 0)
                } else if (chunk.type === 'error') {
                  throw new Error(chunk.error ?? 'Stream error')
                }
              } catch (parseError) {
                // Non-JSON text chunk
                fullText += data
                setText(fullText)
                options.onToken?.(data)
              }
            }
          }
        }

        options.onComplete?.(fullText)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err)
          options.onError?.(err)
        }
      } finally {
        setIsStreaming(false)
        setProgress({ stage: 'complete', percent: 100 })
      }
    },
    [options]
  )

  return { streamText, text, isStreaming, error, progress, cancel }
}
```

**Acceptance Criteria:**
- [ ] 토큰 단위 실시간 업데이트
- [ ] 진행 상태 추적 (분석 중 → 생성 중 → 완료)
- [ ] 에러 핸들링 및 재시도 로직
- [ ] 취소 기능 (AbortController)
- [ ] 테스트 파일: `tests/unit/presentation/hooks/useAIStream.test.ts`

---

#### T1.3.1: StreamingText 컴포넌트
**Priority:** P0 | **Effort:** MEDIUM | **Impact:** HIGH

**File to Create:**
- `src/presentation/components/ai/StreamingText.tsx`

**Implementation:**
```typescript
'use client'

import { memo, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface StreamingTextProps {
  text: string
  isStreaming: boolean
  className?: string
  cursor?: boolean
  highlight?: 'confidence' | 'none'
  confidenceData?: Array<{ start: number; end: number; score: number }>
}

export const StreamingText = memo(function StreamingText({
  text,
  isStreaming,
  className,
  cursor = true,
  highlight = 'none',
  confidenceData,
}: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [text, isStreaming])

  const renderText = () => {
    if (highlight === 'confidence' && confidenceData) {
      return renderWithConfidence(text, confidenceData)
    }
    return text
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'whitespace-pre-wrap break-words',
        className
      )}
      aria-live="polite"
      aria-atomic="false"
    >
      {renderText()}
      {isStreaming && cursor && (
        <span
          className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  )
})

function renderWithConfidence(
  text: string,
  confidenceData: Array<{ start: number; end: number; score: number }>
) {
  // Sort by start position
  const sorted = [...confidenceData].sort((a, b) => a.start - b.start)
  const elements: React.ReactNode[] = []
  let lastEnd = 0

  for (const { start, end, score } of sorted) {
    if (start > lastEnd) {
      elements.push(text.slice(lastEnd, start))
    }
    elements.push(
      <span
        key={start}
        className={cn(
          'px-0.5 rounded',
          score >= 85
            ? 'bg-emerald-100 dark:bg-emerald-900/30'
            : score >= 60
              ? 'bg-amber-100 dark:bg-amber-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
        )}
        title={`신뢰도: ${score}%`}
      >
        {text.slice(start, end)}
      </span>
    )
    lastEnd = end
  }

  if (lastEnd < text.length) {
    elements.push(text.slice(lastEnd))
  }

  return elements
}
```

**Acceptance Criteria:**
- [ ] 실시간 타이핑 효과
- [ ] 커서 애니메이션 (선택적)
- [ ] 신뢰도 하이라이트 지원
- [ ] 접근성 (aria-live)
- [ ] 테스트 파일: `tests/unit/presentation/components/ai/StreamingText.test.tsx`

---

#### T1.3.2: AILoadingIndicator 컴포넌트
**Priority:** P0 | **Effort:** LOW | **Impact:** MEDIUM

**File to Create:**
- `src/presentation/components/ai/AILoadingIndicator.tsx`

**Implementation:**
```typescript
'use client'

import { cn } from '@/lib/utils'

interface AILoadingIndicatorProps {
  stage: 'analyzing' | 'generating' | 'optimizing' | 'complete'
  progress?: number
  message?: string
  variant?: 'inline' | 'overlay' | 'minimal'
}

const STAGE_LABELS: Record<AILoadingIndicatorProps['stage'], string> = {
  analyzing: '분석 중...',
  generating: '생성 중...',
  optimizing: '최적화 중...',
  complete: '완료',
}

export function AILoadingIndicator({
  stage,
  progress,
  message,
  variant = 'inline',
}: AILoadingIndicatorProps) {
  const label = message ?? STAGE_LABELS[stage]

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
        {label}
      </div>
    )
  }

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card p-6 rounded-lg shadow-lg space-y-4">
          <AIGradientSpinner />
          <p className="text-center font-medium">{label}</p>
          {progress !== undefined && (
            <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default: inline
  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-lg">
      <AIGradientSpinner size="sm" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {progress !== undefined && (
          <div className="mt-1 w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function AIGradientSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="url(#ai-gradient)"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="url(#ai-gradient)"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
      <defs>
        <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  )
}
```

**Acceptance Criteria:**
- [ ] 3가지 variant 지원 (inline, overlay, minimal)
- [ ] 단계 전환 애니메이션
- [ ] AI 전용 그라디언트 (퍼플→블루)
- [ ] 사용자 친화적 메시지
- [ ] 테스트 파일: `tests/unit/presentation/components/ai/AILoadingIndicator.test.tsx`

---

#### T1.3.3: StreamingProgress 컴포넌트
**Priority:** P0 | **Effort:** LOW | **Impact:** MEDIUM

**File to Create:**
- `src/presentation/components/ai/StreamingProgress.tsx`

**Implementation:**
```typescript
'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface StreamingProgressProps {
  stages: Array<{
    id: string
    label: string
    status: 'pending' | 'active' | 'complete'
  }>
  estimatedTime?: string
  className?: string
}

export function StreamingProgress({
  stages,
  estimatedTime,
  className,
}: StreamingProgressProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-4">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center gap-2">
            {stage.status === 'complete' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : stage.status === 'active' ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-sm',
                stage.status === 'active'
                  ? 'text-foreground font-medium'
                  : stage.status === 'complete'
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
              )}
            >
              {stage.label}
            </span>
            {index < stages.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5',
                  stage.status === 'complete'
                    ? 'bg-emerald-500'
                    : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
      {estimatedTime && (
        <p className="text-xs text-muted-foreground">
          예상 시간: {estimatedTime}
        </p>
      )}
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] 단계별 진행 표시
- [ ] 스무스 트랜지션
- [ ] 예상 시간 표시 (선택적)
- [ ] 접근성 지원
- [ ] 테스트 파일: `tests/unit/presentation/components/ai/StreamingProgress.test.tsx`

---

#### T1.3.4: SkeletonAI 컴포넌트
**Priority:** P1 | **Effort:** LOW | **Impact:** MEDIUM

**File to Create:**
- `src/presentation/components/ai/SkeletonAI.tsx`

**Implementation:**
```typescript
import { cn } from '@/lib/utils'

interface SkeletonAIProps {
  variant?: 'text' | 'card' | 'list'
  lines?: number
  className?: string
}

export function SkeletonAI({
  variant = 'text',
  lines = 3,
  className,
}: SkeletonAIProps) {
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-lg border p-4 space-y-3',
          'bg-gradient-to-r from-violet-500/5 to-blue-500/5',
          className
        )}
      >
        <div className="h-4 w-1/3 rounded bg-gradient-to-r from-violet-500/20 to-blue-500/20 animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded bg-gradient-to-r from-violet-500/10 to-blue-500/10 animate-pulse"
              style={{ width: `${100 - i * 15}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded bg-gradient-to-r from-violet-500/5 to-blue-500/5"
          >
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-violet-500/20 to-blue-500/20 animate-pulse" />
            <div
              className="h-3 flex-1 rounded bg-gradient-to-r from-violet-500/10 to-blue-500/10 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          </div>
        ))}
      </div>
    )
  }

  // Default: text
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-gradient-to-r from-violet-500/10 to-blue-500/10 animate-pulse"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] AI 브랜딩 색상 적용 (퍼플→블루 그라디언트)
- [ ] 부드러운 펄스 효과
- [ ] 3가지 variant (text, card, list)
- [ ] 테스트 파일: `tests/unit/presentation/components/ai/SkeletonAI.test.tsx`

---

#### T1.4: /api/ai/chat 스트리밍 전환
**Priority:** P0 | **Effort:** HIGH | **Impact:** HIGH

**Files to Modify:**
- `src/app/api/ai/chat/route.ts`

**Files to Create:**
- `src/application/services/StreamingChatService.ts`

**API Route Changes:**
```typescript
// src/app/api/ai/chat/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

// 기존 POST 핸들러 수정
export async function POST(req: NextRequest) {
  // ... 기존 인증/검증 로직 유지

  const body = validation.data
  const isStreaming = body.stream === true

  if (isStreaming) {
    // 스트리밍 응답
    const context = await buildContext(user.id)
    const systemPrompt = buildSystemPrompt(context)

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: body.message,
      temperature: 0.6,
      maxTokens: 2000,
    })

    return result.toDataStreamResponse({
      headers: rateLimitHeaders,
    })
  }

  // 기존 JSON 응답 (하위 호환성)
  const service = getChatService()
  const response = await service.chat(user.id, body.message, body.conversationId)
  // ...
}
```

**Request Body 변경:**
```typescript
// 기존 chatSchema에 stream 필드 추가
export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  stream: z.boolean().optional().default(false), // NEW
})
```

**Response 변경:**
- `stream: false` (기존): `{ message, conversationId, sources, ... }`
- `stream: true` (신규): SSE 스트림 (data: {...}\n\n)

**Acceptance Criteria:**
- [ ] `stream: true` 시 스트리밍 응답
- [ ] `stream: false` 시 기존 JSON 응답 (하위 호환)
- [ ] 기존 기능 유지 (RAG, 컨텍스트)
- [ ] Rate limit 유지
- [ ] 에러 시 graceful fallback
- [ ] 테스트 파일: `tests/integration/api/ai/chat-streaming.test.ts`

---

#### T1.5: AI 컴포넌트 index.ts 업데이트
**Priority:** P0 | **Effort:** LOW | **Impact:** LOW

**File to Modify:**
- `src/presentation/components/ai/index.ts`

**Updated Exports:**
```typescript
// Existing
export { ScienceScore } from './ScienceScore'
export { CitationCard, CitationList } from './CitationCard'
export { DomainBreakdown } from './DomainBreakdown'
export { EvidenceBadge, RecommendationCard } from './EvidenceBadge'

// NEW - Streaming
export { StreamingText } from './StreamingText'
export { AILoadingIndicator } from './AILoadingIndicator'
export { StreamingProgress } from './StreamingProgress'
export { SkeletonAI } from './SkeletonAI'

// NEW - Phase 2 (placeholder for now)
// export { ConfidenceIndicator } from './ConfidenceIndicator'
// export { ConfidenceHighlight } from './ConfidenceHighlight'
// export { EvidencePanel } from './EvidencePanel'
```

**Acceptance Criteria:**
- [ ] 모든 새 컴포넌트 export
- [ ] `npm run type-check` 통과
- [ ] import 경로 테스트

---

### Phase 2: Core AX (Week 3-4)

#### T2.1.1: ConfidenceIndicator 컴포넌트
**Priority:** P1 | **Effort:** MEDIUM | **Impact:** HIGH

**File to Create:**
- `src/presentation/components/ai/ConfidenceIndicator.tsx`

**Implementation:**
```typescript
'use client'

import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ConfidenceIndicatorProps {
  confidence: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  variant?: 'badge' | 'inline' | 'tooltip'
}

export function ConfidenceIndicator({
  confidence,
  size = 'md',
  showLabel = true,
  variant = 'badge',
}: ConfidenceIndicatorProps) {
  const color = getConfidenceColor(confidence)
  const label = getConfidenceLabel(confidence)

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  if (variant === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('inline-flex items-center gap-1', color.text)}>
              <span
                className={cn('h-2 w-2 rounded-full', color.bg)}
                aria-hidden="true"
              />
              <Info className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI 신뢰도: {confidence}% ({label})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-1', color.text)}>
        <span
          className={cn('h-2 w-2 rounded-full', color.bg)}
          aria-hidden="true"
        />
        {showLabel && <span className="text-xs">{label}</span>}
      </span>
    )
  }

  // Default: badge
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        color.bgLight,
        color.text,
        sizeClasses[size]
      )}
      role="status"
      aria-label={`AI 신뢰도 ${confidence}%`}
    >
      <span
        className={cn('h-2 w-2 rounded-full', color.bg)}
        aria-hidden="true"
      />
      {showLabel && <span>{confidence}%</span>}
    </span>
  )
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 85) {
    return {
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-100 dark:bg-emerald-900/30',
    }
  }
  if (confidence >= 60) {
    return {
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-100 dark:bg-amber-900/30',
    }
  }
  return {
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-500',
    bgLight: 'bg-red-100 dark:bg-red-900/30',
  }
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 85) return '높음'
  if (confidence >= 60) return '보통'
  return '낮음'
}
```

**Acceptance Criteria:**
- [ ] 색상 코드 적용 (녹색 >= 85%, 노랑 60-84%, 빨강 < 60%)
- [ ] 3가지 variant 지원 (badge, inline, tooltip)
- [ ] 접근성 (색상만 의존하지 않음 - 라벨/아이콘 제공)
- [ ] 테스트 파일: `tests/unit/presentation/components/ai/ConfidenceIndicator.test.tsx`

---

#### T2.2.1: Anomaly API 응답 매퍼 생성
**Priority:** P1 | **Effort:** MEDIUM | **Impact:** HIGH

**File to Create:**
- `src/presentation/mappers/anomalyMapper.ts`

**API Response Structure (Reference):**
```typescript
// /api/ai/anomalies 응답 구조
interface AnomalyResponse {
  anomalies: AnomalyWithAnalysis[]
  detectedAt: string
  count: number
  summary: {
    critical: number
    warning: number
    info: number
    byType: Record<string, number>
  }
  marketContext?: {
    isSpecialDay: boolean
    events: string[]
  }
  segmentAnalysis?: {
    segments: SegmentAnalysisResult
    campaignComparison: CampaignComparison[]
    timePatterns: TimePatternAnalysis
  }
}
```

**Implementation:**
```typescript
import type { Anomaly } from '@application/services/AnomalyDetectionService'

/**
 * AIInsights 컴포넌트용 매핑된 이상 징후 타입
 */
export interface MappedAnomaly {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  metric: string
  changePercent: number
  campaignName: string
  campaignId: string
  detectedAt: Date
  suggestedActions: string[]
  rootCause?: {
    summary: string
    confidence: number
    factors: string[]
  }
}

/**
 * API 응답을 UI 컴포넌트용 형식으로 변환
 */
export function mapAnomalyResponse(response: {
  anomalies: Anomaly[]
  summary: { critical: number; warning: number; info: number }
  detectedAt: string
}): {
  anomalies: MappedAnomaly[]
  summary: { critical: number; warning: number; info: number }
} {
  return {
    anomalies: response.anomalies.map(mapAnomaly),
    summary: response.summary,
  }
}

function mapAnomaly(anomaly: Anomaly): MappedAnomaly {
  return {
    id: `${anomaly.campaignId}-${anomaly.metric}-${anomaly.type}`,
    type: mapSeverity(anomaly.severity),
    title: generateTitle(anomaly),
    description: anomaly.message,
    metric: anomaly.metric,
    changePercent: anomaly.detail.changePercent,
    campaignName: anomaly.campaignName,
    campaignId: anomaly.campaignId,
    detectedAt: new Date(anomaly.detail.currentDate ?? Date.now()),
    suggestedActions: generateSuggestedActions(anomaly),
    rootCause: anomaly.rootCauseAnalysis
      ? {
          summary: anomaly.rootCauseAnalysis.summary,
          confidence: anomaly.rootCauseAnalysis.confidence,
          factors: anomaly.rootCauseAnalysis.likelyFactors,
        }
      : undefined,
  }
}

function mapSeverity(severity: string): 'critical' | 'warning' | 'info' {
  switch (severity) {
    case 'critical':
      return 'critical'
    case 'warning':
      return 'warning'
    default:
      return 'info'
  }
}

function generateTitle(anomaly: Anomaly): string {
  const direction = anomaly.detail.changePercent > 0 ? '급증' : '급감'
  return `${anomaly.campaignName}: ${anomaly.metric} ${direction}`
}

function generateSuggestedActions(anomaly: Anomaly): string[] {
  // 기본 액션 제안
  const actions: string[] = []

  if (anomaly.type === 'cpa_spike') {
    actions.push('타겟팅 최적화 검토')
    actions.push('크리에이티브 성과 분석')
  } else if (anomaly.type === 'roas_drop') {
    actions.push('예산 재배분 고려')
    actions.push('오디언스 피로도 확인')
  }

  return actions
}
```

**Acceptance Criteria:**
- [ ] API 응답 → UI 컴포넌트 형식 변환
- [ ] 타입 안전성 보장
- [ ] 기본 액션 제안 생성
- [ ] 테스트 파일: `tests/unit/presentation/mappers/anomalyMapper.test.ts`

---

#### T2.2.2: Trend API 응답 매퍼 생성
**Priority:** P1 | **Effort:** MEDIUM | **Impact:** MEDIUM

**File to Create:**
- `src/presentation/mappers/trendMapper.ts`

**API Response Structure (Reference):**
```typescript
// /api/ai/trends 응답 구조
interface TrendResponse {
  success: boolean
  data: {
    upcomingEvents: Array<{
      id: string
      name: string
      date: string
      relevance: string[]
      preparationTip: string
    }>
    weeklyDigest: {
      topOpportunities: string[]
      risksToWatch: string[]
      suggestedActions: string[]
    } | null
    lookaheadDays: number
    industry: string
  }
}
```

**Implementation:**
```typescript
/**
 * AIInsights 컴포넌트용 매핑된 트렌드 타입
 */
export interface MappedTrend {
  id: string
  type: 'opportunity' | 'risk' | 'event'
  title: string
  description: string
  dueDate?: Date
  priority: 'high' | 'medium' | 'low'
  actionItems: string[]
}

/**
 * API 응답을 UI 컴포넌트용 형식으로 변환
 */
export function mapTrendResponse(response: TrendResponse['data']): {
  trends: MappedTrend[]
  upcomingEvents: Array<{ name: string; date: Date; tip: string }>
} {
  const trends: MappedTrend[] = []

  // Weekly digest → trends
  if (response.weeklyDigest) {
    response.weeklyDigest.topOpportunities.forEach((opp, i) => {
      trends.push({
        id: `opp-${i}`,
        type: 'opportunity',
        title: opp,
        description: `이번 주 주목할 기회입니다`,
        priority: 'high',
        actionItems: response.weeklyDigest!.suggestedActions.slice(0, 2),
      })
    })

    response.weeklyDigest.risksToWatch.forEach((risk, i) => {
      trends.push({
        id: `risk-${i}`,
        type: 'risk',
        title: risk,
        description: `주의가 필요한 위험 요소입니다`,
        priority: 'medium',
        actionItems: [],
      })
    })
  }

  // Upcoming events
  const upcomingEvents = response.upcomingEvents.map((event) => ({
    name: event.name,
    date: new Date(event.date),
    tip: event.preparationTip,
  }))

  return { trends, upcomingEvents }
}
```

**Acceptance Criteria:**
- [ ] 트렌드 데이터 매핑
- [ ] 이벤트 데이터 매핑
- [ ] 타입 안전성 보장
- [ ] 테스트 파일: `tests/unit/presentation/mappers/trendMapper.test.ts`

---

#### T2.2.3: useAIInsights 훅 생성
**Priority:** P1 | **Effort:** MEDIUM | **Impact:** HIGH

**File to Create:**
- `src/presentation/hooks/useAIInsights.ts`

**Implementation:**
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { mapAnomalyResponse, type MappedAnomaly } from '../mappers/anomalyMapper'
import { mapTrendResponse, type MappedTrend } from '../mappers/trendMapper'

interface UseAIInsightsOptions {
  industry?: string
  enabled?: boolean
  refetchInterval?: number
}

interface UseAIInsightsReturn {
  anomalies: MappedAnomaly[]
  trends: MappedTrend[]
  upcomingEvents: Array<{ name: string; date: Date; tip: string }>
  summary: { critical: number; warning: number; info: number }
  isLoading: boolean
  error: Error | null
  refresh: () => void
}

export function useAIInsights(
  options: UseAIInsightsOptions = {}
): UseAIInsightsReturn {
  const { industry, enabled = true, refetchInterval = 5 * 60 * 1000 } = options

  // Fetch anomalies
  const anomalyQuery = useQuery({
    queryKey: ['ai-insights', 'anomalies', industry],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (industry) params.set('industry', industry)
      params.set('includeRootCause', 'true')

      const res = await fetch(`/api/ai/anomalies?${params}`)
      if (!res.ok) throw new Error('Failed to fetch anomalies')
      return res.json()
    },
    enabled,
    staleTime: refetchInterval,
    refetchInterval,
  })

  // Fetch trends
  const trendQuery = useQuery({
    queryKey: ['ai-insights', 'trends', industry],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (industry) params.set('industry', industry)
      params.set('lookahead', '14')

      const res = await fetch(`/api/ai/trends?${params}`)
      if (!res.ok) throw new Error('Failed to fetch trends')
      return res.json()
    },
    enabled,
    staleTime: refetchInterval,
    refetchInterval,
  })

  // Map responses
  const mappedAnomalies = anomalyQuery.data
    ? mapAnomalyResponse(anomalyQuery.data)
    : { anomalies: [], summary: { critical: 0, warning: 0, info: 0 } }

  const mappedTrends = trendQuery.data?.data
    ? mapTrendResponse(trendQuery.data.data)
    : { trends: [], upcomingEvents: [] }

  return {
    anomalies: mappedAnomalies.anomalies,
    trends: mappedTrends.trends,
    upcomingEvents: mappedTrends.upcomingEvents,
    summary: mappedAnomalies.summary,
    isLoading: anomalyQuery.isLoading || trendQuery.isLoading,
    error: anomalyQuery.error || trendQuery.error,
    refresh: () => {
      anomalyQuery.refetch()
      trendQuery.refetch()
    },
  }
}
```

**Acceptance Criteria:**
- [ ] 실제 API 연결 (Mock 데이터 없음)
- [ ] 캐싱 전략 (5분)
- [ ] 오류 처리
- [ ] 매퍼 함수 사용
- [ ] 테스트 파일: `tests/unit/presentation/hooks/useAIInsights.test.ts`

---

#### T2.3: /api/ai/copy 스트리밍 전환
**Priority:** P0 | **Effort:** HIGH | **Impact:** HIGH

**Files to Modify:**
- `src/app/api/ai/copy/route.ts`

**Implementation:**
```typescript
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { buildAdCopyPrompt, AD_COPY_SYSTEM_PROMPT } from '@infrastructure/external/openai/prompts/adCopyGeneration'

export async function POST(request: NextRequest) {
  // ... 기존 인증/검증 로직

  const isStreaming = body.stream === true

  if (isStreaming) {
    const prompt = buildAdCopyPrompt(body)

    const result = streamText({
      model: openai('gpt-4o'),
      system: AD_COPY_SYSTEM_PROMPT,
      prompt,
      temperature: 0.8,
      maxTokens: 3000,
    })

    return result.toDataStreamResponse()
  }

  // 기존 JSON 응답 (하위 호환성)
  const aiService = getAIService()
  const variants = await aiService.generateAdCopy(body)
  return NextResponse.json({ variants })
}
```

**Acceptance Criteria:**
- [ ] 카피 생성 스트리밍
- [ ] 각 변형 순차 표시
- [ ] 기존 JSON 응답 유지 (하위 호환)
- [ ] 테스트 파일: `tests/integration/api/ai/copy-streaming.test.ts`

---

#### T2.4: /api/ai/science-copy 스트리밍 전환
**Priority:** P0 | **Effort:** HIGH | **Impact:** HIGH

**Note:** science-score, science-analyze는 AI를 사용하지 않으므로 스트리밍 대상에서 **제외**.

**Files to Modify:**
- `src/app/api/ai/science-copy/route.ts`

**Implementation:**
```typescript
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getScienceAIService } from '@/lib/di/container'
import { formatScienceContextBlock } from '@infrastructure/external/openai/prompts/science'

export async function POST(request: NextRequest) {
  // ... 기존 인증/검증 로직

  const isStreaming = body.stream === true

  if (isStreaming) {
    // Science context 먼저 생성
    const scienceService = getScienceAIService()
    const intelligence = scienceService.intelligence
    const analysisInput = intelligence.mapAdCopyToAnalysisInput(body)
    const { compositeScore, knowledgeContext } = intelligence.analyze(analysisInput)

    // Enriched prompt 생성
    const enrichedBody = {
      ...body,
      scienceContext: formatScienceContextBlock(knowledgeContext),
    }
    const prompt = buildAdCopyPrompt(enrichedBody)

    // 스트리밍 응답
    const result = streamText({
      model: openai('gpt-4o'),
      system: AD_COPY_SYSTEM_PROMPT,
      prompt,
      temperature: 0.8,
      maxTokens: 3000,
    })

    // Custom header로 science score 전달
    return result.toDataStreamResponse({
      headers: {
        'X-Science-Score': String(compositeScore),
      },
    })
  }

  // 기존 JSON 응답
  const scienceService = getScienceAIService()
  const result = await scienceService.generateScienceBackedAdCopy(body)
  return NextResponse.json({
    variants: result.result,
    scienceScore: result.scienceScore,
    knowledgeContext: result.knowledgeContext,
  })
}
```

**Acceptance Criteria:**
- [ ] 과학 기반 카피 생성 스트리밍
- [ ] Science score 헤더로 전달
- [ ] 기존 JSON 응답 유지
- [ ] 테스트 파일: `tests/integration/api/ai/science-copy-streaming.test.ts`

---

### Phase 3: Ambient AI (Week 5-6)

#### T3.1.1: AI 폴백 매니저
**Priority:** P1 | **Effort:** HIGH | **Impact:** HIGH

**File to Create:**
- `src/infrastructure/external/openai/fallback/AIFallbackManager.ts`

**Implementation:**
```typescript
interface FallbackConfig<T> {
  primary: () => Promise<T>
  secondary?: () => Promise<T>
  template?: () => T
  onFallback?: (level: 'secondary' | 'template', error: Error) => void
}

export class AIFallbackManager {
  async execute<T>(config: FallbackConfig<T>): Promise<{
    result: T
    usedFallback: boolean
    fallbackLevel?: 'secondary' | 'template'
  }> {
    try {
      const result = await config.primary()
      return { result, usedFallback: false }
    } catch (primaryError) {
      console.warn('Primary AI failed:', primaryError)

      if (config.secondary) {
        try {
          const result = await config.secondary()
          config.onFallback?.('secondary', primaryError as Error)
          return { result, usedFallback: true, fallbackLevel: 'secondary' }
        } catch (secondaryError) {
          console.warn('Secondary AI failed:', secondaryError)
        }
      }

      if (config.template) {
        const result = config.template()
        config.onFallback?.('template', primaryError as Error)
        return { result, usedFallback: true, fallbackLevel: 'template' }
      }

      throw primaryError
    }
  }
}
```

**Acceptance Criteria:**
- [ ] 3단계 폴백 동작 (고급 AI → 기본 AI → 템플릿)
- [ ] 폴백 시 콜백 호출
- [ ] 로깅 및 모니터링 지원
- [ ] 테스트 파일: `tests/unit/infrastructure/fallback/AIFallbackManager.test.ts`

---

#### T3.2.1: 백그라운드 분석 서비스 (Web Worker)
**Priority:** P2 | **Effort:** HIGH | **Impact:** HIGH

**Files to Create:**
- `src/presentation/workers/backgroundAnalysis.worker.ts`
- `src/application/services/AmbientAIService.ts`

**Web Worker Configuration (Next.js 16):**
```typescript
// next.config.ts
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.worker\.ts$/,
        use: { loader: 'worker-loader', options: { inline: 'fallback' } },
      })
    }
    return config
  },
}
```

**Acceptance Criteria:**
- [ ] Web Worker 백그라운드 실행
- [ ] 성능 영향 최소화
- [ ] 분석 결과 캐싱
- [ ] Next.js 16 호환성
- [ ] 테스트 파일: `tests/unit/application/services/AmbientAIService.test.ts`

---

#### T3.4: 사용자 피드백 저장 (Prisma 스키마 변경)
**Priority:** P1 | **Effort:** MEDIUM | **Impact:** MEDIUM

**File to Modify:**
- `prisma/schema.prisma`

**Schema Addition:**
```prisma
model AIFeedback {
  id          String   @id @default(cuid())
  userId      String
  type        String   // 'suggestion', 'insight', 'copy'
  entityId    String?  // Related entity (campaign, report, etc.)
  rating      Int?     // 1-5 rating
  helpful     Boolean?
  comment     String?
  context     Json?    // Additional context
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
}
```

**Acceptance Criteria:**
- [ ] 스키마 정의
- [ ] 마이그레이션 생성
- [ ] Repository 구현
- [ ] 테스트 파일: `tests/integration/repositories/AIFeedbackRepository.test.ts`

---

### Phase 4: Polish & Onboarding (Week 7-8)

#### T4.2: 전체 통합 테스트
**Priority:** P0 | **Effort:** HIGH | **Impact:** HIGH

**File to Create:**
- `tests/e2e/ax-experience.spec.ts`

**Test Scenarios:**
```typescript
import { test, expect } from '@playwright/test'

test.describe('AX Experience', () => {
  test('should stream AI chat response', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('[data-testid="ai-chat-trigger"]')
    await page.fill('[data-testid="chat-input"]', 'ROAS가 낮은 이유는?')
    await page.click('[data-testid="chat-send"]')

    // Streaming indicator visible
    await expect(page.getByTestId('streaming-indicator')).toBeVisible()

    // Response appears progressively
    const response = page.getByTestId('chat-response')
    await expect(response).toBeVisible({ timeout: 10000 })

    // First Token Time < 500ms
    // (측정 로직 필요)
  })

  test('should show confidence indicator', async ({ page }) => {
    // ...
  })

  test('should handle AI error gracefully', async ({ page }) => {
    // ...
  })
})
```

**Acceptance Criteria:**
- [ ] AI 채팅 스트리밍 E2E
- [ ] 카피 생성 전체 플로우
- [ ] 신뢰도 표시 검증
- [ ] 오류 폴백 테스트
- [ ] 온보딩 플로우
- [ ] 모든 E2E 테스트 통과
- [ ] 성능 기준 충족 (First Token Time < 500ms)

---

#### T4.3: 성능 최적화
**Priority:** P1 | **Effort:** MEDIUM | **Impact:** HIGH

**Focus Areas:**
1. First Token Time < 500ms
2. 스트리밍 청크 크기 최적화
3. 컴포넌트 메모이제이션
4. 번들 크기 분석

**Acceptance Criteria:**
- [ ] First Token Time < 500ms (측정 및 검증)
- [ ] Core Web Vitals 통과
- [ ] 메모리 누수 없음
- [ ] 번들 크기 증가 < 50KB

---

## 6. Commit Strategy

### Phase 0 Commits
```
chore(metrics): add AX baseline measurement document
```

### Phase 1 Commits
```
chore(deps): add Vercel AI SDK (ai@^3.5.0, @ai-sdk/openai@^0.0.72)
feat(ports): add IStreamingAIService interface
feat(infra): implement StreamingAIService with Vercel AI SDK
feat(infra): add streamParser utilities for SSE parsing
feat(hooks): implement useAIStream hook with progress tracking
feat(ui): add StreamingText component with typewriter effect
feat(ui): add AI loading indicators (AILoadingIndicator, StreamingProgress, SkeletonAI)
feat(api): add streaming support to /api/ai/chat endpoint
chore(ui): update AI components index.ts with new exports
test(ai): add streaming infrastructure unit tests
```

### Phase 2 Commits
```
feat(ui): add ConfidenceIndicator component with color codes
feat(ui): implement sentence-level confidence highlighting
feat(ui): add EvidencePanel for AI reasoning transparency
feat(mappers): add anomaly and trend API response mappers
feat(hooks): implement useAIInsights with real API connection
feat(dashboard): connect AIInsights to anomaly/trend APIs
feat(api): add streaming support to /api/ai/copy endpoint
feat(api): add streaming support to /api/ai/science-copy endpoint
test(ai): add core AX component and mapper tests
```

### Phase 3 Commits
```
feat(infra): implement AIFallbackManager with 3-tier fallback
feat(ui): add PartialSuccess and ErrorRecovery components
feat(workers): implement background analysis Web Worker
feat(services): add AmbientAIService for proactive insights
feat(infra): implement context detection engine
feat(ui): add non-invasive AI suggestion components
feat(db): add AIFeedback schema for user feedback collection
test(ai): add ambient AI system tests
```

### Phase 4 Commits
```
feat(onboarding): add AI feature tour for new users
feat(onboarding): implement first-use guides and hints
test(e2e): add comprehensive AX experience E2E tests
perf(ai): optimize streaming performance and bundle size
docs(ai): add AX system documentation
```

---

## 7. Success Criteria

### Quantitative Metrics

| Metric | Baseline (Pre-work) | Target | Method |
|--------|---------------------|--------|--------|
| First Token Time | N/A (no streaming) | < 500ms | API 모니터링 |
| AI 기능 사용률 | TBD (T0.1) | +30% | Analytics |
| 사용자 만족도 | TBD (T0.1, ~3.2) | 4.0/5.0 | NPS 설문 |
| 작업 완료 시간 | TBD (T0.1) | -30% | 세션 분석 |
| 오류 복구율 | TBD (T0.1, ~60%) | 95% | 로그 분석 |
| AI 제안 수용률 | TBD (T0.1, ~20%) | 40% | 클릭 추적 |

### Qualitative Criteria

- [ ] "AI가 방해가 아닌 도움이 된다" - 사용자 피드백
- [ ] "자연스럽게 AI 기능을 사용하게 된다" - 인터뷰
- [ ] "신뢰할 수 있는 제안을 받는다" - 만족도 조사

---

## 8. Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 스트리밍 성능 저하 | MEDIUM | HIGH | 청크 크기 최적화, CDN 활용 |
| Vercel AI SDK 호환성 문제 | LOW | HIGH | 버전 고정, 호환성 테스트 선행 |
| 과도한 AI 제안 피로 | HIGH | HIGH | 피로도 관리, 사용자 설정 존중 |
| 신뢰도 계산 부정확 | MEDIUM | MEDIUM | 지속적 캘리브레이션, 피드백 수집 |
| 폴백 시 품질 저하 | LOW | MEDIUM | 템플릿 품질 관리, 명확한 커뮤니케이션 |
| 백그라운드 분석 리소스 | MEDIUM | LOW | 리소스 쿼터, 저사용 시간 활용 |

---

## 9. File Summary

### New Files to Create (35+ files)

**Ports (1):**
- `src/application/ports/IStreamingAIService.ts`

**Streaming Infrastructure (3):**
- `src/infrastructure/external/openai/streaming/index.ts`
- `src/infrastructure/external/openai/streaming/StreamingAIService.ts`
- `src/infrastructure/external/openai/streaming/streamParser.ts`

**Fallback Infrastructure (1):**
- `src/infrastructure/external/openai/fallback/AIFallbackManager.ts`

**Hooks (3):**
- `src/presentation/hooks/useAIStream.ts`
- `src/presentation/hooks/useAIInsights.ts`
- `src/presentation/hooks/useContextualAI.ts`

**Mappers (2):**
- `src/presentation/mappers/anomalyMapper.ts`
- `src/presentation/mappers/trendMapper.ts`

**Components (14):**
- `src/presentation/components/ai/StreamingText.tsx`
- `src/presentation/components/ai/AILoadingIndicator.tsx`
- `src/presentation/components/ai/StreamingProgress.tsx`
- `src/presentation/components/ai/SkeletonAI.tsx`
- `src/presentation/components/ai/ConfidenceIndicator.tsx`
- `src/presentation/components/ai/ConfidenceHighlight.tsx`
- `src/presentation/components/ai/EvidencePanel.tsx`
- `src/presentation/components/ai/FallbackIndicator.tsx`
- `src/presentation/components/ai/PartialSuccess.tsx`
- `src/presentation/components/ai/ErrorRecovery.tsx`
- `src/presentation/components/ai/AISuggestion.tsx`
- `src/presentation/components/ai/AIHint.tsx`
- `src/presentation/components/onboarding/AITour.tsx`
- `src/presentation/components/onboarding/AIFirstUse.tsx`

**Services (2):**
- `src/application/services/AmbientAIService.ts`
- `src/application/services/InsightQueueService.ts`

**Workers (1):**
- `src/presentation/workers/backgroundAnalysis.worker.ts`

**Stores (1):**
- `src/presentation/stores/insightStore.ts`

**Tests (10+):**
- `tests/unit/infrastructure/streaming/sdk.test.ts`
- `tests/unit/infrastructure/streaming/StreamingAIService.test.ts`
- `tests/unit/infrastructure/streaming/streamParser.test.ts`
- `tests/unit/infrastructure/fallback/AIFallbackManager.test.ts`
- `tests/unit/presentation/hooks/useAIStream.test.ts`
- `tests/unit/presentation/hooks/useAIInsights.test.ts`
- `tests/unit/presentation/mappers/anomalyMapper.test.ts`
- `tests/unit/presentation/mappers/trendMapper.test.ts`
- `tests/unit/presentation/components/ai/*.test.tsx`
- `tests/integration/api/ai/chat-streaming.test.ts`
- `tests/integration/api/ai/copy-streaming.test.ts`
- `tests/integration/api/ai/science-copy-streaming.test.ts`
- `tests/e2e/ax-experience.spec.ts`

### Files to Modify (8 files)

- `package.json` - ai, @ai-sdk/openai 패키지 추가
- `prisma/schema.prisma` - AIFeedback 모델 추가
- `src/app/api/ai/chat/route.ts` - 스트리밍 지원 추가
- `src/app/api/ai/copy/route.ts` - 스트리밍 지원 추가
- `src/app/api/ai/science-copy/route.ts` - 스트리밍 지원 추가
- `src/presentation/components/ai/index.ts` - 새 컴포넌트 export
- `src/lib/validations/index.ts` - chatSchema에 stream 필드 추가
- `next.config.ts` - Web Worker 설정 (선택)

---

## 10. Execution Notes

### Dependencies
```json
{
  "ai": "^3.5.0",
  "@ai-sdk/openai": "^0.0.72"
}
```

### Environment Variables
```bash
# 기존 변수 유지
OPENAI_API_KEY=sk-...

# 새로 추가 (선택)
AI_FALLBACK_ENABLED=true
AI_BACKGROUND_ANALYSIS_ENABLED=true
```

### Testing Strategy
1. Unit Tests: 모든 새 컴포넌트/훅/매퍼
2. Integration Tests: API 스트리밍
3. E2E Tests: 전체 AX 플로우

### Performance Monitoring
- First Token Time 모니터링
- 스트리밍 청크 크기 추적
- 사용자 반응 시간 측정

---

**PLAN_READY: .omc/plans/ax-experience-optimization.md**
