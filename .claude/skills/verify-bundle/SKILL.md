---
name: verify-bundle
description: 프로덕션 번들 크기에 영향을 주는 패턴을 검증합니다. namespace import, dev-only 라이브러리 누출, 대형 청크를 탐지합니다.
---

# 번들 최적화 검증

## Purpose

프로덕션 번들에 불필요한 코드가 포함되지 않도록 검증합니다:

1. **namespace import (`import *`)** — 트리 쉐이킹을 차단하는 namespace import 탐지
2. **dev-only 라이브러리 프로덕션 누출** — 개발 전용 라이브러리가 프로덕션 번들에 포함되는 경우
3. **조건부 로딩 누락** — dev-only 코드가 `process.env.NODE_ENV` 가드 없이 import되는 경우
4. **Server Component에서 ssr:false 사용** — `next/dynamic`의 `ssr: false`는 Client Component에서만 허용

## When to Run

- 새로운 외부 라이브러리를 추가한 후
- import 문을 수정한 후
- `next/dynamic`을 사용한 후
- 빌드 결과물 크기가 증가한 경우

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/errors/reportError.ts` | Sentry named imports (namespace import에서 전환됨) |
| `src/app/error.tsx` | Sentry named imports (namespace import에서 전환됨) |
| `src/app/providers.tsx` | ReactQueryDevtools lazy + dev-only 조건부 로딩 |
| `src/app/docs/page.tsx` | swagger-ui-react 프로덕션 완전 제외 (`NODE_ENV` 가드) |
| `src/app/layout.tsx` | 루트 레이아웃 (Server Component) |
| `src/app/(dashboard)/layout.tsx` | 대시보드 레이아웃 (FacebookSDK Suspense 로딩) |
| `package.json` | dependencies vs devDependencies |

## Workflow

### Step 1: namespace import (`import *`) 탐지

**검사:** `src/` 내에서 `import * as` 패턴을 찾습니다. 트리 쉐이킹을 차단하므로 named import로 교체해야 합니다.

```bash
grep -rn "import \* as" src/ --include="*.ts" --include="*.tsx"
```

**PASS 기준:** 출력이 없거나 허용된 패턴만 존재
**FAIL 기준:** 트리 쉐이킹 가능한 라이브러리에 namespace import 사용

**수정 방법:**
```typescript
// Before (위반)
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(error)

// After (수정)
import { captureException } from '@sentry/nextjs'
captureException(error)
```

### Step 2: dev-only 라이브러리 프로덕션 누출 탐지

**검사:** devDependencies에 있지만 조건부 가드 없이 import되는 라이브러리를 탐지합니다.

알려진 dev-only 라이브러리:
- `@tanstack/react-query-devtools`
- `swagger-ui-react`
- `@types/*`

```bash
# devDependencies에서 import하는 파일 탐지
grep -rn "from ['\"]swagger-ui-react\|from ['\"]@tanstack/react-query-devtools" src/ --include="*.ts" --include="*.tsx"
```

탐지된 파일에서 `process.env.NODE_ENV` 가드가 있는지 확인합니다.

**PASS 기준:** 모든 dev-only import가 `process.env.NODE_ENV` 가드 또는 `React.lazy()` 내부에 존재
**FAIL 기준:** 가드 없이 직접 import

**수정 방법:**
```typescript
// process.env.NODE_ENV 가드
if (process.env.NODE_ENV !== 'production') {
  const SwaggerUI = (await import('swagger-ui-react')).default
}

// 또는 React.lazy + Suspense
const DevTools = lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
```

### Step 3: Server Component에서 ssr:false 사용 탐지

**검사:** Server Component 파일에서 `next/dynamic`의 `ssr: false` 옵션을 사용하는지 확인합니다.

```bash
grep -rn "ssr:\s*false" src/app/**/layout.tsx src/app/**/page.tsx --include="*.tsx" 2>/dev/null
```

해당 파일에 `'use client'`가 없으면 위반입니다.

**PASS 기준:** `ssr: false`가 Client Component에서만 사용됨
**FAIL 기준:** Server Component에서 `ssr: false` 사용

**수정 방법:**
- 해당 컴포넌트를 Client Component로 분리하거나
- 컴포넌트 내부에서 `typeof window !== 'undefined'` 가드로 처리

## Output Format

```markdown
### verify-bundle 결과

| # | 검사 | 상태 | 상세 |
|---|------|------|------|
| 1 | namespace import (`import *`) | PASS/FAIL | 위반: N개 파일 |
| 2 | dev-only 프로덕션 누출 | PASS/FAIL | 가드 없는 import: N개 |
| 3 | Server Component ssr:false | PASS/FAIL | 위반: N개 파일 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **Node.js 내장 모듈의 namespace import** — `import * as path from 'path'` 등 Node.js 내장 모듈은 트리 쉐이킹 대상 아님
2. **서버 전용 파일의 namespace import** — `src/app/api/` 내 API 라우트는 클라이언트 번들에 포함되지 않으므로 namespace import 허용
3. **테스트 파일** — `tests/` 디렉토리 내 파일은 번들에 포함되지 않음
4. **타입 전용 namespace import** — `import type * as` 형태는 런타임 번들에 영향 없음
5. **next/dynamic 없는 일반 dynamic import** — `import()` 표현식 자체는 코드 스플리팅을 위한 것이므로 정상
