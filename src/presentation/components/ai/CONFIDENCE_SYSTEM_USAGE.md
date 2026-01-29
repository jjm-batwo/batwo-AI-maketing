# Confidence System Components Usage

AI 응답의 신뢰도를 시각화하는 컴포넌트 시스템입니다.

## Components

### 1. ConfidenceIndicator

AI 응답의 전체 신뢰도를 색상으로 표시하는 배지 컴포넌트.

```tsx
import { ConfidenceIndicator } from '@/presentation/components/ai'

// Basic usage
<ConfidenceIndicator confidence={92} />

// With percentage
<ConfidenceIndicator confidence={75} showPercentage />

// Different sizes
<ConfidenceIndicator confidence={50} size="sm" />
<ConfidenceIndicator confidence={85} size="lg" showPercentage />
```

**Props:**
- `confidence: number` - 0-100 범위의 신뢰도 점수
- `showPercentage?: boolean` - 퍼센트 표시 여부 (기본값: false)
- `size?: 'sm' | 'md' | 'lg'` - 크기 (기본값: 'md')
- `className?: string` - 추가 CSS 클래스

**Color Coding:**
- 녹색 (≥85%): 높은 신뢰도
- 노랑 (60-84%): 보통 신뢰도
- 빨강 (<60%): 낮은 신뢰도

---

### 2. ConfidenceHighlight

문장별 신뢰도를 하이라이트로 표시하는 컴포넌트.

```tsx
import { ConfidenceHighlight, SentenceConfidence } from '@/presentation/components/ai'
import { useState } from 'react'

const [selectedSentence, setSelectedSentence] = useState<SentenceConfidence | null>(null)

const sentences: SentenceConfidence[] = [
  {
    text: '이 광고 카피는 전환율을 35% 향상시킬 것으로 예상됩니다.',
    confidence: 92,
    evidence: '유사한 1,234개 캠페인 데이터 기반'
  },
  {
    text: '타겟 고객층의 평균 클릭률은 2.8%입니다.',
    confidence: 76,
    evidence: '최근 3개월 데이터 분석'
  },
  {
    text: '예상 ROI는 약 240%로 추정됩니다.',
    confidence: 55,
    evidence: 'AI 모델 예측 기반'
  }
]

<ConfidenceHighlight
  sentences={sentences}
  showConfidence={true}
  onSentenceClick={(sentence) => {
    setSelectedSentence(sentence)
    // Open evidence panel or show details
  }}
/>
```

**Props:**
- `sentences: SentenceConfidence[]` - 문장 배열
- `showConfidence?: boolean` - 신뢰도 하이라이트 표시 여부 (기본값: true)
- `onSentenceClick?: (sentence: SentenceConfidence) => void` - 문장 클릭 핸들러
- `className?: string` - 추가 CSS 클래스

**SentenceConfidence Type:**
```tsx
interface SentenceConfidence {
  text: string
  confidence: number // 0-100
  evidence?: string
}
```

---

### 3. EvidencePanel

AI의 근거와 추론 과정을 표시하는 슬라이드 패널.

```tsx
import { EvidencePanel, Evidence } from '@/presentation/components/ai'
import { useState } from 'react'

const [isPanelOpen, setIsPanelOpen] = useState(false)

const evidence: Evidence[] = [
  {
    type: 'data',
    source: '2024년 1분기 Meta Ads 캠페인 데이터',
    content: '유사한 타겟팅으로 진행한 1,234개 캠페인에서 평균 CTR 2.8%, 전환율 4.2%를 기록했습니다.',
    confidence: 95
  },
  {
    type: 'research',
    source: 'Journal of Marketing Research (2023)',
    content: '감성적 소구가 포함된 광고 카피는 논리적 소구 대비 35% 높은 전환율을 보입니다.',
    confidence: 88
  },
  {
    type: 'pattern',
    source: '바투 AI 분석',
    content: '귀하의 이전 캠페인 데이터를 분석한 결과, 할인율 강조 시 클릭률이 45% 증가했습니다.',
    confidence: 82
  },
  {
    type: 'inference',
    content: '타겟 연령대와 시간대를 고려할 때, 오후 7-9시 게재가 최적으로 판단됩니다.',
    confidence: 70
  }
]

<>
  <Button onClick={() => setIsPanelOpen(true)}>
    근거 보기
  </Button>

  <EvidencePanel
    title="AI 분석 근거"
    evidence={evidence}
    isOpen={isPanelOpen}
    onClose={() => setIsPanelOpen(false)}
  />
</>
```

**Props:**
- `title?: string` - 패널 제목 (기본값: 'AI 근거 및 추론 과정')
- `evidence: Evidence[]` - 근거 배열
- `isOpen: boolean` - 패널 표시 여부
- `onClose: () => void` - 패널 닫기 핸들러
- `className?: string` - 추가 CSS 클래스

**Evidence Type:**
```tsx
interface Evidence {
  type: 'data' | 'research' | 'pattern' | 'inference'
  source?: string
  content: string
  confidence: number
}
```

**Evidence Types:**
- `data` - 데이터: 실제 데이터 기반 근거
- `research` - 연구: 학술 연구 및 논문 기반
- `pattern` - 패턴: 관찰된 패턴 분석
- `inference` - 추론: AI 논리적 추론

---

## Complete Example

전체 신뢰도 시스템을 통합한 예제:

```tsx
'use client'

import { useState } from 'react'
import {
  ConfidenceIndicator,
  ConfidenceHighlight,
  EvidencePanel,
  type SentenceConfidence,
  type Evidence
} from '@/presentation/components/ai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AIResponseWithConfidence() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const overallConfidence = 85

  const sentences: SentenceConfidence[] = [
    {
      text: '이 광고 카피는 전환율을 35% 향상시킬 것으로 예상됩니다.',
      confidence: 92,
      evidence: '유사한 1,234개 캠페인 데이터 기반'
    },
    {
      text: '타겟 고객층의 평균 클릭률은 2.8%입니다.',
      confidence: 88,
      evidence: '최근 3개월 데이터 분석'
    }
  ]

  const evidence: Evidence[] = [
    {
      type: 'data',
      source: '2024년 1분기 Meta Ads 캠페인 데이터',
      content: '유사한 타겟팅으로 진행한 1,234개 캠페인 분석 결과...',
      confidence: 95
    },
    {
      type: 'research',
      source: 'Journal of Marketing (2023)',
      content: '감성적 소구가 35% 높은 전환율 기록...',
      confidence: 88
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI 분석 결과</CardTitle>
          <ConfidenceIndicator
            confidence={overallConfidence}
            showPercentage
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConfidenceHighlight
          sentences={sentences}
          onSentenceClick={() => setIsPanelOpen(true)}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPanelOpen(true)}
        >
          상세 근거 보기
        </Button>

        <EvidencePanel
          evidence={evidence}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />
      </CardContent>
    </Card>
  )
}
```

---

## Design System

### Colors

모든 컴포넌트는 다크 모드를 지원합니다:

- **High Confidence (≥85%)**: Emerald/Green
  - Light: `bg-emerald-100 text-emerald-800 border-emerald-300`
  - Dark: `dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30`

- **Medium Confidence (60-84%)**: Amber/Yellow
  - Light: `bg-amber-100 text-amber-800 border-amber-300`
  - Dark: `dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30`

- **Low Confidence (<60%)**: Red
  - Light: `bg-red-100 text-red-800 border-red-300`
  - Dark: `dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30`

### Accessibility

모든 컴포넌트는 접근성을 고려하여 제작되었습니다:

- ARIA labels 제공
- 키보드 네비게이션 지원 (Tab, Enter, Space)
- 적절한 role 속성
- 색상 외 추가 시각적 단서 (아이콘, 텍스트)
- 툴팁을 통한 추가 정보 제공

---

## Use Cases

### 1. AI 카피 생성
```tsx
<ConfidenceIndicator confidence={aiCopyConfidence} showPercentage />
```

### 2. 마케팅 분석 리포트
```tsx
<ConfidenceHighlight sentences={analysisResults} />
```

### 3. 캠페인 추천
```tsx
<EvidencePanel evidence={recommendationEvidence} isOpen={showDetails} />
```

### 4. A/B 테스트 제안
```tsx
<div className="space-y-2">
  <ConfidenceIndicator confidence={abTestConfidence} />
  <ConfidenceHighlight sentences={testRecommendations} />
</div>
```
