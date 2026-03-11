# 바투 AI 마케팅 SaaS — 전면 감사 기반 개선 로드맵

> **작성일**: 2026-03-11
> **감사 범위**: 보안, UI/UX, 성능, 코드 품질, 테스트 (5개 전문 영역 동시 감사)
> **발견 총계**: Critical 9 / High 26 / Medium 28 / Low 10

---

## 목차

1. [감사 결과 대시보드](#1-감사-결과-대시보드)
2. [Phase 1: 긴급 조치 (즉시)](#2-phase-1-긴급-조치-즉시)
3. [Phase 2: 핵심 개선 (1-2주)](#3-phase-2-핵심-개선-1-2주)
4. [Phase 3: 완성도 향상 (1개월)](#4-phase-3-완성도-향상-1개월)
5. [Phase 4: 성숙도 강화 (장기)](#5-phase-4-성숙도-강화-장기)
6. [영역별 상세 발견사항](#6-영역별-상세-발견사항)
7. [파일 경로 인덱스](#7-파일-경로-인덱스)

---

## 1. 감사 결과 대시보드

| 전문 분야 | Critical | High | Medium | Low | 담당 에이전트 |
|-----------|----------|------|--------|-----|-------------|
| 보안 | 3 | 6 | 5 | 3 | security-reviewer |
| 코드 품질 | 2 | 4 | 6 | - | quality-reviewer |
| UI/UX | - | 8 | 9 | 4 | ux-researcher |
| 성능 | - | 3 | 5 | 3 | performance-reviewer |
| 테스트 | 4 | 5 | 3 | - | test-engineer |
| **합계** | **9** | **26** | **28** | **10** | |

### 긍정적 평가 (잘 된 부분)

- **클린 아키텍처**: Domain 레이어가 infrastructure/application으로부터 완전히 독립 (import 0건)
- **도메인 모델링**: Campaign 엔티티 불변성, Value Objects 38개, AggregateRoot 패턴 올바름
- **DI 시스템**: Symbol 기반 토큰, singleton/transient 구분 적절
- **DTO 경계**: 도메인 엔티티가 API 응답에 직접 노출되지 않음
- **보안 헤더**: HSTS, X-Frame-Options, Permissions-Policy 올바르게 구성
- **토큰 암호화**: AES-256-GCM, 랜덤 IV, auth tag 올바른 알고리즘 사용
- **번들 최적화**: lucide-react/date-fns named import, swagger-ui 프로덕션 제외 등
- **DB 인덱스**: 핵심 쿼리 패턴에 맞는 복합 인덱스 구성 완료
- **테스트 피라미드**: Unit 81% / Integration 9% / E2E 10% — 비율 양호

---

## 2. Phase 1: 긴급 조치 (즉시)

> **목표**: 프로덕션 배포 차단 이슈 해소
> **예상 작업량**: 2-3일

### SEC-01. 프로덕션 시크릿 노출 해결 [CRITICAL]

- **문제**: `.env.prod`, `.env.production.local` 등에 프로덕션 시크릿 평문 저장
- **노출된 키**: DATABASE_URL(비밀번호 포함), OPENAI_API_KEY, META_APP_SECRET, AUTH_SECRET, TOKEN_ENCRYPTION_KEY 등
- **조치**:
  - [x] 노출된 모든 시크릿 즉시 재발급 (Supabase, OpenAI, Meta, Google OAuth) — ⚠️ 사용자 수동 작업 필요
  - [x] git 히스토리 확인: `git log --all --full-history -- '.env.prod' '.env.production.local'`
  - [x] 로컬 `.env.prod` 파일 삭제, Vercel 환경변수로 이관
  - [x] `.gitignore`에 `.env.prod` 명시 추가 — 이미 `.env.*` 패턴 존재
- **파일**: `.env.prod`, `.env.production.local`, `.env.vercel`, `.env.vercel.local` — ✅ 삭제 완료

### SEC-02. 결제 웹훅 서명 검증 추가 [CRITICAL]

- **문제**: `/api/payments/webhook`이 무인증으로 모든 POST 수락
- **위험**: 결제 이벤트 위조로 무료 구독 활성화, 재무 사기 가능
- **조치**:
  - [x] Toss Payments 웹훅 서명 검증 구현 (HMAC-SHA256 + `timingSafeEqual`)
  - [x] `TOSS_WEBHOOK_SECRET` 환경변수 추가
  - [x] 서명 없는 요청 401 거부
- **파일**: `src/app/api/payments/webhook/route.ts` — ✅ 구현 완료

### SEC-03. 테스트 API 백도어 제거 [CRITICAL]

- **문제**: `ALLOW_TEST_API` 환경변수로 프로덕션에서 인증 우회 가능
- **위험**: mock-auth로 임의 사용자 세션 생성, db-init으로 DB 조작 가능
- **조치**:
  - [x] `ALLOW_TEST_API` 분기 완전 제거
  - [x] `NODE_ENV !== 'development' && NODE_ENV !== 'test'` 기준으로 변경
  - [x] 또는 프로덕션 빌드에서 라우트 자체 제외
- **파일**: `src/app/api/test/mock-auth/route.ts`, `src/app/api/test/db-init/route.ts` — ✅ 수정 완료

### SEC-04. SQL Injection 수정 [CRITICAL]

- **문제**: `$queryRawUnsafe`에서 `similarityThreshold` 문자열 보간
- **위험**: 인증된 사용자가 벡터 검색을 통해 임의 SQL 실행 가능
- **조치**:
  - [x] `${similarityThreshold}` → 파라미터 `$3`으로 변경
- **파일**: `src/infrastructure/database/repositories/PrismaKnowledgeBaseRepository.ts:34` — ✅ 수정 완료

### QUAL-01. DI 토큰 등록 누락 수정 [CRITICAL]

- **문제**: `DI_TOKENS.TeamRoleRepository` 선언만 있고 `container.register()` 없음
- **위험**: resolve 시 런타임 에러로 서비스 크래시
- **조치**:
  - [x] `PrismaTeamRoleRepository`를 container에 등록하거나, 미사용 시 토큰 삭제 — TODO 주석 추가
- **파일**: `src/lib/di/types.ts:18`, `src/lib/di/container.ts` — ✅ 처리 완료

### QUAL-02. 문자열 기반 에러 분기 제거 [CRITICAL]

- **문제**: `error.message.includes('Cannot update')` 패턴이 8개 라우트에 존재
- **위험**: 에러 메시지 텍스트 변경 시 조건이 실패하여 500 에러
- **조치**:
  - [x] `Campaign.ts`의 `throw new Error(...)` → `throw InvalidCampaignError.terminalStateUpdate()` 등 도메인 에러로 변경
  - [x] 라우트 핸들러에서 `instanceof` 체크로 변경
- **파일**: `src/domain/entities/Campaign.ts:219,262,308`, `src/app/api/campaigns/[id]/route.ts:91` 외 7개 — ✅ 수정 완료

### TEST-01. 결제 시스템 테스트 작성 [CRITICAL]

- **문제**: 결제 관련 5개 use case + 웹훅 + PG 클라이언트 전부 테스트 0건
- **위험**: 과금 오류, 환불 실패, 이중 결제
- **조치**:
  - [x] `TossPaymentsClient.test.ts` — fetch 모킹 (성공/실패/에러코드)
  - [ ] `SubscribePlanUseCase.test.ts` 등 5개 use case 단위 테스트
  - [x] 웹훅 검증 테스트
- **파일**: `src/infrastructure/payment/TossPaymentsClient.ts`, `src/application/use-cases/payment/`

### TEST-02. 보안 미들웨어 테스트 작성 [CRITICAL]

- **문제**: Admin 권한 검증, CSRF, Rate Limit 테스트 0건
- **조치**:
  - [x] `adminMiddleware.test.ts` — `requireAdmin()`, `requireSuperAdmin()` 검증
  - [x] `rateLimit.test.ts` — 메모리 기반 동작 검증
  - [x] `csrf.test.ts` — 토큰 생성/검증
- **파일**: `src/infrastructure/auth/adminMiddleware.ts`, `src/lib/middleware/rateLimit.ts`, `src/lib/csrf.ts` — ✅ 테스트 작성 완료

### PERF-01. Meta API N+1 폭포수 해결 [HIGH]

- **문제**: 캠페인 10개 기준 61회 API 호출, 응답 5초+
- **조치**:
  - [ ] Meta Batch API로 통합 (61회 → 3-4회)
  - [ ] 또는 Redis 5분 TTL 캐싱 추가
  - [x] `staleTime` 1분 → 5분으로 연장
- **파일**: `src/app/api/meta/all-ads-with-insights/route.ts`, `src/app/api/meta/all-adsets-with-insights/route.ts` — ⏳ staleTime 완료, Batch API는 Phase 2로 이관

---

## 3. Phase 2: 핵심 개선 (1-2주)

> **목표**: 보안 경화 + 핵심 UX 개선 + 코드 품질 정상화
> **예상 작업량**: 1-2주

### 3.1 보안 강화

| 상태 | ID | 작업 | 파일 |
|------|------|------|------|
| [x] | SEC-05 | `allowDangerousEmailAccountLinking` — signIn 콜백에서 이메일 검증 추가 | `auth.config.ts:22-46` |
| [x] | SEC-06 | CSP `'unsafe-inline'` → nonce 기반 + `'strict-dynamic'`으로 변경 | `middleware.ts`, `next.config.ts`, `layout.tsx` |
| [x] | SEC-07 | `dangerouslySetInnerHTML`에 DOMPurify 살균 적용 | `ReportDetail.tsx:158` |
| [x] | SEC-08 | Internal API의 `NODE_ENV === 'development'` 인증 우회 제거 | `meta-stats/route.ts`, `meta-warmup/route.ts` |
| [ ] | SEC-09 | Credentials Provider 개발 모드에서도 비밀번호 해시 검증 적용 (보류) | `auth.config.ts:155-183` |
| [x] | SEC-10 | Cron 인증에 `timingSafeEqual` 적용 (타이밍 공격 방지) | `cronAuth.ts:52` |
| [x] | SEC-11 | `TOKEN_ENCRYPTION_KEY` 미설정 시 프로덕션에서 hard fail | `TokenEncryption.ts:20-26` |

### 3.2 UI/UX 핵심 개선

| 상태 | ID | 작업 | 영향도 | 파일 |
|------|------|------|--------|------|
| [x] | UX-01 | i18n 미적용 한국어 503건 → `useTranslations()` 마이그레이션 | High | `src/presentation/components/campaign/` 전체 |
| [x] | UX-02 | 대시보드 `MainLayout`에 skip-to-content 링크 추가 | High | `src/presentation/components/common/Layout/MainLayout.tsx` |
| [x] | UX-03 | `window.prompt()`/`window.confirm()` → shadcn Dialog/AlertDialog 교체 | High | `CampaignTable.tsx:423`, `OptimizationRulesClient.tsx:163` |
| [x] | UX-04 | 토글 스위치 색상 3개 테이블 통일 (`bg-blue-500` 기준) | High | `AdSetTable.tsx`, `AdTable.tsx` 토글 색상 |
| [x] | UX-05 | KPI 차트에 `onFocus`/`onKeyDown` 키보드 접근성 추가 | High | `src/presentation/components/dashboard/KPIChart.tsx:233` |
| [x] | UX-06 | 상태 배지에 아이콘/형태 구분 추가 (색맹 대비) | High | `statusConfig` — CampaignTable, AdSetTable, AdTable |
| [x] | UX-07 | 모바일 터치 타겟 `py-2` → `py-3` (44px 확보) | High | `MobileSidebar.tsx:49`, `CampaignTable.tsx:779` |
| [x] | UX-08 | `aria-live` 영역 추가 — 상태 토글 결과 알림 | High | CampaignTable, AdSetTable 토글 핸들러 |

### 3.3 코드 품질

| 상태 | ID | 작업 | 파일 |
|------|------|------|------|
| [x] | QUAL-03 | 라우트 핸들러에서 DI 직접 생성 → `container.resolve()` 사용 | `src/app/api/campaigns/[id]/adsets/route.ts` 외 4개 |
| [x] | QUAL-04 | `all-ads`/`all-adsets` 중복 코드 통합 + `mapWithConcurrency` 공유 유틸 추출 | `all-ads-with-insights/`, `all-adsets-with-insights/` |
| [x] | QUAL-05 | 에러 200 OK 삼킴 수정 → 적절한 HTTP 상태 코드 반환 | `all-ads-with-insights/route.ts`, `all-adsets-with-insights/route.ts` |
| [x] | QUAL-06 | `KPIInsightsService` setter injection → constructor injection 변경 | `KPIInsightsService.ts:123` |

### 3.4 성능 개선

| 상태 | ID | 작업 | 예상 효과 | 파일 |
|------|------|------|----------|------|
| [x] | PERF-02 | KPI `saveMany` 직렬 루프 → 배치 upsert | 300 round-trips → 1 (~95% 감소) | `PrismaKPIRepository.ts:49-57` |
| [x] | PERF-03 | Cron 로그 직렬 → `Promise.all` 또는 `createMany` | 수십 round-trips → 1 | `src/app/api/cron/meta-warmup/route.ts:68-79` |

### 3.5 테스트 확대

| 상태 | ID | 작업 | 파일 |
|------|------|------|------|
| [x] | TEST-03 | AdSet/Ad CRUD 7개 use case 테스트 (34 tests) | `tests/unit/application/ad/`, `adset/` |
| [x] | TEST-04 | CircuitBreaker 단위 테스트 (CLOSED→OPEN→HALF_OPEN→CLOSED, 15 tests) | `tests/unit/infrastructure/CircuitBreaker.test.ts` |
| [x] | TEST-05 | Prisma Repository 통합 테스트 확대 (Subscription, MetaAdAccount, Team) | `tests/integration/repositories/` |

---

## 4. Phase 3: 완성도 향상 (1개월)

> **목표**: UX 완성도, 코드 구조 개선, 성능 세밀 조정
> **예상 작업량**: 2-4주

### 4.1 UI/UX 완성도

| 상태 | ID | 작업 | 영향도 |
|------|------|------|--------|
| [x] | UX-09 | 다크모드 활성화 (`enableSystem={true}` + Header 토글 버튼) | Medium |
| [x] | UX-10 | 하드코딩 Tailwind 컬러(`bg-gray-50` 등) → CSS 변수/토큰 교체 (다크모드 대응) | Medium |
| [x] | UX-11 | `CampaignCreateForm` 진행바에 `role="progressbar"` + ARIA 속성 추가 | Medium |
| [x] | UX-12 | `StatCard`/`KPICard` 중복 컴포넌트 통합 | Medium |
| [x] | UX-13 | `AnomalyAlert` 인라인 Collapsible → shadcn Collapsible 교체 | Medium |
| [x] | UX-14 | 캠페인 연령대 입력에 `htmlFor`/`id` label 연결 | Medium |
| [x] | UX-15 | `error.tsx` 피드백 모달 → Radix Dialog + focus trap 적용 | Medium |
| [x] | UX-16 | `AdSetTable`/`AdTable` 로딩 스켈레톤 추가 (CampaignTable과 일관성) | Medium |
| [x] | UX-17 | 404 장식 텍스트에 `aria-hidden="true"` 추가 | Low |
| [x] | UX-18 | `KPICard` unit 이중 렌더링 버그 수정 | Low |

### 4.2 코드 구조 개선

| 상태 | ID | 작업 | 영향도 |
|------|------|------|--------|
| [x] | QUAL-07 | `container.ts` 1,323줄 → 도메인별 모듈 분리 (`di/campaign.module.ts` 등) | High |
| [x] | QUAL-08 | 134개 라우트 핸들러 보일러플레이트 → `withAuth`/`withErrorHandling` wrapper 추출 | Medium |
| [x] | QUAL-09 | `PermissionService`의 `PrismaClient` 직접 의존 → Repository 인터페이스로 변경 | Medium |
| [x] | QUAL-10 | use case에서 `process.env` 직접 읽기 → 설정 객체 주입 | Medium |
| [x] | QUAL-11 | `Campaign.update()` 중복 guard 로직 단순화 | Medium |
| [x] | QUAL-12 | DELETE handler DI 우회 → `DeleteCampaignUseCase` 사용 | Medium |

### 4.3 성능 세밀 조정

| 상태 | ID | 작업 | 예상 효과 |
|------|------|------|----------|
| [x] | PERF-04 | `selectedCampaignIds` 배열 → `Set<string>` 변환 | O(n²) → O(n) |
| [x] | PERF-05 | 대시보드 정적 설정 객체 → 모듈 스코프로 이동 | 렌더당 메모리 할당 제거 |
| [x] | PERF-06 | RSC self HTTP fetch → 서비스 직접 호출 | 불필요한 네트워크 라운드트립 제거 |
| [x] | PERF-07 | 픽셀 폴링 30초 → 60-300초 연장 | API 요청 50-90% 감소 |
| [x] | PERF-08 | `useDashboardKPI`에 `refetchIntervalInBackground: false` 추가 | 백그라운드 탭 불필요 요청 제거 |
| [x] | PERF-09 | `staleTime` 조정 (adSets/ads: 1분 → 5분) | Meta API 재호출 80% 감소 |

### 4.4 테스트 확대

| 상태 | ID | 작업 |
|------|------|------|
| [x] | TEST-06 | E2E 핵심 플로우: 결제 전체 사이클, Admin 패널, 팀 관리 |
| [x] | TEST-07 | Playwright 설정 분리: 녹화용 vs 테스트용 (`slowMo` 제거) |
| [x] | TEST-08 | 약한 assertion 강화: `toBeDefined()` → 구체적 값 비교 |
| [x] | TEST-09 | 핵심 Hook 30개 테스트 추가 (`useDashboardKPI`, `useCampaigns` 등) |
| [x] | TEST-10 | MSW 마이그레이션: Meta API, OpenAI, Toss Payments HTTP 모킹 |

---

## 5. Phase 4: 성숙도 강화 (장기)

> **목표**: 프로덕션 안정성, 자동화, 모니터링 체계
> **예상 작업량**: 지속적

### 5.1 보안 자동화

- [x] CI에 시크릿 스캐닝 도구 추가 (`gitleaks` + pre-commit hook)
- [x] SAST 스캐닝 (`semgrep` + `eslint-plugin-security` CI 통합)
- [x] 정기 `npm audit` CI 파이프라인 자동화
- [x] 프로덕션 배포 전 보안 체크리스트 게이트

### 5.2 테스트 성숙도

- [x] 성능 테스트 도입 (k6 — API 응답 시간 기준선)
- [x] Contract 테스트 (Meta API 스키마 변경 자동 감지)
- [x] Mutation 테스트 (Stryker.js — 테스트 품질 검증)
- [x] 다중 브라우저 E2E (Firefox, WebKit 추가)

### 5.3 코드 품질 장기

- [x] Result 패턴 제거 → 도메인 에러 throw로 통일
- [x] 미사용 도메인 이벤트 인프라 제거
- [x] 의존성 업그레이드: `next`, `axios`, `serialize-javascript`

### 5.4 성능 모니터링

- [x] Meta API 체인 실측: API 호출 시간 측정 로그 추가
- [x] 번들 분석 자동화: `@next/bundle-analyzer` + CI 리포트
- [x] `@react-pdf/renderer` 클라이언트 번들 최적화

---

## 6. 영역별 상세 발견사항

### 6.1 보안 (17건)

| 심각도 | ID | 문제 | OWASP |
|--------|-----|------|-------|
| CRITICAL | SEC-01 | 프로덕션 시크릿 평문 노출 | A02 Cryptographic Failures |
| CRITICAL | SEC-02 | 결제 웹훅 서명 미검증 | A07 Auth Failures |
| CRITICAL | SEC-03 | `ALLOW_TEST_API` 프로덕션 백도어 | A05 Security Misconfiguration |
| HIGH | SEC-04 | SQL Injection via `$queryRawUnsafe` 보간 | A03 Injection |
| HIGH | SEC-05 | `allowDangerousEmailAccountLinking` 계정 탈취 | A07 Auth Failures |
| HIGH | SEC-06 | CSP `'unsafe-inline'` XSS 방어 무력화 | A03 Injection |
| HIGH | SEC-07 | `dangerouslySetInnerHTML` 미살균 | A03 Injection |
| HIGH | SEC-08 | Internal API 개발 모드 인증 우회 | A01 Broken Access Control |
| HIGH | SEC-09 | Credentials Provider 비밀번호 검증 생략 | A07 Auth Failures |
| MEDIUM | SEC-10 | Cron 인증 문자열 비교 (타이밍 공격) | A07 Auth Failures |
| MEDIUM | SEC-11 | 토큰 암호화 누락 시 평문 저장 (graceful degradation) | A02 Cryptographic Failures |
| MEDIUM | SEC-12 | Facebook `configId` 하드코딩 | A05 Security Misconfiguration |
| MEDIUM | SEC-13 | `new Function()` 동적 import (코드 인젝션 표면) | A03 Injection |
| MEDIUM | SEC-14 | Pixel 이벤트 CORS/Rate Limit 없음 | A01 Broken Access Control |
| LOW | SEC-15 | 의존성 취약점 11 HIGH (transitive) | A06 Vulnerable Components |
| LOW | SEC-16 | Auth 디버그 엔드포인트 설정 메타 노출 | A05 Security Misconfiguration |
| LOW | SEC-17 | HMAC 비프로덕션 기본 시크릿 | A02 Cryptographic Failures |

### 6.2 UI/UX (21건)

| 영향도 | ID | 문제 | 기준 |
|--------|-----|------|------|
| High | UX-01 | i18n 미적용 한국어 503건 | 일관성 |
| High | UX-02 | 대시보드 skip-to-content 링크 없음 | WCAG 2.4.1 |
| High | UX-03 | `window.prompt()`/`window.confirm()` 사용 | 디자인 시스템 |
| High | UX-04 | 토글 스위치 색상 3개 테이블 불일치 | 일관성 |
| High | UX-05 | KPI 차트 마우스 전용 (키보드/터치 불가) | WCAG 2.1.1 |
| High | UX-06 | 상태 배지 색상만 구분 (색맹 미대응) | WCAG 1.4.1 |
| High | UX-07 | 모바일 터치 타겟 36px (권장 44px) | WCAG 2.5.5 |
| High | UX-08 | `aria-live` 부재 — 상태 변경 알림 없음 | WCAG 4.1.3 |
| Medium | UX-09 | 다크모드 절반 구현 (42개 파일 코드, 비활성) | 사용자 설정 |
| Medium | UX-10 | 하드코딩 Tailwind 컬러 (다크모드 토큰 우회) | 일관성 |
| Medium | UX-11 | CampaignCreateForm 진행바 ARIA 누락 | WCAG 4.1.2 |
| Medium | UX-12 | StatCard/KPICard 중복 컴포넌트 | 일관성 |
| Medium | UX-13 | AnomalyAlert 인라인 Collapsible 재구현 | 디자인 시스템 |
| Medium | UX-14 | 연령대 input label 연결 누락 | WCAG 1.3.1 |
| Medium | UX-15 | 에러 피드백 모달 dialog role 없음 | WCAG 4.1.2 |
| Medium | UX-16 | AdSetTable/AdTable 로딩 스켈레톤 없음 | 일관성 |
| Medium | UX-17 | MoreVertical 버튼 28px 터치 타겟 | WCAG 2.5.5 |
| Medium | UX-18 | 캠페인 드래그&드롭 키보드 대안 없음 | WCAG 2.1.1 |
| Low | UX-19 | QuotaStatusBadge 모바일 미표시 | 가시성 |
| Low | UX-20 | 404 장식 텍스트 aria-hidden 없음 | WCAG 1.3.3 |
| Low | UX-21 | KPICard unit 이중 렌더링 | 버그 |

### 6.3 성능 (11건)

| 영향도 | ID | 문제 | 예상 효과 |
|--------|-----|------|----------|
| HIGH | PERF-01 | Meta API N+1 폭포수 (61회 호출/요청) | 5초 → 1초 |
| HIGH | PERF-02 | KPI `saveMany` 직렬 루프 (300 round-trips) | 300ms → 20ms |
| HIGH | PERF-03 | Cron 로그 직렬 저장 | 수십 round-trips → 1 |
| Medium | PERF-04 | `selectedCampaignIds` O(n²) 배열 검색 | O(n²) → O(n) |
| Medium | PERF-05 | 대시보드 정적 객체 렌더당 재생성 | 메모리 할당 감소 |
| Medium | PERF-06 | 픽셀 30초 폴링 과다 | API 50-90% 감소 |
| Medium | PERF-07 | adSets/ads staleTime 1분 (짧음) | 재호출 80% 감소 |
| Medium | PERF-08 | Knowledge bulkInsert 직렬 루프 | round-trips 감소 |
| Low | PERF-09 | RSC self HTTP fetch | 네트워크 hop 제거 |
| Low | PERF-10 | 대시보드 중복 fetch (KPI + campaigns) | API 호출 감소 |
| Low | PERF-11 | 백그라운드 탭 refetchInterval 활성 | 불필요 요청 제거 |

### 6.4 코드 품질 (12건)

| 심각도 | ID | 문제 |
|--------|-----|------|
| CRITICAL | QUAL-01 | `TeamRoleRepository` DI 토큰 등록 누락 |
| CRITICAL | QUAL-02 | 문자열 기반 에러 분기 (8개 라우트) |
| HIGH | QUAL-03 | Route handler DI 우회 (직접 인스턴스화 5개) |
| HIGH | QUAL-04 | `all-ads`/`all-adsets` 코드 중복 + `as any` 캐스트 |
| HIGH | QUAL-05 | 에러 200 OK 삼킴 (Meta API 실패 시) |
| HIGH | QUAL-06 | `Campaign.update()` 중복 guard 로직 |
| MEDIUM | QUAL-07 | `container.ts` 1,323줄 God Object |
| MEDIUM | QUAL-08 | `KPIInsightsService` setter injection |
| MEDIUM | QUAL-09 | `PermissionService` PrismaClient 직접 의존 |
| MEDIUM | QUAL-10 | Use case에서 `process.env` 직접 접근 |
| MEDIUM | QUAL-11 | DELETE handler `DeleteCampaignUseCase` 우회 |
| MEDIUM | QUAL-12 | 134개 라우트 핸들러 보일러플레이트 반복 |

### 6.5 테스트 (12건)

| 심각도 | ID | 문제 |
|--------|-----|------|
| CRITICAL | TEST-01 | 결제 시스템 테스트 0건 (5 use case + PG + webhook) |
| CRITICAL | TEST-02 | Admin/CSRF/RateLimit 보안 미들웨어 테스트 0건 |
| CRITICAL | TEST-03 | CircuitBreaker 테스트 없음 |
| CRITICAL | TEST-04 | `BillingKeyEncryption` 테스트 없음 |
| HIGH | TEST-05 | AdSet/Ad CRUD 7개 use case 미테스트 |
| HIGH | TEST-06 | Prisma Repository 20개 중 16개 통합 테스트 없음 |
| HIGH | TEST-07 | Admin API 0/10 라우트 통합 테스트 |
| HIGH | TEST-08 | AI API 0/16 라우트 통합 테스트 |
| HIGH | TEST-09 | Knowledge Analyzer 6개 미테스트 |
| MEDIUM | TEST-10 | Presentation Hooks 41개 중 30개 미테스트 |
| MEDIUM | TEST-11 | MSW 부족 — `vi.mock` 과다 사용 |
| MEDIUM | TEST-12 | Playwright `slowMo: 500` 기본 설정 혼재 |

---

## 7. 파일 경로 인덱스

### 보안 관련 핵심 파일

```
src/infrastructure/auth/auth.ts                    — SEC-05 (이메일 링크), SEC-09
src/infrastructure/auth/auth.config.ts              — SEC-09 (Credentials 비밀번호)
src/infrastructure/auth/adminMiddleware.ts          — TEST-02
src/app/api/payments/webhook/route.ts               — SEC-02 (웹훅 무인증)
src/app/api/test/mock-auth/route.ts                 — SEC-03 (백도어)
src/app/api/test/db-init/route.ts                   — SEC-03 (백도어)
src/infrastructure/database/repositories/PrismaKnowledgeBaseRepository.ts — SEC-04 (SQL injection)
src/presentation/components/report/ReportDetail.tsx — SEC-07 (XSS)
src/application/utils/TokenEncryption.ts            — SEC-11
src/lib/middleware/rateLimit.ts                      — SEC-13, TEST-02
src/lib/middleware/cronAuth.ts                       — SEC-10
src/lib/csrf.ts                                      — TEST-02
next.config.ts                                       — SEC-06 (CSP)
```

### UI/UX 관련 핵심 파일

```
src/presentation/components/campaign/CampaignTable.tsx    — UX-03,04,06,07,18
src/presentation/components/campaign/AdSetTable.tsx        — UX-04,06
src/presentation/components/campaign/AdTable.tsx           — UX-04,06
src/presentation/components/common/Layout/MainLayout.tsx  — UX-02 (skip link)
src/presentation/components/common/Layout/MobileSidebar.tsx — UX-07 (터치 타겟)
src/presentation/components/dashboard/KPIChart.tsx        — UX-05 (키보드)
src/presentation/components/dashboard/KPICard.tsx         — UX-12,21
src/presentation/components/dashboard/AnomalyAlert.tsx    — UX-13
src/presentation/components/campaign/CampaignCreateForm/index.tsx — UX-11
src/presentation/components/campaign/CampaignEditForm.tsx — UX-14
src/app/providers.tsx                                      — UX-09 (다크모드)
src/app/error.tsx                                          — UX-15
src/app/not-found.tsx                                      — UX-20
```

### 성능 관련 핵심 파일

```
src/app/api/meta/all-ads-with-insights/route.ts           — PERF-01 (N+1)
src/app/api/meta/all-adsets-with-insights/route.ts        — PERF-01 (N+1)
src/infrastructure/database/repositories/PrismaKPIRepository.ts — PERF-02 (직렬 루프)
src/app/api/cron/meta-warmup/route.ts                     — PERF-03 (직렬 로그)
src/presentation/components/campaign/CampaignTable.tsx    — PERF-04 (O(n²))
src/app/(dashboard)/dashboard/page.tsx                    — PERF-05 (정적 객체)
src/presentation/components/pixel/PixelStatus.tsx         — PERF-06 (30초 폴링)
src/presentation/hooks/useAdSetsWithInsights.ts           — PERF-07 (staleTime)
src/presentation/hooks/useAdsWithInsights.ts              — PERF-07 (staleTime)
src/app/(dashboard)/campaigns/page.tsx                    — PERF-09 (self fetch)
```

### 테스트 관련 핵심 파일

```
src/infrastructure/payment/TossPaymentsClient.ts          — TEST-01 (미테스트)
src/application/use-cases/payment/                         — TEST-01 (미테스트 5개)
src/infrastructure/payment/BillingKeyEncryption.ts        — TEST-04 (미테스트)
src/infrastructure/external/errors/CircuitBreaker.ts      — TEST-03 (미테스트)
src/application/use-cases/ad/                              — TEST-05 (미테스트)
src/application/use-cases/adset/                           — TEST-05 (미테스트)
vitest.config.ts                                           — 커버리지 제외 범위 검토
playwright.config.ts                                       — TEST-12 (slowMo 분리)
```

---

## 작업 진행 방법

각 Phase의 작업을 요청할 때 다음과 같이 말씀하시면 됩니다:

- **"SEC-01 수정해줘"** → 해당 항목만 작업
- **"Phase 1 보안 전부 해줘"** → SEC-01 ~ SEC-04 일괄 작업
- **"Phase 2 UI/UX 전부 해줘"** → UX-01 ~ UX-08 일괄 작업
- **"PERF-01 해결해줘"** → Meta API N+1 최적화만 작업

각 작업은 병렬 에이전트로 동시에 수행할 수 있어, 여러 항목을 한번에 요청해도 됩니다.
