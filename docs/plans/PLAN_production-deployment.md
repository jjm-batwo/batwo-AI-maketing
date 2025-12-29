# Implementation Plan: 바투 AI 마케팅 솔루션 프로덕션 배포

**Status**: 🔄 **PLANNING**
**Created**: 2025-12-29
**Last Updated**: 2025-12-29
**Estimated Total Time**: 15-20시간

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
**바투 AI 마케팅 솔루션** MVP를 프로덕션 환경에 배포하기 위한 인프라 및 DevOps 구성.

**배포 스택**:
- **Frontend/Backend**: Vercel (Edge Network)
- **Database**: Supabase PostgreSQL
- **Monitoring**: Sentry + Vercel Analytics
- **CI/CD**: GitHub Actions → Vercel

### Success Criteria
- [ ] 프로덕션 환경에서 애플리케이션 정상 동작
- [ ] 모든 환경변수 안전하게 관리됨
- [ ] CI/CD 파이프라인이 자동으로 빌드/테스트/배포 수행
- [ ] 에러 추적 및 성능 모니터링 활성화
- [ ] 스테이징 환경에서 검증 후 프로덕션 배포 가능
- [ ] 롤백 전략 검증 완료
- [ ] Lighthouse Performance Score ≥90

### Current State Assessment
| 영역 | 현재 상태 | 준비도 |
|------|----------|--------|
| 환경 설정 | 개발환경만 존재 | 40% |
| Next.js 보안 | 최소 구성 | 30% |
| Docker | 개발용만 | 20% |
| CI/CD | 미구성 | 0% |
| 모니터링 | 미구성 | 0% |
| 데이터베이스 | 스키마 완성 | 85% |

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **Vercel** | Next.js 네이티브 지원, Edge Functions, 자동 Preview | vendor lock-in |
| **Supabase PostgreSQL** | 관리형 PostgreSQL, Connection Pooling, 백업 자동화 | 제한적 커스터마이징 |
| **Sentry** | 업계 표준 에러 추적, Next.js 공식 통합, 무료 티어 충분 | 추가 의존성 |
| **GitHub Actions** | GitHub 네이티브, Vercel 연동 용이, 무료 티어 충분 | GitHub 종속 |

### 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Preview   │    │   Staging   │    │  Production │     │
│  │ (PR Branch) │    │   (develop) │    │   (main)    │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
    ┌───────────────────────────────────────────────┐
    │              Supabase PostgreSQL               │
    │  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
    │  │ Preview │  │ Staging │  │ Production  │   │
    │  │   DB    │  │   DB    │  │ (Pooling)   │   │
    │  └─────────┘  └─────────┘  └─────────────┘   │
    └───────────────────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                 외부 서비스                 │
    │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
    │  │ Meta │  │OpenAI│  │Sentry│  │Google│  │
    │  │ Ads  │  │      │  │      │  │OAuth │  │
    │  └──────┘  └──────┘  └──────┘  └──────┘  │
    └───────────────────────────────────────────┘
```

---

## 📦 Dependencies

### New Dependencies to Install
```bash
# Sentry (에러 추적)
npm install @sentry/nextjs

# Rate Limiting (API 보호)
npm install @upstash/ratelimit @upstash/redis

# Environment Validation
npm install zod
```

### External Services Required
- [ ] Vercel 계정 및 프로젝트 생성
- [ ] Supabase 프로젝트 생성 (PostgreSQL)
- [ ] Sentry 프로젝트 생성
- [ ] GitHub 리포지토리 Vercel 연동
- [ ] Upstash Redis (Rate Limiting용) - Optional

---

## 🧪 Test Strategy

### Testing in CI/CD Pipeline
| Test Type | Stage | Timeout | Blocking |
|-----------|-------|---------|----------|
| Lint + Type Check | Build | 2min | Yes |
| Unit Tests | Test | 3min | Yes |
| Integration Tests | Test | 3min | Yes |
| E2E Tests | Post-Deploy | 5min | Yes (Staging) |

### Coverage Requirements
- 기존 테스트 커버리지 유지 (252 unit, 40 integration)
- E2E 테스트 주요 시나리오 100% 커버

---

## 🚀 Implementation Phases

### Phase 1: 환경 설정 및 시크릿 관리
**Goal**: 프로덕션용 환경변수 체계화 및 보안 관리
**Estimated Time**: 2-3시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Validation Setup**
- [ ] **Task 1.1**: 환경변수 검증 스키마 테스트 작성
  - File: `tests/unit/lib/env.test.ts`
  - Details: Zod 스키마로 환경변수 타입 안전성 테스트

**🟢 GREEN: Implementation**
- [ ] **Task 1.2**: 환경변수 검증 모듈 생성
  - File: `src/lib/env.ts`
  - Details:
    ```typescript
    // 런타임 환경변수 검증 (Zod)
    // 필수 변수 누락 시 빌드 실패
    // 타입 안전한 환경변수 접근
    ```

- [ ] **Task 1.3**: `.env.example` 프로덕션용 업데이트
  - File: `.env.example`
  - New Variables:
    ```env
    # App
    NODE_ENV=production
    NEXT_PUBLIC_APP_URL=https://batwo.ai

    # Database (Supabase)
    DATABASE_URL=postgresql://...?pgbouncer=true
    DIRECT_URL=postgresql://...  # migrations용

    # Auth
    NEXTAUTH_URL=https://batwo.ai
    NEXTAUTH_SECRET=  # openssl rand -base64 32

    # External APIs
    META_APP_ID=
    META_APP_SECRET=
    OPENAI_API_KEY=

    # OAuth Providers
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    KAKAO_CLIENT_ID=
    KAKAO_CLIENT_SECRET=

    # Monitoring
    SENTRY_DSN=
    NEXT_PUBLIC_SENTRY_DSN=
    SENTRY_AUTH_TOKEN=

    # Rate Limiting (Optional)
    UPSTASH_REDIS_REST_URL=
    UPSTASH_REDIS_REST_TOKEN=
    ```

- [ ] **Task 1.4**: `.env.local.example` 개발용 분리
  - File: `.env.local.example`
  - Details: 로컬 개발 전용 설정

- [ ] **Task 1.5**: Vercel 환경변수 설정 가이드 작성
  - File: `docs/deployment/VERCEL_ENV_SETUP.md`
  - Details: 환경별 시크릿 설정 방법

**🔵 REFACTOR: Cleanup**
- [ ] **Task 1.6**: 기존 코드에서 하드코딩된 값 제거
  - Files: 프로젝트 전체 스캔
  - Details: 모든 환경 의존적 값을 env.ts로 마이그레이션

#### Quality Gate ✋

**Build & Tests**:
- [ ] `npm run build` 성공 (환경변수 누락 시 실패해야 함)
- [ ] `npm test -- tests/unit/lib/env.test.ts` 통과
- [ ] 타입 체크 통과

**Validation Commands**:
```bash
npm run type-check
npm test -- tests/unit/lib/env.test.ts
npm run build
```

**Manual Checklist**:
- [ ] 모든 필수 환경변수가 `.env.example`에 문서화됨
- [ ] 민감한 정보가 코드에 하드코딩되지 않음

---

### Phase 2: 보안 강화 (Next.js 설정)
**Goal**: 프로덕션 수준의 보안 헤더 및 API 보호
**Estimated Time**: 2-3시간
**Status**: ✅ Complete (2025-12-29)
**Dependencies**: Phase 1 완료

#### Tasks

**🔴 RED: Security Tests**
- [x] **Task 2.1**: 보안 헤더 테스트 작성
  - File: `tests/e2e/security-headers.spec.ts`
  - Details: CSP, HSTS, X-Frame-Options 검증

**🟢 GREEN: Implementation**
- [x] **Task 2.2**: `next.config.ts` 보안 헤더 추가
  - File: `next.config.ts`
  - Details:
    ```typescript
    headers: async () => [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
    ```

- [x] **Task 2.3**: Content Security Policy (CSP) 설정
  - File: `next.config.ts`
  - Details: Meta Ads, OpenAI, OAuth 도메인 허용

- [x] **Task 2.4**: API Rate Limiting 미들웨어
  - File: `src/lib/middleware/rateLimit.ts`
  - Details:
    ```typescript
    // Upstash Redis 기반 또는 메모리 기반 폴백
    // API별 차등 제한 (일반: 100/min, AI: 10/min)
    ```

- [x] **Task 2.5**: 미들웨어에 Rate Limiting 통합
  - File: `middleware.ts`
  - Details: `/api/*` 경로에 적용

- [x] **Task 2.6**: CORS 정책 설정
  - File: `next.config.ts` or `middleware.ts`
  - Details: 허용 도메인 명시

**🔵 REFACTOR**
- [x] **Task 2.7**: 보안 설정 중앙화
  - File: `src/lib/security/config.ts`
  - Details: 모든 보안 설정을 한 곳에서 관리

#### Quality Gate ✋

**Build & Tests**:
- [x] `npm run build` 성공
- [x] 보안 헤더 E2E 테스트 작성 완료
- [x] Rate Limiting 동작 확인 (메모리 기반 폴백)

**Validation Commands**:
```bash
npm run build
npx playwright test tests/e2e/security-headers.spec.ts
curl -I https://staging.batwo.ai | grep -E "(Strict-Transport|X-Frame|Content-Security)"
```

**Security Checklist**:
- [x] OWASP Top 10 헤더 적용됨
- [x] API Rate Limiting 동작함
- [x] CORS 정책이 필요한 도메인만 허용

---

### Phase 3: CI/CD 파이프라인 구성
**Goal**: GitHub Actions + Vercel 자동 배포 파이프라인
**Estimated Time**: 3-4시간
**Status**: ⏳ Pending
**Dependencies**: Phase 1, 2 완료

#### Tasks

**🟢 GREEN: Implementation**
- [ ] **Task 3.1**: GitHub Actions 디렉토리 생성
  - Command: `mkdir -p .github/workflows`

- [ ] **Task 3.2**: CI 워크플로우 작성 (테스트/린트)
  - File: `.github/workflows/ci.yml`
  - Details:
    ```yaml
    name: CI
    on: [push, pull_request]
    jobs:
      lint:
        - npm run lint
        - npm run type-check
      test:
        - npm test
        - npm run test:int
      e2e:
        - npx playwright test (staging only)
    ```

- [ ] **Task 3.3**: Vercel 배포 설정
  - File: `vercel.json`
  - Details:
    ```json
    {
      "buildCommand": "npm run build",
      "framework": "nextjs",
      "regions": ["icn1"],  // 한국 리전
      "env": { /* Vercel 환경변수 참조 */ }
    }
    ```

- [ ] **Task 3.4**: Preview 배포 설정 (PR마다 자동)
  - Vercel Dashboard 설정
  - GitHub Integration 활성화

- [ ] **Task 3.5**: 브랜치 전략 설정
  - `main` → Production
  - `develop` → Staging
  - `feature/*` → Preview

- [ ] **Task 3.6**: 배포 성공/실패 Slack/Discord 알림 (Optional)
  - File: `.github/workflows/notify.yml`

**🔵 REFACTOR**
- [ ] **Task 3.7**: 워크플로우 캐싱 최적화
  - Details: npm cache, Playwright browsers cache

#### Quality Gate ✋

**CI/CD Validation**:
- [ ] PR 생성 시 CI 자동 실행됨
- [ ] 모든 체크 통과 시에만 머지 가능
- [ ] Staging 배포 자동화 동작
- [ ] Production 배포는 수동 승인 필요

**Validation Commands**:
```bash
# 로컬에서 CI 시뮬레이션
npm run lint && npm run type-check && npm test && npm run test:int

# Vercel CLI 테스트
npx vercel --prod --dry-run
```

---

### Phase 4: 데이터베이스 마이그레이션 전략
**Goal**: Supabase PostgreSQL 프로비저닝 및 마이그레이션 자동화
**Estimated Time**: 2-3시간
**Status**: ⏳ Pending
**Dependencies**: Phase 1 완료

#### Tasks

**🟢 GREEN: Implementation**
- [ ] **Task 4.1**: Supabase 프로젝트 생성
  - Platform: Supabase Dashboard
  - Details: 서울 리전 선택, Connection Pooling 활성화

- [ ] **Task 4.2**: Prisma 설정 업데이트 (Connection Pooling)
  - File: `prisma/schema.prisma`
  - Details:
    ```prisma
    datasource db {
      provider  = "postgresql"
      url       = env("DATABASE_URL")      // Pooler URL
      directUrl = env("DIRECT_URL")        // Direct URL (migrations)
    }
    ```

- [ ] **Task 4.3**: 마이그레이션 스크립트 작성
  - File: `scripts/migrate.sh`
  - Details:
    ```bash
    #!/bin/bash
    # 프로덕션 마이그레이션 (백업 → 마이그레이션 → 검증)
    ```

- [ ] **Task 4.4**: 롤백 스크립트 작성
  - File: `scripts/rollback.sh`
  - Details: 마이그레이션 실패 시 복구 절차

- [ ] **Task 4.5**: Seed 데이터 프로덕션용 분리
  - File: `prisma/seed.ts`
  - Details: 환경별 분기 (dev: 테스트 데이터, prod: 필수 데이터만)

- [ ] **Task 4.6**: CI에 마이그레이션 자동화 추가
  - File: `.github/workflows/migrate.yml`
  - Details: Staging 배포 시 자동 마이그레이션

**🔵 REFACTOR**
- [ ] **Task 4.7**: 마이그레이션 문서화
  - File: `docs/deployment/DATABASE_MIGRATION.md`

#### Quality Gate ✋

**Database Validation**:
- [ ] Supabase 연결 성공 (개발 환경에서 테스트)
- [ ] Connection Pooling 동작 확인
- [ ] 마이그레이션 성공
- [ ] 롤백 테스트 완료

**Validation Commands**:
```bash
# 마이그레이션 드라이런
npx prisma migrate deploy --dry-run

# 스키마 검증
npx prisma validate

# 연결 테스트
npx prisma db pull
```

---

### Phase 5: 모니터링 및 에러 추적
**Goal**: Sentry + Vercel Analytics 통합
**Estimated Time**: 2-3시간
**Status**: ⏳ Pending
**Dependencies**: Phase 1, 3 완료

#### Tasks

**🔴 RED: Monitoring Tests**
- [ ] **Task 5.1**: 에러 리포팅 테스트 작성
  - File: `tests/unit/lib/sentry.test.ts`
  - Details: Sentry 초기화 및 에러 캡처 검증

**🟢 GREEN: Implementation**
- [ ] **Task 5.2**: Sentry 설치 및 초기화
  - Command: `npx @sentry/wizard@latest -i nextjs`
  - Files Generated:
    - `sentry.client.config.ts`
    - `sentry.server.config.ts`
    - `sentry.edge.config.ts`

- [ ] **Task 5.3**: Sentry 환경 설정
  - File: `sentry.client.config.ts`
  - Details:
    ```typescript
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,  // 10% 트레이싱
      replaysSessionSampleRate: 0.1,
    })
    ```

- [ ] **Task 5.4**: 커스텀 에러 바운더리 강화
  - File: `src/app/error.tsx`
  - Details: Sentry에 추가 컨텍스트 전송

- [ ] **Task 5.5**: API 에러 자동 리포팅
  - File: `src/lib/errors/reportError.ts`
  - Details: API Route에서 에러 발생 시 자동 캡처

- [ ] **Task 5.6**: 헬스체크 엔드포인트 생성
  - File: `src/app/api/health/route.ts`
  - Details:
    ```typescript
    // GET /api/health
    // - Database 연결 상태
    // - 외부 API 상태 (Meta, OpenAI)
    // - 메모리/CPU 사용량 (optional)
    ```

- [ ] **Task 5.7**: Vercel Analytics 활성화
  - File: `src/app/layout.tsx`
  - Details: `@vercel/analytics` 패키지 추가

**🔵 REFACTOR**
- [ ] **Task 5.8**: 민감한 데이터 필터링
  - Details: Sentry에 비밀번호, API 키 등 전송 방지

#### Quality Gate ✋

**Monitoring Validation**:
- [ ] Sentry Dashboard에서 테스트 에러 확인
- [ ] Source Maps 업로드 성공
- [ ] 헬스체크 엔드포인트 동작
- [ ] Vercel Analytics 데이터 수집 확인

**Validation Commands**:
```bash
# Sentry 테스트 에러 발생
curl -X POST https://staging.batwo.ai/api/test-error

# 헬스체크
curl https://staging.batwo.ai/api/health

# Sentry Source Maps 업로드 확인
npx sentry-cli sourcemaps list
```

---

### Phase 6: 스테이징 환경 및 점진적 롤아웃
**Goal**: 스테이징 검증 프로세스 및 프로덕션 체크리스트
**Estimated Time**: 2-3시간
**Status**: ⏳ Pending
**Dependencies**: Phase 1-5 완료

#### Tasks

**🟢 GREEN: Implementation**
- [ ] **Task 6.1**: 스테이징 환경 프로비저닝
  - Vercel: `develop` 브랜치 → staging.batwo.ai
  - Supabase: 별도 스테이징 DB

- [ ] **Task 6.2**: 스테이징 전용 환경변수 설정
  - Vercel Dashboard → Environment Variables
  - Details: Staging 환경에만 적용되는 변수

- [ ] **Task 6.3**: E2E 테스트 스테이징 자동 실행
  - File: `.github/workflows/e2e-staging.yml`
  - Details: Staging 배포 후 자동 E2E 테스트

- [ ] **Task 6.4**: 프로덕션 배포 체크리스트 작성
  - File: `docs/deployment/PRODUCTION_CHECKLIST.md`
  - Details:
    ```markdown
    ## 프로덕션 배포 전 체크리스트
    - [ ] 스테이징에서 전체 기능 테스트 완료
    - [ ] E2E 테스트 100% 통과
    - [ ] 성능 테스트 (Lighthouse ≥90)
    - [ ] 보안 스캔 완료
    - [ ] 데이터베이스 백업 확인
    - [ ] 롤백 계획 준비됨
    - [ ] 팀 알림 완료
    ```

- [ ] **Task 6.5**: 롤백 전략 문서화
  - File: `docs/deployment/ROLLBACK_STRATEGY.md`
  - Details:
    ```markdown
    ## 즉시 롤백 (1분 이내)
    - Vercel Instant Rollback 사용

    ## 데이터베이스 롤백
    - 마이그레이션 롤백 스크립트 실행
    - Supabase Point-in-time Recovery
    ```

- [ ] **Task 6.6**: 프로덕션 배포 워크플로우
  - File: `.github/workflows/deploy-production.yml`
  - Details: 수동 승인 후 프로덕션 배포

**🔵 REFACTOR**
- [ ] **Task 6.7**: 배포 문서 통합
  - File: `docs/deployment/README.md`
  - Details: 모든 배포 문서 인덱스

#### Quality Gate ✋

**Final Validation**:
- [ ] 스테이징 환경 완전히 독립적
- [ ] E2E 테스트 자동 실행됨
- [ ] 프로덕션 배포 체크리스트 모든 항목 검증 가능
- [ ] 롤백 테스트 완료

**Validation Commands**:
```bash
# 스테이징 E2E 테스트
PLAYWRIGHT_BASE_URL=https://staging.batwo.ai npx playwright test

# Lighthouse 성능 테스트
npx lighthouse https://staging.batwo.ai --output=json --output-path=./lighthouse-report.json

# 보안 스캔
npx snyk test
```

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Supabase 연결 풀 소진 | Medium | High | PgBouncer 사용, 연결 모니터링 |
| 마이그레이션 실패 | Low | Critical | 롤백 스크립트, 백업 확인 |
| Vercel 빌드 타임아웃 | Low | Medium | 빌드 최적화, 캐싱 |
| API Rate Limit 초과 (Meta/OpenAI) | Medium | Medium | 쿼터 모니터링, 재시도 로직 |
| 환경변수 누락 | Low | High | 빌드 시 검증, 체크리스트 |

---

## 🔄 Rollback Strategy

### Phase 1-2 실패 시
- Git: `git checkout HEAD~1`
- 환경변수: 이전 버전으로 복구

### Phase 3 실패 시
- GitHub Actions: 워크플로우 비활성화
- Vercel: 이전 배포로 Instant Rollback

### Phase 4 실패 시
- Prisma: `npx prisma migrate resolve --rolled-back`
- Supabase: Point-in-time Recovery

### Phase 5 실패 시
- Sentry: 설정 제거 또는 비활성화
- 앱 기능에는 영향 없음

### Phase 6 (프로덕션) 실패 시
- Vercel Instant Rollback (1분 이내)
- 데이터베이스: 백업에서 복구

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ✅ 100% (환경 설정) - 2025-12-29 완료
- **Phase 2**: ✅ 100% (보안 강화) - 2025-12-29 완료
- **Phase 3**: ⏳ 0% (CI/CD)
- **Phase 4**: ⏳ 0% (데이터베이스)
- **Phase 5**: ⏳ 0% (모니터링)
- **Phase 6**: ⏳ 0% (스테이징/롤아웃)

**Overall Progress**: 33% complete (2/6 phases)

---

## 📁 Critical Files to Modify

### New Files to Create
```
src/lib/env.ts                           # 환경변수 검증
src/lib/middleware/rateLimit.ts          # Rate Limiting
src/lib/security/config.ts               # 보안 설정
src/lib/errors/reportError.ts            # 에러 리포팅
src/app/api/health/route.ts              # 헬스체크

.github/workflows/ci.yml                 # CI 파이프라인
.github/workflows/deploy-production.yml  # 프로덕션 배포
.github/workflows/e2e-staging.yml        # 스테이징 E2E

scripts/migrate.sh                       # 마이그레이션 스크립트
scripts/rollback.sh                      # 롤백 스크립트

docs/deployment/README.md                # 배포 문서 인덱스
docs/deployment/VERCEL_ENV_SETUP.md      # 환경변수 가이드
docs/deployment/DATABASE_MIGRATION.md    # DB 마이그레이션 가이드
docs/deployment/PRODUCTION_CHECKLIST.md  # 프로덕션 체크리스트
docs/deployment/ROLLBACK_STRATEGY.md     # 롤백 전략
```

### Existing Files to Modify
```
.env.example                             # 프로덕션 변수 추가
next.config.ts                           # 보안 헤더, 최적화
middleware.ts                            # Rate Limiting 통합
prisma/schema.prisma                     # Connection Pooling
prisma/seed.ts                           # 환경별 시드 분리
src/app/layout.tsx                       # Analytics 추가
src/app/error.tsx                        # Sentry 통합
vercel.json                              # 배포 설정 (생성)
```

---

## 📝 Notes & Learnings

### Implementation Notes

#### Phase 2 (보안 강화) - 2025-12-29
- **보안 설정 중앙화**: `src/lib/security/config.ts`에 모든 보안 관련 설정 통합
  - CSP 디렉티브, CORS 설정, Rate Limit 설정
  - 개발/프로덕션 환경에 따른 동적 설정
- **Rate Limiting**: Upstash Redis 옵셔널 + 메모리 폴백 구현
  - 개발 환경에서는 경고 없이 메모리 폴백 사용
  - API별 차등 제한: 일반(100/min), AI(10/min), Auth(5/min), Campaign(5/hour)
- **NextAuth 미들웨어 통합**: `auth()` 래퍼 패턴으로 Rate Limiting 및 CORS 통합
- **E2E 테스트**: Playwright로 OWASP 권장 보안 헤더 검증

### Blockers Encountered

#### Phase 2
- **TypeScript 에러 (NextAuth)**: `auth()` 래퍼 패턴으로 해결
- **Upstash 옵셔널 임포트**: `@ts-expect-error` + 동적 import + try-catch로 해결

### Post-Deployment Tasks
- [ ] 도메인 SSL 인증서 확인
- [ ] DNS 설정 완료
- [ ] SEO 메타 태그 검증
- [ ] 소셜 미디어 OG 이미지 테스트
- [ ] Google Search Console 등록
- [ ] Kakao 비즈니스 채널 연동

---

## 📚 References

### Documentation
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Prisma Deploy](https://www.prisma.io/docs/guides/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)

### Related Files
- MVP 구현 계획: `docs/plans/PLAN_batwo-ai-marketing.md`
- Prisma 스키마: `prisma/schema.prisma`

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All phases completed with quality gates passed
- [ ] Production deployment successful
- [ ] Monitoring dashboards operational
- [ ] Rollback tested and documented
- [ ] Team trained on deployment process
- [ ] Documentation complete and reviewed

---

**Plan Status**: 🔄 **READY FOR IMPLEMENTATION**
**Estimated Completion**: 15-20시간
**Blocked By**: None
