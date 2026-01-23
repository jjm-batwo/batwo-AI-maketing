# Meta 앱 검수 통과 가이드

## 반려 현황

| 권한 | 상태 | 반려 사유 |
|------|------|----------|
| pages_show_list | 반려 | 엔드투엔드 경험 미흡 |
| business_management | 반려 | 엔드투엔드 경험 미흡 |
| ads_read | 반려 | 엔드투엔드 경험 미흡 |
| pages_read_engagement | 반려 | 엔드투엔드 경험 미흡 |
| ads_management | 반려 | 엔드투엔드 경험 미흡 |

## 검수 통과 요구사항

Meta 앱 검수를 통과하기 위해 스크린캐스트에 반드시 포함해야 할 내용:

### 1. 전체 로그인 플로우
- Facebook 로그인 버튼 클릭
- Meta 로그인 페이지에서 인증
- 권한 승인 화면 (5개 권한 모두 표시)
- 앱으로 리다이렉션

### 2. 각 권한별 사용 사례

#### `pages_show_list` (페이지 목록 조회)
- **용도**: 사용자가 관리하는 Facebook 페이지 목록 표시
- **데모**: 설정 > Meta 페이지 관리에서 페이지 목록 확인
- **API 호출**: `GET /me/accounts`

#### `pages_read_engagement` (페이지 참여 데이터)
- **용도**: 페이지 게시물의 좋아요, 댓글, 공유 등 참여 데이터 조회
- **데모**: 페이지 상세 > 참여 지표 대시보드
- **API 호출**: `GET /{page-id}/insights`

#### `business_management` (비즈니스 자산 관리)
- **용도**: 비즈니스 계정, 픽셀, 광고 계정 관리
- **데모**: 설정 > 픽셀 관리에서 픽셀 목록 조회/생성
- **API 호출**: `GET /me/businesses`, `GET /{business-id}/adspixels`

#### `ads_read` (광고 데이터 조회)
- **용도**: 캠페인 성과 데이터 (노출, 클릭, 비용, ROAS 등)
- **데모**: 대시보드 KPI 카드, 차트, 캠페인 목록
- **API 호출**: `GET /act_{ad-account-id}/insights`

#### `ads_management` (광고 관리)
- **용도**: 캠페인 생성, 수정, 일시중지, 삭제
- **데모**: 캠페인 생성 폼 → Meta 동기화 → 상태 변경
- **API 호출**: `POST /act_{ad-account-id}/campaigns`

## 스크린캐스트 녹화 순서

### Scene 1: 앱 소개 (30초)
```
1. 앱 로그인 페이지 표시
2. "바투 AI 마케팅 솔루션" 소개 텍스트 표시
3. 주요 기능 나열:
   - Facebook/Instagram 광고 캠페인 자동화
   - 실시간 성과 대시보드
   - AI 기반 최적화 제안
```

### Scene 2: Meta 계정 연결 (60초)
```
1. 로그인 후 대시보드 이동
2. 설정 > Meta 광고 계정 연결 페이지 이동
3. "Meta 계정 연결하기" 버튼 클릭
4. Facebook 로그인 다이얼로그 표시
   - 이메일/비밀번호 입력 (테스트 계정)
5. 권한 승인 화면 캡처 (5개 권한 모두 표시)
6. "계속" 버튼 클릭
7. 앱으로 리다이렉션 → 연결 성공 메시지
```

### Scene 3: pages_show_list 사용 (45초)
```
1. 설정 > Meta 페이지 관리 이동
2. 연결된 페이지 목록 표시
   - 페이지 이름, 카테고리, 팔로워 수
3. 페이지 선택하여 상세 정보 표시
4. 캡션: "사용자가 관리하는 페이지 목록을 조회합니다"
```

### Scene 4: pages_read_engagement 사용 (45초)
```
1. 선택한 페이지의 참여 지표 대시보드
2. 표시 데이터:
   - 총 좋아요 수
   - 총 댓글 수
   - 게시물별 참여율
   - 기간별 참여 추이 차트
3. 캡션: "페이지 게시물의 참여 데이터를 분석합니다"
```

### Scene 5: business_management 사용 (45초)
```
1. 설정 > 픽셀 설치 페이지 이동
2. 연결된 비즈니스의 픽셀 목록 표시
3. 새 픽셀 생성 또는 기존 픽셀 선택
4. 픽셀 설치 코드 복사 기능 시연
5. 캡션: "비즈니스 자산(픽셀)을 관리합니다"
```

### Scene 6: ads_read 사용 (60초)
```
1. 대시보드 메인 페이지 이동
2. KPI 카드 표시:
   - ROAS, 총 지출, 전환수, CTR
3. 차트 표시:
   - 지출 추이, ROAS 추이
4. 캠페인 목록 테이블
5. 캠페인 상세 > 성과 데이터
6. 캡션: "캠페인 성과 데이터를 실시간으로 조회합니다"
```

### Scene 7: ads_management 사용 (60초)
```
1. 캠페인 > 새 캠페인 만들기
2. 캠페인 정보 입력:
   - 이름, 목적, 예산, 기간
3. "Meta에 동기화" 옵션 활성화
4. 캠페인 생성 완료
5. 캠페인 목록에서 새 캠페인 확인
6. 캠페인 일시중지/재개 시연
7. 캡션: "캠페인을 생성하고 관리합니다"
```

### Scene 8: 마무리 (30초)
```
1. 전체 기능 요약
2. 앱의 가치 설명
3. 감사 메시지
```

## 제출 체크리스트

- [ ] 스크린캐스트 (MP4, 5분 이내)
- [ ] 영어 UI 사용 또는 영어 캡션/자막 포함
- [ ] 각 권한별 사용 장면 포함
- [ ] 전체 로그인 플로우 포함
- [ ] 테스트 계정 정보 제공
- [ ] 개인정보처리방침 URL
- [ ] 서비스 이용약관 URL

## 제출 노트 템플릿

```
## App Description
Batwo AI Marketing Solution is a comprehensive marketing automation platform
for e-commerce businesses that integrates with Meta (Facebook/Instagram) Ads.

## Permissions Usage

### pages_show_list
Used to display the list of Facebook Pages managed by the user, allowing them
to select which pages to connect with our platform for engagement analytics.

### pages_read_engagement
Used to fetch engagement metrics (likes, comments, shares) for the connected
Pages to display in our engagement analytics dashboard.

### business_management
Used to manage business assets including Meta Pixels for conversion tracking
setup on customer websites.

### ads_read
Used to fetch campaign performance data (impressions, clicks, spend, ROAS,
conversions) to display in our real-time KPI dashboard.

### ads_management
Used to create, update, pause, and delete advertising campaigns on behalf of
the user through our campaign management interface.

## Test Account
Email: [test account email]
Password: [test account password]

Note: This app uses OAuth authentication with user tokens. The screencast
demonstrates the complete end-to-end flow including Facebook Login dialog
and permission consent screen.
```

## 관련 파일

- OAuth 연결: `src/app/(dashboard)/settings/meta-connect/page.tsx`
- Callback API: `src/app/api/meta/callback/route.ts`
- 대시보드: `src/app/(dashboard)/dashboard/page.tsx`
- 캠페인 관리: `src/app/(dashboard)/campaigns/`
- 픽셀 관리: `src/app/api/pixel/`

## 참고 링크

- [Meta App Review Process](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review)
- [Permission Dependencies](https://developers.facebook.com/docs/permissions#permission-dependencies)
- [Screencast Best Practices](https://medium.com/orion-innovation-techclub/how-to-create-a-meta-app-review-screencast-that-gets-approved-fast-6d89b133f0f2)
