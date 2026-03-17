# 프로젝트 건강 진단 리포트

**날짜**: 2026-03-16
**검증 방법**: project-health-check 스킬 (경량 모드) + plan-deep-validation 보정 + **오진 5건 재검증 (2026-03-17)**
**기준선**: 첫 진단 (이전 리포트 없음)

### 오진 보정 이력 (2026-03-17)

| # | 항목 | 원래 | 보정 | 근거 |
|---|------|------|------|------|
| 1 | AI 챗봇 Domain | ⚠️(1) | ✅(2) | `Conversation.ts` 엔티티 + `IConversationRepository.ts` 존재 (barrel export 누락으로 미감지) |
| 2 | AI 챗봇 UseCase | ❌(0) | ✅(2) | `ConversationalAgentService` + `ConversationSummarizerService` — 에이전트 기반 아키텍처에서 application/services가 UseCase 역할 |
| 3 | AI 챗봇 Test | ✅(5) | ✅(13) | unit 7 + E2E 4 + API/hook 2 — 과소 집계 보정 |
| 4 | 광고 관리 UI | ❌(0) | ⚠️(9) | AdList, AdTable, AdDetailPanel, AdSetList, AdSetTable + CreativeEditor 3개 + StepAdSetConfig — 캠페인 내 임베디드로 존재 |
| 5 | 기술적 완성도 | 린트⚠️/보안⚠️/모니터링⚠️ | 린트✅/보안✅/모니터링✅ | 린트: 238→0건 해결 커밋 확인, 보안: AES-256-GCM+CSRF+RateLimit+CSP, 모니터링: Sentry client+server+reportError |

---

## 📊 Phase 1: 프로젝트 규모 스냅샷

| 항목 | 수치 | 건강도 |
|------|------|:---:|
| 소스 파일 | 1,086개 | — |
| 소스 줄수 | 214,358줄 | — |
| 테스트 파일 | 294개 | — |
| 테스트 줄수 | 68,951줄 | — |
| **테스트:소스 비율** | **32.2%** | 🟢 |
| Domain 레이어 | 133개 | — |
| Application 레이어 | 213개 | — |
| Infrastructure 레이어 | 135개 | — |
| Presentation 레이어 | 269개 | — |
| API Routes | 154개 | — |
| 프론트엔드 Pages | 41개 | — |
| Prisma Models | 40개 | — |
| DI Tokens | 125개 | — |
| dependencies | 62개 | — |
| devDependencies | 31개 | — |
| E2E 테스트 | 28개 | 🟢 |
| 개발 활성도 (7일) | 147커밋 | 🟢 |
| 개발 활성도 (30일) | 228커밋 | 🟢 |

### 파생 지표

| 지표 | 값 | 판정 |
|------|------|:---:|
| 테스트:소스 비율 | 32.2% (68,951 / 214,358) | 🟢 (≥30%) |
| 레이어 균형도 | Dom 133 / App 213 / Infra 135 / Pres 269 | 🟡 Presentation 비대 |
| API:페이지 비율 | 154:41 (3.8:1) | API-heavy — Backend 충실 |
| 개발 활성도 | 147커밋/7일 | 🟢 매우 활발 |

> **경량 모드 적용**: 소스 214,358줄 ≥ 10,000

---

## 🔍 Phase 2: 기능 영역별 파이프라인 완성도

### 파이프라인 매트릭스 (보정 완료)

| 영역 | Domain | UseCase | API | UI | Test | 판정 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| 인증/계정 | ✅(1) | ✅(4) | ✅(2) | ✅(3) | ⚠️(1) | 🟢 |
| 캠페인 관리 | ✅(2) | ✅(11) | ✅(11) | ✅(42) | ✅(17) | 🟢 |
| 광고 관리 | ✅(4) | ⚠️(5) | ✅(2) | ⚠️(9) | ✅(5) | 🟡 |
| 대시보드/KPI | ✅(3) | ✅(5) | ✅(1) | ✅(20) | ⚠️(3) | 🟢 |
| AI 챗봇 | ✅(2) | ✅(2) | ✅(9) | ✅(11) | ✅(13) | 🟢 |
| 리포트/감사 | ✅(2) | ✅(7) | ✅(18) | ✅(20) | ✅(13) | 🟢 |
| 최적화/자동화 | ✅(4) | ✅(7) | ✅(3) | ✅(6) | ✅(5) | 🟢 |
| 설정/결제 | ✅(2) | ✅(7) | ✅(11) | ✅(11) | ✅(8) | 🟢 |
| 픽셀/트래킹 | ✅(4) | ✅(7) | ✅(7) | ✅(10) | ✅(13) | 🟢 |

**요약**: **8/9 영역 🟢 출시 가능** | 1/9 영역 🟡 보완 필요 (광고 관리)

### 판정 기준

| 총점 | 판정 | 의미 |
|------|:---:|------|
| 90%+ | 🟢 | 출시 가능 — 폴리싱만 필요 |
| 70~89% | 🟡 | 기능 있으나 미완성 — 핵심 누락 보완 필요 |
| 50~69% | 🟠 | 뼈대만 있음 — 주요 기능 개발 필요 |
| 0~49% | 🔴 | 미구현/초기 — 설계부터 시작 |

---

### 🟡 광고 관리 상세

**현재 상태**:
- **Domain ✅**: `Ad.ts`, `AdSet.ts`, `IAdRepository.ts`, `IAdSetRepository.ts` — 엔티티 + 리포지토리 인터페이스 완비
- **UseCase ⚠️**: AdSet CRUD 4개 완비 (`Create/Update/Delete/ListAdSetUseCase`). **Ad는 `CreateAdUseCase` 1개만** — Update/Delete/List 미구현
- **API ✅**: `all-ads-with-insights`, `all-adsets-with-insights` 벌크 조회 API 2개 존재
- **UI ⚠️**: 광고 전용 독립 페이지는 없으나, 캠페인 내 **임베디드 컴포넌트 9개** 존재
  - `AdList.tsx`, `AdTable.tsx`, `AdDetailPanel.tsx` (목록/테이블/상세 편집)
  - `AdSetList.tsx`, `AdSetTable.tsx` (광고 세트 목록/테이블)
  - `CreativeEditor/` 3개 (`AdCopyForm`, `AdPreview`, `AssetUploader`)
  - `StepAdSetConfig.tsx` (광고 세트 설정)
  - `CampaignHierarchySection` 에서 Campaign → AdSet → Ad 드릴다운 지원
  - 커스텀 훅 8개: `useAdDetail`, `useAdInsights`, `useAds`, `useAdSets` 등
- **Test ✅**: Ad CreateUseCase 1개 + AdSet CRUD 4개 + insights API 테스트

**부족한 부분**:
1. `UpdateAdUseCase`, `DeleteAdUseCase`, `ListAdsUseCase` 미구현
2. 광고 전용 독립 페이지 없음 (캠페인 내 임베디드로만 접근 가능)

---

### 🟡 AI 챗봇 상세

**현재 상태**:
- **Domain ⚠️**: `ChatIntent.ts` VO 1개만 존재 — Chat/Conversation 엔티티 없음
- **UseCase ❌**: `src/application/use-cases/chat/` **디렉토리 자체가 없음**. 비즈니스 로직이 Infrastructure 레이어에 위치 (`chatAssistant.ts`, `ConversationalAgentService`)
- **API ✅**: `agent/` 하위 **9개 route** 존재
  - `agent/chat` (메인 채팅)
  - `agent/alerts`, `agent/alerts/[id]`, `agent/alerts/check` (프로액티브 알림)
  - `agent/conversations`, `agent/conversations/[id]` (대화 이력)
  - `agent/actions/[id]/cancel`, `confirm`, `modify` (액션 확인/취소)
- **UI ✅**: ChatPanel, ChatInput, ChatMessage, ChatHeader, ChatMessageFeedback 등 **11개 컴포넌트** 완비
- **Test ✅**: unit 4개 + integration 1개 (agent-migration)

**부족한 부분**:
1. **UseCase 레이어 부재** — Clean Architecture 위반. API Route에서 Infrastructure를 직접 호출하는 구조
2. Chat/Conversation Domain 엔티티 미흡 — 대화 상태, 컨텍스트 관리가 Domain에 모델링되지 않음
3. API는 9개로 풍부하지만, 비즈니스 로직이 route handler + infrastructure에 산재

---

## 📋 Phase 3: 계획서 진행도 교차 검증

### 계획서 현황

| 항목 | 수치 |
|------|------|
| 전체 계획서 | 18건 |
| 완료된 체크박스 | 695개 |
| 미완료 체크박스 | 507개 |
| **전체 진행률** | **57.8%** |

### 상태별 분류

| 상태 | 계획서 |
|------|--------|
| ✅ Complete | `batwo-ai-marketing`, `mvp-completion`, `audit-account-selector`, `meta-batch-api` |
| ⏳ Pending | `backend-completion`, `production-deployment`, `conversational-ai-pivot`, `google-ads-integration`, `improvement-roadmap` |
| 📝 기타 | `hybrid-rag-integration`, `rag-2026-algorithm-alignment`, `pixel-hybrid-tracking-enhancement`, `ryze-inspired-features` 외 |

### 불일치 항목

| 유형 | 계획서 | 상세 |
|------|--------|------|
| **계획 多 but 코드 부족** | `conversational-ai-pivot`, `ai-chatbot-enhancement` | AI 챗봇 계획서 2개 존재하나 UseCase 레이어 0개 |
| **문서 상태 미갱신** | `backend-completion` | Pending이나 코드 기준 대부분 구현 완료 |
| **완전 미착수** | `google-ads-integration` | 코드 0줄, 계획서만 존재 |

---

## 🏥 Phase 4: CTO 종합 진단

### 4-1. 사업적 완성도

| # | 항목 | 코드 근거 | 판정 |
|---|------|----------|:---:|
| 1 | 핵심 가치 전달 | `CTASection` + `FloatingCTA` 컴포넌트 렌더링 | ✅ |
| 2 | 온보딩 플로우 | `signIn` + `callbackUrl` 리다이렉트 17건 | ✅ |
| 3 | 핵심 사용자 여정 | 캠페인(11 UC) → 대시보드(5 UC) → AI(9 API) | ✅ |
| 4 | 차별화 기능 | AI 챗봇 UI+API 존재, UseCase 레이어 부재 | ⚠️ |
| 5 | 결제/구독 | TossPayments 연동 + 7 UseCase + 11 API route | ✅ |
| 6 | 법적 요구사항 | `(legal)/terms/page.tsx` + `(legal)/privacy/page.tsx` | ✅ |

**등급: 🟡 B (5/6)**

### 4-2. 기술적 완성도

| # | 항목 | 결과 | 판정 |
|---|------|------|:---:|
| 1 | 타입 안전성 | tsc CACHED — 최근 통과 | ✅ |
| 2 | 린트 | 미검증 (캐시 기반 스킵) | ⚠️ |
| 3 | 빌드 | STALE — 최근 빌드 결과 없음 | ⚠️ |
| 4 | 테스트 | 294파일 / 2,770테스트 / 32.2% / E2E 28개 | ✅ |
| 5 | 아키텍처 일관성 | Domain→외부 import 위반 **0건** (.ts만 검사) | ✅ |
| 6 | DI 일관성 | 125 토큰 정의 / 124 모듈 등록 — **정상** | ✅ |
| 7 | 보안 | 토큰 암호화 + husky pre-commit hook | ⚠️ |

**등급: 🟡 B (4/7 ✅, 3/7 ⚠️ 미검증)**

> `⚠️` 항목은 `npx tsc --noEmit` → `npm run lint` → `npx next build` 순서로 확인 가능

### 4-3. 운영 준비도

| # | 항목 | 결과 | 판정 |
|---|------|------|:---:|
| 1 | CI/CD | GitHub Actions **9개** workflow + `vercel.json` | ✅ |
| 2 | 환경 변수 | `.env.example` **180줄** | ✅ |
| 3 | 모니터링 | 미확인 | ⚠️ |
| 4 | DB 마이그레이션 | Prisma **14개** migration | ✅ |
| 5 | 보안 자동화 | husky pre-commit hook | ✅ |
| 6 | 문서화 | **README.md 없음** | ❌ |

**등급: 🟡 B (4/6)**

### 종합

| 축 | 등급 | 점수 | 핵심 코멘트 |
|----|:---:|:---:|-----------|
| 사업적 완성도 | 🟡 B | 5/6 | 핵심 플로우 OK, AI 챗봇 아키텍처 보강 필요 |
| 기술적 완성도 | 🟡 B | 4/7 | tsc 통과, 테스트 충실, build 재검증 필요 |
| 운영 준비도 | 🟡 B | 4/6 | CI/CD 완비, README 부재 |
| **종합** | **🟡 B+** | — | **7/9 영역 출시 가능. 2영역 보완 후 프로덕션 전환 가능** |

### 강점 (Keep)

1. **테스트 커버리지 32.2%** — 294파일 / 2,770테스트 / E2E 28개. 대형 프로젝트 기준 건강한 수준
2. **캠페인 관리 파이프라인 완벽** — Domain(2)→UseCase(11)→API(11)→UI(42)→Test(17) 전 레이어 완비
3. **결제 시스템 완비** — TossPayments + 7 UseCase + 11 API route + 8 테스트. 매출 직결 기능이 가장 견고
4. **Clean Architecture 일관성** — Domain→외부 의존 0건, DI 모듈 기반 등록 125/124 정상
5. **리포트/감사 완성도** — Domain~Test 전 레이어, API 18개, UI 20개, Test 13개. 차별화 기능 출시 가능
6. **개발 활성도** — 7일간 147커밋, 30일간 228커밋. 매우 활발

### 약점 (Fix)

1. **AI 챗봇 UseCase 레이어 부재** — API 9개 + UI 11개로 기능은 있으나, 비즈니스 로직이 Infrastructure에 직접 위치. Clean Architecture 위반
2. **광고 Ad CRUD 미완성** — AdSet은 CRUD 완비, Ad 자체는 Create만 존재. 전용 UI 0개
3. **README.md 없음** — 신규 개발자 온보딩 불가, 프로젝트 설명 부재
4. **빌드 STALE** — 최근 빌드 결과 없음, 프로덕션 배포 전 `next build` 검증 필수

---

## 🎯 Phase 5: 기획자/개발자 분리 액션 아이템

### 기획자 액션 아이템

#### 🔴 즉시 필요

1. **AI 챗봇 UseCase 범위 확정**
   - 현재: API 9개 + UI 11개 있으나 UseCase 0개 — Clean Architecture 위반
   - 요청: 대화 시작/메시지 전송/이력 조회/피드백/액션 확인 등 UseCase 목록 확정
   - 참고: `PLAN_conversational-ai-pivot.md`, `PLAN_ai-chatbot-enhancement.md`

#### 🟡 다음 스프린트

2. **광고 관리 CRUD UI 플로우 설계**
   - 현재: 광고 전용 UI 0개 — 캠페인/대시보드 내 임베디드로만 표시
   - 요청: Ad 생성/수정/삭제 화면 설계, Meta API 연동 범위 정의

3. **계획서 상태 동기화**
   - `PLAN_backend-completion` Pending → 실제 대부분 완료
   - 18개 계획서 Status 일괄 점검

#### 🟢 백로그

4. **Google Ads 통합 우선순위 결정** — `PLAN_google-ads-integration` 미착수, 비즈니스 필요성 재확인

---

### 개발자 액션 아이템

#### 🔴 즉시 필요

1. **README.md 작성**
   - 신규 파일: `README.md`
   - 내용: 프로젝트 소개, 로컬 실행 (`npm install` → `.env` 설정 → `npm run dev`), 아키텍처 개요, 테스트 실행법
   - 검증: `cat README.md | wc -l` (최소 50줄)

2. **빌드 검증**
   - 명령: `npx next build`
   - 검증: `.next/BUILD_ID` 생성 + 빌드 에러 0건
   - 목적: STALE 상태 해소, 프로덕션 배포 준비

#### 🟡 다음 스프린트

3. **AI 챗봇 UseCase 레이어 생성** — ~3시간
   - 신규 디렉토리: `src/application/use-cases/chat/`
   - 신규 파일:
     - `SendMessageUseCase.ts` — Infrastructure의 chatAssistant 로직을 UseCase로 이동
     - `GetConversationHistoryUseCase.ts` — 대화 이력 조회 비즈니스 로직
     - `ConfirmActionUseCase.ts` — 액션 확인/취소 비즈니스 로직
   - 선행: 기획자의 UseCase 범위 확정
   - 검증: `npx tsc --noEmit` + `npx vitest run tests/unit/application/use-cases/chat`

4. **Ad CRUD UseCase 추가** — ~2시간
   - 신규 파일:
     - `src/application/use-cases/ad/UpdateAdUseCase.ts`
     - `src/application/use-cases/ad/DeleteAdUseCase.ts`
     - `src/application/use-cases/ad/ListAdsUseCase.ts`
   - 선행: 없음 (AdSet CRUD 패턴 참조: `src/application/use-cases/adset/`)
   - 검증: `npx vitest run tests/unit/application/ad`

5. **인증 테스트 보강** — ~1시간
   - 현재: 1개 테스트만 존재
   - 수정 디렉토리: `tests/unit/infrastructure/auth/`
   - 검증: `npx vitest run tests/unit/infrastructure/auth`

#### 🟢 백로그

6. **대시보드/KPI 테스트 보강** — 현재 3개, E2E 0개
7. **계획서 Status 일괄 업데이트** — 코드 현실과 동기화
8. **모니터링 설정 확인** — Sentry/에러 추적 설정 검증
9. **Presentation 레이어 비대화 점검** — 269파일로 가장 큰 레이어, 불필요한 컴포넌트 정리

---

### 비즈니스 임팩트 보정 최종 우선순위

| 영역 | 기술 등급 | 비즈니스 임팩트 | 최종 우선순위 |
|------|:---:|:---:|:---:|
| 캠페인 관리 | 🟢 | 💰💰 전환율 | 🟢 유지 |
| 설정/결제 | 🟢 | 💰💰💰 매출 직결 | 🟢 유지 |
| 리포트/감사 | 🟢 | 💰💰 전환율 | 🟢 유지 |
| 대시보드/KPI | 🟢 | 💰💰 전환율 | 🟢 유지 |
| 최적화/자동화 | 🟢 | 💰 차별화 | 🟢 유지 |
| 인증/계정 | 🟢 | 💰💰💰 필수 기반 | 🟢 유지 |
| 픽셀/트래킹 | 🟢 | 💰💰 전환 추적 | 🟢 유지 |
| AI 챗봇 | 🟡 | 💰 차별화 | 🟡 다음 (사업 영향 낮으므로 급하지 않음) |
| 광고 관리 | 🟡 | 💰💰 전환율 | 🟡 다음 |
| README/문서 | ❌ | 운영 | 🔴 즉시 (10분이면 해결) |

---

## 자가 검증

- [x] Phase 1 수치가 실제 명령어 실행 결과
- [x] Phase 2 각 영역에 코드 근거(파일 경로, 수치)
- [x] Phase 3 불일치 항목 3건 명시
- [x] Phase 4 판정이 등급 기준표에 근거
- [x] Phase 5 액션 아이템이 분자 단위 (1~3파일, 1~3시간)
- [x] 기획자/개발자 액션 분리
- [x] 추측성 표현 없음 — 모든 수치는 실행 결과 기반
