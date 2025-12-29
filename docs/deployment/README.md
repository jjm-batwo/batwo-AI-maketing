# 배포 문서

바투 AI 마케팅 솔루션의 배포 및 인프라 관련 문서입니다.

## 문서 목록

| 문서 | 설명 |
|------|------|
| [BRANCH_STRATEGY.md](./BRANCH_STRATEGY.md) | 브랜치 전략 및 배포 플로우 |
| [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) | Vercel 환경변수 설정 가이드 |
| [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) | 데이터베이스 마이그레이션 가이드 |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | 프로덕션 배포 체크리스트 |
| [ROLLBACK_STRATEGY.md](./ROLLBACK_STRATEGY.md) | 롤백 전략 가이드 |

---

## 빠른 시작

### 개발 환경 설정

```bash
# 의존성 설치
npm ci

# 환경변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

### Vercel CLI 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel link

# Preview 배포
vercel

# Production 배포
vercel --prod
```

---

## CI/CD 파이프라인

### GitHub Actions 워크플로우

| 워크플로우 | 트리거 | 설명 |
|-----------|--------|------|
| `ci.yml` | push, PR | Lint, 타입체크, 테스트, 빌드 |
| `e2e-staging.yml` | deployment_status | Staging 배포 후 E2E 테스트 |
| `migrate.yml` | workflow_dispatch, workflow_run | 데이터베이스 마이그레이션 |
| `deploy-production.yml` | workflow_dispatch | 수동 프로덕션 배포 |

### CI 파이프라인 흐름

```
Push/PR
  │
  ├─→ Lint & Type Check
  │
  ├─→ Unit Tests
  │
  ├─→ Integration Tests
  │
  └─→ Build
        │
        └─→ CI Success Gate
```

---

## 환경 구성

### 환경 목록

| 환경 | URL | 브랜치 | 데이터베이스 |
|------|-----|--------|-------------|
| Development | localhost:3000 | feature/* | Local/Docker |
| Staging | staging.batwo.ai | develop | Supabase Staging |
| Production | batwo.ai | main | Supabase Production |

### 필수 환경변수

```env
# 필수
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# 외부 API
META_APP_ID=
META_APP_SECRET=
OPENAI_API_KEY=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 모니터링
SENTRY_DSN=
```

---

## 트러블슈팅

### 빌드 실패 시

1. 로컬에서 빌드 테스트: `npm run build`
2. 환경변수 확인: `.env.example` 참조
3. 타입 에러 확인: `npm run type-check`

### 배포 실패 시

1. Vercel Dashboard에서 빌드 로그 확인
2. GitHub Actions 로그 확인
3. 롤백 고려: Vercel Instant Rollback

### 데이터베이스 연결 실패 시

1. DATABASE_URL 형식 확인
2. Connection Pooling 설정 확인
3. IP 화이트리스트 확인 (Supabase)

---

## 관련 링크

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Sentry Dashboard](https://sentry.io)
- [GitHub Actions](https://github.com/features/actions)
