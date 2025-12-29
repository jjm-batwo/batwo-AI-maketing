# Vercel 환경변수 설정 가이드

## 개요

바투 AI 마케팅 솔루션을 Vercel에 배포할 때 필요한 환경변수 설정 가이드입니다.

## 환경 구분

| 환경 | 브랜치 | 도메인 | 용도 |
|------|--------|--------|------|
| Production | `main` | batwo.ai | 실제 서비스 |
| Staging | `develop` | staging.batwo.ai | 배포 전 검증 |
| Preview | PR 브랜치 | pr-{n}.batwo.ai | PR 미리보기 |

## 환경변수 설정 방법

### 1. Vercel Dashboard에서 설정

1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 각 변수 추가 시 적용할 환경 선택 (Production, Preview, Development)

### 2. Vercel CLI로 설정

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel link

# 환경변수 추가 (인터랙티브)
vercel env add DATABASE_URL production

# 환경변수 조회
vercel env ls
```

---

## 필수 환경변수

### Database (Supabase)

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `DATABASE_URL` | All | Supabase Connection Pooling URL |
| `DIRECT_URL` | All | Supabase Direct URL (마이그레이션용) |

```
# Supabase Dashboard → Settings → Database → Connection string
# Transaction 모드 (6543 포트) 사용
DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Session 모드 (5432 포트) - 마이그레이션용
DIRECT_URL=postgresql://postgres.[project-id]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

### NextAuth.js

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `NEXTAUTH_URL` | All | 앱 URL (환경별로 다름) |
| `NEXTAUTH_SECRET` | All | 세션 암호화 키 (최소 32자) |

```bash
# Production
NEXTAUTH_URL=https://batwo.ai

# Staging
NEXTAUTH_URL=https://staging.batwo.ai

# 시크릿 생성
openssl rand -base64 32
```

### App Configuration

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `NODE_ENV` | All | 자동 설정됨 (Vercel) |
| `NEXT_PUBLIC_APP_URL` | All | 프론트엔드 앱 URL |

---

## 선택 환경변수

### Meta Ads API

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `META_APP_ID` | Production | Meta 앱 ID |
| `META_APP_SECRET` | Production | Meta 앱 시크릿 |

> ⚠️ Meta 광고 연동 기능 사용 시에만 필요

### OpenAI API

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `OPENAI_API_KEY` | Production | OpenAI API 키 |

> ⚠️ AI 카피 생성, 분석 기능 사용 시에만 필요

### OAuth Providers

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `GOOGLE_CLIENT_ID` | All | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | All | Google OAuth 시크릿 |
| `KAKAO_CLIENT_ID` | All | Kakao OAuth 앱 키 |
| `KAKAO_CLIENT_SECRET` | All | Kakao OAuth 시크릿 |

### Monitoring (Sentry)

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `SENTRY_DSN` | Production | Sentry 서버사이드 DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Production | Sentry 클라이언트 DSN |
| `SENTRY_AUTH_TOKEN` | Production | Sentry 인증 토큰 (Source Maps) |

### Rate Limiting (Upstash Redis)

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Upstash Redis 토큰 |

---

## 환경별 설정 예시

### Production 환경

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://batwo.ai

DATABASE_URL=postgresql://postgres.xxx:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres

NEXTAUTH_URL=https://batwo.ai
NEXTAUTH_SECRET=[production-secret]

META_APP_ID=[production-meta-app-id]
META_APP_SECRET=[production-meta-secret]
OPENAI_API_KEY=[production-openai-key]

SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Staging 환경

```env
NODE_ENV=production  # Staging도 production 모드로 빌드
NEXT_PUBLIC_APP_URL=https://staging.batwo.ai

DATABASE_URL=[staging-db-url]
DIRECT_URL=[staging-db-direct-url]

NEXTAUTH_URL=https://staging.batwo.ai
NEXTAUTH_SECRET=[staging-secret]

# 테스트용 API 키 사용
META_APP_ID=[test-meta-app-id]
OPENAI_API_KEY=[test-openai-key]
```

---

## 체크리스트

### 배포 전 확인사항

- [ ] `DATABASE_URL`이 올바른 Supabase 프로젝트를 가리킴
- [ ] `NEXTAUTH_SECRET`이 환경별로 다른 값 사용
- [ ] `NEXTAUTH_URL`이 실제 도메인과 일치
- [ ] Production에서 `SENTRY_DSN` 설정됨
- [ ] API 키들이 테스트/프로덕션 구분됨

### 보안 주의사항

- ⚠️ **절대 Git에 시크릿 커밋 금지**
- ⚠️ `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에 노출
- ⚠️ Preview 환경에서 프로덕션 DB 연결 금지
- ⚠️ 팀원 간 시크릿 공유 시 안전한 채널 사용 (1Password, Vault 등)

---

## 트러블슈팅

### "Invalid environment variables" 에러

```
❌ Invalid environment variables:
  DATABASE_URL: DATABASE_URL must be a valid PostgreSQL connection string
```

**해결**: Vercel Dashboard에서 해당 변수가 올바르게 설정되었는지 확인

### 데이터베이스 연결 실패

```
Error: Connection refused
```

**해결**:
1. Supabase Dashboard에서 IP 허용 목록 확인
2. Connection Pooling 설정 확인 (Transaction 모드 권장)

### NextAuth 세션 에러

```
[next-auth][error][CLIENT_FETCH_ERROR]
```

**해결**:
1. `NEXTAUTH_URL`이 실제 접속 도메인과 일치하는지 확인
2. HTTPS 사용 여부 확인

---

## 참고 링크

- [Vercel Environment Variables 문서](https://vercel.com/docs/environment-variables)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [Sentry Next.js Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
