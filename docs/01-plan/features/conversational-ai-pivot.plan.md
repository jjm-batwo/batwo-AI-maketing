# Conversational AI Pivot Plan

## Feature: 대화형 AI 마케팅 에이전트로 전환
- **Status**: Plan
- **Created**: 2026-02-06
- **Priority**: Critical (전체 프로젝트 방향 전환)

---

## 1. 배경 및 동기

### 현재 문제
- 수동 대시보드 기반 UI → 사용자가 직접 버튼/폼을 조작해야 함
- 마케팅 전문 지식이 없는 커머스 사업자에게 진입장벽이 높음
- AI 기능이 15개 엔드포인트로 분산되어 있어 발견이 어려움

### 전환 방향
**"LLM에게 자연어로 말하면 작업을 수행하는" 대화형 AI 에이전트**

사용자 예시:
- "이번 주 성과 어때?" → KPI 분석 + 자연어 요약
- "전환 캠페인 만들어줘, 예산 10만원" → 확인 후 캠페인 생성
- "ROAS 떨어진 캠페인 찾아서 예산 줄여줘" → 분석 + 액션 제안

---

## 2. 핵심 설계 결정

| 결정사항 | 선택 | 근거 |
|---------|------|------|
| **인터페이스** | 하이브리드 (채팅 + 읽기전용 대시보드) | 시각화는 대시보드, 조작은 대화형 |
| **기존 UI** | 읽기 전용 유지 | 차트/리포트 시각화 컴포넌트 재활용 |
| **AI 자율성** | 실행 전 확인 | 제안 → 승인 → 실행 프로토콜 |
| **인텐트 분류** | LLM Function Calling (Option A) | 복합 인텐트 처리, 한국어 자연어 |
| **대화 저장** | PostgreSQL (Prisma) | 기존 DB 활용, 검색/쿼리 가능 |
| **LLM 제공자** | OpenAI gpt-4o-mini via Vercel AI SDK | 이미 통합됨, 도구 호출 우수 |
| **채팅 UI 배치** | 우측 사이드바 패널 (Persistent) | 대시보드 유지, Intercom 패턴 |
| **스트리밍** | SSE (Server-Sent Events) | 이미 구현됨, Vercel 호환 |

---

## 3. 현재 자산 분석

### KEEP (그대로 유지) - 약 70%

| 자산 | 설명 | 대화형 가치 |
|------|------|------------|
| **도메인 엔티티** | Campaign, KPI, Report 등 | 비즈니스 로직 검증 |
| **유스케이스 49개** | CreateCampaign, GetDashboardKPI 등 | AI 도구로 직접 래핑 |
| **MetaAdsClient** | 544줄 프로덕션급 Meta API | 캠페인 CRUD 실행 |
| **StreamingAIService** | Vercel AI SDK SSE 스트리밍 | 대화 응답 스트리밍 |
| **DB 스키마 27테이블** | 완성된 데이터 모델 | 확장만 필요 |
| **인증/결제/캐시** | NextAuth, Toss, Redis | 인프라 그대로 |
| **대시보드 컴포넌트** | KPICard, KPIChart 등 | 읽기전용 + 채팅 내 DataCard |

### ADAPT (수정 필요) - 약 20%

| 자산 | 현재 | 변경 |
|------|------|------|
| **ChatService** | 읽기전용 RAG Q&A | 도구 실행 가능한 에이전트로 확장 |
| **API 라우트** | 폼 데이터용 JSON | 자연어 응답 포맷 추가 |
| **useAIStream 훅** | 텍스트 스트리밍만 | 확인카드/데이터카드 처리 |
| **uiStore** | 대시보드 상태 | conversationId, chatPanelOpen 추가 |

### NEW (신규 구축) - 약 10%

| 자산 | 설명 |
|------|------|
| **ConversationalAgentService** | 핵심 오케스트레이터 |
| **Tool Registry (15개 도구)** | 유스케이스 래핑 |
| **ActionConfirmationService** | 제안→확인→실행 프로토콜 |
| **AlertService** | 프로액티브 알림 시스템 |
| **Chat UI 컴포넌트** | ChatPanel, ConfirmationCard 등 |
| **Prisma 모델 4개** | Conversation, Message, PendingAction, Alert |

---

## 4. 아키텍처

### 데이터 흐름

```
사용자 메시지
    │
    ▼
[POST /api/agent/chat]
    │
    ▼
[ConversationalAgentService]
    │
    ├── 대화 히스토리 로드 (DB)
    ├── 시스템 프롬프트 + 도구 정의 구성
    ├── LLM 호출 (streamText + tools)
    │
    ▼
[LLM 응답]
    │
    ├── 도구 호출 감지?
    │   ├── Query 도구 → 즉시 실행 → 자연어로 결과 스트리밍
    │   ├── Mutation 도구 → PendingAction 생성 → 확인 카드 스트리밍
    │   └── 도구 없음 → 텍스트 응답 직접 스트리밍
    │
    ▼
[SSE 스트림 → 클라이언트]
```

### 액션 확인 프로토콜

```
[사용자] "전환 캠페인 만들어줘, 예산 10만원"
    │
    ▼
[AI] 도구 호출: createCampaign { objective: CONVERSIONS, dailyBudget: 100000 }
    │
    ▼
[시스템] PendingAction 생성 (status: PENDING)
    │
    ▼
[UI] 확인 카드 렌더링
    ┌─────────────────────────────────────┐
    │ 캠페인 생성 확인                      │
    │                                     │
    │ 목적: 전환 (CONVERSIONS)             │
    │ 일일 예산: ₩100,000                  │
    │ 타겟: 자동 (Advantage+)              │
    │                                     │
    │ ⚠️ Meta 계정에 동시 반영됩니다        │
    │                                     │
    │ [확인] [취소] [수정]                  │
    └─────────────────────────────────────┘
    │
    ▼
[사용자] "확인" 클릭
    │
    ▼
[POST /api/agent/actions/{id}/confirm]
    │
    ▼
[CreateCampaignUseCase 실행]
    │
    ▼
[AI] "전환 캠페인 '봄 시즌 전환'이 생성되었습니다 ✅"
```

### 인텐트-도구 매핑

```
QUERY 도구 (확인 불필요, 즉시 실행)
────────────────────────────────────
getPerformanceKPI      → GetDashboardKPIUseCase
listCampaigns          → ListCampaignsUseCase
getCampaignDetail      → GetCampaignUseCase
generateReport         → GenerateWeeklyReportUseCase
checkAnomalies         → /api/ai/anomalies 로직
analyzeTrends          → /api/ai/trends 로직
getBudgetRecommendation → /api/ai/budget-recommendation 로직

MUTATION 도구 (확인 필요)
────────────────────────────────────
createCampaign         → CreateCampaignUseCase
updateCampaignBudget   → UpdateCampaignUseCase
pauseCampaign          → PauseCampaignUseCase
resumeCampaign         → ResumeCampaignUseCase
deleteCampaign         → DeleteCampaignUseCase
generateAdCopy         → AI 카피 생성

META 도구
────────────────────────────────────
askClarification       → 누락 정보 질문
freeformResponse       → 일반 대화
```

---

## 5. 새로운 파일 구조

```
src/
├── application/
│   ├── ports/
│   │   └── IConversationalAgent.ts          # 에이전트 도구 인터페이스
│   ├── services/
│   │   ├── ConversationalAgentService.ts    # 핵심 오케스트레이터
│   │   ├── ActionConfirmationService.ts     # 액션 확인 생명주기
│   │   ├── AlertService.ts                  # 프로액티브 알림
│   │   └── ConversationSummaryService.ts    # 컨텍스트 윈도우 관리
│   └── tools/                               # 도구 레지스트리
│       ├── index.ts
│       ├── queries/                          # 7개 조회 도구
│       ├── mutations/                        # 6개 실행 도구
│       └── meta/                             # 2개 메타 도구
│
├── domain/entities/
│   ├── Conversation.ts
│   ├── PendingAction.ts
│   └── Alert.ts
│
├── domain/repositories/
│   ├── IConversationRepository.ts
│   ├── IPendingActionRepository.ts
│   └── IAlertRepository.ts
│
├── infrastructure/database/repositories/
│   ├── PrismaConversationRepository.ts
│   ├── PrismaPendingActionRepository.ts
│   └── PrismaAlertRepository.ts
│
├── app/api/agent/                           # 새 API 그룹
│   ├── chat/route.ts                        # 메인 대화 엔드포인트
│   ├── conversations/route.ts               # 대화 목록
│   ├── conversations/[id]/route.ts          # 대화 상세
│   ├── actions/[id]/confirm/route.ts        # 액션 확인
│   ├── actions/[id]/cancel/route.ts         # 액션 취소
│   └── alerts/route.ts                      # 알림 관리
│
└── presentation/components/agent/           # 채팅 UI 컴포넌트
    ├── ChatPanel.tsx                        # 메인 채팅 패널
    ├── ChatMessage.tsx                      # 메시지 렌더링
    ├── ChatInput.tsx                        # 입력 + 추천 질문
    ├── ConfirmationCard.tsx                 # 액션 확인 카드
    ├── DataCard.tsx                         # 데이터 시각화 카드
    ├── AlertBanner.tsx                      # 알림 배너
    └── ConversationList.tsx                 # 대화 히스토리
```

---

## 6. DB 스키마 확장

```prisma
model Conversation {
  id          String              @id @default(cuid())
  userId      String
  user        User                @relation(...)
  title       String?
  messages    ConversationMessage[]
  pendingActions PendingAction[]
  isArchived  Boolean             @default(false)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

model ConversationMessage {
  id             String       @id @default(cuid())
  conversationId String
  role           String       // 'user' | 'assistant' | 'system' | 'tool'
  content        String?      @db.Text
  toolName       String?
  toolArgs       Json?
  toolResult     Json?
  metadata       Json?
  createdAt      DateTime     @default(now())
}

model PendingAction {
  id             String              @id @default(cuid())
  conversationId String
  toolName       String
  toolArgs       Json
  displaySummary String              @db.Text
  status         PendingActionStatus @default(PENDING)
  result         Json?
  expiresAt      DateTime
  createdAt      DateTime            @default(now())
}

model Alert {
  id          String        @id @default(cuid())
  userId      String
  type        String        // 'anomaly' | 'budget' | 'milestone'
  severity    AlertSeverity // INFO | WARNING | CRITICAL
  status      AlertStatus   @default(UNREAD)
  title       String
  message     String        @db.Text
  data        Json?
  campaignId  String?
  pushedToChat Boolean      @default(false)
  createdAt   DateTime      @default(now())
}
```

---

## 7. 구현 로드맵

### Phase 1: Foundation (5일)
- [ ] Prisma 스키마 확장 (Conversation, Message, PendingAction, Alert)
- [ ] 도메인 엔티티 + 리포지토리 인터페이스
- [ ] Prisma 리포지토리 구현
- [ ] ConversationalAgentService (Vercel AI SDK tool calling)
- [ ] ActionConfirmationService

### Phase 2: Tool Implementation (4일)
- [ ] Query 도구 7개 (기존 유스케이스 래핑)
- [ ] Mutation 도구 6개 (기존 유스케이스 래핑)
- [ ] Meta 도구 2개 (clarification, freeform)
- [ ] 도구 레지스트리

### Phase 3: API + Streaming (4일)
- [ ] POST /api/agent/chat (SSE 스트리밍)
- [ ] 액션 확인 API 엔드포인트
- [ ] 대화 관리 API
- [ ] 알림 체크 API (크론용)

### Phase 4: Chat UI (5일)
- [ ] ChatPanel + ChatMessage + ChatInput
- [ ] ConfirmationCard
- [ ] DataCard (KPI, 차트, 캠페인 목록)
- [ ] useConversation + useAgentChat 훅

### Phase 5: Alert + Polish (3일)
- [ ] AlertService + 크론 엔드포인트
- [ ] 대시보드 레이아웃에 채팅 패널 통합
- [ ] E2E 테스트

### 타임라인

```
Week 1  [Phase 1: Foundation ████████████████████]
Week 2  [Phase 1 ████][Phase 2: Tools ████████████████]
Week 3  [Phase 2 █████████][Phase 3: API ██████████████]
Week 4  [Phase 3 ███████][Phase 4: UI ███████████████]
Week 5  [Phase 4 ████████████][Phase 5: Alerts █████████]
Week 6  [Phase 5 + Polish ████████████████████████████████]
```

**총 예상: 21 개발일 (1인 4-5주, 2인 병렬 2-3주)**

---

## 8. 리스크 평가

| 리스크 | 심각도 | 완화 방안 |
|--------|--------|----------|
| Vercel AI SDK 도구 호출 동작 확인 필요 | Medium | Phase 1에서 PoC 먼저 |
| 한국어 인텐트 분류 품질 | Medium | gpt-4o-mini 한국어 테스트 → 필요시 gpt-4o |
| SSE + 도구 호출 인터리빙 복잡성 | Medium | 기존 SSE 패턴 참고 |
| 기존 UI와 채팅 패널 레이아웃 충돌 | Low | 사이드바 패널로 분리 |
| Meta API 액션 롤백 불가 (삭제 등) | Low | 확인 카드에 경고 표시 |

---

## 9. 성공 지표

| 지표 | 목표 |
|------|------|
| 대화형 인텐트 인식률 | ≥ 90% |
| 액션 확인 → 실행 성공률 | ≥ 95% |
| 평균 응답 시간 (첫 토큰) | < 1초 |
| 사용자 만족도 (채팅 vs 대시보드) | 채팅 선호 ≥ 70% |
