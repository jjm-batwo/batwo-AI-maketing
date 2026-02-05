# 성능 최적화 작업 학습 내용

## 2026-02-05 - React & Next.js 성능 최적화

### 주요 학습 사항

1. **React.memo의 효과적 사용**
   - 자주 리렌더링되는 리스트 아이템에 필수
   - Props가 자주 변경되는 컴포넌트는 memo 효과가 제한적
   - Display name 제공으로 디버깅 용이성 향상

2. **useMemo vs useCallback 선택**
   - useMemo: 계산 비용이 높은 값 (toLocaleString, 객체 생성)
   - useCallback: 자식 컴포넌트에 전달되는 함수
   - 과도한 사용은 오히려 메모리 낭비

3. **Dynamic Import 전략**
   - 초기 로딩 시 필요 없는 컴포넌트 우선 (OnboardingWizard)
   - 사용자 액션 후 표시되는 컴포넌트 (Modal, Dialog)
   - Suspense fallback은 레이아웃 시프트 방지를 위해 높이 유지

4. **Next.js Image 최적화**
   - formats 설정으로 AVIF, WebP 자동 변환
   - deviceSizes와 imageSizes 세밀 조정으로 대역폭 절감
   - LCP 이미지에는 반드시 priority 속성

5. **Bundle Analyzer 활용**
   - @next/bundle-analyzer로 중복 의존성 발견
   - Tree shaking 효과 검증
   - 환경 변수 제어로 필요 시에만 활성화

### 성공 패턴

```typescript
// 1. 효과적인 memo 사용
export const Component = memo(function Component({ data }) {
  const memoized = useMemo(() => expensiveCalc(data), [data])
  const handler = useCallback(() => action(data.id), [data.id])
  return <div>{memoized}</div>
})

// 2. Dynamic import with Suspense
const Heavy = lazy(() => import('./Heavy'))
<Suspense fallback={<Skeleton />}>
  <Heavy />
</Suspense>

// 3. Next.js Image 최적화
<Image
  src="/hero.png"
  width={1200}
  height={600}
  priority
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Hero"
/>
```

### 피해야 할 패턴

```typescript
// ❌ 모든 컴포넌트에 memo (불필요)
export const SimpleText = memo(({ text }) => <span>{text}</span>)

// ❌ 의존성 배열 없는 useMemo (의미 없음)
const value = useMemo(() => props.value)

// ❌ Dynamic import 남용 (초기 로딩 중요 컴포넌트)
const Header = lazy(() => import('./Header')) // Header는 항상 필요
```

### 측정의 중요성

- 최적화 전/후 반드시 Lighthouse 측정
- Bundle analyzer로 실제 번들 크기 확인
- Core Web Vitals 지속 모니터링

### Next.js 버전별 주의사항

- Next.js 16.1에서 `reactCompiler` 옵션은 experimental에 없음
- React 19.2와 호환성 확인 필요
- Turbopack 사용 시 일부 플러그인 동작 상이

### 프로덕션 체크리스트

- [ ] Lighthouse 점수 90+ 달성
- [ ] 초기 번들 < 200KB
- [ ] LCP < 2.5초
- [ ] CLS < 0.1
- [ ] 모든 이미지 next/image 사용
- [ ] Critical 경로 최적화
