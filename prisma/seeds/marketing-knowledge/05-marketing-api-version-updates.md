# 메타 마케팅 API(MAPI) 버전별 변경 사항 및 SaaS 개발 대응 (v23.0 ~ v25.0)

메타 광고 자동화 SaaS 개발에 있어, Graph API 및 Marketing API(MAPI)의 버전별 변경 사항을 아키텍처에 완벽하게 반영하는 것은 **솔루션의 생존과 직결**된다. 2025년 하반기~2026년 상반기의 API 감가상각(Deprecation) 조치들은 구버전 코드를 방치하는 서드파티 툴들을 시장에서 완전히 퇴출시킬 만큼 치명적이다.

## 1. MAPI v23.0 — 레거시 Advantage+ 캠페인 지원 중단 선언

- **시점**: 2025년 10월 8일 적용 시작
- **핵심 변경**: 이전 방식의 레거시 Advantage+ 쇼핑 캠페인(ASC) 및 앱 캠페인(AAC)을 생성하는 **구형 API 엔드포인트 공식 지원 중단**
- **SaaS 대응**: 즉시 Advantage+ 전용 신규 엔드포인트 구조 분석에 착수

---

## 2. MAPI v24.0 — 신규 지표 추가 및 재무 통제 옵션 확장

- **시점**: 2026년 시스템 본격 적용
- **신규 엔드포인트 및 기능**:
  - **Content Monetization Earnings**: 크리에이터 콘텐츠 수익 추적 가능
  - **Website Destination Optimization**: 웹사이트 도착지 최적화 기능 API 제어 가능
  - **제외된 게재위치에 대한 예산 제한**: Limited Spend on Excluded Placements
  - **일일 예산 유연성(Daily Budget Flexibility)**: 고도화된 재무 통제 옵션
- **SaaS 대응**: 대시보드 내 신규 지표 수집 파이프라인 연동 필수, 자동 입찰 및 예산 관리 알고리즘의 정교화

---

## 3. MAPI v25.0 — ⚠️ 최고 주의: 2026년 5월 19일 전면 강제 적용

- **시점**: 2025년 2월 18일 릴리스, **2026년 5월 19일에 모든 하위 MAPI 버전에 강제 소급 적용**
- **핵심 변경**: 서드파티 앱 내에서 **구버전 방식의 Advantage+ 캠페인 생성 및 수정 행위 자체가 원천적으로 금지**
- **SaaS 대응**: 
  - **기한 전까지** 캠페인 생성 모듈 전체의 코드를 v24.0 이상의 최신 Advantage+ 규격으로 **전면 마이그레이션** 필수
  - 이를 위반할 경우 → 고객들이 SaaS 플랫폼 내에서 캠페인을 제어할 수 없는 **치명적 오류 발생**

---

## API 버전별 요약표

| API 버전 | 릴리스/강제 적용 기한 | 핵심 변경 사항 | SaaS 개발팀 대응 과제 |
|----------|---------------------|-------------|---------------------|
| **MAPI v23.0** | 2025년 10월 적용 | 레거시 ASC/AAC 신규 캠페인 생성 지원 중단 | Advantage+ 전용 신규 엔드포인트 구조 분석 |
| **MAPI v24.0** | 2026년 본격 적용 | Content Monetization Earnings 등 신규 지표, 일일 예산 유연성 옵션 | 대시보드 내 신규 지표 수집 파이프라인 연동 |
| **MAPI v25.0** | **2026년 5월 19일 전면 강제** | 구버전 Advantage+ 캠페인 생성/업데이트 모든 API 버전에서 완전 금지 | 기한 내 백엔드 코드 마이그레이션 불이행 시 SaaS 작동 중단 |

---

## SaaS 개발 실무 가이드

1. 메타 릴리스 노트 변경 사항을 **매월 트래킹**하여 선제적으로 데이터 스키마(Schema) 업데이트
2. v25.0 강제 적용(2026년 5월 19일) 이전까지 **Advantage+ 전용 캠페인 생성 모듈로 전면 전환** 완료
3. 새로운 지표(Content Monetization Earnings, Daily Budget Flexibility 등)의 **데이터 수집 파이프라인** 구축

### 출처
- Social Media Today: "Meta Updates Marketing API To Put More Focus on AI Targeting Tools"
- Social Media Today: "Meta Updates Marketing API To Align With Latest Ad Shifts"  
- UAMaster: "Facebook Launches Graph API v24.0 and Marketing API v24.0 for Developers"
