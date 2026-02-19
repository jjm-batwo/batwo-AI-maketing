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

## TDD 개발 지침 (필수)

### 핵심 원칙
모든 기능 구현은 TDD 프로세스를 따른다. 테스트는 '살아있는 문서'로서 비즈니스 의도를 명확히 전달해야 한다.

### RED → GREEN → REFACTOR

**1단계: RED (테스트 먼저)**
- 프로덕션 코드 작성 전, 반드시 실패하는 테스트를 먼저 작성
- 테스트는 비즈니스 로직의 의도(Intent)를 담아야 함
- 컴파일 에러 또는 테스트 실패를 확인한 후 다음 단계로 진행

**2단계: GREEN (최소 구현)**
- 테스트를 통과시키는 최소한의 코드만 작성
- 테스트 미통과 상태에서 기능 확장 금지

**3단계: REFACTOR (정리)**
- 테스트 통과를 유지하면서 코드 정리
- 중복 제거, 네이밍 개선, 구조 정리

### Self-Healing 규칙
- 기존 코드 수정 시 테스트 실패 → **테스트를 약화시키지 말고, 구현 코드를 수정**
- 에러 메시지로 "어떤 비즈니스 로직이 깨졌는지" 추론하고 복구

### 테스트 네이밍 컨벤션
Given/When/Then이 자연어로 읽히도록 서술적 작성:
```typescript
// Good - 의도가 명확하게 읽힘
it('should_create_campaign_when_valid_budget_provided')
it('should_reject_campaign_when_weekly_limit_exceeded')
it('should_calculate_roas_with_discount_applied')

// Bad - 의도 불명확
it('test campaign')
it('works correctly')
```

### 테스트 구조 및 커버리지 목표
```
tests/
├── unit/           # domain (≥95%), application (≥90%)
├── integration/    # repositories (≥85%)
└── e2e/            # Playwright (주요 시나리오 100%)
```

### 레이어별 테스트 전략
| 레이어 | 도구 | 모킹 범위 | 예시 |
|--------|------|----------|------|
| Domain | Vitest | 없음 (순수 로직) | `Campaign.create()` 검증 |
| Application | Vitest | Repository 인터페이스 | `CreateCampaignUseCase` |
| Infrastructure | Vitest | DB (Prisma mock) | `PrismaCampaignRepo` |
| Presentation | Vitest + RTL | API 호출 | `CampaignForm` 렌더링 |
| E2E | Playwright | 없음 (실제 플로우) | 캠페인 생성 전체 흐름 |

### 에이전트 출력 형식
기능 구현 시 반드시 이 순서를 따를 것:
1. **[Test Code]** — 실패하는 테스트 작성 + 실패 확인
2. **[Reasoning]** — 이 테스트가 검증하는 비즈니스 요구사항 설명
3. **[Implementation]** — 테스트를 통과시키는 최소 구현 코드
4. **[Verify]** — 테스트 통과 확인 (`npx vitest run [파일]`)

## 주요 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 빌드
npm run type-check   # 타입 체크 (npx tsc --noEmit)
npm run lint         # ESLint
npm test             # 단위 테스트 (npx vitest run)
npm run test:int     # 통합 테스트
npx playwright test  # E2E 테스트
```

## 검증 기준
코드 변경 후 반드시 확인:
1. `npx tsc --noEmit` — 타입 체크 통과
2. `npx vitest run` — 전체 테스트 통과
3. `npx next build` — 빌드 성공

## MVP 사용량 제한
- 캠페인 생성: 5회/주
- AI 카피 생성: 20회/일
- AI 분석: 5회/주

## TCREI 프롬프트 프레임워크

구조화된 프롬프트로 AI 코드 생성 품질을 높인다.

| 요소 | 설명 |
|------|------|
| **R** (Role) | AI가 수행할 전문가 역할 |
| **C** (Context) | 프로젝트 상황 및 제약조건 |
| **T** (Task) | 구체적인 작업 지시 |
| **E** (Examples) | 참조 코드 및 패턴 |
| **I** (Input/Format) | 입출력 형식 |

기본 역할: 도메인 모델러(`src/domain/`), API 설계자(`src/app/api/`), React UI 엔지니어(`src/presentation/`), TDD 전문가(`tests/`)

상세 템플릿: `docs/ai-team/tcrei-templates.md`

## 랜딩 페이지 구조
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

### 온보딩 플로우
1. Welcome (환영) → 2. Meta 연결 → 3. **픽셀 설치** → 4. 완료

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
