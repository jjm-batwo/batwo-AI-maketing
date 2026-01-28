# 경쟁사 광고 분석 기능

Meta Ad Library API를 활용한 경쟁사 광고 크리에이티브 분석 시스템.

## 개요

경쟁사가 운영 중인 Meta 광고를 검색하고 AI를 통해 트렌드를 분석하여 실행 가능한 인사이트를 제공합니다.

## 구성 요소

### 1. 서비스 계층
- `CompetitorAnalysisService` - 경쟁사 광고 분석 로직
  - `searchCompetitorAds()` - 키워드 기반 광고 검색
  - `analyzeCompetitorCreatives()` - AI 기반 크리에이티브 분석
  - `generateCompetitiveInsights()` - 전체 인사이트 생성

### 2. 인프라 계층
- `AdLibraryClient` - Meta Ad Library API 클라이언트
  - `searchAds()` - 키워드/국가로 광고 검색
  - `getPageAds()` - 특정 페이지 광고 조회
- `AIService` (확장) - 경쟁사 분석 AI 프롬프트
  - `analyzeCompetitorTrends()` - 후크/오퍼/포맷 트렌드 분석
  - `generateCompetitorInsights()` - 추천 전략 생성

### 3. API 엔드포인트
- `GET /api/ai/competitors` - 경쟁사 광고 검색 및 분석
- `POST /api/ai/competitors` - 경쟁사 페이지 추적 (향후 확장)

## API 사용법

### GET 요청 (광고 검색 및 분석)

```bash
GET /api/ai/competitors?keywords=skincare,beauty&countries=KR&limit=50&industry=beauty
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| keywords | string | ✅ | 검색 키워드 (쉼표로 구분) |
| countries | string | | 국가 코드 (기본값: KR) |
| limit | number | | 광고 수 제한 (기본값: 50, 최대: 100) |
| industry | string | | 업종 (분석 최적화용) |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "totalAds": 48,
    "analysis": {
      "competitors": [
        {
          "pageName": "뷰티브랜드A",
          "pageId": "123456789",
          "adCount": 15,
          "dominantFormats": ["single_image_medium_copy", "carousel"],
          "commonHooks": ["할인 프로모션", "무료 혜택", "사회적 증거"],
          "averageAdLifespan": 28
        }
      ],
      "trends": {
        "popularHooks": [
          "할인 프로모션 (예: 50% 할인, 오늘만)",
          "무료 혜택 (예: 무료 배송, 사은품 증정)",
          "사회적 증거 (예: 리뷰 4.9점, 만족도 99%)"
        ],
        "commonOffers": [
          "30~50% 할인",
          "무료 배송 (3만원 이상)",
          "첫 구매 추가 할인"
        ],
        "formatDistribution": [
          { "format": "short_copy", "percentage": 45 },
          { "format": "medium_copy", "percentage": 35 }
        ]
      },
      "recommendations": [
        "경쟁사 상위 후크 '할인 프로모션'을 활용하되, '첫 구매 고객 50% + 무료 배송' 같은 번들 오퍼로 차별화",
        "리뷰/평점 강조가 트렌드이므로, 광고 문구에 '만족도 4.9점', '재구매율 95%' 등 구체적 수치 포함"
      ]
    }
  }
}
```

### POST 요청 (경쟁사 추적 저장)

```bash
POST /api/ai/competitors
Content-Type: application/json

{
  "pageIds": ["123456789", "987654321"],
  "industry": "beauty"
}
```

**향후 확장 기능**: 추적 중인 페이지의 새 광고를 주기적으로 모니터링.

## 분석 결과 구조

### CompetitorAnalysis

```typescript
interface CompetitorAnalysis {
  // 경쟁사별 요약
  competitors: {
    pageName: string
    pageId: string
    adCount: number
    dominantFormats: string[]        // 주로 사용하는 광고 포맷
    commonHooks: string[]            // 자주 사용하는 후크 기법
    averageAdLifespan: number        // 평균 광고 수명 (일)
  }[]

  // 시장 전체 트렌드
  trends: {
    popularHooks: string[]           // 인기 후크 기법 Top 5
    commonOffers: string[]           // 공통 오퍼 전략
    formatDistribution: {            // 포맷 분포
      format: string
      percentage: number
    }[]
  }

  // AI 추천 전략
  recommendations: string[]
}
```

## Meta Ad Library API 제약사항

### 1. 조회 가능한 데이터
- ✅ 광고 크리에이티브 (텍스트, 이미지 URL)
- ✅ 페이지 정보 (이름, ID)
- ✅ 노출 범위 (lower/upper bound)
- ✅ 게재 기간 (시작/종료 날짜)
- ✅ 플랫폼 (Facebook, Instagram 등)

### 2. 조회 불가능한 데이터
- ❌ 성과 지표 (CTR, CVR, CPC, ROAS)
- ❌ 예산 정보
- ❌ 타겟팅 상세 (연령, 관심사 등)
- ❌ 입찰 전략

### 3. Rate Limit
- **200 calls/hour per user**
- 동일 검색어 반복 조회 시 캐싱 권장

### 4. 인증 요구사항
- 활성화된 Meta 비즈니스 계정
- User Access Token 필요
- `ads_read` 권한 (기본 권한)

## 환경 변수

```bash
# Meta Access Token (테스트용)
META_ACCESS_TOKEN=your_meta_access_token

# OpenAI API Key (AI 분석용)
OPENAI_API_KEY=your_openai_api_key
```

## 활용 시나리오

### 1. 신규 캠페인 기획
```
목표: 스킨케어 신제품 출시 광고 기획
1. keywords=skincare,serum&industry=beauty 검색
2. 경쟁사 후크 패턴 분석 → "비타민C 세럼 30% 할인" 트렌드 파악
3. 우리 제품: "국내 최초 발효 비타민C 세럼 + 무료 체험" 차별화
```

### 2. 크리에이티브 최적화
```
목표: CTR 개선
1. 경쟁사 dominantFormats 확인 → carousel이 45%
2. 우리 광고를 single_image에서 carousel로 변경
3. 경쟁사 commonHooks 적용 → "리뷰 4.9점" 강조
```

### 3. 경쟁사 벤치마킹
```
목표: 시장 포지셔닝
1. 주요 경쟁사 3개 페이지 추적
2. averageAdLifespan 비교 → 우리 14일 vs 경쟁사 28일
3. 전략: A/B 테스트 빈도 증가로 광고 피로도 방지
```

## 향후 개발 예정

### Phase 2: 경쟁사 모니터링 자동화
- [ ] DB에 추적 페이지 저장
- [ ] 주간 자동 리포트 생성
- [ ] 신규 광고 알림 (Webhook)

### Phase 3: 고급 분석
- [ ] 이미지 분석 (색상, 레이아웃, 텍스트 위치)
- [ ] 시계열 트렌드 분석 (월별 변화)
- [ ] 업종별 벤치마크 비교

### Phase 4: 통합 대시보드
- [ ] 경쟁사 광고 갤러리 UI
- [ ] 필터링 (업종, 기간, 성과 추정)
- [ ] 즐겨찾기 기능

## 참고 자료

- [Meta Ad Library API 문서](https://developers.facebook.com/docs/marketing-api/reference/ads_archive/)
- [Meta Marketing API 버전](https://developers.facebook.com/docs/graph-api/changelog/)
- [Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/)
