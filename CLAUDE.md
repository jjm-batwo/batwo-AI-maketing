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

## 모듈화된 규칙 (.claude/rules/)

기능별 상세 지침은 `.claude/rules/`에 분리되어 해당 파일 작업 시 자동 로드됩니다:

| 규칙 파일 | 로딩 조건 | 내용 |
|-----------|----------|------|
| `tdd.md` | `src/**/*.{ts,tsx}`, `tests/**` | TDD 지침, 검증 체크리스트, 증거 기반 완료 |
| `feature-pixel.md` | 픽셀 관련 파일 | 픽셀 설치, 온보딩, 카페24 연동 |
| `feature-landing.md` | 랜딩 컴포넌트 | 랜딩 페이지 구조, Evolving 상태 |
| `feature-optimization.md` | 최적화 관련 파일 | 규칙 엔진, 절감 금액, 크론 |
| `feature-audit.md` | 감사 관련 파일 | 무료 감사, OAuth, Rate Limit |
| `feature-chatbot.md` | 챗봇 관련 파일 | AI 어시스턴트, 인텐트, 레질리언스 |
| `feature-ads.md` | AdSet/Ad/Creative 파일 | 광고 소재, Advantage+ |

## 참고 문서
- 상세 구현 계획: `docs/plans/PLAN_batwo-ai-marketing.md`
- 픽셀 기능 계획: `.claude/plans/rustling-chasing-wave.md`
- Prisma 스키마: `prisma/schema.prisma`
- 환경 변수: `.env.example`
