# 프론트엔드 성능 최적화 가이드

## 개요
바투 AI 마케팅 솔루션의 프론트엔드 성능 최적화 구현 문서입니다.

## 최적화 영역

### 1. React 컴포넌트 최적화 ✅

#### 1.1 React.memo 적용
자주 리렌더링되는 컴포넌트에 `memo`를 적용하여 불필요한 리렌더링 방지:

**최적화된 컴포넌트:**
- `CampaignCard` - 캠페인 카드 컴포넌트
- `CampaignList` - 캠페인 목록 컴포넌트
- `AIInsights` - AI 인사이트 컴포넌트
- `CampaignSummaryTable` - 캠페인 요약 테이블

```typescript
// Before
export function CampaignCard({ ... }) { ... }

// After
export const CampaignCard = memo(function CampaignCard({ ... }) { ... })
```

#### 1.2 useMemo/useCallback 최적화
계산 비용이 높은 값과 콜백 함수 메모이제이션:

**useMemo 적용 사례:**
- `statusInfo` - 상태 설정 객체
- `objectiveLabel` - 목표 라벨 변환
- `formattedBudget`, `formattedSpend`, `formattedRoas` - 숫자 포맷팅
- `statusConfig` - 번역된 상태 설정

**useCallback 적용 사례:**
- `handlePause`, `handleResume` - 상태 변경 핸들러
- `handleStatusChange` - 상태 변경 콜백

```typescript
// 계산 비용 절감
const formattedBudget = useMemo(() => dailyBudget.toLocaleString(), [dailyBudget])

// 자식 컴포넌트 리렌더링 방지
const handlePause = useCallback(() => {
  onStatusChange?.(id, 'PAUSED')
}, [id, onStatusChange])
```

### 2. 코드 스플리팅 ✅

#### 2.1 동적 임포트 (Dynamic Import)
무거운 컴포넌트를 lazy loading으로 초기 번들 크기 감소:

**동적 임포트 적용 컴포넌트:**
- `OnboardingWizard` - 온보딩 위저드 (초기 로드 시 필요 없음)
- `CampaignSummaryTable` - 캠페인 요약 테이블
- `AIInsights` - AI 인사이트

```typescript
import { Suspense, lazy } from 'react'

const OnboardingWizard = lazy(() =>
  import('@/presentation/components/onboarding').then(mod => ({
    default: mod.OnboardingWizard
  }))
)

// 사용 시 Suspense로 감싸기
<Suspense fallback={<div className="h-20" />}>
  <OnboardingWizard />
</Suspense>
```

**효과:**
- 초기 JavaScript 번들 크기 약 15-20% 감소 예상
- Time to Interactive (TTI) 개선

### 3. 이미지 최적화 ✅

#### 3.1 Next.js Image 설정 강화

**추가된 설정:**
```typescript
images: {
  formats: ['image/avif', 'image/webp'],  // 최신 이미지 포맷
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,  // 캐싱 최적화
}
```

**사용 가이드:**
```tsx
import Image from 'next/image'

// LCP 이미지에는 priority 속성 추가
<Image
  src="/hero-image.png"
  alt="Hero"
  width={1200}
  height={600}
  priority  // LCP 최적화
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// 일반 이미지
<Image
  src="/campaign-thumbnail.png"
  alt="Campaign"
  width={400}
  height={300}
  placeholder="blur"  // 로딩 중 블러 효과
  blurDataURL="data:..."
/>
```

### 4. Bundle 분석 ✅

#### 4.1 webpack-bundle-analyzer 설정

**설치 및 설정 완료:**
```bash
npm install --save-dev @next/bundle-analyzer
```

**분석 실행:**
```bash
npm run analyze
```

**분석 대상:**
- 각 페이지별 번들 크기
- 중복된 의존성 확인
- Tree shaking 효과 검증
- 불필요한 패키지 식별

#### 4.2 Webpack 최적화 설정

```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization = {
      ...config.optimization,
      usedExports: true,      // Tree shaking 강화
      sideEffects: false,     // 부작용 없는 모듈 제거
    }
  }
  return config
}
```

### 5. 컴파일러 최적화 ✅

#### 5.1 React Compiler
```typescript
experimental: {
  reactCompiler: true,  // React 19.2 컴파일러 활성화
}
```

**효과:**
- 자동 메모이제이션
- 더 효율적인 컴포넌트 렌더링

#### 5.2 프로덕션 최적화
```typescript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error', 'warn'],  // error, warn은 유지
  } : false,
}
```

## 성능 지표 목표

### Core Web Vitals 목표값

| 지표 | 목표 | 현재 상태 |
|------|------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | 측정 필요 |
| FID (First Input Delay) | < 100ms | 측정 필요 |
| CLS (Cumulative Layout Shift) | < 0.1 | 측정 필요 |
| FCP (First Contentful Paint) | < 1.8s | 측정 필요 |
| TTI (Time to Interactive) | < 3.8s | 측정 필요 |

### Bundle Size 목표

| 항목 | 목표 | 현재 |
|------|------|------|
| Initial JS | < 200KB | 측정 필요 |
| Total JS | < 1MB | 측정 필요 |
| CSS | < 50KB | 측정 필요 |

## 측정 및 모니터링

### 1. 로컬 측정
```bash
# Lighthouse 실행
npm run build
npm start
# Chrome DevTools > Lighthouse 실행

# Bundle 분석
npm run analyze
```

### 2. 프로덕션 모니터링
- Vercel Analytics (이미 설치됨)
- Sentry Performance Monitoring (이미 설치됨)

## 추가 최적화 계획

### Phase 2 (향후 구현)

#### 2.1 Service Worker & PWA
- [ ] Offline 지원
- [ ] 백그라운드 동기화
- [ ] Push 알림

#### 2.2 이미지 추가 최적화
- [ ] `public/` 폴더 이미지 최적화 (ImageOptim, Squoosh)
- [ ] SVG 스프라이트 시스템
- [ ] Responsive images 자동화

#### 2.3 CSS 최적화
- [ ] Critical CSS 인라인
- [ ] Unused CSS 제거 (PurgeCSS)
- [ ] CSS 모듈 code splitting

#### 2.4 API 최적화
- [ ] GraphQL 도입 검토
- [ ] API Response 압축 (Brotli)
- [ ] Prefetching 전략 강화

#### 2.5 컴포넌트 가상화
- [ ] `react-window` 또는 `react-virtualized` 도입
- [ ] 긴 리스트 렌더링 최적화 (캠페인 목록, 보고서 목록)

## 체크리스트

### 완료 항목 ✅
- [x] React.memo 적용 (CampaignCard, CampaignList, AIInsights, CampaignSummaryTable)
- [x] useMemo/useCallback 최적화
- [x] Dynamic imports (OnboardingWizard, CampaignSummaryTable, AIInsights)
- [x] Next.js Image 설정 강화
- [x] Bundle analyzer 설정
- [x] React Compiler 활성화
- [x] Webpack tree shaking 설정
- [x] Console.log 제거 설정

### 다음 단계
- [ ] Lighthouse 측정 실행
- [ ] Bundle 분석 리포트 생성
- [ ] Core Web Vitals 측정
- [ ] 성능 개선 전/후 비교

## 참고 자료

- [Next.js Performance Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing)
- [React Performance Optimization](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Web.dev - Core Web Vitals](https://web.dev/vitals/)
- [webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

---

**최종 업데이트**: 2026-02-05
**작성자**: Claude Code (Sisyphus-Junior Agent)
