# 메타 픽셀 설정, 표준/맞춤 이벤트, CAPI 연동 실무 가이드

## 1. 메타 픽셀(Meta Pixel)이란?

메타 픽셀은 웹사이트에 설치하는 JavaScript 코드 조각으로, 방문자의 행동을 추적하여 다음 기능을 가능하게 한다:
- 광고 캠페인의 **전환 추적** (구매, 가입, 장바구니 등)
- **리타겟팅 오디언스** 생성 (방문자, 장바구니 유기자 등)
- **유사 타겟(Lookalike Audience)** 생성을 위한 데이터 수집
- 전환 최적화 캠페인의 **학습 데이터** 제공

---

## 2. 픽셀 설치 방법

### 2-1. 픽셀 생성
1. Meta Events Manager(이벤트 관리자) 접속
2. "데이터 소스 연결" → "웹" 선택 → "메타 픽셀" 선택
3. 픽셀 이름 지정 (보통 비즈니스명 사용) → 고유 Pixel ID 생성

### 2-2. 설치 옵션

| 방법 | 설명 | 권장 대상 |
|------|------|----------|
| **수동 설치** | 픽셀 base code를 웹사이트의 `<head>` 태그 상단에 직접 삽입 | 개발 리소스가 있는 팀, 가장 정확한 제어 가능 |
| **Google Tag Manager (GTM)** | GTM에서 맞춤 HTML 태그로 픽셀 코드 추가, 트리거는 "All Pages" 설정 | 코드 수정 없이 유연한 관리 가능. 가장 권장되는 방법 |
| **파트너 통합** | Shopify, WordPress, Cafe24, NHN 커머스 등 CMS의 내장 연동 기능 사용 | 비개발자, 표준 이벤트 자동 설정 가능 |

### 2-3. 올바른 설치 확인 방법
- **Meta Pixel Helper** (Chrome 확장 프로그램): 페이지별 픽셀 발화 여부 및 오류 확인
- **Events Manager → "테스트 이벤트" 탭**: 웹사이트 URL을 입력하고 실제 행동 수행 → 실시간으로 이벤트 수신 확인

---

## 3. 표준 이벤트(Standard Events) — 17개 사전 정의 이벤트

표준 이벤트는 메타가 미리 정의한 전환 행동으로, **전환 최적화 캠페인에서 직접 최적화 목표로 사용 가능**하다.

### 이커머스 핵심 표준 이벤트 (필수)

| 이벤트 이름 | 설명 | 코드 예시 |
|------------|------|----------|
| `PageView` | 페이지 조회 (base code에 자동 포함) | 자동 발화 |
| `ViewContent` | 상품 상세 페이지 조회 | `fbq('track', 'ViewContent', {content_ids: ['SKU123'], content_type: 'product', value: 29900, currency: 'KRW'});` |
| `AddToCart` | 장바구니에 상품 추가 | `fbq('track', 'AddToCart', {content_ids: ['SKU123'], value: 29900, currency: 'KRW'});` |
| `InitiateCheckout` | 결제 프로세스 시작 | `fbq('track', 'InitiateCheckout', {value: 59800, currency: 'KRW', num_items: 2});` |
| `AddPaymentInfo` | 결제 정보 입력 | `fbq('track', 'AddPaymentInfo');` |
| `Purchase` | 구매 완료 (**가장 중요**) | `fbq('track', 'Purchase', {content_ids: ['SKU123'], value: 59800, currency: 'KRW'});` |

### 리드/가입 관련 표준 이벤트

| 이벤트 이름 | 설명 |
|------------|------|
| `Lead` | 연락처 정보 제출 (문의 폼, 상담 신청) |
| `CompleteRegistration` | 회원가입 완료 |
| `Subscribe` | 유료 구독 시작 |
| `Search` | 사이트 내 검색 수행 |

### 필수 파라미터
전환 최적화 정확도를 높이려면 이벤트에 **파라미터**를 반드시 포함해야 한다:
- `value`: 전환 금액 (ROAS 최적화에 필수)
- `currency`: 통화 코드 ('KRW', 'USD' 등)
- `content_ids`: 상품 SKU/ID (동적 리마케팅에 필수)
- `content_type`: 'product' 또는 'product_group'

---

## 4. 맞춤 이벤트(Custom Events)

표준 이벤트 17개로 커버되지 않는 비즈니스 고유의 행동을 추적할 때 사용한다.

### 사용 예시
```javascript
fbq('trackCustom', 'ProductFilterUsed', {
  filter_type: 'price_range',
  filter_value: '30000-50000'
});

fbq('trackCustom', 'VideoWatched75Percent', {
  video_title: '브랜드 스토리',
  video_length: 120
});
```

### 주의사항
- 맞춤 이벤트는 **오디언스 생성**에는 사용 가능
- 그러나 **전환 최적화 목표로 직접 사용 불가** → 가장 가까운 표준 이벤트에 매핑하여 최적화해야 함
- 맞춤 이벤트보다 표준 이벤트를 우선 사용하는 것이 항상 권장됨

---

## 5. CAPI(전환 API)와 픽셀 이중 설정 — 중복 제거(Deduplication)

2026년 현재 **픽셀 + CAPI 하이브리드 트래킹은 필수**이다 (자세한 내용은 04번 문서 참조). 단, 동시 사용 시 **중복 전환 카운팅** 문제가 발생한다.

### 중복 제거 방법
모든 이벤트에 `eventID` 파라미터를 추가하여, 픽셀과 CAPI에서 동일한 `eventID`가 전송되면 메타가 자동으로 **1건으로 통합 처리**한다.

**픽셀 측 코드:**
```javascript
fbq('track', 'Purchase', {
  value: 59800,
  currency: 'KRW',
  content_ids: ['SKU123']
}, { eventID: 'order_20260309_abc123' });
```

**CAPI 측 서버 전송:**
```json
{
  "event_name": "Purchase",
  "event_id": "order_20260309_abc123",
  "event_time": 1741492800,
  "user_data": { "em": ["해시화된 이메일"], "ph": ["해시화된 전화번호"] },
  "custom_data": { "value": 59800, "currency": "KRW" }
}
```

핵심: **동일한 전환에 대해 픽셀과 CAPI 양쪽에서 같은 `eventID`를 전송**해야 중복이 제거된다.

---

## 6. 고급 매칭(Advanced Matching) 활성화

메타 이벤트 관리자에서 "고급 매칭"을 활성화하면, 웹사이트 방문자의 **해시화된 이메일, 전화번호, 이름 등**을 자동으로 메타 프로필과 매칭하여 이벤트 매칭 품질(EMQ)이 향상된다.

### 설정 방법
- Events Manager → 데이터 소스 설정 → "고급 매칭(Advanced Matching)" 토글 ON
- 자동 고급 매칭: 메타가 웹사이트 폼에서 자동으로 고객 정보를 추출
- 수동 고급 매칭: 개발자가 코드에서 직접 고객 정보를 해시화하여 전달

---

## 7. 흔한 트러블슈팅 Q&A

### "AddToCart 이벤트가 안 잡혀요"
→ 장바구니 버튼이 **AJAX 기반(페이지 새로고침 없음)**인 경우, 클릭 이벤트 리스너에 `fbq('track', 'AddToCart')` 코드를 직접 연결해야 함. GTM 사용 시 "클릭 트리거"로 설정.

### "Purchase 이벤트가 중복으로 잡혀요"
→ 결제 완료 페이지(Thank You Page)에서 새로고침 시 이벤트가 다시 발화되는 문제. **`eventID`를 주문 번호로 설정**하면 메타가 중복을 자동 제거함.

### "Pixel Helper에서 '이벤트 수신됨' 표시 안 됨"
→ 가능한 원인: (1) 광고 차단기가 활성화된 상태, (2) 픽셀 코드가 `<head>` 대신 `<body>` 하단에 배치됨, (3) JavaScript 오류로 코드 실행 차단됨. 브라우저 개발자 도구(F12) → Console 탭에서 오류 확인.

### 출처
- Meta for Developers: "Meta Pixel Reference"
- Meta Business Help Center: "Standard Events and Custom Events"
- Meta for Developers: "Conversions API Setup Guide"
- ROI Hacks: "Complete Meta Pixel Tutorial 2026"
- Cometly: "Facebook Conversions API and Pixel Deduplication"
