# OpenAPI/Swagger 문서 설정 가이드

## 개요

바투 AI 마케팅 솔루션의 REST API에 대한 OpenAPI 3.0 기반 자동 문서 생성 시스템입니다.

## 접근 방법

### 1. Swagger UI (브라우저)

개발 서버 실행 후:

```bash
npm run dev
```

브라우저에서 접속:
- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs

### 2. 환경별 접근 제어

| 환경 | 접근 가능 여부 |
|------|---------------|
| 로컬 개발 | ✅ 가능 |
| Vercel Preview | ✅ 가능 |
| Vercel Production | ❌ 차단 (404 반환) |

## 구현 구조

```
src/
├── lib/openapi/
│   ├── registry.ts       # API 엔드포인트 등록
│   ├── schemas.ts        # Zod 스키마 (OpenAPI 확장)
│   ├── spec.ts          # OpenAPI 스펙 생성
│   └── index.ts         # 공개 API
├── app/
│   ├── api/docs/
│   │   └── route.ts     # OpenAPI JSON 엔드포인트
│   └── docs/
│       ├── page.tsx     # Swagger UI 페이지
│       ├── layout.tsx   # 메타데이터
│       └── middleware.ts # 접근 제어
```

## 문서화된 API

### Campaigns (캠페인 관리)

| 메서드 | 엔드포인트 | 설명 | Rate Limit |
|--------|-----------|------|------------|
| GET | `/api/campaigns` | 캠페인 목록 조회 | - |
| POST | `/api/campaigns` | 캠페인 생성 | 5회/주 |
| GET | `/api/campaigns/{id}` | 캠페인 상세 조회 | - |
| PATCH | `/api/campaigns/{id}` | 캠페인 수정 | - |
| DELETE | `/api/campaigns/{id}` | 캠페인 삭제 | - |

### Dashboard (KPI 대시보드)

| 메서드 | 엔드포인트 | 설명 | 캐시 |
|--------|-----------|------|------|
| GET | `/api/dashboard/kpi` | KPI 데이터 조회 | 5분 |

**쿼리 파라미터:**
- `period`: `today` | `yesterday` | `7d` | `30d`
- `comparison`: `true` | `false` (이전 기간과 비교)
- `breakdown`: `true` | `false` (캠페인별 상세)

### Reports (리포트 관리)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/reports` | 리포트 목록 조회 |
| POST | `/api/reports` | 주간 리포트 생성 |

## 기술 스택

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@asteasolutions/zod-to-openapi` | ^8.4.0 | Zod → OpenAPI 변환 |
| `swagger-ui-react` | ^5.31.0 | Swagger UI 렌더링 |
| `@types/swagger-ui-react` | ^5.18.0 | TypeScript 타입 |

## 타입 안전성

### Zod 스키마 → OpenAPI 자동 변환

```typescript
// src/lib/openapi/schemas.ts
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255).openapi({ example: 'Summer Sale' }),
  dailyBudget: z.number().positive().openapi({ example: 50000 }),
  // ...
})
```

### 런타임 검증과 문서 동기화

- ✅ API 검증 스키마 (`src/lib/validations`)와 OpenAPI 스펙이 자동 동기화
- ✅ TypeScript 타입 + Zod 검증 + API 문서가 단일 소스
- ✅ 수동 문서 작성 불필요

## 새 엔드포인트 추가 방법

### 1. 스키마 정의 (schemas.ts)

```typescript
export const myNewSchema = z.object({
  id: z.string().uuid().openapi({ example: '123...' }),
  name: z.string().openapi({ example: 'Example' }),
})
```

### 2. 엔드포인트 등록 (registry.ts)

```typescript
const MySchema = registry.register('MyResource', myNewSchema)

registry.registerPath({
  method: 'get',
  path: '/my-resource',
  tags: ['MyResource'],
  summary: '리소스 조회',
  description: '상세 설명',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: MySchema,
        },
      },
    },
  },
})
```

### 3. 테스트 추가 (optional)

```typescript
// tests/unit/lib/openapi.test.ts
it('should register GET /my-resource', () => {
  expect(openApiSpec.paths?.['/my-resource']?.get).toBeDefined()
})
```

## 보안

### 인증 요구사항

모든 엔드포인트는 NextAuth.js 세션 인증 필요:

```typescript
security: [{ bearerAuth: [] }]
```

### 환경별 접근 제어

```typescript
// src/lib/openapi/spec.ts
export function getOpenApiSpec() {
  if (process.env.NODE_ENV === 'production' &&
      process.env.VERCEL_ENV === 'production') {
    return null // 프로덕션에서는 404
  }
  return openApiSpec
}
```

## 테스트

```bash
# OpenAPI 스펙 생성 테스트
npm test -- tests/unit/lib/openapi.test.ts

# 전체 테스트 커버리지
✓ 스펙 생성 검증
✓ 엔드포인트 등록 확인
✓ 스키마 정의 확인
✓ 보안 설정 확인
✓ 환경별 필터링 확인
```

## 향후 확장

### 추가 가능한 API 카테고리

- `AI` - AI 분석 및 추천 API
- `Pixel` - 픽셀 설치 및 관리 API
- `Team` - 팀 관리 API
- `ABTest` - A/B 테스트 API
- `Alerts` - 예산 알림 API

각 카테고리별로 `registry.ts`에 섹션을 추가하면 자동으로 문서화됩니다.

## 참고 자료

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [zod-to-openapi GitHub](https://github.com/asteasolutions/zod-to-openapi)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Zod Documentation](https://zod.dev/)
