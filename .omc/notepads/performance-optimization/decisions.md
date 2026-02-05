# 성능 최적화 설계 결정 사항

## 2026-02-05 - 프론트엔드 성능 최적화

### 1. React.memo 적용 기준

**결정**: 자주 리렌더링되는 리스트 아이템과 데이터 디스플레이 컴포넌트에만 적용

**이유**:
- 모든 컴포넌트에 memo를 적용하면 오히려 메모리 오버헤드 증가
- Props 비교 비용이 리렌더링 비용보다 클 수 있음
- 리스트 아이템(CampaignCard)은 항상 memo 대상

**적용 컴포넌트**:
- CampaignCard (리스트 아이템)
- CampaignList (리스트 컨테이너)
- AIInsights (데이터 디스플레이)
- CampaignSummaryTable (테이블)

**미적용 컴포넌트**:
- Layout 컴포넌트 (거의 변경 안됨)
- Button, Input 등 기본 UI 컴포넌트 (이미 최적화됨)

### 2. Dynamic Import 범위

**결정**: 초기 렌더링에 불필요한 컴포넌트만 동적 로딩

**대상**:
- OnboardingWizard: 신규 사용자만 표시
- CampaignSummaryTable: 스크롤 후 노출
- AIInsights: 부가 기능

**미적용**:
- Header, Sidebar: 항상 필요
- KPICard, KPIChart: LCP 구성 요소
- 폼 컴포넌트: 사용자 액션 차단 방지

**Trade-off**:
- 초기 번들 감소 vs 지연 로딩 대기
- Suspense fallback으로 UX 저하 최소화

### 3. Image 최적화 전략

**결정**: AVIF 우선, WebP 폴백, 다단계 sizes 설정

**설정 근거**:
- AVIF: 40% 추가 압축 (브라우저 지원 증가)
- WebP: 30% 압축 (거의 모든 브라우저)
- deviceSizes 8단계: 다양한 디바이스 커버
- minimumCacheTTL 60초: 빈번한 재요청 방지

**향후 개선**:
- placeholder blur 자동 생성
- 로컬 이미지 사전 최적화

### 4. Bundle Analyzer 도입

**결정**: 환경 변수로 제어, CI/CD에서 자동 실행 안함

**이유**:
- 개발 시 필요에 따라 수동 실행
- CI 빌드 시간 증가 방지
- 리포트 파일 커밋 방지

**사용 시나리오**:
- 새 패키지 추가 후
- 번들 크기 이상 증가 시
- 정기 성능 점검 (월 1회)

### 5. Webpack 최적화 설정

**결정**: Tree shaking 강화, console.log 프로덕션 제거

**Tree shaking**:
- usedExports: true
- sideEffects: false
- 효과: 미사용 코드 자동 제거

**console.log 제거**:
- 프로덕션에서만 적용
- error, warn은 유지 (디버깅용)
- 번들 크기 약 5-10KB 감소

### 6. React Compiler 미적용

**결정**: Next.js 16.1에서 아직 미지원

**대안**:
- 수동 memo, useMemo, useCallback 적용
- React 19 자체 최적화에 의존
- 향후 버전 업그레이드 시 재검토

### 7. 측정 도구 선택

**Lighthouse**:
- 로컬 개발 및 프로덕션 검증
- Core Web Vitals 기준

**Vercel Analytics**:
- 실사용자 데이터 (RUM)
- 지속적 모니터링

**Sentry Performance**:
- API 응답 시간
- 프론트엔드 에러와 성능 연관 분석

---

**검토 주기**: 분기별 (3개월)
**책임자**: 프론트엔드 개발팀
