# Backend Completion Plan

## Feature: AI 채팅 실제 작동 + 백엔드 기능 완성
- **Status**: Plan
- **Created**: 2026-02-06
- **Priority**: Critical
- **Excludes**: 메타 앱검수 필요 기능 (Facebook OAuth 실제 로그인, Meta Ads API 실제 호출)

---

## 1. 배경 및 목표

### 현재 상태
- 코드베이스에 45+ 파일, 3,800+ 줄의 대화형 AI 에이전트 코드가 이미 작성됨
- 100+ API 라우트가 존재하며 대부분 실제 비즈니스 로직 포함
- 하지만 **실제 동작 검증이 안 된 상태** (빌드 에러, 타입 에러, 런타임 에러 가능)

### 목표
1. **AI 채팅이 실제로 답변을 반환**하도록 E2E 동작 보장
2. **메타 앱검수 불필요한 백엔드 기능** 모두 정상 작동 확인
3. **빌드 & 타입 체크 통과** (zero errors)

### 메타 앱검수 제외 범위
| 제외 기능 | 이유 |
|----------|------|
| Facebook OAuth 실제 로그인 | Meta 앱 검수 필요 (개발 모드로만 테스트) |
| Meta Ads API 실제 캠페인 조작 | Business Verification 필요 |
| Meta Pixel 실시간 이벤트 전송 | 도메인 인증 필요 |
| Webhook 구독 (cafe24, Meta) | 외부 플랫폼 설정 필요 |

→ 위 기능은 **Mock/Fallback 모드**로 동작하되, 코드 구조는 유지

---

## 2. 작업 범위 분류

### PHASE 1: 빌드 & 타입 안정화 (선행 조건)
- [ ] `npm run type-check` 통과 (zero errors)
- [ ] `npm run build` 통과
- [ ] Prisma 스키마 검증 (`npx prisma validate`)
- [ ] Prisma Client 생성 (`npx prisma generate`)
- [ ] 누락된 import/export 수정
- [ ] DI 컨테이너 순환 참조 해결 (있다면)

### PHASE 2: AI 채팅 E2E 동작 (핵심 목표)
- [ ] `POST /api/agent/chat` → SSE 스트리밍 응답 정상 반환
- [ ] OpenAI API 연동 확인 (OPENAI_API_KEY 설정)
- [ ] 대화 히스토리 DB 저장/로드 정상 동작
- [ ] Query 도구 실행 (getPerformanceKPI, listCampaigns 등)
- [ ] Mutation 도구 → PendingAction 생성 → 확인 카드 반환
- [ ] `POST /api/agent/actions/{id}/confirm` → 실제 액션 실행
- [ ] `POST /api/agent/actions/{id}/cancel` → 취소 처리
- [ ] 대화 목록 조회 (`GET /api/agent/conversations`)
- [ ] 알림 체크 (`POST /api/agent/alerts/check`)
- [ ] ChatPanel UI → 메시지 송수신 → 스트리밍 렌더링

### PHASE 3: 백엔드 기능 검증 (메타 앱검수 제외)
- [ ] **대시보드 KPI**: `GET /api/dashboard/kpi` → 실제 DB 데이터 반환
- [ ] **AI 기능 14개 엔드포인트**: chat, copy, anomalies, trends, budget-recommendation 등
- [ ] **리포트 생성**: `POST /api/reports` → 주간 보고서 생성
- [ ] **결제 시스템**: Toss Payments 구독/취소/변경 플로우
- [ ] **관리자 패널**: 사용자/결제 관리 API
- [ ] **팀 관리**: 팀 생성/멤버 추가
- [ ] **A/B 테스트**: 생성/조회
- [ ] **사용량 제한**: 쿼터 체크 (`GET /api/quota`)
- [ ] **크론 작업**: 보고서 생성, 이상탐지 등

### PHASE 4: Mock/Fallback 모드 구현 (메타 앱검수 대체)
- [ ] MetaAdsClient에 Mock 모드 추가 (환경변수 기반 스위칭)
- [ ] Facebook OAuth 없이도 개발/테스트 가능한 인증 우회
- [ ] 캠페인 CRUD를 DB만으로 동작하게 하는 Fallback 로직
- [ ] 픽셀 이벤트를 로컬 로깅으로 대체

---

## 3. 기술 결정사항

### AI 채팅 동작 요건
| 항목 | 결정 |
|------|------|
| LLM 모델 | OpenAI gpt-4o-mini (Vercel AI SDK) |
| 스트리밍 | SSE (Server-Sent Events) |
| 도구 호출 | Vercel AI SDK `streamText` + `tools` |
| 대화 저장 | PostgreSQL (Prisma) |
| 확인 프로토콜 | PendingAction 엔티티 (상태 머신) |
| 시스템 프롬프트 | 한국어 마케팅 전문가 페르소나 |

### 메타 의존성 처리
| 기능 | 메타 필요 시 | 메타 없을 때 |
|------|------------|-------------|
| 캠페인 생성 | MetaAdsClient → 실제 API | DB만 저장 (metaCampaignId = null) |
| 캠페인 동기화 | Meta → DB 동기화 | 건너뛰기 (DB 데이터만 사용) |
| KPI 데이터 | Meta Insights API | DB에 저장된 데이터 + 시드 데이터 |
| 픽셀 추적 | Meta Pixel + CAPI | 로컬 이벤트 로깅 |

### 인증 전략
| 환경 | 전략 |
|------|------|
| 개발 모드 | NextAuth CredentialsProvider (이메일/비밀번호) |
| 프로덕션 | Facebook + Google + Kakao OAuth |
| 테스트 | Mock 세션 주입 |

---

## 4. 구현 순서 및 의존성

```
PHASE 1: 빌드 안정화
    │
    ▼
PHASE 2: AI 채팅 E2E ←── 가장 중요
    │
    ├── 2a. ConversationalAgentService 동작 확인
    ├── 2b. Tool Registry 15개 도구 동작 확인
    ├── 2c. API Route + SSE 스트리밍 검증
    ├── 2d. Action Confirmation 플로우 검증
    └── 2e. ChatPanel UI 통합 검증
    │
    ▼
PHASE 3: 나머지 백엔드 기능 검증
    │
    ├── 3a. 대시보드/KPI
    ├── 3b. AI 엔드포인트 14개
    ├── 3c. 리포트/결제/관리자
    └── 3d. 팀/A/B 테스트/쿼터
    │
    ▼
PHASE 4: Mock/Fallback 모드
    │
    ├── 4a. MetaAdsClient Mock 모드
    ├── 4b. 개발용 인증 우회
    └── 4c. 시드 데이터 스크립트
```

---

## 5. 성공 기준

| 기준 | 목표 |
|------|------|
| TypeScript 빌드 | zero errors |
| AI 채팅 응답 | 사용자 메시지 → 실제 LLM 답변 스트리밍 |
| 도구 호출 | "이번 주 성과 알려줘" → KPI 데이터 반환 |
| 확인 플로우 | "캠페인 만들어줘" → 확인카드 → 승인 → 실행 |
| API 엔드포인트 | 100+ 라우트 중 메타 제외 90+ 정상 동작 |
| Mock 모드 | META_MOCK_MODE=true 시 Meta API 없이 동작 |

---

## 6. 리스크

| 리스크 | 심각도 | 완화 방안 |
|--------|--------|----------|
| 타입 에러가 100개 이상일 수 있음 | High | Phase 1에서 집중 해결, build-fixer 활용 |
| OpenAI API 키 미설정 | Medium | .env.example 업데이트 + 에러 메시지 개선 |
| Prisma 마이그레이션 미적용 | Medium | prisma db push로 빠르게 적용 |
| DI 컨테이너 런타임 에러 | Medium | 서버 시작 시 즉시 발견 가능 |
| SSE 스트리밍 클라이언트 파싱 이슈 | Low | 기존 useAIStream 훅 검증 |
