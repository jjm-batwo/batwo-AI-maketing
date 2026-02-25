---
name: verify-ui-components
description: UI 컴포넌트의 일관성, 접근성, 성능 패턴을 검증합니다. 랜딩/대시보드/채팅/최적화/픽셀/온보딩/감사 컴포넌트 변경 후 사용.
---

# UI 컴포넌트 검증

## Purpose

React 컴포넌트 구현의 일관성과 품질을 검증합니다:

1. **shadcn/ui 일관성** — 커스텀 컴포넌트가 shadcn/ui 패턴을 따르는지 확인
2. **접근성(a11y)** — ARIA 속성, 키보드 네비게이션, 포커스 관리
3. **성능 패턴** — 불필요한 리렌더링, 메모이제이션, lazy loading
4. **타입 안전성** — Props 인터페이스 완전성, 제네릭 사용
5. **스타일 일관성** — Tailwind 클래스 순서, 다크모드 지원, 반응형 디자인

## When to Run

- 새로운 UI 컴포넌트를 추가한 후
- 랜딩 페이지 섹션을 수정한 후
- 대시보드 컴포넌트를 변경한 후
- 채팅 UI 컴포넌트를 추가/수정한 후
- 최적화 규칙 관리 컴포넌트를 변경한 후
- shadcn/ui 컴포넌트를 커스터마이징한 후

## Related Files

| File                                                                      | Purpose                                                  |
| ------------------------------------------------------------------------- | -------------------------------------------------------- |
| `src/presentation/components/landing/FeaturesSection/FeaturesSection.tsx` | 랜딩 페이지 기능 섹션 — Intersection Observer 애니메이션 |
| `src/presentation/components/landing/HeroSection/HeroContent.tsx`         | 랜딩 페이지 히어로 — CTA 버튼, 소셜 프루프               |
| `src/presentation/components/landing/PricingSection/PricingSection.tsx`   | 가격 섹션 — 토글, 카드 그리드                            |
| `src/presentation/components/landing/ProductShowcaseSection.tsx`          | 제품 쇼케이스 — 탭 인터페이스                            |
| `src/presentation/components/landing/SocialProofSection.tsx`              | 소셜 프루프 — 카드 그리드, 인용구                        |
| `src/presentation/components/dashboard/KPICard.tsx`                       | KPI 카드 — 스파클차트, 변화율 표시                       |
| `src/presentation/components/dashboard/KPIChart.tsx`                      | KPI 차트 — Recharts 기반                                 |
| `src/presentation/components/dashboard/CampaignSummaryTable.tsx`          | 캠페인 요약 테이블 — 정렬, 필터링                        |
| `src/presentation/components/dashboard/DonutChart.tsx`                    | 도넛 차트 — 캠페인 상태 분포                             |
| `src/presentation/components/dashboard/AIInsights.tsx`                    | AI 인사이트 카드                                         |
| `src/presentation/components/dashboard/OptimizationTimeline.tsx`          | 최적화 타임라인 — 규칙 적용 히스토리 표시               |
| `src/presentation/components/dashboard/SavingsWidget.tsx`                 | 절감 위젯 — 예상 절감 금액 표시                         |
| `src/presentation/components/dashboard/FeedbackSummaryCard.tsx`           | 피드백 요약 카드 — 긍정률/최근 부정 피드백 표시         |
| `src/presentation/components/chat/ChatInput.tsx`                          | 채팅 입력 — 글자 수 제한, 키보드 전송, 접근성           |
| `src/presentation/components/chat/ChatMessage.tsx`                        | 채팅 메시지 — role 기반 렌더링, 마크다운 지원           |
| `src/presentation/components/chat/ChatPanel.tsx`                          | 채팅 패널 — 메시지 목록, 스크롤, 가이드 질문            |
| `src/presentation/components/chat/ChatMessageFeedback.tsx`                | 채팅 피드백 — 좋아요/싫어요 버튼, ARIA 접근성           |
| `src/presentation/components/optimization/*.tsx`                          | 최적화 규칙 관리 — CRUD UI 컴포넌트                     |
| `src/presentation/components/audit/AuditReportCard.tsx`                   | 감사 리포트 카드 — 점수 및 개선사항 요약                |
| `src/presentation/components/audit/AuditCategoryBreakdown.tsx`            | 감사 카테고리 분석 — 세부 카테고리별 점수               |
| `src/presentation/components/audit/AuditConversionCTA.tsx`                | 감사 전환 CTA — 묶음 서비스 신청 유도                   |
| `src/presentation/components/pixel/PlatformSelector.tsx`                  | 픽셀 설치 — 플랫폼 선택 카드 (카페24/자체몰/네이버)     |
| `src/presentation/components/pixel/guides/CustomSiteGuide.tsx`            | 픽셀 설치 — 자체몰 설치 가이드                           |
| `src/presentation/components/pixel/guides/NaverGuide.tsx`                 | 픽셀 설치 — 네이버 스마트스토어 설치 가이드              |
| `src/presentation/components/onboarding/steps/PixelSetupStep.tsx`         | 온보딩 — 픽셀 설치 단계 (플랫폼 선택 → 가이드 분기)     |
| `src/presentation/hooks/useScrollAnimation.ts`                            | 스크롤 애니메이션 훅                                     |
| `src/presentation/hooks/useDashboardKPI.ts`                               | 대시보드 KPI 데이터 훅                                   |
| `src/presentation/hooks/useSavings.ts`                                    | 절감 금액 계산 훅                                       |
| `src/presentation/hooks/useAgentChat.ts`                                  | AI 채팅 SSE 스트리밍 훅                                  |
| `src/presentation/hooks/useFeedback.ts`                                   | 채팅 메시지 피드백 훅                                    |
| `src/presentation/hooks/useFeedbackAnalytics.ts`                          | 피드백 분석 데이터 훅                                    |
| `src/presentation/hooks/useKeyboardNavigation.ts`                         | 채팅 키보드 네비게이션 훅                                |
| `src/components/ui/`                                                      | shadcn/ui 기본 컴포넌트들                                |

## Workflow

### Step 1: 컴포넌트 Props 인터페이스 검증

**검사:** 모든 컴포넌트가 완전한 TypeScript Props 인터페이스를 정의하는지 확인합니다.

```bash
grep -rn "interface.*Props" src/presentation/components/landing/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/chat/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/optimization/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/pixel/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/onboarding/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/audit/ --include="*.tsx"
```

**PASS 기준:** 모든 컴포넌트가 Props 인터페이스 정의
**FAIL 기준:** `any` 타입 사용 또는 Props 미정의

### Step 2: 'use client' 지시어 검증

**검사:** 클라이언트 훅을 사용하는 컴포넌트에 'use client' 지시어가 있는지 확인합니다.

```bash
# useState, useEffect, useMemo 등을 사용하면서 'use client'가 없는 파일 검색
grep -rl "useState\|useEffect\|useMemo" src/presentation/components/ --include="*.tsx" | while read f; do
  if ! head -1 "$f" | grep -q "'use client'"; then
    echo "MISSING: $f"
  fi
done
```

**PASS 기준:** 클라이언트 훅 사용 시 'use client' 선언
**FAIL 기준:** 지시어 누락으로 인한 빌드 오류

### Step 3: shadcn/ui 컴포넌트 사용 일관성

**검사:** UI 컴포넌트가 shadcn/ui 기본 컴포넌트를 재사용하는지 확인합니다.

```bash
# shadcn/ui 컴포넌트 import 확인
grep -rn "@/components/ui/" src/presentation/components/landing/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/chat/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/optimization/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/pixel/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/onboarding/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/audit/ --include="*.tsx"
```

**PASS 기준:** Card, Button, Input 등 기본 UI는 shadcn/ui 사용
**FAIL 기준:** 기본 컴포넌트를 직접 구현한 경우

### Step 4: Tailwind 클래스 순서 및 패턴

**검사:** Tailwind CSS 클래스가 일관된 순서로 작성되었는지 확인합니다.

```bash
# cn() 유틸리티 사용 확인
grep -rn "cn(" src/presentation/components/landing/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/chat/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/optimization/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/pixel/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/onboarding/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/audit/ --include="*.tsx"
```

**PASS 기준:** 조건 클래스는 `cn()` 유틸리티 사용
**FAIL 기준:** 문자열 템플릿으로 조건 클래스 처리

**클래스 순서 규칙:**

1. Layout (flex, grid, block)
2. Spacing (p-, m-, gap-)
3. Sizing (w-, h-)
4. Typography (text-, font-)
5. Colors (bg-, text-, border-)
6. Effects (shadow-, rounded-)
7. States (hover:, focus:, disabled:)

### Step 5: 접근성(a11y) 기본 검사

**검사:** 기본적인 접근성 속성이 포함되었는지 확인합니다.

```bash
# 버튼에 aria-label 또는 명확한 텍스트 확인
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/landing/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/chat/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/optimization/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/pixel/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/onboarding/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/audit/ --include="*.tsx"
```

**PASS 기준:**

- 아이콘 버튼에 `aria-label` 제공
- 이미지에 `alt` 텍스트
- 폼 입력에 `label` 연결
- 채팅 메시지 목록에 `role="log"` + `aria-live="polite"`
- 피드백 버튼에 `aria-label` 제공

### Step 6: 성능 패턴 검증

**검사:** 불필요한 리렌더링을 방지하는 패턴이 적용되었는지 확인합니다.

```bash
# useMemo/useCallback 사용 확인 (대시보드/채팅의 무거운 계산)
grep -rn "useMemo\|useCallback" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "useMemo\|useCallback" src/presentation/components/chat/ --include="*.tsx"

# React.memo 사용 확인
grep -rn "React.memo\|memo(" src/presentation/components/ --include="*.tsx"
```

**PASS 기준:**

- 무거운 계산은 `useMemo`로 메모이제이션
- 자주 리렌더링되는 리스트 아이템은 `React.memo`
- 대시보드 KPI 계산은 `useMemo` 사용
- 채팅 이벤트 핸들러는 `useCallback` 사용

### Step 7: 반응형 디자인 검증

**검사:** 모바일/태블릿/데스크톱 브레이크포인트가 적절히 적용되었는지 확인합니다.

```bash
# 반응형 클래스 사용 확인 (md:, lg:)
grep -rn "md:\|lg:\|sm:" src/presentation/components/landing/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/dashboard/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/chat/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/optimization/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/pixel/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/onboarding/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/audit/ --include="*.tsx" | head -20
```

**PASS 기준:** 모든 UI가 모바일 우선으로 구현
**FAIL 기준:** 특정 화면 크기에서 깨지는 UI

## Output Format

```markdown
### verify-ui-components 결과

| #   | 검사                | 상태      | 상세                 |
| --- | ------------------- | --------- | -------------------- |
| 1   | Props 인터페이스    | PASS/FAIL | 누락: N개 파일       |
| 2   | 'use client' 지시어 | PASS/FAIL | 누락: 파일 경로      |
| 3   | shadcn/ui 사용      | PASS/FAIL | 직접 구현: N개       |
| 4   | Tailwind 클래스     | PASS/FAIL | cn() 미사용: N개     |
| 5   | 접근성              | PASS/FAIL | aria-label 누락: N개 |
| 6   | 성능 패턴           | PASS/FAIL | useMemo 권장: N개    |
| 7   | 반응형 디자인       | PASS/WARN | 미검증: N개          |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **서버 컴포넌트** — 'use client'가 필요 없는 순수 서버 컴포넌트
2. **타입 정의 파일** — `.d.ts` 파일은 Props 인터페이스 검사 제외
3. **스토리/테스트 파일** — 스토리북 또는 테스트 파일은 접근성 검사 대상에서 제외
4. **HOC/유틸리티** — 고차 컴포넌트나 유틸리티 함수는 일부 패턴 검사 제외
5. **동적 import** — `lazy()`로 로드되는 컴포넌트는 초기 로드 검사 제외
6. **채팅 컴포넌트의 textarea** — ChatInput의 textarea는 접근성을 위해 aria-describedby를 사용하며, label 대신 aria-label을 사용하는 것이 허용됨

## Examples

### 올바른 예시

```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface KPICardProps {
  title: string
  value: number
  change?: number
  isLoading?: boolean
  className?: string
}

export function KPICard({ title, value, change, isLoading, className }: KPICardProps) {
  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat('ko-KR').format(value)
  }, [value])

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className="mt-2 text-3xl font-bold">{formattedValue}</p>
        {change !== undefined && (
          <span className={cn(
            'text-sm',
            change > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </CardContent>
    </Card>
  )
}
```

### 위반 예시

```typescript
// 'use client' 누락
import { useState } from 'react' // 오류!

// Props 타입 미정의
export function BadComponent(props: any) { // 위반!
  // 문자열 템플릿으로 클래스 처리
  return <div className={`p-4 ${props.active ? 'bg-blue-500' : ''}`}> // 위반!
    <button onClick={props.onClick}> {/* aria-label 누락 */}
      <Icon />
    </button>
  </div>
}
```
