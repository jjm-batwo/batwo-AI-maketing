# Implementation Plan: 무료검사(Free Audit) 기능 종합 개선

**Status**: ⏳ Pending
**Started**: 2026-02-27
**Last Updated**: 2026-02-27
**Estimated Completion**: 2026-03-05
**Scope**: Large (6 Phases, ~20-24 hours)
**Origin**: CCG Tri-Model Analysis (Codex: 코드/보안, Gemini: UI/UX, Claude: 종합)

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each phase:
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
무료검사(Free Audit) 기능의 CCG 심층 분석에서 도출된 19건의 개선사항을 6개 Phase로 나누어 체계적으로 구현한다.
- **CRITICAL 3건**: 서버리스 캐시 비호환, Race Condition, 보고서 위조
- **HIGH 4건**: N+1 성능, 에러 피드백, alert() UX, 진행률 미표시
- **MEDIUM 5건**: 포커스 트랩, Rate Limit 설계, 메모리 누수, 전환추적 오탐, currency 하드코딩
- **LOW 5건**: 공유CTA, PDF파일명, 세션만료경고, 빈카테고리, aria-checked
- **HARDENING 2건**: Integration 품질게이트 명령 통일, HMAC 시크릿 Prod 강제 정책

### Success Criteria
- [ ] 서버리스 환경(Vercel)에서 인스턴스 간 세션 공유 정상 동작
- [ ] 보고서 위조 불가 (HMAC 서명 검증)
- [ ] 100개 캠페인 분석 시 응답 시간 50% 이상 단축 (20초→10초 이내)
- [ ] alert() 제거 → Toast 컴포넌트 100% 교체
- [ ] 모든 기존 테스트 통과 + 새 테스트 20건 이상 추가
- [ ] `npx tsc --noEmit` + `npx vitest run` + `npx next build` 모두 통과
- [ ] Integration 테스트가 올바른 config(`vitest.config.integration.ts`)로 실행됨
- [ ] HMAC 시크릿이 production에서 필수 강제됨 (fallback 불가)

### User Impact
- **전환율 향상**: 에러 피드백 개선으로 이탈률 감소
- **신뢰성**: 서버리스 환경에서 세션 유실 버그 제거
- **보안**: 위조 보고서 생성 차단
- **성능**: 분석 대기 시간 50% 단축 + 진행률 표시로 체감 시간 감소

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| 인메모리 Map → Upstash Redis | Vercel 서버리스에서 인스턴스 간 캐시 공유 필수 | 외부 의존성 추가, 비용 발생 (무료 티어 10,000 req/day) |
| HMAC 서명으로 보고서 무결성 검증 | 서버측 결과 캐시보다 구현 단순, 상태 비저장 | 서명 키 관리 필요 (환경변수) |
| Promise.allSettled + 배치 5개 | Meta API Rate Limit(200/hour) 존중하면서 병렬화 | 배치 크기 튜닝 필요 |
| shadcn/ui Toast 도입 | 기존 UI 시스템과 일관성 유지 | 추가 컴포넌트 번들 크기 (미미) |

---

## 📦 Dependencies

### Required Before Starting
- [ ] Upstash Redis 계정 생성 및 REST URL/TOKEN 확보
- [ ] `AUDIT_HMAC_SECRET` 환경변수 값 생성 (32바이트 hex)

### External Dependencies
- `@upstash/redis`: ^1.x (Vercel 서버리스 호환 Redis 클라이언트)
- shadcn/ui `toast` 컴포넌트 (이미 설치된 shadcn/ui 기반)

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥90% | 캐시 어댑터, HMAC 서명, 배치 유틸 |
| **Integration Tests** | Critical paths | API 라우트 전체 플로우, 캐시 연동 |
| **E2E Tests** | Key flows | OAuth → 계정선택 → 분석 → 결과 → 공유/PDF |

### Test File Organization
```
tests/
├── unit/
│   ├── infrastructure/cache/
│   │   └── upstashAuditCache.test.ts     (Phase 1)
│   ├── lib/
│   │   ├── auditHmac.test.ts             (Phase 1)
│   │   └── batchPromise.test.ts          (Phase 2)
│   └── presentation/components/audit/
│       └── AccountSelector.test.tsx       (Phase 3 추가)
├── integration/
│   ├── audit/
│   │   ├── analyze-race-condition.test.ts (Phase 1)
│   │   ├── pdf-hmac-verify.test.ts        (Phase 1)
│   │   └── rate-limit-flow.test.ts        (Phase 4)
│   └── free-audit-flow.test.ts            (기존 — 업데이트)
└── e2e/
    └── audit-flow.spec.ts                 (Phase 5 업데이트)
```

---

## 🚀 Implementation Phases

---

### Phase 1: 핵심 보안 및 인프라 (CRITICAL 3건)
**Goal**: 서버리스 캐시, Race Condition, 보고서 위조 방어 — 배포 전 필수 해결
**Estimated Time**: 5-6 hours
**Status**: ⏳ Pending
**Severity**: CRITICAL

#### 개선 항목
| # | 항목 | 심각도 |
|---|------|--------|
| 1 | 인메모리 캐시 → Upstash Redis 전환 | CRITICAL |
| 2 | Race Condition — atomic getAndDelete | CRITICAL |
| 3 | PDF/Share API — HMAC 서명 검증 | CRITICAL |

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 1.1**: Upstash 캐시 어댑터 단위 테스트
  - File: `tests/unit/infrastructure/cache/upstashAuditCache.test.ts`
  - Expected: Tests FAIL — 어댑터 미구현
  - Test cases:
    - `set()` → UUID 반환, TTL 설정
    - `get()` → 존재하는 세션 조회
    - `get()` → 만료 세션 null 반환
    - `getAndDelete()` → 조회 후 즉시 삭제 (atomic)
    - `delete()` → 세션 삭제
    - MAX_ENTRIES 초과 시 가장 오래된 항목 eviction
  - Mock: `@upstash/redis` 클라이언트 mock

- [ ] **Test 1.2**: HMAC 서명 유틸 단위 테스트
  - File: `tests/unit/lib/auditHmac.test.ts`
  - Expected: Tests FAIL — HMAC 유틸 미구현
  - Test cases:
    - `signReport(report)` → base64 HMAC 문자열 반환
    - `verifyReport(report, signature)` → true/false
    - 변조된 report → 검증 실패
    - 빈 report → 적절한 에러 처리

- [ ] **Test 1.3**: Race Condition 통합 테스트
  - File: `tests/integration/audit/analyze-race-condition.test.ts`
  - Expected: Tests FAIL — getAndDelete 미구현
  - Test cases:
    - 동일 sessionId로 동시 2회 POST → 1회만 성공, 1회는 403
    - 사용된 세션 재사용 불가

- [ ] **Test 1.4**: PDF/Share HMAC 검증 통합 테스트
  - File: `tests/integration/audit/pdf-hmac-verify.test.ts`
  - Expected: Tests FAIL — HMAC 미적용
  - Test cases:
    - 유효 서명 → 200 OK
    - 무효/누락 서명 → 403 Forbidden
    - 변조된 report + 원본 서명 → 403

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 1.5**: Upstash Redis 캐시 어댑터 구현
  - File: `src/infrastructure/cache/UpstashAuditCache.ts`
  - Goal: 기존 `auditTokenCache`, `auditStateCache`, `auditShareCache`를 공통 인터페이스로 대체
  - Details:
    - `ICache<T>` 포트 인터페이스 정의 (`src/application/ports/ICache.ts`)
    - Upstash Redis 어댑터 구현 (TTL, getAndDelete, cleanup)
    - 개발환경 폴백: `META_MOCK_MODE=true`일 때 기존 인메모리 사용

- [ ] **Task 1.6**: 기존 캐시 → Upstash 어댑터로 교체
  - Files: `src/lib/cache/auditTokenCache.ts`, `auditStateCache.ts`, `auditShareCache.ts`
  - Goal: 기존 Map 기반 → Upstash 어댑터로 교체 (인터페이스 동일 유지)
  - Details:
    - 기존 파일은 어댑터 팩토리 패턴으로 리팩토링
    - 환경변수 `UPSTASH_REDIS_REST_URL` 존재 시 Upstash, 없으면 인메모리
    - 기존 API 라우트 코드 변경 최소화

- [ ] **Task 1.7**: HMAC 서명 유틸 구현
  - File: `src/lib/security/auditHmac.ts`
  - Goal: Test 1.2 통과
  - Details:
    - `crypto.createHmac('sha256', secret)` 기반
    - `signReport(report: AuditReportDTO): string`
    - `verifyReport(report: AuditReportDTO, signature: string): boolean`
    - 환경변수: `AUDIT_HMAC_SECRET`

- [ ] **Task 1.8**: analyze API에 HMAC 서명 첨부
  - File: `src/app/api/audit/analyze/route.ts`
  - Goal: 분석 결과에 `signature` 필드 추가
  - Details:
    - `getAndDelete()` 패턴 적용 (Race Condition 방어)
    - 응답에 `{ ...report, signature }` 포함

- [ ] **Task 1.9**: PDF/Share API에 HMAC 검증 추가
  - Files: `src/app/api/audit/pdf/route.ts`, `src/app/api/audit/share/route.ts`
  - Goal: Test 1.4 통과
  - Details:
    - 요청에서 `signature` 추출 → `verifyReport()` 호출
    - 검증 실패 시 403 반환

- [ ] **Task 1.10**: 클라이언트에서 signature 전달
  - File: `src/app/audit/callback/page.tsx`
  - Goal: analyze 응답의 signature를 PDF/Share 요청에 포함
  - Details: state에 signature 저장 후 handleShare/handleDownloadPDF에서 body에 포함

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 1.11**: 캐시 계층 리팩토링
  - Files: 모든 캐시 관련 파일
  - Checklist:
    - [ ] 중복 제거 (3개 캐시의 공통 로직 추출)
    - [ ] 팩토리 패턴으로 캐시 생성 통일
    - [ ] 기존 통합 테스트 업데이트 (`free-audit-flow.test.ts`)
    - [ ] JSDoc 주석 추가

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 2 until ALL checks pass**

**TDD Compliance**:
- [ ] Tests written FIRST and initially failed
- [ ] Production code written to make tests pass
- [ ] Code improved while tests still pass

**Validation Commands**:
```bash
npx tsc --noEmit
npx vitest run tests/unit/infrastructure/cache/
npx vitest run tests/unit/lib/auditHmac.test.ts
npx vitest run --config vitest.config.integration.ts tests/integration/audit/
npx vitest run --config vitest.config.integration.ts tests/integration/free-audit-flow.test.ts
npx vitest run  # 전체 테스트
npx next build
```

**Manual Test Checklist**:
- [ ] OAuth → callback → analyze → 결과 페이지 정상 동작
- [ ] 동일 세션 이중 클릭 → 1회만 성공 확인
- [ ] 조작된 report로 PDF 생성 시도 → 403 확인
- [ ] Upstash 대시보드에서 키 생성/삭제 확인

---

### Phase 2: 성능 최적화 (HIGH 1건 + MEDIUM 1건)
**Goal**: N+1 문제 해결 + currency 하드코딩 수정 — 분석 응답 시간 50% 단축
**Estimated Time**: 3-4 hours
**Status**: ⏳ Pending
**Severity**: HIGH
**Dependencies**: Phase 1 완료

#### 개선 항목
| # | 항목 | 심각도 |
|---|------|--------|
| 4 | N+1 캠페인 인사이트 순차 호출 → 병렬 배치 | HIGH |
| 12 | currency: 'KRW' 하드코딩 → 실제 계정 currency 사용 | MEDIUM |

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 2.1**: 배치 유틸 단위 테스트
  - File: `tests/unit/lib/batchPromise.test.ts`
  - Test cases:
    - `batchSettled(items, fn, batchSize=5)` → 결과 배열 반환
    - 일부 실패 시 fulfilled/rejected 구분
    - 빈 배열 → 빈 결과
    - batchSize=1 → 순차 실행과 동일 결과

- [ ] **Test 2.2**: AuditAdAccountUseCase 병렬 실행 테스트
  - File: `tests/unit/application/audit/AuditAdAccountUseCase.test.ts` (기존 파일 확장)
  - Test cases:
    - 20개 캠페인 → 4배치(5개씩) 병렬 호출 확인
    - 일부 인사이트 실패 → 성공한 것만 포함
    - currency가 계정의 실제 currency 반영 확인

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 2.3**: 배치 유틸 구현
  - File: `src/lib/utils/batchSettled.ts`
  - Details:
    ```typescript
    async function batchSettled<T, R>(
      items: T[],
      fn: (item: T) => Promise<R>,
      batchSize: number = 5
    ): Promise<PromiseSettledResult<R>[]>
    ```

- [ ] **Task 2.4**: UseCase에 배치 적용 + currency 수정
  - File: `src/application/use-cases/audit/AuditAdAccountUseCase.ts`
  - Details:
    - `for` 루프 → `batchSettled(campaigns, getCampaignInsights, 5)` 교체
    - `currency: 'KRW'` → callback에서 전달받은 `account.currency` 사용
    - `AuditRequestDTO`에 `currency` 필드 추가

- [ ] **Task 2.5**: DTO 및 API 라우트 currency 전달
  - Files: `src/application/dto/audit/AuditDTO.ts`, `src/app/api/audit/analyze/route.ts`
  - Details: analyze 요청에 currency 포함, UseCase에 전달

**🔵 REFACTOR**

- [ ] **Task 2.6**: 코드 정리
  - [ ] batchSettled 제네릭 타입 최적화
  - [ ] 기존 UseCase 테스트 업데이트

#### Quality Gate ✋

**Validation Commands**:
```bash
npx tsc --noEmit
npx vitest run tests/unit/lib/batchPromise.test.ts
npx vitest run tests/unit/application/audit/
npx vitest run
npx next build
```

**Manual Test Checklist**:
- [ ] 캠페인 10개+ 계정 분석 시 응답 시간 측정 (기존 대비 개선 확인)
- [ ] USD 계정 분석 시 currency 정확히 표시되는지 확인

---

### Phase 3: UX 피드백 개선 (HIGH 3건 + MEDIUM 1건)
**Goal**: alert() 제거, 에러 피드백 추가, 진행률 표시, 포커스 트랩 — 사용자 경험 대폭 개선
**Estimated Time**: 4-5 hours
**Status**: ⏳ Pending
**Severity**: HIGH
**Dependencies**: Phase 1 완료 (signature state 연동)

#### 개선 항목
| # | 항목 | 심각도 |
|---|------|--------|
| 5 | FreeAuditButton 에러 시 피드백 없음 | HIGH |
| 6 | alert() → Toast 교체 (3곳) | HIGH |
| 7 | 분석 중 진행률 표시 없음 | HIGH |
| 8 | AccountSelector 확인 다이얼로그 포커스 트랩/ESC 미구현 | MEDIUM |

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 3.1**: FreeAuditButton 에러 피드백 테스트
  - File: `tests/unit/presentation/components/landing/FreeAuditButton.test.tsx`
  - Test cases:
    - fetch 실패 → 에러 메시지 렌더링 확인
    - 에러 후 재시도 가능 확인
    - 로딩 중 버튼 비활성화 확인

- [ ] **Test 3.2**: Toast 통합 (alert 제거 확인)
  - File: `tests/unit/presentation/components/audit/CallbackPage.test.tsx`
  - Test cases:
    - 공유 성공 → toast 호출 확인 (alert 아님)
    - 공유 실패 → toast error 확인
    - PDF 실패 → toast error 확인
    - `window.alert` 호출 0회 확인

- [ ] **Test 3.3**: AccountSelector 포커스 트랩 테스트
  - File: `tests/unit/presentation/components/audit/AccountSelector.test.tsx` (기존 확장)
  - Test cases:
    - 다이얼로그 열림 → 첫 번째 버튼에 포커스 이동
    - Tab → 다이얼로그 내부에서만 순환
    - ESC → 다이얼로그 닫힘
    - 배경 클릭 → 다이얼로그 닫힘

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 3.4**: Toast 컴포넌트 설정
  - Details: `npx shadcn@latest add toast` (이미 shadcn/ui 사용 중)
  - File: 레이아웃에 `<Toaster />` 추가

- [ ] **Task 3.5**: FreeAuditButton 에러 피드백 추가
  - File: `src/presentation/components/landing/HeroSection/FreeAuditButton.tsx`
  - Details:
    - catch 블록에 에러 state 추가
    - 인라인 에러 메시지 또는 toast 표시
    - 503(Meta 앱 미설정) 전용 메시지

- [ ] **Task 3.6**: callback page alert() → toast 교체
  - File: `src/app/audit/callback/page.tsx`
  - Details:
    - `handleShare`: `alert('복사됨')` → `toast({ title: '공유 링크가 복사되었습니다' })`
    - `handleShare` catch: `alert('실패')` → `toast({ variant: 'destructive', ... })`
    - `handleDownloadPDF` catch: `alert('실패')` → `toast({ variant: 'destructive', ... })`

- [ ] **Task 3.7**: 분석 진행률 표시 추가
  - File: `src/app/audit/callback/page.tsx`
  - Details:
    - LoadingSpinner에 예상 소요시간 안내 추가
    - "광고 데이터를 분석하고 있습니다... (약 30초~1분 소요)"
    - 선택사항: analyze API를 SSE로 변경하여 실시간 진행률 (복잡도 高 → Phase 5로 이관 가능)

- [ ] **Task 3.8**: AccountSelector 포커스 트랩 + ESC
  - File: `src/presentation/components/audit/AccountSelector.tsx`
  - Details:
    - shadcn/ui `AlertDialog` 또는 커스텀 포커스 트랩
    - `useEffect`로 ESC 키 핸들러
    - 모달 열릴 때 `document.body.style.overflow = 'hidden'`
    - 포커스를 "계속 진단" 버튼으로 이동

**🔵 REFACTOR**

- [ ] **Task 3.9**: 코드 정리
  - [ ] Toast 메시지 상수 추출
  - [ ] LoadingSpinner 컴포넌트 분리
  - [ ] 접근성 속성 검증

#### Quality Gate ✋

**Validation Commands**:
```bash
npx tsc --noEmit
npx vitest run tests/unit/presentation/
npx vitest run
npx next build
```

**Manual Test Checklist**:
- [ ] FreeAuditButton: 네트워크 차단 후 클릭 → 에러 토스트 표시
- [ ] 분석 결과 → 공유 버튼 → 토스트로 "링크 복사됨" 표시 (alert 아님)
- [ ] 비활성 계정 클릭 → 다이얼로그 → ESC로 닫힘 확인
- [ ] 다이얼로그 → Tab으로 포커스 트랩 확인
- [ ] 분석 중 "약 30초~1분 소요" 안내 표시 확인

---

### Phase 4: Rate Limit 설계 + 안정성 (MEDIUM 3건)
**Goal**: Rate Limit 키 합리화, 메모리 누수 방지, 전환추적 오탐 개선
**Estimated Time**: 3-4 hours
**Status**: ⏳ Pending
**Severity**: MEDIUM
**Dependencies**: Phase 1 완료

#### 개선 항목
| # | 항목 | 심각도 |
|---|------|--------|
| 9 | Rate Limit 키 불일치 — 보조 API 과다 소모 | MEDIUM |
| 10 | setInterval 메모리 누수 (인메모리 폴백 시) | MEDIUM |
| 11 | 전환 추적 평가 — conversions=0 오탐 | MEDIUM |

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 4.1**: Rate Limit 플로우 통합 테스트
  - File: `tests/integration/audit/rate-limit-flow.test.ts`
  - Test cases:
    - 1회 완전한 플로우(auth-url → callback → accounts → analyze) → Rate Limit 1회만 차감
    - 보조 API(callback, accounts)는 별도 한도 또는 미차감
    - 3회 플로우 후 4번째 auth-url → Rate Limit 초과

- [ ] **Test 4.2**: 전환 추적 평가 개선 테스트
  - File: `tests/unit/domain/AuditScore.test.ts` (기존 확장)
  - Test cases:
    - conversions=0 + status=ACTIVE + 최근 생성 → "데이터 수집 중" (critical 아님)
    - conversions=0 + 충분한 기간 → "전환 추적 미설정" (기존 동작)

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 4.3**: Rate Limit 키 재설계
  - Files: `src/app/api/audit/callback/route.ts`, `accounts/route.ts`
  - Details:
    - callback: Rate Limit 제거 (OAuth 콜백은 Meta가 호출, 사용자 제어 불가)
    - accounts: 별도 `audit-read:${ip}` 타입 (10회/시간) 또는 제거
    - auth-url + analyze만 `audit:${ip}` (3회/24시간) 유지

- [ ] **Task 4.4**: setInterval 정리 메서드 추가
  - File: `src/lib/cache/auditTokenCache.ts` (인메모리 폴백용)
  - Details:
    - `private intervalId` 필드 추가
    - `destroy()` 메서드로 `clearInterval` 가능
    - Hot reload 시 중복 방지

- [ ] **Task 4.5**: 전환 추적 평가 로직 개선
  - File: `src/domain/value-objects/AuditScore.ts`
  - Details:
    - `CampaignAuditData`에 `createdTime` 필드 추가 (선택적)
    - conversions=0이지만 최근 7일 이내 생성 → warning("데이터 수집 중")
    - conversions=0이고 7일+ 경과 → critical("전환 추적 미설정")
    - 해당 정보 없으면 기존 동작 유지 (하위 호환)

**🔵 REFACTOR**

- [ ] **Task 4.6**: Rate Limit 문서화 + 테스트 업데이트
  - [ ] Rate Limit 타입별 한도 정리 문서
  - [ ] 기존 free-audit-flow.test.ts 업데이트

#### Quality Gate ✋

**Validation Commands**:
```bash
npx tsc --noEmit
npx vitest run tests/unit/domain/AuditScore.test.ts
npx vitest run --config vitest.config.integration.ts tests/integration/audit/
npx vitest run
npx next build
```

**Manual Test Checklist**:
- [ ] 전체 플로우 3회 실행 후 4번째 시도 → Rate Limit 에러 확인
- [ ] callback/accounts API가 Rate Limit에 불필요하게 차감되지 않는지 확인

---

### Phase 5: 폴리시 및 전환 최적화 (LOW 5건)
**Goal**: 바이럴/전환 극대화 + 접근성 완성 + 엣지케이스 처리
**Estimated Time**: 3-4 hours
**Status**: ⏳ Pending
**Severity**: LOW
**Dependencies**: Phase 3 완료

#### 개선 항목
| # | 항목 | 심각도 |
|---|------|--------|
| 13 | 공유 페이지에 "나도 무료 진단 받기" CTA 부재 | LOW |
| 14 | PDF 파일명 — 계정명 미포함 | LOW |
| 15 | 세션 만료 시 사전 경고 없음 (15분 TTL) | LOW |
| 16 | 빈 카테고리(campaigns=0) 전용 안내 UI 없음 | LOW |
| 17 | aria-checked 항상 false (접근성) | LOW |

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 5.1**: 공유 페이지 CTA 렌더링 테스트
  - File: `tests/unit/presentation/components/audit/SharedPage.test.tsx`
  - Test cases:
    - 공유 결과 페이지에 "나도 진단 받기" 버튼 존재
    - 클릭 → `/` 또는 auth-url로 이동

- [ ] **Test 5.2**: aria-checked 상태 반영 테스트
  - File: `tests/unit/presentation/components/audit/AccountSelector.test.tsx` (추가)
  - Test cases:
    - 선택된 계정의 aria-checked="true"
    - 미선택 계정의 aria-checked="false"

- [ ] **Test 5.3**: 빈 결과 전용 UI 테스트
  - File: `tests/unit/presentation/components/audit/EmptyResult.test.tsx`
  - Test cases:
    - categories=[] → "캠페인이 없어 분석할 수 없습니다" 안내 렌더링
    - 픽셀 설치 안내 CTA 표시

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 5.4**: 공유 페이지 "나도 진단 받기" CTA 추가
  - File: `src/app/audit/shared/[token]/page.tsx`
  - Details: 결과 하단에 FreeAuditButton 재사용 또는 유사 CTA 배치

- [ ] **Task 5.5**: PDF 파일명에 계정명 포함
  - Files: `src/app/api/audit/pdf/route.ts`, `src/app/audit/callback/page.tsx`
  - Details:
    - 요청에 `accountName` 추가
    - 파일명: `바투_광고계정진단_[계정명]_20260227.pdf`
    - 특수문자 sanitize

- [ ] **Task 5.6**: 세션 만료 사전 경고
  - File: `src/app/audit/callback/page.tsx`
  - Details:
    - 계정 선택 화면에서 `setTimeout(12분)` → toast("세션이 3분 후 만료됩니다")
    - 만료 시 자동으로 에러 상태 전환

- [ ] **Task 5.7**: 빈 결과 전용 안내 UI
  - File: `src/presentation/components/audit/EmptyAuditResult.tsx` (신규)
  - Details: 캠페인 0개 시 "캠페인을 먼저 생성해보세요" + 도움말 링크

- [ ] **Task 5.8**: aria-checked 상태 반영
  - File: `src/presentation/components/audit/AccountSelector.tsx`
  - Details: `aria-checked={false}` → `aria-checked={selectedId === account.id}`
  - (현재 AccountSelector는 선택 즉시 분석 시작하므로, 선택 상태를 시각적으로 보여주는 것도 고려)

**🔵 REFACTOR**

- [ ] **Task 5.9**: 최종 접근성 점검
  - [ ] axe-core 테스트 추가
  - [ ] 스크린 리더 테스트 (VoiceOver)
  - [ ] 전체 감사 플로우 탭 순서 확인

#### Quality Gate ✋

**Validation Commands**:
```bash
npx tsc --noEmit
npx vitest run tests/unit/presentation/components/audit/
npx vitest run
npx next build
# E2E (선택)
npx playwright test tests/e2e/audit-flow.spec.ts
```

**Manual Test Checklist**:
- [ ] 공유 페이지에서 "나도 진단 받기" 클릭 → 랜딩 페이지 이동
- [ ] PDF 파일명에 계정명 포함 확인
- [ ] 계정 선택 화면 12분 대기 → "세션 만료 예정" 토스트 확인
- [ ] 캠페인 0개 계정 분석 → 전용 안내 UI 표시 확인
- [ ] 스크린 리더로 계정 선택 → aria-checked 상태 읽힘 확인

---

### Phase 6: 품질게이트 강화 (HARDENING 2건)
**Goal**: Integration 테스트 명령 정합성 확보 + HMAC 시크릿 운영환경 강제 정책
**Estimated Time**: 1-2 hours
**Status**: ⏳ Pending
**Severity**: HARDENING (코드 리뷰 피드백 반영)
**Dependencies**: Phase 1 완료

#### 개선 항목
| # | 항목 | 심각도 |
|---|------|--------|
| 18 | Integration 품질게이트 명령이 기본 config 사용 — 테스트 건너뜀 위험 | MEDIUM |
| 19 | HMAC 시크릿 Prod 강제 — 공개 기본키로 서명되는 보안 갭 | HIGH |

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 6.1**: HMAC 시크릿 환경별 정책 테스트
  - File: `tests/unit/lib/auditHmac.test.ts` (기존 확장)
  - Test cases:
    - `NODE_ENV=production` + `AUDIT_HMAC_SECRET` 미설정 → `signReport()` throw
    - `NODE_ENV=production` + `AUDIT_HMAC_SECRET` 미설정 → `verifyReport()` throw
    - `NODE_ENV=production` + `AUDIT_HMAC_SECRET` 설정 → 정상 서명/검증
    - `NODE_ENV=test` + `AUDIT_HMAC_SECRET` 미설정 → fallback 정상 동작
    - fallback 사용 시 경고 로그 1회 출력 확인

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 6.2**: HMAC 시크릿 환경별 분기 구현
  - File: `src/lib/security/auditHmac.ts`
  - Details:
    - `NODE_ENV === 'production'` + `AUDIT_HMAC_SECRET` 미설정 → 즉시 throw
    - `development`/`test` → 기존 fallback 허용 + 1회 경고 로그
    - 모듈 스코프 플래그로 경고 중복 방지

- [ ] **Task 6.3**: package.json 전용 스크립트 추가
  - File: `package.json`
  - Details:
    - `test:integration:audit` — `vitest run --config vitest.config.integration.ts tests/integration/audit`
    - `test:integration:audit:flow` — `vitest run --config vitest.config.integration.ts tests/integration/free-audit-flow.test.ts`

- [ ] **Task 6.4**: .env.example에 AUDIT_HMAC_SECRET 문서화
  - File: `.env.example`
  - Details: `AUDIT_HMAC_SECRET` 항목 추가, production 필수 명시

- [ ] **Task 6.5**: 계획서 내 잘못된 integration 명령 수정
  - File: `docs/plans/PLAN_audit-improvements.md`
  - Details: `--config vitest.config.integration.ts` 누락된 호출 일괄 교체 (Phase 6 작성 과정에서 함께 완료)

#### Quality Gate ✋

**Validation Commands**:
```bash
npx tsc --noEmit
npx vitest run tests/unit/lib/auditHmac.test.ts
npm run test:integration:audit
npm run test:integration:audit:flow
npx vitest run
npx next build
```

**Checklist**:
- [ ] `NODE_ENV=production` 시뮬레이션에서 secret 없이 서명 시도 → 즉시 에러
- [ ] 기존 전체 테스트(dev/test 환경)에서 fallback으로 정상 동작
- [ ] package.json 신규 스크립트가 올바른 config로 integration 테스트 실행

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Upstash Redis 장애 시 전체 감사 불가 | Low | High | 인메모리 폴백 모드 유지 (환경변수 스위치) |
| Meta API Rate Limit 초과 (병렬 배치) | Medium | Medium | batchSize=5로 보수적 설정, 429 시 exponential backoff |
| HMAC 시크릿 노출 | Low | High | 환경변수로만 관리, .env에 미커밋, Vercel secrets 사용 |
| shadcn/ui toast 번들 크기 증가 | Low | Low | tree-shaking으로 최소화, 이미 shadcn 사용 중 |
| 기존 테스트 깨짐 (캐시 인터페이스 변경) | Medium | Medium | 팩토리 패턴으로 인터페이스 유지, 점진적 마이그레이션 |

---

## 🔄 Rollback Strategy

### If Phase 1 Fails
- `git stash` 또는 브랜치 되돌리기
- 환경변수에서 `UPSTASH_REDIS_REST_URL` 제거 → 자동 인메모리 폴백
- HMAC 검증 코드 제거 → PDF/Share API 원상복구

### If Phase 2 Fails
- UseCase의 `batchSettled` → 기존 `for` 루프 복원
- currency 필드 → 'KRW' 하드코딩 복원

### If Phase 3 Fails
- Toast → alert() 원상복구
- 포커스 트랩 코드 제거
- 진행률 표시 → 기존 LoadingSpinner 복원

### If Phase 4 Fails
- Rate Limit 키 → 기존 키 복원
- 전환 추적 로직 → `conversions === 0` 단순 판별 복원

### If Phase 5 Fails
- 각 LOW 항목은 독립적 → 개별 되돌리기 가능

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1** (보안/인프라): ⏳ 0%
- **Phase 2** (성능): ⏳ 0%
- **Phase 3** (UX 피드백): ⏳ 0%
- **Phase 4** (Rate Limit/안정성): ⏳ 0%
- **Phase 5** (폴리시/전환): ⏳ 0%
- **Phase 6** (품질게이트 강화): ⏳ 0%

**Overall Progress**: 0% complete

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1 (보안/인프라) | 5-6h | - | - |
| Phase 2 (성능) | 3-4h | - | - |
| Phase 3 (UX 피드백) | 4-5h | - | - |
| Phase 4 (Rate Limit) | 3-4h | - | - |
| Phase 5 (폴리시) | 3-4h | - | - |
| Phase 6 (품질게이트 강화) | 1-2h | - | - |
| **Total** | **20-25h** | - | - |

---

## 📝 Notes & Learnings

### Implementation Notes
- (Phase 완료 시 기록)

### Blockers Encountered
- (발생 시 기록)

---

## 📚 References

### 관련 문서
- 기능 규칙: `.claude/rules/feature-audit.md`
- 기존 계정 선택 계획: `docs/plans/PLAN_audit-account-selector.md`
- Upstash Redis: https://upstash.com/docs/redis/overall/getstarted
- shadcn/ui Toast: https://ui.shadcn.com/docs/components/toast

### 관련 파일 (28개)
- API Routes (7): `src/app/api/audit/{auth-url,callback,accounts,analyze,pdf,share,share/[token]}/route.ts`
- Pages (2): `src/app/audit/{callback,shared/[token]}/page.tsx`
- Components (5): `src/presentation/components/audit/{AccountSelector,AuditReportCard,AuditCategoryBreakdown,AuditConversionCTA,index}.tsx`
- Cache (3): `src/lib/cache/audit{TokenCache,StateCache,ShareCache}.ts`
- Domain (1): `src/domain/value-objects/AuditScore.ts`
- Application (2): `src/application/{use-cases/audit/AuditAdAccountUseCase,dto/audit/AuditDTO}.ts`
- Infrastructure (1): `src/infrastructure/pdf/AuditPDFGenerator.ts`
- Landing (1): `src/presentation/components/landing/HeroSection/FreeAuditButton.tsx`
- Utils (1): `src/presentation/utils/accountStatus.ts`
- Validation (1): `src/lib/validations/audit.ts`
- Tests (5): `tests/{unit,integration}/...`

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All 6 phases completed with quality gates passed
- [ ] Full integration testing performed
- [ ] 19건 개선사항 모두 반영 확인
- [ ] `npx tsc --noEmit` 통과
- [ ] `npx vitest run` 전체 통과 (기존 2,662 + 신규 20건+)
- [ ] `npx next build` 성공
- [ ] E2E 테스트 통과
- [ ] 접근성(a11y) 검증 완료
- [ ] 보안 검증 완료 (HMAC, Rate Limit)

---

**Plan Status**: ⏳ Pending User Approval
**Next Action**: 사용자 승인 후 Phase 1부터 실행
**Blocked By**: Upstash Redis 계정 생성, `AUDIT_HMAC_SECRET` 환경변수 설정
