# OpenAPI Documentation

바투 AI 마케팅 솔루션의 REST API를 위한 OpenAPI 3.0 문서 자동 생성 시스템.

## 구조

```
src/lib/openapi/
├── registry.ts     # Zod 스키마를 OpenAPI로 변환 및 엔드포인트 등록
├── spec.ts         # OpenAPI 스펙 생성 및 환경별 필터링
└── index.ts        # 공개 API 내보내기
```

## 사용법

### 1. API 문서 보기

개발 서버 실행 후:

```bash
npm run dev
```

브라우저에서 접속:
- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs

### 2. 새 엔드포인트 추가

`registry.ts`에서 새 엔드포인트를 등록:

```typescript
// 1. 스키마 등록 (필요시)
const MySchema = registry.register(
  'MySchema',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
  })
)

// 2. 엔드포인트 등록
registry.registerPath({
  method: 'get',
  path: '/my-resource',
  tags: ['MyResource'],
  summary: '리소스 조회',
  description: '상세 설명',
  security: [{ bearerAuth: [] }],
  request: {
    query: myQuerySchema,
  },
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

### 3. 기존 Zod 스키마 활용

`src/lib/validations`의 스키마를 그대로 사용:

```typescript
import { createCampaignSchema } from '@/lib/validations'

registry.registerPath({
  method: 'post',
  path: '/campaigns',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCampaignSchema,
        },
      },
    },
  },
  // ...
})
```

## 주요 기능

### 자동 타입 안전성

Zod 스키마에서 OpenAPI 스펙을 자동 생성하므로:
- ✅ 런타임 검증과 문서가 항상 동기화
- ✅ 타입스크립트 타입과 API 스펙 일치
- ✅ 수동 문서 작성 불필요

### 환경별 필터링

- **개발/스테이징**: 모든 문서 공개
- **프로덕션**: 자동으로 404 반환

```typescript
// spec.ts
export function getOpenApiSpec() {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return null
  }
  return openApiSpec
}
```

### 보안 스키마

모든 엔드포인트는 NextAuth.js 인증 필요:

```typescript
security: [{ bearerAuth: [] }]
```

## 문서화된 엔드포인트

### Campaigns
- `GET /api/campaigns` - 캠페인 목록 조회
- `POST /api/campaigns` - 캠페인 생성 (Rate limit: 5회/주)
- `GET /api/campaigns/{id}` - 캠페인 상세 조회
- `PATCH /api/campaigns/{id}` - 캠페인 수정
- `DELETE /api/campaigns/{id}` - 캠페인 삭제

### Dashboard
- `GET /api/dashboard/kpi` - KPI 대시보드 조회 (캐시: 5분)

### Reports
- `GET /api/reports` - 리포트 목록 조회
- `POST /api/reports` - 리포트 생성

## 확장 가능성

향후 추가 가능한 엔드포인트:
- AI 분석 API (`/api/ai/*`)
- 픽셀 관리 API (`/api/pixel/*`)
- 팀 관리 API (`/api/team/*`)
- A/B 테스트 API (`/api/abtest/*`)

각 카테고리별로 `registry.ts`에 새 섹션을 추가하면 됩니다.

## 참고

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [zod-to-openapi Documentation](https://github.com/asteasolutions/zod-to-openapi)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
