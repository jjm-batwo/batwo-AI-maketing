# Quick Start - Meta 앱 검수 스크린캐스트 녹화

## 빠른 시작 (3단계)

### 1단계: 개발 서버 실행
```bash
npm run dev
```

### 2단계: 녹화 실행
```bash
# 새 터미널에서
npm run record:meta:full
```

### 3단계: 비디오 확인
```bash
open docs/meta-app-review/recordings/Full-Flow-Recording-chromium.webm
```

## 명령어 요약

| 명령어 | 용도 |
|--------|------|
| `npm run record:meta:full` | **전체 플로우 1개 녹화** (권장) |
| `npm run record:meta:scenes` | 개별 씬 7개 녹화 |
| `npm run record:meta` | 모든 테스트 8개 녹화 |

## 출력 파일

```
docs/meta-app-review/recordings/
└── Full-Flow-Recording-chromium.webm  ← 이 파일을 Meta에 제출
```

## 문제 발생 시

### 포트 3000이 이미 사용 중
```bash
# 기존 프로세스 종료
lsof -ti:3000 | xargs kill -9
npm run dev
```

### 비디오가 생성되지 않음
```bash
# Playwright 재설치
npx playwright install chromium
```

### 페이지가 로드되지 않음
```bash
# 서버 확인
curl http://localhost:3000
```

## 상세 문서

- 설정 가이드: `RECORDING_SETUP.md`
- 녹화 지침: `RECORDING_INSTRUCTIONS.md`
- Meta 검수 가이드: `META_APP_REVIEW_GUIDE.md`
