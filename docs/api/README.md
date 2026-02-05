# Batwo AI Marketing Solution API Documentation

## 개요

바투 AI 마케팅 솔루션 API는 커머스 사업자를 위한 AI 기반 마케팅 자동화 서비스입니다.

## 주요 기능

- **캠페인 관리**: Meta 광고 캠페인 생성, 수정, 동기화
- **KPI 대시보드**: 실시간 성과 지표 및 분석
- **AI 카피 생성**: GPT-4 기반 광고 카피 자동 생성
- **보고서 생성**: 주간/월간 성과 보고서 자동 생성
- **픽셀 관리**: Meta 픽셀 원클릭 설치 및 추적
- **할당량 관리**: 요금제별 사용량 제한 및 모니터링

## 문서 구조

```
docs/api/
├── openapi.yaml           # OpenAPI 3.0 메인 스펙
├── schemas/               # 재사용 가능한 스키마
│   ├── Campaign.yaml      # 캠페인 관련 스키마
│   ├── KPI.yaml          # KPI 관련 스키마
│   ├── Report.yaml       # 보고서 관련 스키마
│   ├── Pixel.yaml        # 픽셀 관련 스키마
│   ├── AI.yaml           # AI 카피 생성 관련 스키마
│   ├── Quota.yaml        # 할당량 관련 스키마
│   └── common.yaml       # 공통 스키마
└── README.md             # 이 파일
```

## API 문서 보기

### Swagger UI

1. **로컬 개발 환경**
   ```bash
   npm install -g @apidevtools/swagger-cli
   swagger-cli serve docs/api/openapi.yaml
   ```
   브라우저에서 http://localhost:8080 접속

2. **온라인 뷰어**
   - [Swagger Editor](https://editor.swagger.io/)에서 `openapi.yaml` 파일 로드
   - [Redoc](https://redocly.github.io/redoc/)로 렌더링

### VS Code 확장 프로그램

- [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi)
- [Swagger Viewer](https://marketplace.visualstudio.com/items?itemName=Arjun.swagger-viewer)

## 인증

모든 API 엔드포인트는 NextAuth.js 세션 기반 인증을 사용합니다.

```
Authorization: Bearer {session_token}
```

### 인증 흐름

1. `/api/auth/signin`으로 로그인
2. 세션 쿠키 자동 설정
3. 이후 요청에서 자동으로 인증 정보 전송

## 환경별 서버

| 환경 | URL | 설명 |
|------|-----|------|
| 개발 | `http://localhost:3000` | 로컬 개발 서버 |
| 스테이징 | `https://staging.batwo.ai` | 스테이징 환경 |
| 프로덕션 | `https://batwo.ai` | 프로덕션 환경 |

## 주요 엔드포인트

### Campaigns (캠페인)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/campaigns` | 캠페인 목록 조회 |
| POST | `/api/campaigns` | 캠페인 생성 |
| GET | `/api/campaigns/{id}` | 캠페인 상세 조회 |
| PATCH | `/api/campaigns/{id}` | 캠페인 수정 |
| POST | `/api/campaigns/sync` | Meta 캠페인 동기화 |

### KPI (성과 지표)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/dashboard/kpi` | 대시보드 KPI 조회 |

### Reports (보고서)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/reports` | 보고서 목록 조회 |
| POST | `/api/reports` | 보고서 생성 |
| GET | `/api/reports/{id}` | 보고서 상세 조회 |

### Pixel (픽셀)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/pixel` | 픽셀 목록 조회 |
| POST | `/api/pixel` | 픽셀 생성/선택 |
| GET | `/api/pixel/{pixelId}` | 픽셀 상세 조회 |
| GET | `/api/pixel/{pixelId}/snippet` | 설치 스크립트 조회 |

### AI (AI 기능)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/ai/copy` | AI 광고 카피 생성 |
| GET | `/api/ai/copy` | 카피 생성 힌트 조회 |

### Quota (할당량)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/quota` | 사용량 할당량 조회 |

## Rate Limiting

API는 요청 제한을 적용합니다:

| 엔드포인트 유형 | 제한 |
|----------------|------|
| 캠페인 생성 | 10회/분 |
| AI 카피 생성 | 20회/시간 |
| 일반 조회 | 100회/분 |

Rate limit 초과 시 `429 Too Many Requests` 응답과 함께 다음 헤더가 반환됩니다:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1707134400
```

## 에러 처리

모든 에러 응답은 다음 형식을 따릅니다:

```json
{
  "message": "에러 메시지",
  "code": "ERROR_CODE",
  "details": {
    "field": "fieldName",
    "constraint": "제약 조건"
  }
}
```

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 성공 |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복 리소스 |
| 429 | Too Many Requests | Rate limit 초과 |
| 500 | Internal Server Error | 서버 오류 |

## 페이지네이션

목록 조회 API는 페이지네이션을 지원합니다:

**요청 파라미터**:
```
GET /api/campaigns?page=1&pageSize=10
```

**응답 형식**:
```json
{
  "campaigns": [...],
  "total": 42,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

## 할당량 시스템

요금제별 할당량:

| 요금제 | 캠페인 생성 | AI 카피 생성 | AI 분석 |
|--------|-------------|--------------|---------|
| FREE | 5회/주 | 20회/일 | 5회/주 |
| BASIC | 20회/주 | 100회/일 | 20회/주 |
| PREMIUM | 무제한 | 무제한 | 무제한 |
| ENTERPRISE | 커스텀 | 커스텀 | 커스텀 |

할당량 확인:
```bash
GET /api/quota
```

## 예제

### 캠페인 생성

```bash
curl -X POST https://batwo.ai/api/campaigns \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2024 봄 신상품 프로모션",
    "objective": "SALES",
    "dailyBudget": 50000,
    "currency": "KRW",
    "startDate": "2024-03-01",
    "endDate": "2024-03-31",
    "targetAudience": {
      "ageMin": 25,
      "ageMax": 45,
      "genders": ["ALL"],
      "locations": ["KR"]
    },
    "syncToMeta": false
  }'
```

### AI 카피 생성

```bash
curl -X POST https://batwo.ai/api/ai/copy \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "프리미엄 유기농 녹차",
    "productDescription": "제주도에서 자란 100% 유기농 녹차로 만든 프리미엄 티백",
    "targetAudience": "건강을 중시하는 30-40대 여성",
    "tone": "professional",
    "objective": "conversion",
    "keywords": ["유기농", "건강", "제주"],
    "variantCount": 3
  }'
```

### 스트리밍 AI 카피 생성

```bash
curl -X POST 'https://batwo.ai/api/ai/copy?stream=true' \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "프리미엄 유기농 녹차",
    "productDescription": "제주도에서 자란 100% 유기농 녹차",
    "targetAudience": "건강을 중시하는 30-40대 여성",
    "tone": "professional",
    "objective": "conversion"
  }'
```

### KPI 조회

```bash
curl -X GET 'https://batwo.ai/api/dashboard/kpi?dateRange=last_7d&includeComparison=true' \
  -H "Authorization: Bearer {token}"
```

## 스트리밍 응답 (SSE)

AI 카피 생성은 Server-Sent Events (SSE) 스트리밍을 지원합니다.

```javascript
const eventSource = new EventSource('/api/ai/copy?stream=true');

eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    return;
  }

  const chunk = JSON.parse(event.data);
  console.log(chunk);
};
```

## 웹훅 (계획 중)

향후 다음 이벤트에 대한 웹훅을 지원할 예정입니다:

- `campaign.created` - 캠페인 생성
- `campaign.status_changed` - 캠페인 상태 변경
- `report.generated` - 보고서 생성 완료
- `quota.exceeded` - 할당량 초과

## 변경 이력

### v1.0.0 (2024-02-05)
- 초기 API 문서 생성
- 캠페인, KPI, 보고서, 픽셀, AI, 할당량 API 정의

## 지원

- **이메일**: support@batwo.ai
- **문서**: https://docs.batwo.ai
- **GitHub**: https://github.com/batwo/batwo-marketing

## 라이선스

Proprietary - © 2024 Batwo Inc.
