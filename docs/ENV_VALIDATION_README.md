# 환경변수 중앙 검증 시스템

> 타입 안전한 환경변수 관리로 런타임 에러를 방지하고 개발자 경험을 개선합니다.

## 빠른 시작

### 1. 환경변수 파일 설정

```bash
# .env.example을 복사하여 .env.local 생성
cp .env.example .env.local

# 필수 환경변수 입력
vi .env.local
```

### 2. 코드에서 사용

```typescript
// ❌ 절대 이렇게 하지 마세요
const apiKey = process.env.OPENAI_API_KEY

// ✅ 이렇게 하세요
import { env } from '@/lib/env'
const apiKey = env.OPENAI_API_KEY
```

### 3. 검증

```bash
# 타입 체크
npm run type-check

# 개발 서버 시작 (자동 검증)
npm run dev
```

---

## 필수 환경변수

앱을 시작하려면 다음 환경변수가 **반드시** 설정되어야 합니다:

| 환경변수 | 설명 | 생성 방법 |
|---------|------|----------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | Supabase 또는 로컬 PostgreSQL |
| `NEXTAUTH_URL` | 애플리케이션 URL | 개발: `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth 시크릿 (32자 이상) | `openssl rand -base64 32` |

### 누락 시 에러 메시지

```
❌ Invalid environment variables:
  DATABASE_URL: DATABASE_URL is required
  NEXTAUTH_SECRET: NEXTAUTH_SECRET must be at least 32 characters

Please check your .env file or environment configuration.
```

---

## 주요 기능

### ✅ 타입 안전성

```typescript
import { env } from '@/lib/env'

// 자동 완성 지원
env.DATABASE_URL     // string
env.OPENAI_API_KEY   // string | undefined
env.NODE_ENV         // 'development' | 'test' | 'production'

// 잘못된 환경변수명 사용 시 컴파일 에러
env.OPENA_API_KEY    // ❌ Property does not exist
```

### ✅ 런타임 검증

```typescript
// 앱 시작 시 자동으로 모든 환경변수 검증
// - 필수 변수 누락 체크
// - URL 형식 검증
// - 최소 길이 검증
```

### ✅ 환경 감지

```typescript
import { isDevelopment, isProduction, isTest } from '@/lib/env'

if (isDevelopment) {
  console.log('디버그 모드')
}

if (isProduction) {
  // 프로덕션 전용 로직
}
```

---

## 사용 예시

### API 라우트

```typescript
// src/app/api/example/route.ts
import { env } from '@/lib/env'

export async function GET() {
  // Cron 작업 인증
  if (env.CRON_SECRET) {
    // CRON_SECRET이 설정된 경우에만 실행
  }

  // Meta API 호출
  if (env.META_APP_ID && env.META_APP_SECRET) {
    // Meta 연동 기능 활성화
  } else {
    return Response.json(
      { error: 'Meta API not configured' },
      { status: 503 }
    )
  }
}
```

### 서비스 레이어

```typescript
// src/application/services/EmailService.ts
import { env } from '@/lib/env'

export class EmailService {
  constructor() {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required for EmailService')
    }

    this.client = new Resend(env.RESEND_API_KEY)
  }
}
```

### 클라이언트 컴포넌트

```typescript
// src/app/components/MyComponent.tsx
import { publicEnv } from '@/lib/env'

export function MyComponent() {
  // 클라이언트에서는 publicEnv 사용
  const appUrl = publicEnv.NEXT_PUBLIC_APP_URL

  return <div>App URL: {appUrl}</div>
}
```

---

## 환경변수 목록

### 필수 (Required)

- `DATABASE_URL` - PostgreSQL 연결 문자열
- `NEXTAUTH_URL` - 애플리케이션 URL
- `NEXTAUTH_SECRET` - NextAuth 시크릿 (32자 이상)

### Meta 광고 연동

- `META_APP_ID` - Meta 앱 ID
- `META_APP_SECRET` - Meta 앱 시크릿

### AI 기능

- `OPENAI_API_KEY` - OpenAI API 키

### 이메일 발송

- `RESEND_API_KEY` - Resend API 키
- `RESEND_FROM_EMAIL` - 발신 이메일 주소

### OAuth 프로바이더

- `GOOGLE_CLIENT_ID` - Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 시크릿
- `KAKAO_CLIENT_ID` - Kakao OAuth 클라이언트 ID
- `KAKAO_CLIENT_SECRET` - Kakao OAuth 시크릿

### 카페24 연동

- `CAFE24_CLIENT_ID` - 카페24 클라이언트 ID
- `CAFE24_CLIENT_SECRET` - 카페24 시크릿
- `CAFE24_REDIRECT_URI` - 카페24 리디렉션 URI

### Cron 작업

- `CRON_SECRET` - Cron 엔드포인트 인증 시크릿

### 모니터링 (Sentry)

- `SENTRY_DSN` - Sentry DSN
- `SENTRY_AUTH_TOKEN` - Sentry 인증 토큰
- `SENTRY_ORG` - Sentry 조직
- `SENTRY_PROJECT` - Sentry 프로젝트
- `SENTRY_RELEASE` - 릴리즈 버전

### Rate Limiting (Upstash Redis)

- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis 토큰

### 내부 플래그

- `SKIP_DATABASE_ADAPTER` - DB 어댑터 건너뛰기 (디버깅용)
- `WARMUP_ACCOUNT_ID` - Meta API Warmup 계정 ID (스크립트용)

### CI/CD

- `CI` - CI 환경 플래그
- `NEXT_RUNTIME` - Next.js 런타임 (`nodejs` | `edge`)

---

## 문서

### 📖 상세 가이드

- **[환경변수 검증 가이드](./env-validation-guide.md)** - 전체 사용법, 베스트 프랙티스, 트러블슈팅
- **[마이그레이션 예시](./env-migration-examples.md)** - 실제 코드 마이그레이션 패턴
- **[구현 완료 요약](./env-validation-implementation-summary.md)** - 구현 내역 및 통계

### 📝 설정 파일

- **[.env.example](../.env.example)** - 환경변수 템플릿
- **[src/lib/env.ts](../src/lib/env.ts)** - 중앙 검증 시스템

---

## 마이그레이션 체크리스트

기존 코드를 마이그레이션할 때:

- [ ] `import { env } from '@/lib/env'` 추가
- [ ] `process.env.X` → `env.X`로 변경
- [ ] 타입 체크 실행 (`npm run type-check`)
- [ ] 선택 환경변수에 fallback 처리
- [ ] 환경변수 누락 시 명확한 에러 메시지

---

## 트러블슈팅

### "DATABASE_URL is required" 에러

**원인**: 필수 환경변수가 설정되지 않음

**해결**:
```bash
cp .env.example .env.local
vi .env.local  # 값 입력
```

### "must be a valid PostgreSQL connection string" 에러

**원인**: DATABASE_URL 형식 오류

**해결**:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

### TypeScript 타입 에러

**해결**:
```typescript
// 명시적 타입 체크
if (env.OPENAI_API_KEY) {
  // 여기서 env.OPENAI_API_KEY는 string 타입
  const key = env.OPENAI_API_KEY.toLowerCase()
}
```

---

## 베스트 프랙티스

### ✅ Do

```typescript
// 1. 항상 env import 사용
import { env } from '@/lib/env'

// 2. 선택 환경변수 체크
if (env.OPENAI_API_KEY) {
  // 사용
}

// 3. 명시적 에러 처리
if (!env.META_APP_ID || !env.META_APP_SECRET) {
  throw new Error('Meta API credentials not configured')
}
```

### ❌ Don't

```typescript
// 1. process.env 직접 접근 금지
const key = process.env.SOME_KEY  // ❌

// 2. 클라이언트에서 서버 env 사용 금지
'use client'
const dbUrl = env.DATABASE_URL  // ❌ 보안 위험

// 3. 타입 체크 우회 금지
const key = env.OPENAI_API_KEY!.toLowerCase()  // ❌ 런타임 에러 가능
```

---

## 팀 컨벤션

1. **새 환경변수 추가 시**
   - `src/lib/env.ts`에 스키마 추가
   - `.env.example`에 문서화
   - 이 README 업데이트

2. **Pull Request 체크**
   - `process.env` 직접 접근 금지
   - `npm run type-check` 통과 필수

3. **코드 리뷰 시**
   - 환경변수 누락 처리 확인
   - 에러 메시지 명확성 확인

---

## 검증 테스트

시스템이 올바르게 작동하는지 확인:

```bash
# 1. 필수 환경변수 누락 시 에러
DATABASE_URL="" npm run dev  # ❌ 에러 발생

# 2. 올바른 환경변수 설정 시 정상 작동
npm run dev  # ✅ 앱 시작

# 3. 타입 체크 통과
npm run type-check  # ✅ 에러 없음
```

---

## 기술 스택

- **Zod** - 런타임 스키마 검증
- **TypeScript** - 정적 타입 체크
- **Next.js** - 환경변수 관리

---

## 기여

환경변수 시스템 개선 제안:

1. 이슈 생성 또는 PR 제출
2. `docs/` 디렉토리 문서 업데이트
3. `.env.example` 예시 추가

---

## 라이센스

바투 AI 마케팅 솔루션 프로젝트의 일부입니다.

---

## 추가 리소스

- [Zod Documentation](https://zod.dev/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

**마지막 업데이트**: 2026-01-25
**버전**: 1.0.0
