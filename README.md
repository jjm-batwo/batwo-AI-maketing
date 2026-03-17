# 바투 (Batwo) — AI 마케팅 솔루션

커머스 사업자를 위한 **올인원 AI 마케팅 대행 SaaS**.
마케팅 지식 없이도 AI가 광고 캠페인 세팅부터 성과 분석·최적화까지 전 과정을 지원합니다.

---

## 주요 기능

| 카테고리 | 기능 |
|----------|------|
| **캠페인 관리** | Meta Ads 연동, 캠페인/애드셋/광고 생성·편집, 예산 관리 |
| **AI 분석** | 이상 탐지(Anomaly Detection), 근본 원인 분석, KPI 예측(ARIMA), 포트폴리오 최적화 |
| **AI 챗봇** | 2-Phase 스트리밍 대화형 에이전트, 의도 분류, 자연어로 캠페인 조작 |
| **자동화** | 최적화 규칙 엔진, 주간/월간 리포트, 예산 알림, 트렌드 알림 |
| **크리에이티브** | AI 광고 카피 생성, 카피 학습(A/B), 에셋 관리 |
| **인사이트** | 경쟁사 벤치마킹, 무료 감사(Audit) 리포트, 대시보드 커스터마이징 |
| **협업** | 팀 멤버 초대, RBAC 역할 관리, 알림 채널(Slack·카카오톡·이메일) |
| **결제** | 구독 플랜(FREE/STARTER/PRO/ENTERPRISE), 토스페이먼츠 정기결제 |

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, Radix UI, shadcn/ui |
| State | TanStack Query v5, Zustand, React Hook Form + Zod |
| Database | PostgreSQL (Supabase), Prisma 7, pgvector (RAG) |
| Auth | NextAuth.js v5 (Facebook · Google · Kakao OAuth) |
| AI | OpenAI API (ai SDK v6), Perplexity API |
| Payment | Toss Payments (정기결제 + 웹훅) |
| Cache | Redis / Upstash (Rate Limiting 포함) |
| Monitoring | Sentry, OpenTelemetry, Vercel Analytics |
| Testing | Vitest 4 (2,770+ 테스트), Playwright (E2E + a11y), MSW |
| Deploy | Vercel (서울 리전), GitHub Actions CI/CD |

---

## 아키텍처

Clean Architecture 기반 4-레이어 구조:

```
src/
├── domain/           # 엔티티, 값 객체, 도메인 서비스, 이벤트
├── application/      # 유즈케이스, 애플리케이션 서비스, 포트(인터페이스)
├── infrastructure/   # DB, 외부 API, 캐시, 이메일, 결제, 텔레메트리
├── presentation/     # 스마트 컴포넌트, 커스텀 훅, Zustand 스토어
├── app/              # Next.js App Router (페이지, API 라우트, 레이아웃)
├── components/ui/    # shadcn/ui 컴포넌트 라이브러리
├── lib/              # 유틸리티, DI, 보안, 검증 스키마, 미들웨어
└── i18n/             # 국제화 (next-intl)
```

**의존성 규칙**: `domain` ← `application` ← `infrastructure` / `presentation` ← `app`
외부 의존성은 `infrastructure`에서만 참조하며, `application`은 포트(인터페이스)를 통해 접근합니다.

---

## 로컬 실행

### 사전 요구사항

- **Node.js** v20+
- **npm** 11.9.0
- **PostgreSQL** (로컬 또는 [Supabase](https://supabase.com))

### 설치 및 실행

```bash
# 1. 의존성 설치
npm ci

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local을 열어 DATABASE_URL, NEXTAUTH_SECRET 등 필수 값 입력

# 3. Prisma 클라이언트 생성 + DB 스키마 반영
npx prisma generate
npx prisma db push        # 또는: npx prisma migrate dev

# 4. 개발 서버 실행
npm run dev               # → http://localhost:3000
```

> **Tip**: Meta API 없이 개발하려면 `.env.local`에 `META_MOCK_MODE="true"` 설정 (기본값).

### 주요 환경변수

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `DATABASE_URL` | ✅ | PostgreSQL 연결 문자열 |
| `DIRECT_URL` | ✅ | Prisma 마이그레이션용 Direct URL |
| `NEXTAUTH_SECRET` | ✅ | NextAuth 암호화 키 (`openssl rand -base64 32`) |
| `META_APP_ID` / `META_APP_SECRET` | ✅ | Meta Ads OAuth 앱 키 |
| `OPENAI_API_KEY` | ⬚ | AI 기능 사용 시 필요 |
| `CRON_SECRET` | ✅ | Vercel Cron 인증 (`openssl rand -base64 32`) |
| `TOSS_SECRET_KEY` | ⬚ | 결제 연동 시 필요 |
| `RESEND_API_KEY` | ⬚ | 이메일 발송 시 필요 |

전체 목록은 [`.env.example`](.env.example) 참조.

---

## 검증 & 테스트

```bash
# 빠른 검증 (≈15초) — push 전
make check-quick          # lint + type-check + unit test

# 전체 검증 (≈60초) — PR 전
make check-full           # + format + integration + build

# CI 미러링 — 모든 CI 검사
make check-ci             # + security audit

# 개별 실행
npm run lint              # ESLint
npm run type-check        # TypeScript (npx tsc --noEmit)
npm run test:run          # Vitest (전체)
npm run test:e2e          # Playwright E2E
npm run build             # 프로덕션 빌드
```

---

## 프로젝트 구조

```
├── .github/workflows/    # CI/CD (ci, deploy-gate, deploy-production, migrate 등)
├── docs/                 # 아키텍처, API, 배포, 구현 가이드 문서
├── prisma/               # Prisma 스키마 + 마이그레이션
├── public/               # 정적 에셋
├── scripts/              # Meta 앱 리뷰, 유틸리티 스크립트
├── src/                  # 소스 코드 (위 아키텍처 섹션 참조)
├── tests/                # E2E, Contract, Performance 테스트
├── Makefile              # CI 미러 검증 타겟
├── PRD.md                # 제품 요구사항 정의서
└── AGENTS.md             # 에이전트/서비스 문서
```

---

## 배포

**Vercel** (서울 리전, `main` 브랜치 자동 배포)

프로덕션 배포 시 필수 환경변수:
- `TOKEN_ENCRYPTION_KEY` (64자 hex)
- `AUDIT_HMAC_SECRET` (`openssl rand -hex 32`)
- `META_MOCK_MODE=false`
- `CRON_SECRET`

Cron 작업 (Vercel Cron):
| 스케줄 | 작업 |
|--------|------|
| 매일 00:00 | Meta API 워밍업 |
| 매일 01:00 | 이상 탐지 |
| 매일 02:00 | OAuth 토큰 갱신 |
| 매주 월요일 | 주간 리포트 생성 |

---

## 문서

- [`docs/`](docs/) — 아키텍처, API, 배포, 구현 상세 가이드
- [`PRD.md`](PRD.md) — 제품 요구사항 및 사용자 페르소나
- [`AGENTS.md`](AGENTS.md) — 서비스/에이전트 상세 문서

---

## 라이선스

Private — All rights reserved. Batwo Company.
