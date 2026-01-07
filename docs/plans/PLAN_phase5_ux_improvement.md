# Phase 5: UX 개선 구현 계획

**CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ DO NOT skip quality gates or proceed with failing checks

---

## 개요

**목표**: 신규 사용자의 첫 경험 개선 및 모바일 사용성 확보
**범위**: Medium Scope (3 phases, 6-10 hours total)
**우선순위**: P3 - 중영향/저노력

### 핵심 기능
1. **온보딩 위저드**: 신규 사용자 첫 로그인 시 가이드
2. **캠페인 템플릿**: 빠른 시작을 위한 사전 정의 템플릿
3. **모바일 반응형**: 사이드바 드로어 및 반응형 그리드

### 기술 스택 활용
- 기존 shadcn/ui 컴포넌트 (dialog, card, button, tabs)
- Zustand 상태 관리 (uiStore 확장)
- 기존 CampaignCreateForm 멀티스텝 패턴 재활용
- Tailwind CSS 반응형 유틸리티

---

## 아키텍처 결정

### 온보딩 상태 관리
```
Option A: Zustand Store (선택)
- 장점: 기존 패턴과 일관성, 간단한 구현
- 단점: 페이지 새로고침 시 리셋

Option B: localStorage + Store
- 장점: 영속성 확보
- 단점: 복잡도 증가

결정: Option A + localStorage 하이브리드
- 온보딩 완료 여부만 localStorage 저장
- 현재 스텝은 Zustand로 관리
```

### 캠페인 템플릿 저장 위치
```
Option A: 하드코딩 (선택)
- 장점: 빠른 구현, DB 스키마 변경 불필요
- 단점: 동적 추가 어려움

Option B: DB 저장
- 장점: 유연성, 관리자 편집 가능
- 단점: 마이그레이션 필요, MVP에 과함

결정: Option A - 정적 템플릿 배열로 구현
```

### 모바일 드로어 구현
```
Option A: shadcn Sheet 컴포넌트 (선택)
- 장점: 일관된 디자인, 접근성 지원
- 단점: 추가 설치 필요

Option B: 커스텀 CSS 드로어
- 장점: 의존성 없음
- 단점: 접근성 직접 구현 필요

결정: Option A - Sheet 컴포넌트 추가 설치
```

---

## Phase 5.1: 온보딩 위저드 (2-3시간)

### 목표
신규 사용자가 첫 로그인 시 서비스 소개와 Meta 연동을 안내받음

### 생성 파일
- `src/presentation/stores/onboardingStore.ts`
- `src/presentation/components/onboarding/OnboardingWizard.tsx`
- `src/presentation/components/onboarding/steps/WelcomeStep.tsx`
- `src/presentation/components/onboarding/steps/MetaConnectStep.tsx`
- `src/presentation/components/onboarding/steps/CompletionStep.tsx`
- `tests/unit/presentation/stores/onboardingStore.test.ts`
- `tests/unit/presentation/components/onboarding/OnboardingWizard.test.tsx`

### TDD 워크플로우

#### 🔴 RED: 실패하는 테스트 작성

**onboardingStore.test.ts**:
```typescript
describe('onboardingStore', () => {
  it('should initialize with step 1 for new users')
  it('should advance to next step')
  it('should go back to previous step')
  it('should mark onboarding as complete')
  it('should persist completion status to localStorage')
  it('should skip onboarding if already completed')
})
```

**OnboardingWizard.test.tsx**:
```typescript
describe('OnboardingWizard', () => {
  it('should render welcome step initially')
  it('should navigate to next step on button click')
  it('should show progress indicator')
  it('should call onComplete when finished')
  it('should not render if onboarding completed')
})
```

#### 🟢 GREEN: 최소 구현

**onboardingStore.ts**:
```typescript
interface OnboardingState {
  currentStep: number
  isCompleted: boolean
  totalSteps: number
  nextStep: () => void
  prevStep: () => void
  completeOnboarding: () => void
  checkOnboardingStatus: () => boolean
}
```

**OnboardingWizard.tsx**:
- 3단계 위저드 (Welcome → Meta Connect → Complete)
- Dialog 기반 모달 UI
- 진행률 표시 바

#### 🔵 REFACTOR: 코드 정리
- 중복 로직 추출
- 타입 최적화
- 접근성 개선 (aria-labels)

### 완료 기준
- [ ] 테스트 먼저 작성 (TDD)
- [ ] 신규 사용자 첫 방문 시 온보딩 표시
- [ ] 3단계 스텝 정상 동작
- [ ] 완료 후 다시 표시되지 않음
- [ ] 커버리지 ≥85%

### 의존성
- 없음 (독립적 구현)

---

## Phase 5.2: 캠페인 템플릿 (2-3시간)

### 목표
사전 정의된 캠페인 설정으로 빠른 시작 지원

### 생성 파일
- `src/domain/value-objects/CampaignTemplate.ts`
- `src/presentation/components/campaign/TemplateSelector.tsx`
- `src/presentation/components/campaign/TemplateCard.tsx`
- `tests/unit/domain/value-objects/CampaignTemplate.test.ts`
- `tests/unit/presentation/components/campaign/TemplateSelector.test.tsx`

### 수정 파일
- `src/presentation/components/campaign/CampaignCreateForm/index.tsx` - 템플릿 적용 로직
- `src/app/(dashboard)/campaigns/new/page.tsx` - 템플릿 선택 UI 통합

### TDD 워크플로우

#### 🔴 RED: 실패하는 테스트 작성

**CampaignTemplate.test.ts**:
```typescript
describe('CampaignTemplate', () => {
  it('should create template with required fields')
  it('should have valid objective')
  it('should have reasonable budget range')
  it('should include target audience defaults')
})
```

**TemplateSelector.test.tsx**:
```typescript
describe('TemplateSelector', () => {
  it('should render all available templates')
  it('should call onSelect when template clicked')
  it('should highlight selected template')
  it('should show template details on hover')
})
```

#### 🟢 GREEN: 최소 구현

**템플릿 정의**:
```typescript
const CAMPAIGN_TEMPLATES = [
  {
    id: 'traffic',
    name: '트래픽 증대',
    description: '웹사이트 방문자 늘리기',
    icon: 'MousePointer',
    objective: 'TRAFFIC',
    dailyBudget: 30000,
    targetAudience: { ageMin: 25, ageMax: 45, gender: 'ALL' }
  },
  {
    id: 'conversions',
    name: '전환 극대화',
    description: '구매/신청 전환율 높이기',
    icon: 'ShoppingCart',
    objective: 'CONVERSIONS',
    dailyBudget: 50000,
    targetAudience: { ageMin: 25, ageMax: 55, gender: 'ALL' }
  },
  {
    id: 'brand',
    name: '브랜드 인지도',
    description: '브랜드 노출 확대',
    icon: 'Star',
    objective: 'BRAND_AWARENESS',
    dailyBudget: 20000,
    targetAudience: { ageMin: 18, ageMax: 65, gender: 'ALL' }
  }
]
```

#### 🔵 REFACTOR: 코드 정리
- 템플릿 타입 강화
- 컴포넌트 분리 최적화

### 완료 기준
- [ ] 테스트 먼저 작성 (TDD)
- [ ] 3개 이상 템플릿 제공
- [ ] 템플릿 선택 시 폼에 값 자동 채움
- [ ] 템플릿 없이 직접 입력도 가능
- [ ] 커버리지 ≥85%

### 의존성
- Phase 5.1 불필요 (독립적)

---

## Phase 5.3: 모바일 반응형 (2-3시간)

### 목표
모바일에서 사이드바 드로어, 대시보드 반응형 그리드 제공

### 설치 의존성
```bash
npx shadcn@latest add sheet
```

### 수정 파일
- `src/presentation/components/common/Layout/Sidebar.tsx` - 모바일 드로어
- `src/presentation/components/common/Layout/MainLayout.tsx` - 반응형 구조
- `src/presentation/components/common/Layout/Header.tsx` - 햄버거 메뉴
- `src/presentation/components/dashboard/KPICard.tsx` - 반응형 그리드
- `src/presentation/components/dashboard/CampaignSummaryTable.tsx` - 반응형 테이블

### 생성 파일
- `src/presentation/components/common/Layout/MobileDrawer.tsx`
- `tests/unit/presentation/components/common/Layout/MobileDrawer.test.tsx`

### TDD 워크플로우

#### 🔴 RED: 실패하는 테스트 작성

**MobileDrawer.test.tsx**:
```typescript
describe('MobileDrawer', () => {
  it('should open when menu button clicked')
  it('should close when overlay clicked')
  it('should close when navigation item clicked')
  it('should show current page as active')
  it('should be accessible (aria-labels)')
})
```

#### 🟢 GREEN: 최소 구현

**반응형 브레이크포인트**:
```
- mobile: < 768px (md)
- tablet: 768px - 1024px (lg)
- desktop: > 1024px
```

**MainLayout 변경**:
```tsx
// 데스크톱: 고정 사이드바
// 모바일: 숨김 + 햄버거 메뉴로 드로어 열기
<div className="flex h-screen">
  {/* Desktop sidebar */}
  <aside className="hidden md:flex w-64 ...">
    <Sidebar />
  </aside>

  {/* Mobile drawer */}
  <MobileDrawer />

  <main className="flex-1 ...">
    {children}
  </main>
</div>
```

**Header 변경**:
```tsx
// 모바일에서 햄버거 버튼 표시
<button className="md:hidden" onClick={toggleMobileMenu}>
  <Menu className="h-6 w-6" />
</button>
```

#### 🔵 REFACTOR: 코드 정리
- 중복 네비게이션 로직 추출
- 반응형 유틸리티 클래스 정리

### 완료 기준
- [ ] 테스트 먼저 작성 (TDD)
- [ ] 768px 미만에서 사이드바 숨김
- [ ] 햄버거 메뉴로 드로어 열기/닫기
- [ ] 대시보드 카드 모바일 스택
- [ ] 터치 스와이프로 드로어 닫기 (선택)
- [ ] 커버리지 ≥85%

### 의존성
- shadcn sheet 컴포넌트 설치 필요

---

## Quality Gate 체크리스트

각 Phase 완료 후 확인:

### Build & Compilation
- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 에러 없음
- [ ] `npm run build` 성공

### Testing
- [ ] `npm test` 전체 통과
- [ ] 새 테스트 추가됨
- [ ] 커버리지 ≥85%

### Functionality
- [ ] 수동 테스트 완료
- [ ] 기존 기능 회귀 없음
- [ ] 다양한 화면 크기에서 확인

### Code Quality
- [ ] TDD 프로세스 준수
- [ ] 기존 패턴과 일관성 유지
- [ ] 접근성 (a11y) 기본 충족

---

## 리스크 평가

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|----------|
| Sheet 컴포넌트 스타일 충돌 | 낮음 | 낮음 | 기존 테마 검토 후 설치 |
| 온보딩 상태 동기화 이슈 | 중간 | 낮음 | localStorage와 store 동기화 로직 테스트 |
| 반응형 레이아웃 깨짐 | 중간 | 중간 | 다양한 디바이스에서 수동 테스트 |
| 기존 테스트 깨짐 | 낮음 | 중간 | 변경 전 테스트 실행 확인 |

---

## 롤백 전략

### Phase 5.1 (온보딩)
- 독립 컴포넌트이므로 파일 삭제로 롤백
- localStorage 키 정리 필요

### Phase 5.2 (템플릿)
- TemplateSelector 제거 후 기존 캠페인 생성 유지
- CampaignCreateForm 수정 사항 revert

### Phase 5.3 (모바일)
- MobileDrawer 제거
- Sidebar/MainLayout을 git revert
- sheet 컴포넌트는 유지해도 무방

---

## 진행 상황

| Phase | 상태 | 시작일 | 완료일 | 비고 |
|-------|------|--------|--------|------|
| 5.1 온보딩 위저드 | ⬜ 대기 | - | - | |
| 5.2 캠페인 템플릿 | ⬜ 대기 | - | - | |
| 5.3 모바일 반응형 | ⬜ 대기 | - | - | |

**Last Updated**: 2026-01-07

---

## Notes & Learnings

_이 섹션은 구현 과정에서 발견한 내용을 기록합니다_
