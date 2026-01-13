# Meta 앱 검수 통과 계획

## 거부 사유 요약
- `pages_show_list`: 스크린캐스트가 엔드투엔드 경험 미흡
- `ads_read`: 스크린캐스트가 엔드투엔드 경험 미흡
- `ads_management`: 스크린캐스트가 엔드투엔드 경험 미흡

---

## Phase 1: UI 영어화 (2일)

### 1.1 다국어 지원 설정
```bash
npm install next-intl
```

### 1.2 영어 번역 필요 페이지
| 페이지 | 파일 |
|--------|------|
| 로그인 | `src/app/(auth)/login/page.tsx` |
| 대시보드 | `src/app/(dashboard)/dashboard/page.tsx` |
| 캠페인 목록 | `src/app/(dashboard)/campaigns/page.tsx` |
| 캠페인 생성 | `src/app/(dashboard)/campaigns/new/page.tsx` |
| 캠페인 상세 | `src/app/(dashboard)/campaigns/[id]/page.tsx` |
| 설정 (Meta 연결) | `src/app/(dashboard)/settings/meta-connect/page.tsx` |

### 1.3 핵심 번역 항목
```json
{
  "login": {
    "title": "Login",
    "continueWithFacebook": "Continue with Facebook",
    "continueWithGoogle": "Continue with Google"
  },
  "dashboard": {
    "title": "Dashboard",
    "impressions": "Impressions",
    "clicks": "Clicks",
    "spend": "Spend",
    "roas": "ROAS"
  },
  "campaigns": {
    "title": "Campaigns",
    "newCampaign": "New Campaign",
    "search": "Search campaigns...",
    "status": {
      "all": "All",
      "active": "Active",
      "paused": "Paused",
      "draft": "Draft"
    }
  },
  "campaignCreate": {
    "step1": "Campaign Info",
    "step2": "Target Audience",
    "step3": "Budget & Schedule",
    "step4": "Review & Create"
  }
}
```

---

## Phase 2: 스크린캐스트 촬영 (1일)

### 2.1 촬영 환경 설정
- [ ] 브라우저: Chrome (개발자 도구 숨김)
- [ ] 해상도: 1920x1080
- [ ] 녹화 도구: OBS Studio 또는 QuickTime
- [ ] 언어: 영어 UI
- [ ] 테스트 데이터: 실제 광고 계정 데이터

### 2.2 스크린캐스트 구성 (총 4~5분)

#### Part 1: 로그인 & 권한 부여 (45초)
```
[00:00] 앱 로그인 페이지 표시
[00:10] 자막: "User clicks 'Continue with Facebook' to authenticate"
[00:15] Meta OAuth 화면 표시 - 권한 목록 강조
[00:25] 자막: "User reviews and approves the following permissions:
        - pages_show_list: View user's Facebook Pages
        - ads_read: Read advertising data
        - ads_management: Manage advertising campaigns"
[00:35] "Continue" 클릭 → 앱으로 리디렉션
[00:40] 자막: "User is now logged in and redirected to the dashboard"
```

#### Part 2: pages_show_list 사용 (30초)
```
[00:45] Settings > Meta Connection 페이지 이동
[00:55] 연결된 광고 계정 목록 표시
[01:05] 자막: "The app displays connected Meta Ad Accounts using pages_show_list permission"
[01:10] 계정 정보 확인 (Account Name, Account ID, Connected Date)
```

#### Part 3: ads_read 사용 (1분 30초)
```
[01:15] Dashboard 페이지 이동
[01:20] 자막: "Dashboard shows real-time campaign performance metrics"
[01:30] KPI 카드 순서대로 강조:
        - Impressions (노출수)
        - Clicks (클릭수)
        - Spend (지출)
        - ROAS (광고수익률)
[01:50] 자막: "This data is fetched from Meta Ads API using ads_read permission"
[02:00] Campaigns 페이지 이동
[02:10] 캠페인 목록 표시 → 하나 클릭
[02:20] 캠페인 상세 페이지 → Performance Insights 섹션 표시
[02:35] 자막: "Detailed campaign analytics including daily performance trends"
```

#### Part 4: ads_management 사용 (2분)
```
[02:45] "New Campaign" 버튼 클릭
[02:50] 자막: "Creating a new campaign using ads_management permission"

[Step 1: Campaign Info]
[03:00] Campaign Name 입력: "Holiday Sale Campaign"
[03:05] Objective 선택: "Sales"
[03:10] "Next" 클릭

[Step 2: Target Audience]
[03:15] Age Range: 25-54
[03:20] Locations: United States
[03:25] Interests: E-commerce, Online Shopping
[03:30] "Next" 클릭

[Step 3: Budget & Schedule]
[03:35] Daily Budget: $50
[03:40] Start Date: Today
[03:45] End Date: 2 weeks later
[03:50] "Next" 클릭

[Step 4: Review & Create]
[03:55] 설정 요약 확인
[04:00] "Create Campaign" 클릭
[04:05] 자막: "Campaign created successfully via Meta Ads API"

[Campaign Management]
[04:10] 생성된 캠페인 목록에서 확인
[04:15] Edit 버튼 클릭 → Budget 수정 ($50 → $75)
[04:25] Save 클릭
[04:30] 자막: "Campaign budget updated using ads_management permission"
[04:35] Pause 버튼 클릭 → 캠페인 일시중지
[04:40] 자막: "Campaign status changed to Paused"
```

#### Part 5: 마무리 (15초)
```
[04:45] 자막: "This application helps businesses efficiently manage
        their Meta advertising campaigns through an intuitive interface"
[04:55] 끝
```

---

## Phase 3: 제출 노트 작성

### 3.1 pages_show_list 제출 노트
```
USE CASE: Our application displays connected Meta Ad Accounts to users.

SCREENCAST TIMESTAMP:
- 00:45-01:15: User navigates to Settings > Meta Connection
- The app lists all connected Ad Accounts with Account Name, ID, and Connection Date
- This allows users to manage which accounts are linked to our platform

PERMISSION USAGE:
- We use pages_show_list to retrieve the list of Facebook Pages and Ad Accounts
- The data is displayed in the Settings page for account management
- Users can disconnect accounts if needed

NO FRONTEND LOGIN NOTE:
N/A - Our app uses standard frontend Meta OAuth login flow as shown at 00:00-00:40.
```

### 3.2 ads_read 제출 노트
```
USE CASE: Our application provides a real-time advertising dashboard and campaign analytics.

SCREENCAST TIMESTAMP:
- 01:15-02:45: Dashboard displays KPIs (Impressions, Clicks, Spend, ROAS)
- Campaign list shows performance metrics for each campaign
- Campaign detail page shows historical performance trends

PERMISSION USAGE:
- We use ads_read to fetch campaign performance data from Meta Ads API
- Data displayed: impressions, clicks, CTR, spend, conversions, ROAS
- Insights are updated in real-time when users view the dashboard

API ENDPOINTS USED:
- GET /{ad-account-id}/campaigns - List campaigns
- GET /{campaign-id}/insights - Campaign performance data
- GET /{ad-account-id}/insights - Account-level analytics
```

### 3.3 ads_management 제출 노트
```
USE CASE: Our application allows users to create, edit, and manage Meta advertising campaigns.

SCREENCAST TIMESTAMP:
- 02:45-04:45: Complete campaign lifecycle demonstration
  - 02:45-04:05: Create new campaign (4-step wizard)
  - 04:10-04:30: Edit existing campaign (budget modification)
  - 04:35-04:45: Pause/Resume campaign

PERMISSION USAGE:
- CREATE: Users can create new campaigns with objectives, targeting, and budget
- UPDATE: Users can modify campaign name, budget, schedule, and targeting
- STATUS: Users can pause, resume, or archive campaigns

API ENDPOINTS USED:
- POST /{ad-account-id}/campaigns - Create campaign
- POST /{campaign-id} - Update campaign
- DELETE /{campaign-id} - Delete campaign
```

---

## Phase 4: 최종 체크리스트

### 제출 전 확인
- [ ] 스크린캐스트 해상도: 1080p 이상
- [ ] 스크린캐스트 길이: 3~5분
- [ ] 영어 UI 또는 영어 자막
- [ ] 모든 버튼/UI 요소 설명 포함
- [ ] 전체 로그인 플로우 포함
- [ ] 권한 동의 화면 캡처
- [ ] 각 권한별 엔드투엔드 경험 시연
- [ ] 제출 노트 영어로 작성
- [ ] API 호출량 충분 (15일간 1000+ 호출)

### 제출 순서
1. API 호출량 확인 (현재 웜업 진행 중)
2. 스크린캐스트 촬영 및 편집
3. 제출 노트 작성
4. Meta 개발자 콘솔에서 재제출

---

## 타임라인

| 단계 | 예상 소요 | 상태 |
|------|----------|------|
| API 웜업 | 2-3일 | 🔄 진행 중 |
| UI 영어화 (선택) | 1-2일 | ⏳ 대기 |
| 스크린캐스트 촬영 | 1일 | ⏳ 대기 |
| 제출 노트 작성 | 2시간 | ⏳ 대기 |
| 검수 재제출 | - | ⏳ 대기 |
| Meta 검토 | 3-5 영업일 | ⏳ 대기 |

---

## 참고 자료
- [Meta App Review Guide](https://developers.facebook.com/docs/app-review)
- [Screencast Best Practices](https://developers.facebook.com/docs/app-review/submission-guide/screencast)
- [Common Rejection Reasons](https://developers.facebook.com/docs/app-review/common-rejections)
