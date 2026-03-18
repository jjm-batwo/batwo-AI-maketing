# 바투 AI 마케팅 - 주간 마케팅 리포트 생성기

Meta Ads 데이터를 넣으면 **HTML + PDF 보고서**를 자동 생성합니다.

## 📁 프로젝트 구조

```
batwo-report/
├── generate_report.py      # 메인 생성 스크립트
├── templates/
│   └── report.html.j2      # Jinja2 HTML 템플릿
├── data/
│   └── sample_data.json    # 샘플 데이터 (데이터 스키마 참고용)
├── output/                  # 생성된 보고서 저장 위치
└── README.md
```

## ⚡ 빠른 시작

### 1. 의존성 설치

```bash
pip install jinja2 playwright
playwright install chromium
```

### 2. 실행

```bash
# 샘플 데이터로 테스트
python generate_report.py

# 실제 데이터로 생성
python generate_report.py --data data/my_week_data.json

# HTML만 생성 (PDF 불필요시)
python generate_report.py --html-only

# PDF만 생성
python generate_report.py --pdf-only
```

## 📊 데이터 스키마

`data/sample_data.json`을 참고하세요. 주요 구조:

```json
{
  "report_meta": {
    "brand_name": "바투 AI 마케팅 솔루션",
    "period_start": "2026-03-12",
    "period_end": "2026-03-18",
    "generated_at": "2026-03-18"
  },
  "kpi_summary": { ... },     // 총 지출, 매출, ROAS, CTR, 전환
  "daily_data": [ ... ],      // 일별 데이터 배열
  "campaigns": [ ... ],       // 캠페인별 성과
  "creatives_top5": [ ... ],  // 소재 TOP 5
  "creative_fatigue": [ ... ],// 피로도 지수
  "format_performance": [ ... ], // 포맷별 성과
  "funnel": [ ... ],          // ToFu/MoFu/BoFu
  "analysis": { ... },        // AI 분석 결과
  "actions": [ ... ]          // 추천 액션
}
```

## 🔌 Meta Ads API 연동 방법

Meta Ads API에서 데이터를 가져와 위 JSON 스키마에 맞게 변환하는 스크립트를 별도로 작성하면 됩니다.

### 필요한 Meta API 엔드포인트:

| 데이터 | API 엔드포인트 | 주요 필드 |
|--------|---------------|-----------|
| 캠페인 성과 | `/act_{ad_account_id}/insights` | spend, actions, action_values |
| 소재 성과 | `/act_{ad_account_id}/ads` + insights | adcreatives, ctr, impressions |
| 일별 추이 | insights + `time_increment=1` | date_start, spend, impressions |

### 연동 흐름:

```
Meta Ads API → JSON 변환 스크립트 → sample_data.json 형식 → generate_report.py → HTML + PDF
```

## 🎨 커스터마이징

### 색상 변경
`templates/report.html.j2`의 `:root` CSS 변수를 수정:

```css
:root {
  --accent-blue: #4E8CFF;    /* 메인 포인트 컬러 */
  --accent-green: #34D399;   /* 긍정 지표 */
  --accent-red: #F87171;     /* 경고/하락 */
  --bg-primary: #0A0A0F;     /* 배경색 */
}
```

### 섹션 추가/제거
템플릿에서 `<!-- ===== PAGE N ===== -->` 주석으로 구분된 섹션을 추가/삭제하세요.

### 클라이언트별 브랜딩
`report_meta.brand_name`을 변경하면 헤더에 자동 반영됩니다.
