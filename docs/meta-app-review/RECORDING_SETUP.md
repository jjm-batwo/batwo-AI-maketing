# Meta App Review - 비디오 녹화 설정 완료

## 설정 변경 사항 요약

### 1. Playwright 설정 파일 수정

#### `/Users/jm/batwo-maketting service-saas/playwright.config.ts`
일반 E2E 테스트용 설정에 비디오 녹화 기능 추가:

```typescript
use: {
  baseURL: 'http://localhost:3000',
  trace: 'on-first-retry',
  video: 'on',              // ✅ 비디오 녹화 활성화
  launchOptions: {
    slowMo: 500,            // ✅ 500ms 딜레이 (녹화용 느린 동작)
  },
},
outputDir: './docs/meta-app-review/recordings',  // ✅ 녹화 파일 저장 위치
```

#### `/Users/jm/batwo-maketting service-saas/playwright.recording.config.ts` (신규)
Meta 앱 검수 전용 녹화 설정:

- **testDir**: `./scripts` (녹화 스크립트 위치)
- **testMatch**: `**/meta-app-review-recording.ts`
- **video**: `on` (모든 테스트 녹화)
- **slowMo**: `500ms` (가시성 향상)
- **viewport**: `1280x720` (720p 해상도)
- **workers**: `1` (일관된 녹화를 위한 순차 실행)
- **outputDir**: `./docs/meta-app-review/recordings`

### 2. 출력 디렉토리 생성

```bash
mkdir -p ./docs/meta-app-review/recordings
```

**경로**: `/Users/jm/batwo-maketting service-saas/docs/meta-app-review/recordings`

이 디렉토리에 다음 파일들이 저장됩니다:
- 비디오 녹화 파일 (`.webm`)
- 스크린샷 (실패 시)
- Trace 파일 (실패 시)

### 3. NPM 스크립트 추가

`package.json`에 3개의 새로운 스크립트 추가:

| 스크립트 | 명령어 | 설명 |
|----------|--------|------|
| `npm run record:meta` | `playwright test --config=playwright.recording.config.ts --headed` | 모든 녹화 시나리오 실행 (8개 테스트) |
| `npm run record:meta:full` | `playwright test --config=playwright.recording.config.ts --headed --grep 'Full Flow Recording'` | 전체 플로우 1개만 녹화 (권장) |
| `npm run record:meta:scenes` | `playwright test --config=playwright.recording.config.ts --headed --grep 'Scene'` | 개별 씬만 녹화 (7개) |

## 사용 방법

### 기본 워크플로우

```bash
# 1. 개발 서버 실행 (터미널 1)
npm run dev

# 2. 녹화 실행 (터미널 2)
npm run record:meta:full
```

### 녹화 시나리오

#### 옵션 1: 전체 플로우 녹화 (권장)
```bash
npm run record:meta:full
```

**장점**:
- 1개의 연속된 비디오로 모든 권한 시연
- Meta 검수자가 보기 편함
- 파일명: `Full-Flow-Recording-chromium.webm`

**녹화 내용** (약 30초):
1. 로그인 페이지 (3초)
2. 앱 검수 데모 페이지 (4초 + 스크롤)
3. Meta 연결 페이지 (3초)
4. 페이지 관리 (3초) - pages_show_list
5. 대시보드 (4초 + 스크롤) - ads_read
6. 캠페인 목록 (3초) - ads_management
7. 캠페인 생성 (4초) - ads_management
8. 앱 검수 데모로 복귀 (2초)

#### 옵션 2: 개별 씬 녹화
```bash
npm run record:meta:scenes
```

**장점**:
- 각 권한별로 별도 파일
- 특정 권한만 재녹화 가능

**파일** (7개):
- `Scene-1-App-Introduction-chromium.webm`
- `Scene-2-Meta-Account-Connection-chromium.webm`
- `Scene-3-pages_show_list-Demo-chromium.webm`
- `Scene-4-pages_read_engagement-Demo-chromium.webm`
- `Scene-5-business_management-Demo-chromium.webm`
- `Scene-6-ads_read-Demo-chromium.webm`
- `Scene-7-ads_management-Demo-chromium.webm`

#### 옵션 3: 모든 테스트 녹화
```bash
npm run record:meta
```

**결과**: 8개 비디오 파일 (7개 씬 + 1개 전체 플로우)

### 녹화 파일 위치

```
docs/meta-app-review/recordings/
├── Full-Flow-Recording-chromium.webm         # 전체 플로우 (30초)
├── Scene-1-App-Introduction-chromium.webm
├── Scene-2-Meta-Account-Connection-chromium.webm
├── Scene-3-pages_show_list-Demo-chromium.webm
├── Scene-4-pages_read_engagement-Demo-chromium.webm
├── Scene-5-business_management-Demo-chromium.webm
├── Scene-6-ads_read-Demo-chromium.webm
└── Scene-7-ads_management-Demo-chromium.webm
```

### 녹화 팁

1. **로컬 서버 준비 상태 확인**
   ```bash
   curl http://localhost:3000
   ```

2. **브라우저 창 크기**: 1280x720 (자동 설정됨)

3. **녹화 속도**: 500ms slowMo (자연스러운 시연)

4. **파일 크기**: 1개 비디오당 약 5-10MB

5. **재녹화**: 기존 파일은 자동으로 덮어씌워짐

## 문제 해결

### 녹화가 시작되지 않음

```bash
# Playwright 브라우저 재설치
npx playwright install chromium
```

### 비디오 파일이 생성되지 않음

설정 확인:
```typescript
// playwright.recording.config.ts
use: {
  video: 'on',  // ✅ 'on'으로 설정되어 있는지 확인
}
```

### 페이지가 로드되지 않음

개발 서버 실행 확인:
```bash
npm run dev
# 다른 터미널에서:
curl http://localhost:3000
```

### 녹화 속도가 너무 빠름/느림

```typescript
// playwright.recording.config.ts
launchOptions: {
  slowMo: 500,  // 값 조정 (밀리초)
}
```

## 검증

### 녹화 스크립트 테스트
```bash
npx playwright test --config=playwright.recording.config.ts --list
```

**예상 출력**:
```
Listing tests:
  [chromium] › meta-app-review-recording.ts:36:7 › Meta App Review Screencast › Scene 1: App Introduction
  [chromium] › meta-app-review-recording.ts:46:7 › Meta App Review Screencast › Scene 2: Meta Account Connection
  ...
Total: 8 tests in 1 file
```

### 녹화 파일 확인
```bash
ls -lh docs/meta-app-review/recordings/
```

### 비디오 재생
```bash
# macOS
open docs/meta-app-review/recordings/Full-Flow-Recording-chromium.webm

# 또는 브라우저에서 직접 열기
```

## Meta 앱 검수 제출

1. **녹화 실행**:
   ```bash
   npm run record:meta:full
   ```

2. **비디오 파일 확인**:
   ```bash
   open docs/meta-app-review/recordings/
   ```

3. **Meta 앱 검수 페이지에 업로드**:
   - 파일: `Full-Flow-Recording-chromium.webm`
   - 형식: WebM (Playwright 기본)
   - 길이: 약 30초
   - 해상도: 1280x720

4. **설명 추가** (영문):
   ```
   This screencast demonstrates all requested permissions in action:
   - pages_show_list: Displaying Meta Pages
   - pages_read_engagement: Showing page engagement metrics
   - business_management: Managing Meta Pixel
   - ads_read: Reading ad performance data
   - ads_management: Creating and managing ad campaigns
   ```

## 참고 자료

- 녹화 스크립트: `scripts/meta-app-review-recording.ts`
- 녹화 설정: `playwright.recording.config.ts`
- E2E 설정: `playwright.config.ts`
- Meta 검수 가이드: `docs/meta-app-review/META_APP_REVIEW_GUIDE.md`
- 녹화 지침: `docs/meta-app-review/RECORDING_INSTRUCTIONS.md`
- 제출 노트: `docs/meta-app-review/SUBMISSION_NOTES.md`

## 다음 단계

1. ✅ Playwright 설정 완료
2. ✅ 녹화 디렉토리 생성
3. ✅ NPM 스크립트 추가
4. ⏭️ 로컬 서버 실행 (`npm run dev`)
5. ⏭️ 녹화 실행 (`npm run record:meta:full`)
6. ⏭️ 비디오 확인 및 Meta에 제출

---

**설정 완료!** 이제 `npm run record:meta:full` 명령어로 Meta 앱 검수용 스크린캐스트를 녹화할 수 있습니다.
