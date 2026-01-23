# Meta App Review 스크린캐스트 녹화 가이드

## 사전 준비

### 1. 테스트 계정 준비
- Facebook 테스트 계정 (Meta Developer Console에서 생성)
- 테스트 계정에 연결된 Facebook 페이지
- 테스트 계정에 연결된 Meta Business 계정
- 테스트 계정에 연결된 광고 계정 (샘플 캠페인 포함)

### 2. 앱 권한 재설정
테스트 계정에서 앱 권한을 먼저 제거하여 OAuth 동의 화면이 표시되도록 합니다:
1. Facebook 설정 > 앱 및 웹사이트로 이동
2. "Batwo" 앱 찾기
3. "제거" 클릭

### 3. 로컬 환경 설정
```bash
# 환경 변수 확인
cat .env | grep META

# 로컬 서버 실행
npm run dev
```

## 녹화 도구 옵션

### Option A: OBS Studio (권장)
```bash
# macOS에 OBS 설치
brew install --cask obs
```

설정:
- 해상도: 1920x1080
- FPS: 30
- 출력 형식: MP4
- 비트레이트: 2500 kbps

### Option B: QuickTime Player (macOS 기본)
1. QuickTime Player 실행
2. 파일 > 새 화면 기록
3. 옵션에서 마이크 끔 (Meta는 오디오를 듣지 않음)

### Option C: Playwright 자동 녹화
```bash
# Playwright 설정에 비디오 녹화 추가
npx playwright test scripts/meta-app-review-recording.ts --headed
```

## 녹화 시나리오 스크립트

### Scene 1: 앱 소개 (30초)
```
1. 브라우저에서 http://localhost:3000 열기
2. 로그인 페이지 3초간 표시
3. (캡션) "Batwo AI Marketing Solution - E-commerce advertising automation platform"
```

### Scene 2: Meta 계정 연결 (60초)
```
1. 로그인 후 대시보드로 이동
2. 설정 메뉴 클릭 > Meta 광고 계정 연결
3. "Meta 계정 연결하기" 버튼 클릭
4. Facebook 로그인 다이얼로그에서:
   - 테스트 이메일 입력
   - 비밀번호 입력
   - 로그인 클릭
5. 권한 동의 화면 캡처 (5개 권한 표시)
   (캡션) "User grants access to: pages_show_list, pages_read_engagement,
           business_management, ads_read, ads_management"
6. "계속" 버튼 클릭
7. 앱으로 리다이렉션 - 연결 성공 메시지 표시
```

### Scene 3: pages_show_list 데모 (45초)
```
1. 설정 > Meta 페이지 관리 클릭
2. 페이지 목록 로딩 대기
3. (캡션) "Using pages_show_list permission to display managed Facebook Pages"
4. 각 페이지의 이름, 카테고리, 팔로워 수 확인
5. 첫 번째 페이지 클릭
```

### Scene 4: pages_read_engagement 데모 (45초)
```
1. 선택한 페이지의 참여 지표 로딩
2. (캡션) "Using pages_read_engagement permission to fetch engagement metrics"
3. 표시 항목:
   - 팬 수
   - 노출 수
   - 참여 사용자
   - 게시물 참여
4. 최근 게시물 섹션의 좋아요/댓글/공유 수 확인
```

### Scene 5: business_management 데모 (45초)
```
1. 설정 > 픽셀 설치 클릭
2. (캡션) "Using business_management permission to manage Meta Pixels"
3. 픽셀 목록 확인
4. 픽셀 선택 또는 새 픽셀 생성
5. 설치 코드 복사 버튼 확인
```

### Scene 6: ads_read 데모 (60초)
```
1. 대시보드 메인 페이지로 이동
2. (캡션) "Using ads_read permission to fetch campaign performance data"
3. KPI 카드 확인:
   - ROAS: X.XX
   - 총 지출: ₩X,XXX
   - 전환수: XX
   - CTR: X.XX%
4. 차트 섹션으로 스크롤
5. 지출 추이 차트, ROAS 추이 차트 확인
6. 캠페인 목록 테이블 확인
```

### Scene 7: ads_management 데모 (60초)
```
1. 캠페인 메뉴 클릭
2. 기존 캠페인 목록 확인
3. "새 캠페인 만들기" 버튼 클릭
4. (캡션) "Using ads_management permission to create and manage campaigns"
5. 캠페인 정보 입력:
   - 이름: "Test Campaign for Review"
   - 목적: 전환
   - 예산: ₩10,000
   - 시작일/종료일 설정
6. "Meta에 동기화" 옵션 활성화
7. "캠페인 생성" 버튼 클릭
8. 생성 성공 메시지 확인
9. 캠페인 목록에서 새 캠페인 확인
10. 일시중지 버튼 클릭하여 상태 변경 시연
```

### Scene 8: 마무리 (30초)
```
1. 앱 검수 데모 페이지 (/app-review-demo) 이동
2. 모든 권한이 "Granted" 상태인지 확인
3. (캡션) "All requested permissions are demonstrated with end-to-end experience"
4. 앱 로고와 함께 종료
```

## 캡션/자막 추가

Meta 앱 검수는 영어 자막을 요구합니다. 각 씬에 다음 캡션을 추가하세요:

| 시간 | 캡션 텍스트 |
|------|------------|
| 0:00 | Batwo AI Marketing Solution - Campaign management for e-commerce |
| 0:30 | Connecting Meta account via Facebook OAuth |
| 1:00 | Granting permissions: pages_show_list, pages_read_engagement, business_management, ads_read, ads_management |
| 1:30 | Demonstrating pages_show_list - Viewing managed Facebook Pages |
| 2:15 | Demonstrating pages_read_engagement - Page engagement analytics |
| 3:00 | Demonstrating business_management - Meta Pixel management |
| 3:45 | Demonstrating ads_read - Real-time campaign performance dashboard |
| 4:30 | Demonstrating ads_management - Creating and managing campaigns |
| 5:00 | Campaign created and synced to Meta |
| 5:15 | All permissions demonstrated with complete end-to-end experience |

## 녹화 후 체크리스트

- [ ] 영상 길이가 5분 이내인지 확인
- [ ] 모든 5개 권한이 사용되는 장면이 포함되어 있는지 확인
- [ ] Facebook OAuth 동의 화면이 캡처되었는지 확인
- [ ] 영어 캡션/자막이 추가되었는지 확인
- [ ] 영상 화질이 선명한지 확인 (최소 720p)
- [ ] 민감한 정보(실제 비밀번호 등)가 노출되지 않았는지 확인

## 제출 방법

1. Meta Developer Console 접속
2. App Review > Permissions and Features
3. 각 권한에 대해:
   - "Request" 클릭
   - 사용 사례 설명 입력 (SUBMISSION_NOTES.md 참조)
   - 스크린캐스트 업로드
   - 테스트 계정 정보 입력
4. 모든 권한 요청 후 "Submit for Review" 클릭

## 문제 해결

### OAuth 동의 화면이 안 보이는 경우
이미 권한을 부여한 경우입니다. Facebook 설정에서 앱 연결을 해제하세요.

### API 오류가 발생하는 경우
- 토큰 만료 여부 확인
- 권한 범위 확인
- 개발자 모드인지 확인 (라이브 모드에서는 앱 검수 통과 필요)

### 테스트 데이터가 없는 경우
Meta Developer Console에서 테스트 데이터를 생성하거나, 실제 테스트 계정에 샘플 데이터를 추가하세요.
