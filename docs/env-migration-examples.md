# 환경변수 마이그레이션 예시

이 문서는 `process.env` 직접 접근을 중앙 검증 시스템(`src/lib/env.ts`)으로 마이그레이션하는 실제 예시를 제공합니다.

## 목차

1. [API 라우트 마이그레이션](#api-라우트-마이그레이션)
2. [인프라 서비스 마이그레이션](#인프라-서비스-마이그레이션)
3. [설정 파일 마이그레이션](#설정-파일-마이그레이션)
4. [조건부 환경변수 처리](#조건부-환경변수-처리)

---

## API 라우트 마이그레이션

### Before (❌ 타입 안전하지 않음)

```typescript
// src/app/api/cron/generate-reports/route.ts
export async function GET(request: Request) {
  // 타입 체크 없음, 런타임 에러 가능
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // ...
}
```

### After (✅ 타입 안전, 검증됨)

```typescript
// src/app/api/cron/generate-reports/route.ts
import { env } from '@/lib/env'

export async function GET(request: Request) {
  // 타입 안전, 자동 완성 지원
  const cronSecret = env.CRON_SECRET

  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // ...
}
```

### 개선 사항

- ✅ 타입 안전성: `env.CRON_SECRET`는 `string | undefined` 타입
- ✅ 자동 완성: IDE에서 사용 가능한 환경변수 자동 제안
- ✅ 오타 방지: 잘못된 환경변수명 사용 시 컴파일 에러

---

## 인프라 서비스 마이그레이션

### Before (❌)

```typescript
// src/lib/di/container.ts
import { EmailService } from '@infrastructure/email/EmailService'

container.registerSingleton<IEmailService>(
  DI_TOKENS.EmailService,
  () => new EmailService(process.env.RESEND_API_KEY || '')
)
```

### After (✅)

```typescript
// src/lib/di/container.ts
import { env } from '@/lib/env'
import { EmailService } from '@infrastructure/email/EmailService'

container.registerSingleton<IEmailService>(
  DI_TOKENS.EmailService,
  () => new EmailService(env.RESEND_API_KEY || '')
)
```

### 추가 개선: 명시적 검증

```typescript
// src/lib/di/container.ts
import { env } from '@/lib/env'
import { EmailService } from '@infrastructure/email/EmailService'

container.registerSingleton<IEmailService>(
  DI_TOKENS.EmailService,
  () => {
    if (!env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured. Email features will be disabled.')
      // Fallback 구현 또는 Mock 서비스 반환
      return new MockEmailService()
    }
    return new EmailService(env.RESEND_API_KEY)
  }
)
```

---

## 설정 파일 마이그레이션

### Before (❌)

```typescript
// src/infrastructure/auth/auth.ts
import NextAuth from 'next-auth'
import Facebook from 'next-auth/providers/facebook'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Facebook({
      clientId: process.env.META_APP_ID ?? '',
      clientSecret: process.env.META_APP_SECRET ?? '',
    }),
  ],
})
```

### After (✅)

```typescript
// src/infrastructure/auth/auth.ts
import { env } from '@/lib/env'
import NextAuth from 'next-auth'
import Facebook from 'next-auth/providers/facebook'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET || env.NEXTAUTH_SECRET,
  providers: [
    Facebook({
      clientId: env.META_APP_ID ?? '',
      clientSecret: env.META_APP_SECRET ?? '',
    }),
  ],
})
```

---

## 조건부 환경변수 처리

### 패턴 1: Optional Chaining

#### Before (❌)

```typescript
// 타입 체크 없음
const apiUrl = process.env.CAFE24_REDIRECT_URI

if (apiUrl) {
  // apiUrl은 string | undefined
  const url = new URL(apiUrl) // 잠재적 에러
}
```

#### After (✅)

```typescript
import { env } from '@/lib/env'

// 타입 안전한 체크
const apiUrl = env.CAFE24_REDIRECT_URI

if (apiUrl) {
  // TypeScript가 apiUrl이 string임을 인식
  const url = new URL(apiUrl)
}
```

### 패턴 2: Nullish Coalescing

#### Before (❌)

```typescript
const fromEmail = process.env.RESEND_FROM_EMAIL || 'default@example.com'
```

#### After (✅)

```typescript
import { env } from '@/lib/env'

const fromEmail = env.RESEND_FROM_EMAIL ?? 'default@example.com'
```

### 패턴 3: Early Return

#### Before (❌)

```typescript
export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  // 사용
  const resend = new Resend(apiKey)
  // ...
}
```

#### After (✅)

```typescript
import { env } from '@/lib/env'

export async function sendEmail(to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  // TypeScript가 여기서 env.RESEND_API_KEY가 string임을 인식
  const resend = new Resend(env.RESEND_API_KEY)
  // ...
}
```

---

## 복잡한 케이스: 다중 환경변수 검증

### Before (❌)

```typescript
// src/app/api/platform/cafe24/auth/route.ts
const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID || ''
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET || ''
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI || ''

export async function GET() {
  if (!CAFE24_CLIENT_ID || !CAFE24_CLIENT_SECRET || !CAFE24_REDIRECT_URI) {
    return Response.json(
      { error: 'Cafe24 integration not configured' },
      { status: 500 }
    )
  }

  // ...
}
```

### After (✅)

```typescript
// src/app/api/platform/cafe24/auth/route.ts
import { env } from '@/lib/env'

// 타입 가드 함수로 추출
function isCafe24Configured() {
  return !!(env.CAFE24_CLIENT_ID && env.CAFE24_CLIENT_SECRET && env.CAFE24_REDIRECT_URI)
}

export async function GET() {
  if (!isCafe24Configured()) {
    return Response.json(
      { error: 'Cafe24 integration not configured' },
      { status: 500 }
    )
  }

  // TypeScript는 여기서 모든 값이 존재함을 알지 못하므로 optional chaining 사용
  const authUrl = new URL('https://mall_id.cafe24.com/api/v2/oauth/authorize')
  authUrl.searchParams.set('client_id', env.CAFE24_CLIENT_ID!)
  authUrl.searchParams.set('redirect_uri', env.CAFE24_REDIRECT_URI!)
  // ...
}
```

### Better (✅✅)

```typescript
// src/app/api/platform/cafe24/auth/route.ts
import { env } from '@/lib/env'

// 타입 가드와 assertion 결합
function getCafe24Config() {
  const { CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET, CAFE24_REDIRECT_URI } = env

  if (!CAFE24_CLIENT_ID || !CAFE24_CLIENT_SECRET || !CAFE24_REDIRECT_URI) {
    return null
  }

  return {
    clientId: CAFE24_CLIENT_ID,
    clientSecret: CAFE24_CLIENT_SECRET,
    redirectUri: CAFE24_REDIRECT_URI,
  }
}

export async function GET() {
  const config = getCafe24Config()

  if (!config) {
    return Response.json(
      { error: 'Cafe24 integration not configured' },
      { status: 500 }
    )
  }

  // 타입 안전하게 사용
  const authUrl = new URL('https://mall_id.cafe24.com/api/v2/oauth/authorize')
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', config.redirectUri)
  // ...
}
```

---

## 환경 감지 마이그레이션

### Before (❌)

```typescript
const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

if (isDev) {
  console.log('Debug info')
}
```

### After (✅)

```typescript
import { isDevelopment, isProduction } from '@/lib/env'

if (isDevelopment) {
  console.log('Debug info')
}

if (isProduction) {
  // 프로덕션 전용 로직
}
```

---

## Next.js 설정 파일 (특수 케이스)

### Note

`next.config.ts`, `sentry.*.config.ts` 등 Next.js 빌드 타임 설정 파일은 `src/lib/env.ts`를 import할 수 없습니다. 이러한 파일에서는 `process.env`를 직접 사용해야 합니다.

```typescript
// next.config.ts - process.env 사용이 필요함
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

export default nextConfig
```

**이유**: 빌드 타임에 실행되는 파일은 애플리케이션 코드가 실행되기 전에 처리되므로 런타임 검증이 불가능합니다.

---

## 체크리스트

마이그레이션 완료 후 다음을 확인하세요:

- [ ] `process.env` 직접 접근 제거 (빌드 타임 파일 제외)
- [ ] `import { env } from '@/lib/env'` 추가
- [ ] 타입 에러 없음 (`npm run type-check`)
- [ ] 선택 환경변수에 대한 적절한 fallback 처리
- [ ] 환경변수 누락 시 명확한 에러 메시지

---

## 추가 리소스

- [환경변수 검증 가이드](./env-validation-guide.md)
- [.env.example](./../.env.example)
- [src/lib/env.ts](../src/lib/env.ts)
