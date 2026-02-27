# Implementation Plan: 광고 진단 계정 선택 기능

**Status**: ⏳ Pending
**Started**: 2026-02-27
**Last Updated**: 2026-02-27
**Estimated Completion**: 2026-02-27

---

**CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 Overview

### Feature Description
무료 광고 진단 기능에서 OAuth 콜백 후 사용자가 **광고 계정을 직접 선택**할 수 있도록 개선한다.
현재는 첫 번째 계정이 자동 선택되어 비활성 계정까지 통합 진단되는 문제가 있다.

### 현재 플로우 (AS-IS)
```
Meta OAuth 로그인 → 콜백에서 accounts[0] 자동 선택 → 즉시 분석 실행
```

### 개선 플로우 (TO-BE)
```
Meta OAuth 로그인 → 콜백에서 계정 목록 확인
  ├─ 활성 계정 1개: 자동 선택 → 즉시 분석
  └─ 활성 계정 2개+: 계정 선택 UI 표시 → 사용자 선택 → 분석 실행
```

### Success Criteria
- [ ] 다중 계정 사용자에게 계정 선택 UI가 표시된다
- [ ] 계정별 활성/비활성 상태가 시각적으로 구분된다
- [ ] 활성 계정이 1개일 때는 기존처럼 자동 진단된다
- [ ] 비활성 계정도 선택 가능하나 경고가 표시된다
- [ ] 기존 단일 계정 사용자 플로우가 깨지지 않는다
- [ ] 15분 세션 TTL 내에서 계정 변경 후 재진단 불가 (1회성 유지)

### User Impact
- 운영 중인 계정만 골라서 진단 → 정확한 진단 결과
- 계정 상태(활성/비활성)를 한눈에 파악
- 여러 계정 중 원하는 계정을 직접 선택하는 제어감

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| `account_status`를 캐시에 저장 | Meta API에서 이미 조회하지만 저장하지 않던 데이터 활용 | 캐시 메모리 미미하게 증가 (~수 바이트/계정) |
| 계정 목록 전용 API 추가 (`/api/audit/accounts`) | 콜백 페이지에서 세션의 계정 목록만 조회. analyze API와 분리 | API 엔드포인트 1개 추가 |
| 콜백 라우트에서 `adAccountId` 제거 | 자동 선택 대신 프론트에서 선택 위임 | 기존 단일 계정도 프론트 로직 거침 (자동 선택으로 UX 동일) |
| 1회용 토큰 정책 유지 | 보안: analyze 후 세션 삭제. 계정 선택 중에는 삭제 안 함 | 계정 선택 화면에서 15분 경과 시 세션 만료 |

---

## 📦 Dependencies

### Required Before Starting
- [x] 기존 audit 기능 정상 동작 확인
- [x] `auditTokenCache` 구조 파악 완료
- [x] Meta API `account_status` 필드 매핑 확인

### External Dependencies
- 없음 (기존 의존성만 사용)

### Meta `account_status` 값 매핑
| 값 | 의미 | UI 표시 |
|----|------|---------|
| 1 | ACTIVE | 🟢 운영 중 |
| 2 | DISABLED | 🔴 비활성 |
| 3 | UNSETTLED | 🟡 미결제 |
| 7 | PENDING_RISK_REVIEW | 🟡 검토 중 |
| 8 | PENDING_SETTLEMENT | 🟡 정산 대기 |
| 9 | IN_GRACE_PERIOD | 🟡 유예 기간 |
| 100 | PENDING_CLOSURE | 🔴 폐쇄 예정 |
| 101 | CLOSED | 🔴 폐쇄됨 |
| 201 | ANY_ACTIVE | 🟢 활성 |
| 202 | ANY_CLOSED | 🔴 폐쇄 |

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥80% | 캐시 타입 확장, 계정 상태 헬퍼 함수 |
| **Integration Tests** | Critical paths | API 라우트 요청/응답, 콜백 리다이렉트 |
| **E2E Tests** | 1 critical path | 계정 선택 → 진단 실행 플로우 (수동) |

### Test File Organization
```
tests/
├── unit/
│   └── lib/cache/
│       └── auditTokenCache.test.ts        (확장)
├── integration/
│   └── audit/
│       ├── accounts-api.test.ts            (신규)
│       └── callback-redirect.test.ts       (확장)
```

---

## 🚀 Implementation Phases

### Phase 1: 캐시 타입 확장 + 계정 목록 API
**Goal**: `account_status`를 캐시에 저장하고, 프론트에서 계정 목록을 조회할 수 있는 API 제공
**Estimated Time**: 1.5 시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 1.1**: `auditTokenCache` 타입 확장 테스트
  - File: `tests/unit/lib/cache/auditTokenCache.test.ts`
  - Expected: `account_status` 필드가 없어 타입 에러 또는 검증 실패
  - Test cases:
    - `set()` 시 `accountStatus` 포함 저장 확인
    - `get()` 시 `accountStatus` 포함 반환 확인
    - 기존 `adAccountId`, `adAccounts` 필드 호환성 유지

- [ ] **Test 1.2**: `GET /api/audit/accounts` API 테스트
  - File: `tests/integration/audit/accounts-api.test.ts`
  - Expected: API가 존재하지 않아 404
  - Test cases:
    - 유효한 sessionId → 200 + 계정 목록 반환
    - 존재하지 않는 sessionId → 404
    - sessionId 미전달 → 400
    - 만료된 세션 → 404
    - 응답에 `accountStatus` 포함 확인

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 1.3**: `AuditSession` 타입에 `accountStatus` 추가
  - File: `src/lib/cache/auditTokenCache.ts`
  - 변경:
    ```typescript
    adAccounts: {
      id: string
      name: string
      currency: string
      accountStatus: number  // 추가
    }[]
    ```

- [ ] **Task 1.4**: 콜백 라우트에서 `account_status` 저장
  - File: `src/app/api/audit/callback/route.ts`
  - 변경: `accounts.map()` 시 `accountStatus: a.account_status` 포함
  - 리다이렉트 URL에서 `adAccountId` 제거 → `/audit/callback?session=<id>`만 전달

- [ ] **Task 1.5**: `GET /api/audit/accounts` 라우트 생성
  - File: `src/app/api/audit/accounts/route.ts` (신규)
  - 로직:
    1. `searchParams.get('session')` 검증
    2. `auditTokenCache.get(sessionId)` 조회
    3. `adAccounts` 배열 반환 (accessToken 제외 — 보안)
  - Rate Limit: `audit` 타입 적용

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 1.6**: 리팩토링
  - [ ] `accountStatus` 관련 헬퍼 함수 추출 (상태 라벨, 색상 매핑)
  - [ ] API 응답 타입 정의 (공유 가능한 DTO)

#### Quality Gate ✋

**TDD Compliance**:
- [ ] Red Phase 완료: 테스트 먼저 작성 후 실패 확인
- [ ] Green Phase 완료: 구현 후 테스트 통과
- [ ] Refactor Phase 완료: 테스트 유지하며 정리

**Validation Commands**:
```bash
npx tsc --noEmit
npx vitest run tests/unit/lib/cache/auditTokenCache.test.ts
npx vitest run tests/integration/audit/accounts-api.test.ts
npx vitest run  # 전체 테스트 회귀 확인
```

**Manual Test Checklist**:
- [ ] `GET /api/audit/accounts?session=<validId>` → 200 + 계정 목록
- [ ] `GET /api/audit/accounts?session=invalidId` → 404
- [ ] 콜백 후 리다이렉트 URL에 `adAccountId`가 없음 확인

---

### Phase 2: 계정 선택 UI 컴포넌트
**Goal**: 콜백 페이지에 계정 선택 카드 UI를 추가하여 사용자가 진단할 계정을 선택할 수 있게 함
**Estimated Time**: 2 시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 2.1**: `AccountSelector` 컴포넌트 단위 테스트
  - File: `tests/unit/presentation/components/audit/AccountSelector.test.tsx`
  - Expected: 컴포넌트가 존재하지 않아 import 실패
  - Test cases:
    - 계정 목록 렌더링 (활성/비활성 구분)
    - 활성 계정 클릭 시 `onSelect` 콜백 호출
    - 비활성 계정 클릭 시 경고 표시 후 `onSelect` 호출
    - 로딩 상태 표시
    - 빈 목록 시 안내 메시지
    - 접근성: role, aria-label 확인

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 2.2**: `AccountSelector` 컴포넌트 구현
  - File: `src/presentation/components/audit/AccountSelector.tsx` (신규)
  - Props:
    ```typescript
    interface AccountSelectorProps {
      accounts: { id: string; name: string; currency: string; accountStatus: number }[]
      onSelect: (adAccountId: string) => void
      loading?: boolean
    }
    ```
  - UI 구성:
    - 헤더: "진단할 광고 계정을 선택하세요"
    - 카드 리스트: 계정명, 상태 뱃지(🟢/🟡/🔴), 통화
    - 활성 계정 우선 정렬 (status=1 상단)
    - 비활성 계정 선택 시 확인 다이얼로그
    - 로딩 시 스켈레톤 표시

- [ ] **Task 2.3**: 계정 상태 헬퍼 유틸리티
  - File: `src/presentation/utils/accountStatus.ts` (신규)
  - 함수:
    - `getStatusLabel(status: number): string` — "운영 중", "비활성" 등
    - `getStatusColor(status: number): string` — Tailwind 색상 클래스
    - `isActiveAccount(status: number): boolean`
    - `sortByStatus(accounts): accounts` — 활성 우선 정렬

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 2.4**: 리팩토링
  - [ ] 컴포넌트 접근성 검증 (role="radiogroup", aria-checked)
  - [ ] 반응형 레이아웃 확인 (모바일/태블릿/데스크톱)
  - [ ] 다크모드 대응

#### Quality Gate ✋

**Validation Commands**:
```bash
npx tsc --noEmit
npx vitest run tests/unit/presentation/components/audit/AccountSelector.test.tsx
npx vitest run  # 전체 테스트 회귀 확인
```

**Manual Test Checklist**:
- [ ] 계정 카드에 상태 뱃지가 올바르게 표시됨
- [ ] 활성 계정이 상단에 정렬됨
- [ ] 비활성 계정 선택 시 경고 메시지 표시
- [ ] 모바일 뷰에서 카드 레이아웃 정상
- [ ] 키보드 탐색 가능 (Tab, Enter)

---

### Phase 3: 콜백 페이지 플로우 통합
**Goal**: 콜백 페이지에서 계정 선택 → 분석 실행 플로우를 완성하고 기존 테스트 호환성 유지
**Estimated Time**: 1.5 시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 3.1**: 콜백 페이지 통합 플로우 테스트
  - File: `tests/integration/audit/callback-flow.test.ts`
  - Expected: 계정 선택 로직이 없어 실패
  - Test cases:
    - 세션 있음 + 다중 계정 → AccountSelector 렌더링
    - 세션 있음 + 활성 계정 1개 → 자동 분석 실행
    - 세션 있음 + 활성 계정 0개 (모두 비활성) → 전체 목록 표시 + 안내
    - 계정 선택 후 → analyze API 호출 확인
    - 세션 만료 → 에러 표시
    - 에러 파라미터 → 에러 UI 표시 (기존 동작 유지)

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 3.2**: 콜백 페이지 수정
  - File: `src/app/audit/callback/page.tsx`
  - 변경 사항:
    1. `adAccountId`가 URL에 없으면 → `GET /api/audit/accounts` 호출
    2. 활성 계정 1개 → 자동 선택 후 `analyze()` 실행
    3. 활성 계정 2개+ → `AccountSelector` 렌더링
    4. 사용자 선택 후 → `analyze()` 실행
  - 상태 관리:
    ```typescript
    const [phase, setPhase] = useState<'loading' | 'select' | 'analyzing' | 'result' | 'error'>('loading')
    const [accounts, setAccounts] = useState<AdAccount[]>([])
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
    ```

- [ ] **Task 3.3**: 기존 테스트 호환성 수정
  - File: 기존 audit 관련 테스트 파일들
  - `adAccountId` 쿼리 파라미터 의존 제거
  - 새로운 플로우에 맞게 mock 업데이트

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 3.4**: 리팩토링
  - [ ] 콜백 페이지 컴포넌트 분리 (phase별 서브 컴포넌트)
  - [ ] 에러 처리 통합 (세션 만료, API 오류, 네트워크 오류)
  - [ ] 로딩 상태 전환 애니메이션

#### Quality Gate ✋

**Validation Commands**:
```bash
npx tsc --noEmit
npx vitest run tests/integration/audit/
npx vitest run  # 전체 테스트 (2,662개) 회귀 확인
npx next build  # 빌드 성공 확인
```

**Manual Test Checklist (End-to-End)**:
- [ ] 랜딩 → 무료 진단 클릭 → Meta 로그인 → 계정 선택 UI 표시
- [ ] 활성 계정 선택 → 분석 → 결과 표시
- [ ] 비활성 계정 선택 → 경고 → 확인 → 분석
- [ ] 단일 활성 계정 → 자동 분석 (기존 UX 유지)
- [ ] 15분 경과 후 접근 → 세션 만료 에러
- [ ] 공유/PDF 기능 정상 동작 (회귀 없음)

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Meta API `account_status` 필드 누락 | Low | Medium | 기본값 1(ACTIVE) 처리, 상태 없으면 "알 수 없음" 표시 |
| 세션 만료 중 계정 선택 시도 | Medium | Low | 계정 목록 API에서 만료 체크, 프론트에서 재인증 유도 |
| 기존 단일 계정 플로우 회귀 | Low | High | 활성 계정 1개일 때 자동 선택 로직 + 기존 테스트 유지 |
| `adAccountId` URL 파라미터 제거로 인한 호환성 | Medium | Medium | 하위 호환: URL에 `adAccountId`있으면 기존 동작 유지 |

---

## 🔄 Rollback Strategy

### If Phase 1 Fails
- `auditTokenCache.ts` 원복 (타입 변경 되돌리기)
- `/api/audit/accounts/` 디렉토리 삭제
- 콜백 라우트 원복 (`adAccountId` 포함 리다이렉트)

### If Phase 2 Fails
- `AccountSelector.tsx` 삭제
- `accountStatus.ts` 삭제
- Phase 1 결과는 유지 (하위 호환)

### If Phase 3 Fails
- `callback/page.tsx` 원복 (git stash/checkout)
- Phase 1-2 결과는 유지 (사용 안 될 뿐 깨지지 않음)

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ⏳ 0%
- **Phase 2**: ⏳ 0%
- **Phase 3**: ⏳ 0%

**Overall Progress**: 0% complete

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1: 캐시 + API | 1.5h | - | - |
| Phase 2: 선택 UI | 2h | - | - |
| Phase 3: 플로우 통합 | 1.5h | - | - |
| **Total** | **5h** | - | - |

---

## 📦 수정 대상 파일 요약

| Phase | File | Action | Layer |
|-------|------|--------|-------|
| 1 | `src/lib/cache/auditTokenCache.ts` | 수정 | Infrastructure |
| 1 | `src/app/api/audit/callback/route.ts` | 수정 | API |
| 1 | `src/app/api/audit/accounts/route.ts` | **신규** | API |
| 1 | `tests/unit/lib/cache/auditTokenCache.test.ts` | 확장 | Test |
| 1 | `tests/integration/audit/accounts-api.test.ts` | **신규** | Test |
| 2 | `src/presentation/components/audit/AccountSelector.tsx` | **신규** | Presentation |
| 2 | `src/presentation/utils/accountStatus.ts` | **신규** | Presentation |
| 2 | `tests/unit/presentation/components/audit/AccountSelector.test.tsx` | **신규** | Test |
| 3 | `src/app/audit/callback/page.tsx` | 수정 | Page |
| 3 | `tests/integration/audit/callback-flow.test.ts` | **신규** | Test |

---

## 📝 Notes & Learnings

### Implementation Notes
- (구현 중 기록 예정)

### Blockers Encountered
- (발생 시 기록 예정)

---

## 📚 References

### 관련 파일
- 진단 기능 전체 플로우: 이 문서의 Overview 참조
- Meta API 문서: [Ad Account Fields](https://developers.facebook.com/docs/marketing-api/reference/ad-account/)

### 관련 기능
- `FreeAuditButton.tsx` — 진단 시작 버튼 (이번 세션에서 UI 개선 완료)
- `AuditReportCard.tsx` — 진단 결과 표시 (변경 없음)

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] 모든 phase 완료 + quality gate 통과
- [ ] 전체 통합 테스트 수행 (`npx vitest run` — 2,662+ 테스트)
- [ ] 타입 체크 통과 (`npx tsc --noEmit`)
- [ ] 빌드 성공 (`npx next build`)
- [ ] 수동 E2E 테스트 완료 (다중 계정 시나리오)
- [ ] 기존 단일 계정 플로우 회귀 없음
- [ ] 보안 검토: accessToken이 프론트에 노출되지 않음 확인

---

**Plan Status**: ⏳ Pending Approval
**Next Action**: 사용자 승인 후 Phase 1 시작
**Blocked By**: None
