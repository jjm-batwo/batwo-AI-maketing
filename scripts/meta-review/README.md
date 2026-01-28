# Meta App Review Demo Recording

Meta 앱 검수용 데모 영상 자동 녹화 스크립트

## 사전 준비

### 1. 데모 데이터 시드

```bash
# 데모 사용자 및 캠페인 데이터 생성
npx prisma db seed -- --demo
```

생성되는 데모 계정:
- **관리자**: `admin@batwo.ai`
- **데모 사용자**: `demo@batwo.ai`

### 2. 로컬 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:3000`에서 실행되어야 합니다.

### 3. 환경 변수 설정 (선택)

```bash
# .env.local
DEMO_EMAIL=demo@batwo.ai
DEMO_PASSWORD=demo123!@#
BASE_URL=http://localhost:3000
```

## 녹화 실행

### 전체 녹화 (5개 권한 모두)

```bash
npx tsx scripts/meta-review/record-demo.ts
```

### 출력 파일

녹화가 완료되면 다음 파일이 생성됩니다:

```
docs/meta-app-review/videos/
├── 1-ads-management.webm         # 캠페인 관리 권한
├── 2-ads-read.webm                # 성과 조회 권한
├── 3-business-management.webm     # 픽셀 관리 권한
├── 4-pages-show-list.webm         # 페이지 목록 권한
└── 5-pages-read-engagement.webm   # 참여 분석 권한
```

## 녹화 시나리오

### 1. ads_management (캠페인 관리)

**시나리오**:
1. 로그인
2. 대시보드 확인
3. 캠페인 목록 페이지
4. 새 캠페인 생성 폼 작성
5. 캠페인 저장
6. 캠페인 상태 변경 (일시중지)

**권한 증명**:
- 캠페인 생성 가능
- 캠페인 수정 가능
- 캠페인 상태 변경 가능

### 2. ads_read (성과 조회)

**시나리오**:
1. 로그인
2. 대시보드 KPI 카드 표시
3. 캠페인 상세 페이지
4. 성과 탭 확인
5. 차트 및 데이터 표시
6. 보고서 페이지
7. 주간 보고서 상세 확인

**권한 증명**:
- 광고 성과 데이터 조회
- KPI 지표 표시
- 차트 및 인사이트 제공

### 3. business_management (픽셀 관리)

**시나리오**:
1. 로그인
2. 설정 페이지
3. Meta 연결 페이지
4. 픽셀 관리 페이지
5. 픽셀 목록 조회
6. 픽셀 선택
7. 설치 스크립트 복사

**권한 증명**:
- 비즈니스 계정의 픽셀 목록 조회
- 픽셀 선택 및 관리
- 설치 스크립트 제공

### 4. pages_show_list (페이지 목록)

**시나리오**:
1. 로그인
2. 설정 페이지
3. Meta 연결 상태 확인
4. Meta 페이지 관리 페이지
5. 페이지 목록 표시
6. 페이지 선택

**권한 증명**:
- Meta 페이지 목록 조회
- 페이지 기본 정보 표시

### 5. pages_read_engagement (참여 분석)

**시나리오**:
1. 로그인
2. Meta 페이지 관리 페이지
3. 페이지 선택
4. 인사이트 섹션 표시
5. 참여 지표 확인
6. 기간 변경 및 데이터 갱신

**권한 증명**:
- 페이지 참여 데이터 조회
- 좋아요, 댓글, 공유 등 지표 표시
- 기간별 비교 데이터

## 녹화 설정

### 화면 크기
- **해상도**: 1280x720 (HD)
- **형식**: WebM
- **프레임레이트**: 30fps

### 타이밍
- **시작 전 대기**: 3초
- **액션 사이 대기**: 1.5초
- **슬로우 모션**: 800ms

### 마우스 커서
- 커서가 강조되어 표시됨
- 클릭 액션이 명확하게 보임

## 문제 해결

### 서버 연결 오류
```bash
❌ 서버에 연결할 수 없습니다. npm run dev를 실행하세요.
```

**해결책**:
- `npm run dev`로 서버 실행
- `http://localhost:3000`이 응답하는지 확인

### 로그인 실패
```bash
로그인 중...
```

**해결책**:
- 데모 데이터 시드 확인: `npx prisma db seed -- --demo`
- 환경 변수 확인: `DEMO_EMAIL`, `DEMO_PASSWORD`

### 페이지 요소를 찾을 수 없음

**해결책**:
- UI 컴포넌트가 실제로 렌더링되는지 확인
- Playwright 셀렉터가 최신 UI와 일치하는지 확인

### 녹화 파일이 생성되지 않음

**해결책**:
- `docs/meta-app-review/videos/` 디렉토리 권한 확인
- 브라우저가 정상적으로 종료되는지 확인

## 고급 사용법

### 특정 시나리오만 녹화

스크립트를 수정하여 개별 함수만 실행:

```typescript
// main() 함수 수정
async function main() {
  // 1개 시나리오만 녹화
  await recordAdsManagement()
}
```

### 환경 변수로 설정 변경

```bash
# 다른 서버 URL 사용
BASE_URL=https://staging.batwo.ai npx tsx scripts/meta-review/record-demo.ts

# 다른 계정 사용
DEMO_EMAIL=admin@batwo.ai DEMO_PASSWORD=admin123 npx tsx scripts/meta-review/record-demo.ts
```

### 녹화 속도 조정

`CONFIG` 객체 수정:

```typescript
const CONFIG = {
  slowMo: 1000, // 더 느리게
  actionDelay: 2000, // 액션 사이 더 긴 대기
}
```

## Meta 앱 검수 제출

1. 녹화된 5개 영상 확인
2. 각 영상이 해당 권한을 명확히 증명하는지 검토
3. Meta 개발자 센터에서 앱 검수 제출
4. 각 권한에 대응하는 영상 업로드
5. 스크린캐스트 설명 작성:
   - 영상이 어떤 권한을 증명하는지
   - 주요 화면 및 기능 설명

## 참고 문서

- Meta 앱 검수 가이드: `docs/meta-app-review/submission-guide.md`
- Playwright 문서: https://playwright.dev
- Meta Graph API 권한: https://developers.facebook.com/docs/permissions/reference
