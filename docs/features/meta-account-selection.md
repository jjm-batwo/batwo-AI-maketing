# Meta 광고 계정 선택 기능

## 개요
Meta OAuth 콜백에서 여러 광고 계정이 발견될 경우, 사용자가 원하는 계정을 선택할 수 있도록 하는 기능입니다.

## 문제점
기존 `/api/meta/callback/route.ts:85`에서는 첫 번째 광고 계정을 자동 선택했기 때문에, 사용자가 여러 계정을 가지고 있을 때 잘못된 계정이 선택될 수 있었습니다.

## 해결 방안

### 1. OAuth 임시 데이터 캐시 (`src/lib/cache/oauthCache.ts`)
- **목적**: Meta accessToken과 계정 목록을 안전하게 임시 저장
- **보안**:
  - 5분 TTL로 짧은 생명주기
  - 사용자 ID 검증
  - 사용 후 자동 삭제
  - 세션 ID 기반 접근 제어
- **메모리 관리**: 주기적인 만료 항목 정리 (1분마다)

### 2. Meta Callback 라우트 수정 (`src/app/api/meta/callback/route.ts`)
#### 계정 수에 따른 분기 처리
- **계정 0개**: 에러 메시지와 함께 리다이렉트
- **계정 1개**: 기존 로직대로 자동 선택 및 DB 저장
- **계정 2개 이상**:
  - OAuth 데이터를 캐시에 저장 (세션 ID 생성)
  - 선택 페이지로 리다이렉트 (`?mode=select&session=xxx`)

### 3. 선택 대기 계정 API (`src/app/api/meta/pending-accounts/route.ts`)
- **엔드포인트**: `GET /api/meta/pending-accounts?session=xxx`
- **기능**:
  - 세션 ID로 캐시에서 계정 목록 조회
  - 사용자 ID 검증
  - 민감한 정보(accessToken) 제외하고 반환

### 4. 계정 선택 API (`src/app/api/meta/select-account/route.ts`)
- **엔드포인트**: `POST /api/meta/select-account`
- **요청 본문**:
  ```json
  {
    "sessionId": "oauth_userId_timestamp_randomId",
    "accountId": "act_123456789"
  }
  ```
- **기능**:
  1. 세션 ID로 OAuth 데이터 조회
  2. 선택한 계정 유효성 검증
  3. DB에 저장 (기존 계정이 있으면 업데이트)
  4. 캐시에서 OAuth 데이터 삭제 (보안)

### 5. Meta Connect 페이지 UI (`src/app/(dashboard)/settings/meta-connect/page.tsx`)
#### 선택 모드 UI 추가
- **활성화 조건**: `?mode=select&session=xxx` 쿼리 파라미터
- **UI 구성**:
  - 라디오 버튼으로 계정 선택
  - 계정 이름, ID, 통화 정보 표시
  - 활성 계정 표시 (account_status === 1)
  - "선택한 계정 연결하기" 버튼
- **사용자 플로우**:
  1. 계정 목록 조회 (`/api/meta/pending-accounts`)
  2. 라디오 버튼으로 계정 선택
  3. "선택한 계정 연결하기" 클릭
  4. 성공 시 일반 설정 페이지로 리다이렉트

## 보안 고려사항
1. **accessToken 보호**: 쿼리 파라미터 대신 서버 메모리 캐시 사용
2. **짧은 TTL**: 5분 후 자동 삭제
3. **사용자 검증**: 캐시 조회 시 userId 일치 확인
4. **사용 후 삭제**: 계정 선택 완료 후 즉시 캐시 삭제
5. **세션 ID**: 랜덤 + 타임스탬프로 생성하여 추측 불가

## 사용자 시나리오

### 시나리오 1: 계정 1개 (기존 동작 유지)
1. Meta OAuth 완료
2. 자동으로 첫 번째 계정 선택
3. DB에 저장
4. 성공 페이지로 리다이렉트

### 시나리오 2: 계정 여러 개 (새 기능)
1. Meta OAuth 완료
2. 선택 페이지로 리다이렉트
3. 계정 목록 표시 (예: "바투컴퍼니", "테스트 계정")
4. 사용자가 원하는 계정 선택
5. "선택한 계정 연결하기" 클릭
6. DB에 저장
7. 성공 페이지로 리다이렉트

### 시나리오 3: 세션 만료
1. 선택 페이지에서 5분 이상 대기
2. "선택한 계정 연결하기" 클릭
3. "세션이 만료되었습니다. 다시 연결해주세요." 에러 표시
4. 사용자가 다시 Meta 연결 시작

## 파일 목록
- **신규 파일**:
  - `src/lib/cache/oauthCache.ts`
  - `src/app/api/meta/select-account/route.ts`
  - `src/app/api/meta/pending-accounts/route.ts`
- **수정 파일**:
  - `src/app/api/meta/callback/route.ts`
  - `src/app/(dashboard)/settings/meta-connect/page.tsx`

## 테스트 체크리스트
- [ ] 계정 1개일 때 자동 선택 동작
- [ ] 계정 여러 개일 때 선택 페이지 표시
- [ ] 계정 선택 후 DB 저장 확인
- [ ] 세션 만료 후 에러 처리
- [ ] 잘못된 세션 ID 접근 차단
- [ ] 다른 사용자 세션 접근 차단
- [ ] 캐시 자동 정리 동작 확인

## 향후 개선 사항
1. **Redis 캐시**: 프로덕션에서 인메모리 캐시를 Redis로 교체하여 멀티 인스턴스 지원
2. **계정 전환**: 연결 후에도 다른 계정으로 전환할 수 있는 기능
3. **다중 계정 지원**: 한 사용자가 여러 광고 계정을 동시에 관리
4. **계정 정보 표시**: 광고 계정의 예산, 캠페인 수 등 추가 정보 표시
