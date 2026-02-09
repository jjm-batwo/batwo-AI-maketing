# 바투 AI 마케팅 솔루션 - Claude 지침

## 언어 규칙
- **모든 응답, 작업 내용, 커밋 메시지, 문서 작성은 한국어로 작성**
- 코드 주석도 한국어 우선 (기술 용어는 영문 허용)
- 사용자와의 대화는 항상 한국어로 진행

## 프로젝트 개요
커머스 사업자를 위한 AI 마케팅 대행 솔루션. Meta 광고 캠페인 자동화, KPI 대시보드, 주간 보고서 생성.

## 기술 스택
- **Framework**: Next.js 16.1 (App Router, Turbopack)
- **Runtime**: React 19.2 + React Compiler
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL + Prisma 7.x
- **Auth**: NextAuth.js v5 (beta)
- **UI**: shadcn/ui + Tailwind CSS 4
- **State**: Zustand 5 + TanStack Query 5
- **Testing**: Vitest 4 + Playwright 1.57

## 클린 아키텍처 구조

```
src/
├── domain/           # 핵심 비즈니스 로직 (외부 의존성 없음)
│   ├── entities/     # Campaign, Report, KPI
│   ├── value-objects/# Money, DateRange
│   └── repositories/ # 인터페이스 (포트)
│
├── application/      # 유스케이스
│   ├── use-cases/    # CreateCampaign, GenerateReport
│   ├── dto/          # Data Transfer Objects
│   └── ports/        # 외부 서비스 인터페이스
│
├── infrastructure/   # 어댑터 구현
│   ├── database/     # Prisma 리포지토리
│   ├── external/     # Meta Ads, OpenAI
│   └── auth/         # NextAuth 설정
│
├── presentation/     # UI 계층
│   ├── components/   # React 컴포넌트
│   ├── hooks/        # 커스텀 훅
│   └── stores/       # Zustand 스토어
│
└── app/              # Next.js App Router
```

**의존성 규칙**: domain ← application ← infrastructure/presentation

## TDD 개발 방식

### 필수 프로세스
```
🔴 RED    → 실패하는 테스트 먼저 작성
🟢 GREEN  → 테스트 통과하는 최소 구현
🔵 REFACTOR → 코드 정리 (테스트 유지)
```

### 테스트 구조
```
tests/
├── unit/           # 단위 테스트 (domain, application)
├── integration/    # 통합 테스트 (repositories)
└── e2e/            # E2E 테스트 (Playwright)
```

### 커버리지 목표
- Domain: ≥95%
- Application: ≥90%
- Infrastructure: ≥85%
- E2E: 주요 시나리오 100%

## 주요 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 빌드
npm run type-check   # 타입 체크
npm run lint         # ESLint
npm test             # 단위 테스트
npm run test:int     # 통합 테스트
npx playwright test  # E2E 테스트
```

## MVP 사용량 제한
- 캠페인 생성: 5회/주
- AI 카피 생성: 20회/일
- AI 분석: 5회/주

## 계획 수립 규칙

**기능 구현 계획 시 반드시 `/feature-planner` 스킬 사용**:
- 새 기능 구현 요청 시 → `/feature-planner` 실행
- 복잡한 리팩토링 계획 시 → `/feature-planner` 실행
- 다단계 작업 계획 시 → `/feature-planner` 실행

```bash
# 예시
/feature-planner "사용자 인증 시스템 구현"
/feature-planner "Meta Ads API 연동"
```

계획 파일은 `docs/plans/` 디렉토리에 저장됩니다.

## TCREI 프롬프트 프레임워크

> 구조화된 프롬프트로 AI 코드 생성 품질을 높입니다.

### TCREI 구성요소

| 요소 | 설명 |
|------|------|
| **R** (Role) | AI가 수행할 전문가 역할 |
| **C** (Context) | 프로젝트 상황 및 제약조건 |
| **T** (Task) | 구체적인 작업 지시 |
| **E** (Examples) | 참조 코드 및 패턴 |
| **I** (Input/Format) | 입출력 형식 |

### 기본 역할 정의

| 역할 | 전문 분야 | 위치 |
|------|----------|------|
| **도메인 모델러** | 엔티티, 값 객체, 도메인 오류 | `src/domain/` |
| **API 설계자** | Route Handlers, UseCase, DTO | `src/app/api/` |
| **React UI 엔지니어** | shadcn/ui, Tailwind CSS 4 | `src/presentation/` |
| **TDD 전문가** | Vitest, Playwright | `tests/` |

### TCREI 명령어

```
/tcrei entity [EntityName]       도메인 엔티티 생성
/tcrei api [경로] [메서드]        API 엔드포인트 생성
/tcrei component [ComponentName] UI 컴포넌트 생성
/tcrei bugfix [경로] [설명]      TDD 기반 버그 수정
```

> `/기능요청`, `/버그신고` 시 TCREI 템플릿이 자동 적용됩니다.

상세 템플릿: `docs/ai-team/tcrei-templates.md`

## 바투 AI 개발팀 시스템

**모든 개발 관련 요청은 AI 개발팀을 통해 처리**

### 팀 구성
| 역할 | 담당 업무 | 자동 실행 |
|------|----------|----------|
| **총괄 PM** | 모든 요청 접수, 작업 분배 | 항상 |
| **품질 관리자** | 테스트 실행, 품질 검증 | 코드 변경 후 |
| **보안 책임자** | 보안 검사, 취약점 탐지 | API/인증 변경 시 |
| **분석 담당** | 오류 분석, 성능 모니터링 | 에러 발생 시 |
| **설계 담당** | 아키텍처 검토 | 새 기능 요청 시 |
| **개발 담당** | 기능 구현 | 구현 요청 시 |
| **문서 담당** | 변경사항 기록 | 모든 작업 완료 후 |

### 기본 명령어
```
/상태          현재 시스템 상태 확인
/기능요청      새 기능 요청 (→ PM Agent → Feature Planner 자동 실행)
/버그신고      버그 신고 (→ QA Agent 자동 분석)
/검증          모든 품질 검사 실행
/배포          프로덕션 배포 (승인 필요)
/보고서        일일 또는 주간 보고서 생성
```

### 정보 확인 명령어
```
/변경사항      최근 코드 변경 내역
/진행상황      진행 중인 작업 목록
/품질          테스트 커버리지, 린트 결과
/보안          보안 검사 결과
```

### 작업 명령어
```
/수정 #123     Issue #123 수정 시작
/승인          대기 중인 작업 승인
/거부          대기 중인 작업 거부
/롤백          이전 버전으로 복원
/문의          도움말 표시
```

### 자동 워크플로우
- **기능 요청** → PM Agent 접수 → 설계 담당 검토 → 개발 담당 구현 → 품질 관리자 검증 → 문서 담당 기록
- **버그 신고** → PM Agent 접수 → 분석 담당 조사 → 개발 담당 수정 → 품질 관리자 검증
- **코드 변경** → 자동 테스트 → 보안 검사 (API/인증 변경 시) → 빌드 검증

### Plan Mode 에이전트 자동 연동

> **Plan Mode 진입 시 개발 에이전트가 자동으로 활성화됩니다.**

#### 에이전트 자동 선택 규칙

| Task 키워드 | 활성화 에이전트 | TCREI 템플릿 |
|------------|----------------|--------------|
| entity, 엔티티, domain, 도메인 | 설계 담당 → 개발 담당 | `/tcrei entity` |
| api, route, endpoint | 설계 담당 → 개발 담당 → 보안 책임자 | `/tcrei api` |
| component, 컴포넌트, ui, 화면 | 설계 담당 → 개발 담당 | `/tcrei component` |
| bug, fix, 버그, 수정, 오류 | 분석 담당 → 개발 담당 | `/tcrei bugfix` |
| test, 테스트, 검증 | 품질 관리자 | - |
| security, auth, 보안, 인증 | 보안 책임자 → 개발 담당 | `/tcrei api` |
| refactor, 리팩토링 | 설계 담당 → 개발 담당 → 품질 관리자 | - |
| deploy, 배포 | PM → 품질 관리자 → 보안 책임자 | - |

#### Plan Mode 실행 흐름

```
Plan Mode 진입
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 1. PM Agent 활성화                               │
│    - Task 키워드 분석                            │
│    - 적절한 에이전트 선택                         │
│    - TCREI 템플릿 자동 적용                       │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 2. 설계 담당 (해당 시)                           │
│    - 아키텍처 검토                               │
│    - 의존성 분석                                 │
│    - 구현 계획 수립                              │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 3. Plan 파일 생성                                │
│    - .claude/plans/ 디렉토리에 저장              │
│    - TCREI 형식으로 구조화                       │
│    - 에이전트별 작업 항목 명시                    │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 4. 사용자 승인 대기                              │
│    - Plan 검토 요청                              │
│    - 수정 사항 반영                              │
└─────────────────────────────────────────────────┘
    │
    ▼
Plan Mode 종료 → 실행 단계 (에이전트 순차 작동)
```

#### 예시: 기능 구현 Plan Mode

```
사용자: "주문 엔티티 구현해줘"
    │
    ▼
[PM Agent 활성화]
├── 키워드 분석: "엔티티" → 설계 담당 + 개발 담당
├── TCREI 템플릿: /tcrei entity Order
└── 작업 분배:
    ├── 설계 담당: Order 엔티티 설계 검토
    ├── 개발 담당: TDD 기반 구현
    ├── 품질 관리자: 테스트 커버리지 검증
    └── 문서 담당: 변경사항 기록
```

### 승인 필요 작업
| 작업 유형 | 이유 |
|----------|------|
| 데이터베이스 변경 | 데이터 구조 영향 |
| API 변경 | 외부 연동 영향 |
| 새 라이브러리 | 보안/호환성 |
| 보안 변경 | 인증/권한 영향 |
| 프로덕션 배포 | 실서비스 영향 |

### 사용자 가이드
상세 사용법: `docs/ai-team/user-guide-ko.md`

## UX/UI 디자인 팀

**홈페이지 및 랜딩 페이지 UX/UI 개선 전문 에이전트**

### UX/UI 팀 구성
| 역할 | 담당 업무 | 자동 실행 |
|------|----------|----------|
| **UX 리서처** | 사용자 여정 분석, A/B 테스트 설계 | audit 모드 |
| **UI 디자이너** | 컴포넌트 설계, 비주얼 개선 | design 모드 |
| **접근성 전문가** | WCAG 2.1 AA 검증 | 모든 UI 변경 후 |
| **전환 최적화** | CTA 개선, 이탈률 분석 | --focus conversion |

### UX/UI 명령어
```
/ux감사          홈페이지 전체 UX/UI 분석
/ux개선 [섹션]   특정 섹션 개선 제안
/ux구현 [섹션]   승인된 디자인 구현
/접근성검사      WCAG 2.1 AA 검증
/전환율분석      CTA 및 전환 퍼널 분석
```

### SuperClaude 스킬
```bash
/sc:ux-studio [target] --mode [audit|design|implement] --focus [conversion|accessibility|mobile]
```

### UX/UI 자동 워크플로우
- **감사** → Playwright 캡처 → 4 페르소나 분석 → 우선순위 매트릭스 → 보고서
- **개선** → 현황 분석 → 옵션 제안 → 접근성 검증 → 사용자 승인
- **구현** → TDD (RED → GREEN → REFACTOR) → Playwright 검증

### 랜딩 페이지 구조
```
src/presentation/components/landing/
├── LandingHeader.tsx      # 네비게이션
├── HeroSection.tsx        # 메인 헤로우
├── SocialProofSection.tsx # 신뢰 지표
├── FeaturesSection.tsx    # 기능 소개
├── ProductShowcaseSection.tsx
├── HowItWorksSection.tsx  # 사용 방법
├── TestimonialsSection.tsx # 후기
├── PricingSection.tsx     # 가격
├── FAQSection.tsx         # FAQ
├── CTASection.tsx         # 최종 CTA
└── LandingFooter.tsx      # 푸터
```

## 픽셀 설치 기능

### 개요
Meta 픽셀 원클릭 설치 기능. 커머스 사업자가 버튼 한 번으로 픽셀 설치를 완료할 수 있음.

### 도메인 엔티티
```
src/domain/entities/
├── MetaPixel.ts              # 픽셀 설정 엔티티
├── PlatformIntegration.ts    # 플랫폼 연동 엔티티 (카페24)
└── ConversionEvent.ts        # CAPI 전환 이벤트 엔티티
```

### 주요 API
| 엔드포인트 | 용도 |
|-----------|------|
| `GET /api/pixel` | 사용자 픽셀 목록 |
| `POST /api/pixel` | 픽셀 선택/저장 |
| `GET /api/pixel/[id]` | 픽셀 상세 |
| `GET /api/pixel/[id]/tracker.js` | 동적 추적 스크립트 |
| `POST /api/pixel/[id]/event` | 클라이언트 이벤트 수신 |
| `GET /api/platform/cafe24/auth` | 카페24 OAuth URL |
| `GET /api/platform/cafe24/callback` | OAuth 콜백 |
| `POST /api/webhooks/cafe24` | 카페24 주문 웹훅 |

### UI 컴포넌트
```
src/presentation/components/
├── pixel/
│   ├── PixelSelector.tsx         # 픽셀 선택 UI
│   ├── PixelStatus.tsx           # 픽셀 상태 표시
│   └── UniversalScriptCopy.tsx   # 스크립트 복사
└── onboarding/steps/
    └── PixelSetupStep.tsx        # 온보딩 3단계
```

### 온보딩 플로우
1. Welcome (환영)
2. Meta 연결
3. **픽셀 설치** (NEW)
4. 완료

### 환경 변수
```bash
# 카페24 API (선택)
CAFE24_CLIENT_ID=""
CAFE24_CLIENT_SECRET=""
CAFE24_REDIRECT_URI=""
```

## 참고 문서
- 상세 구현 계획: `docs/plans/PLAN_batwo-ai-marketing.md`
- 픽셀 기능 계획: `.claude/plans/rustling-chasing-wave.md`
- Prisma 스키마: `prisma/schema.prisma`
- 환경 변수: `.env.example`
