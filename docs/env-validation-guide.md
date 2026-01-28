# 환경변수 중앙 검증 시스템 가이드

## 개요

바투 AI 마케팅 솔루션은 Zod를 사용한 타입 안전한 환경변수 검증 시스템을 제공합니다. 모든 환경변수는 `src/lib/env.ts`에서 중앙 관리되며, 런타임 오류를 방지하고 타입 안전성을 보장합니다.

## 기본 사용법

### ❌ 잘못된 사용 (직접 접근)

```typescript
// 타입 안전성 없음, 런타임 에러 가능
const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL
```

### ✅ 올바른 사용 (중앙 검증 사용)

```typescript
import { env } from '@/lib/env'

// 타입 안전, 검증됨
const apiKey = env.OPENAI_API_KEY
const dbUrl = env.DATABASE_URL
```

## 서버 vs 클라이언트 환경변수

### 서버 환경변수 (Server-only)

```typescript
import { env } from '@/lib/env'

// API 라우트, 서버 컴포넌트, 서버 액션에서만 사용 가능
export async function GET() {
  const dbUrl = env.DATABASE_URL
  const metaAppId = env.META_APP_ID
  const cronSecret = env.CRON_SECRET

  // ...
}
```

### 클라이언트 환경변수 (Public)

```typescript
import { publicEnv } from '@/lib/env'

// 클라이언트 컴포넌트에서 사용 가능 (브라우저에 노출됨)
export function MyComponent() {
  const appUrl = publicEnv.NEXT_PUBLIC_APP_URL
  const sentryDsn = publicEnv.NEXT_PUBLIC_SENTRY_DSN

  // ...
}
```

## 환경변수 카테고리

### 필수 환경변수 (Required)

애플리케이션이 시작되려면 반드시 설정되어야 합니다:

| 환경변수 | 설명 | 예시 |
|---------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | 애플리케이션 URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth 시크릿 (32자 이상) | `openssl rand -base64 32` |

### 선택 환경변수 (Optional)

기능에 따라 필요 시 설정:

| 환경변수 | 설명 | 필요 기능 |
|---------|------|----------|
| `META_APP_ID` | Meta 앱 ID | Meta 광고 연동 |
| `META_APP_SECRET` | Meta 앱 시크릿 | Meta 광고 연동 |
| `OPENAI_API_KEY` | OpenAI API 키 | AI 분석/추천 |
| `RESEND_API_KEY` | Resend API 키 | 이메일 발송 |
| `CRON_SECRET` | Cron 작업 시크릿 | 자동화된 리포트 생성 |
| `CAFE24_CLIENT_ID` | 카페24 클라이언트 ID | 카페24 연동 |
| `SENTRY_DSN` | Sentry DSN | 에러 모니터링 |

## 환경 감지 헬퍼

```typescript
import { isProduction, isDevelopment, isTest } from '@/lib/env'

if (isProduction) {
  // 프로덕션 전용 로직
}

if (isDevelopment) {
  console.log('디버그 정보:', env.META_APP_ID)
}
```

## 타입 안전성

### 타입 추론

환경변수는 자동으로 타입이 추론됩니다:

```typescript
import { env } from '@/lib/env'

// NODE_ENV는 'development' | 'test' | 'production' 타입
const nodeEnv: 'development' | 'test' | 'production' = env.NODE_ENV

// DATABASE_URL은 string 타입 (검증됨)
const dbUrl: string = env.DATABASE_URL

// OPENAI_API_KEY는 string | undefined 타입
const apiKey: string | undefined = env.OPENAI_API_KEY
```

### 타입 export

타입을 별도로 사용하려면:

```typescript
import type { ServerEnv, ClientEnv } from '@/lib/env'

function processEnv(config: ServerEnv) {
  // ...
}
```

## 에러 처리

### 검증 실패 시

애플리케이션 시작 시 필수 환경변수가 누락되면:

```
❌ Invalid environment variables:
  DATABASE_URL: DATABASE_URL is required
  NEXTAUTH_SECRET: NEXTAUTH_SECRET must be at least 32 characters

Please check your .env file or environment configuration.
```

### 선택 환경변수 체크

```typescript
import { env } from '@/lib/env'

// 방법 1: Optional chaining
const result = env.OPENAI_API_KEY?.length

// 방법 2: 조건부 체크
if (env.OPENAI_API_KEY) {
  // AI 기능 활성화
  await generateRecommendation()
} else {
  // Fallback 로직
  return defaultRecommendation
}

// 방법 3: Nullish coalescing
const apiKey = env.OPENAI_API_KEY ?? 'fallback-key'
```

## 마이그레이션 가이드

### 기존 코드 마이그레이션

1. **process.env 검색**
   ```bash
   grep -r "process\.env\." src/
   ```

2. **env import로 교체**
   ```typescript
   // Before
   const secret = process.env.NEXTAUTH_SECRET

   // After
   import { env } from '@/lib/env'
   const secret = env.NEXTAUTH_SECRET
   ```

3. **타입 체크 실행**
   ```bash
   npm run type-check
   ```

### 주요 파일별 마이그레이션 체크리스트

- [ ] API 라우트 (`src/app/api/**/*.ts`)
- [ ] 서버 컴포넌트 (`src/app/**/page.tsx`)
- [ ] 인프라 레이어 (`src/infrastructure/**/*.ts`)
- [ ] 설정 파일 (`next.config.ts`, `sentry.*.config.ts`)

## 새 환경변수 추가하기

### 1. env.ts 스키마 업데이트

```typescript
// src/lib/env.ts
const serverEnvSchema = z.object({
  // ... 기존 변수들

  // 새 환경변수 추가
  MY_NEW_API_KEY: z.string().optional(),
  MY_SERVICE_URL: z.string().url().min(1, 'MY_SERVICE_URL is required'),
})
```

### 2. .env.example 업데이트

```bash
# .env.example

# -------------------------------------------
# My Service Configuration
# -------------------------------------------
MY_NEW_API_KEY=""
MY_SERVICE_URL="https://api.myservice.com"
```

### 3. 타입 체크

```bash
npm run type-check
```

### 4. 문서화

이 문서를 업데이트하여 새 환경변수 설명 추가

## 베스트 프랙티스

### ✅ Do

1. **항상 env import 사용**
   ```typescript
   import { env } from '@/lib/env'
   ```

2. **선택 환경변수 체크**
   ```typescript
   if (env.OPENAI_API_KEY) {
     // 사용
   }
   ```

3. **타입 활용**
   ```typescript
   const nodeEnv: typeof env.NODE_ENV = env.NODE_ENV
   ```

### ❌ Don't

1. **process.env 직접 접근 금지**
   ```typescript
   // 절대 사용하지 말 것
   const key = process.env.SOME_KEY
   ```

2. **클라이언트에서 서버 env 사용 금지**
   ```typescript
   // 클라이언트 컴포넌트에서
   const dbUrl = env.DATABASE_URL // ❌ 보안 위험
   ```

3. **검증 없이 사용 금지**
   ```typescript
   // 타입 체크 우회 금지
   const key = env.OPENAI_API_KEY!.toLowerCase() // ❌ 런타임 에러 가능

   // 올바른 방법
   const key = env.OPENAI_API_KEY?.toLowerCase() // ✅
   ```

## 트러블슈팅

### 문제: "DATABASE_URL is required" 에러

**원인**: 필수 환경변수가 설정되지 않음

**해결**:
```bash
# .env.local 파일 확인
cat .env.local

# .env.example 복사
cp .env.example .env.local

# 값 입력
vi .env.local
```

### 문제: "must be a valid PostgreSQL connection string" 에러

**원인**: DATABASE_URL 형식이 잘못됨

**해결**:
```bash
# 올바른 형식
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

### 문제: TypeScript 타입 에러

**원인**: env 타입이 제대로 추론되지 않음

**해결**:
```typescript
// 명시적 타입 import
import type { ServerEnv } from '@/lib/env'

// 타입 체크 재실행
npm run type-check
```

## 참고 자료

- [Zod Documentation](https://zod.dev/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- 프로젝트 루트의 `.env.example` 파일
