# Implementation Plan: Hybrid RAG Integration (Agentic + Knowledge Base)

**Status**: ✅ Complete
**Created**: 2026-03-08
**Last Updated**: 2026-03-08
**Completed**: 2026-03-08
**Scope**: Large (7 Phases, ~23 hours)

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 Overview

### Feature Description
현재 AI 챗봇(Agentic Tool Calling 아키텍처)에 **RAG(Retrieval-Augmented Generation) 기능을 하나의 Tool로 추가**하여 하이브리드 구조를 완성합니다.

기존의 실시간 캠페인 제어/조회 기능(17개 Tool)은 100% 그대로 유지하면서, AI가 마케팅 전문 지식이 필요한 질문에 대해 **벡터 데이터베이스(Supabase pgvector)에서 관련 문서를 검색**하여 할루시네이션 없이 정확한 답변을 제공할 수 있도록 합니다.

### Success Criteria
- [x] Supabase pgvector 확장 활성화 및 벡터 저장 테이블 생성
- [x] 마케팅 지식 문서를 임베딩으로 변환하여 DB에 저장하는 파이프라인 완성
- [x] `searchKnowledgeBase` Tool이 기존 17개 Tool과 함께 정상 등록 및 작동
- [x] AI가 일반 질문(GENERAL)이나 지식 기반 질문 시 자동으로 RAG Tool 호출
- [x] 기존 모든 테스트(resilience, useAgentChat 등)가 깨지지 않고 통과
- [x] 검색 품질: Top-3 검색 결과 중 관련 문서가 1개 이상 포함

### User Impact
- **"페이스북 광고 정책상 텍스트 20% 규칙이 아직 적용돼?"** → 정확한 최신 정책 기반 답변
- **"전환율을 높이려면 어떤 카피가 좋을까?"** → 사전 저장된 성공 카피 사례 기반 추천
- **"CPA가 높은데 원인이 뭘까?"** → 실시간 데이터(Agentic) + 마케팅 가이드(RAG) 복합 답변

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Supabase pgvector 사용 | 이미 Supabase PostgreSQL을 DB로 사용 중이므로 별도 벡터DB 없이 확장 가능 | 전용 벡터DB(Pinecone, Weaviate) 대비 검색 최적화 기능이 제한적 |
| RAG를 AgentTool로 등록 | 기존 Tool 아키텍처(`IToolRegistry`)를 100% 재활용, 코드 변경 최소화 | Tool 단위 호출이므로 모든 쿼리에 자동 RAG 적용은 불가 (AI가 판단하여 호출) |
| OpenAI `text-embedding-3-small` 사용 | 비용 효율적이면서도 충분한 임베딩 품질 (1536 dim) | 다국어(Korean) 특화 모델 대비 소폭 정확도 차이 가능 |
| Prisma raw query 사용 (pgvector) | Prisma가 pgvector를 네이티브 지원하지 않으므로 `$queryRawUnsafe` 사용 | 타입 안전성이 떨어지지만, Repository 패턴으로 캡슐화하여 완화 |
| `ChatIntent`에 `KNOWLEDGE_QUERY` 추가 | IntentClassifier가 지식 질문을 분류하여 불필요한 RAG 호출 방지 (토큰 절약) | Intent 분류 정확도에 의존 |

---

## 📦 Dependencies

### Required Before Starting
- [x] Supabase 프로젝트(batwo-saas)에 `pgvector` 확장 활성화 가능 여부 확인
- [x] OpenAI API 키가 `.env.local`에 설정되어 있는지 확인 (`OPENAI_API_KEY`)

### External Dependencies (신규 설치)
- `openai` (^4.x): 임베딩 생성용 (이미 `@ai-sdk/openai`로 간접 사용 중이므로 호환 확인)

### Existing Dependencies (변경 없음)
- `@prisma/client` ^7.2.0
- `ai` ^6.0.59 / `@ai-sdk/openai` ^3.0.21
- `zod` ^4.2.1

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests BEFORE implementation

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥90% | EmbeddingService, KnowledgeBaseRepository, searchKnowledgeBase Tool |
| **Integration Tests** | Critical paths | 임베딩 생성 → 벡터 저장 → 검색 → Tool 응답 전체 플로우 |
| **E2E Tests** | 1 critical flow | 사용자가 지식 질문 → AI가 RAG 결과 포함하여 답변 |

### Test File Organization
```
tests/
├── unit/
│   ├── application/
│   │   └── tools/queries/searchKnowledgeBase.tool.test.ts
│   ├── infrastructure/
│   │   ├── database/repositories/PrismaKnowledgeBaseRepository.test.ts
│   │   └── external/openai/EmbeddingService.test.ts
│   └── domain/
│       └── value-objects/ChatIntent.test.ts  (기존 테스트 확장)
├── integration/
│   └── rag/
│       └── knowledge-base-search.test.ts
```

---

## 🚀 Implementation Phases

### Phase 1: Database Foundation — pgvector 확장 및 테이블
**Goal**: Supabase에 pgvector 확장을 활성화하고 마케팅 지식 저장용 테이블을 생성
**Estimated Time**: 2 hours
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 1.1**: `PrismaKnowledgeBaseRepository` 단위 테스트 작성
  - File(s): `tests/unit/infrastructure/database/repositories/PrismaKnowledgeBaseRepository.test.ts`
  - Expected: Tests FAIL — Repository 클래스가 존재하지 않음
  - Details:
    - `findSimilar(embedding, limit)` → 유사 문서 반환
    - `insert(document)` → 문서 저장
    - `deleteBySource(source)` → 소스별 삭제

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 1.2**: Prisma 마이그레이션 — pgvector 확장 + `knowledge_documents` 테이블
  - Supabase MCP로 `pgvector` 확장 활성화
  - Prisma 스키마에 `KnowledgeDocument` 모델 추가
  - 마이그레이션 실행: `npx prisma migrate dev --name add_knowledge_documents`

- [x] **Task 1.3**: `IKnowledgeBaseRepository` 포트 인터페이스 정의
  - File: `src/application/ports/IKnowledgeBaseRepository.ts`
  - Methods: `findSimilar`, `insert`, `bulkInsert`, `deleteBySource`

- [x] **Task 1.4**: `PrismaKnowledgeBaseRepository` 구현
  - File: `src/infrastructure/database/repositories/PrismaKnowledgeBaseRepository.ts`
  - pgvector 유사도 검색: `SELECT *, 1 - (embedding <=> $1) AS similarity FROM knowledge_documents ORDER BY similarity DESC LIMIT $2`

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 1.5**: 코드 품질 개선
  - [x] Repository 인터페이스 타입 정리
  - [x] SQL 인젝션 방지 확인 (parameterized query)
  - [x] 인라인 문서 추가

#### Quality Gate ✋

**TDD Compliance**:
- [x] Tests written FIRST and initially failed
- [x] Production code written to make tests pass
- [x] Refactor Phase completed

**Validation Commands**:
```bash
npx vitest run tests/unit/infrastructure/database/repositories/PrismaKnowledgeBaseRepository.test.ts
npm run type-check
npm run lint
```

---

### Phase 2: Embedding Service — 임베딩 생성 서비스
**Goal**: 텍스트를 OpenAI 임베딩 벡터로 변환하는 서비스 구현
**Estimated Time**: 2 hours
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 2.1**: `EmbeddingService` 단위 테스트 작성
  - File(s): `tests/unit/infrastructure/external/openai/EmbeddingService.test.ts`
  - Expected: Tests FAIL — EmbeddingService가 존재하지 않음
  - Details:
    - `generateEmbedding(text)` → 1536차원 벡터 반환
    - `generateEmbeddings(texts[])` → 배치 임베딩 반환
    - 빈 문자열/너무 긴 문자열 에러 처리
    - OpenAI API 실패 시 재시도 로직

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 2.2**: `IEmbeddingService` 포트 인터페이스 정의
  - File: `src/application/ports/IEmbeddingService.ts`

- [x] **Task 2.3**: `OpenAIEmbeddingService` 구현
  - File: `src/infrastructure/external/openai/OpenAIEmbeddingService.ts`
  - Model: `text-embedding-3-small` (1536 dimensions)
  - 기존 `IResilienceService`의 `withRetry` 활용

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 2.4**: 코드 품질 개선
  - [x] 배치 처리 최적화 (한 번에 여러 텍스트)
  - [x] 에러 타입 정의 (`EmbeddingError`)
  - [x] Rate limit 대응 로직

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/unit/infrastructure/external/openai/EmbeddingService.test.ts
npm run type-check
npm run lint
```

---

### Phase 3: Knowledge Ingestion Pipeline — 지식 문서 적재
**Goal**: 마케팅 지식 문서(Markdown/JSON)를 청킹→임베딩→DB 저장하는 파이프라인 구현
**Estimated Time**: 3 hours
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 3.1**: `KnowledgeIngestionService` 단위 테스트 작성
  - File(s): `tests/unit/application/services/KnowledgeIngestionService.test.ts`
  - Expected: Tests FAIL
  - Details:
    - Markdown 파일을 ≤500 토큰 단위로 청킹
    - 각 청크에 임베딩 생성 후 DB 저장
    - 중복 문서 감지 및 업데이트
    - 에러 발생 시 부분 실패 허용 (나머지 청크는 계속 처리)

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 3.2**: `KnowledgeIngestionService` 구현
  - File: `src/application/services/KnowledgeIngestionService.ts`
  - 의존성: `IEmbeddingService`, `IKnowledgeBaseRepository`

- [x] **Task 3.3**: 초기 마케팅 지식 시드 데이터 작성
  - File: `prisma/seeds/marketing-knowledge/` 디렉토리
  - 내용: Meta 광고 정책, 카피 작성 가이드, ROAS 최적화 전략 등 5~10개 문서

- [x] **Task 3.4**: 시드 스크립트 작성
  - File: `scripts/seed-knowledge-base.ts`
  - 실행: `npx tsx scripts/seed-knowledge-base.ts`

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 3.5**: 코드 품질 개선
  - [x] 청킹 알고리즘 최적화 (문단 경계 존중)
  - [x] 배치 임베딩으로 API 호출 최소화
  - [x] 진행률 로깅 추가

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/unit/application/services/KnowledgeIngestionService.test.ts
npm run type-check
npm run lint
```

---

### Phase 4: RAG Tool — searchKnowledgeBase Tool 등록
**Goal**: 기존 Tool 아키텍처에 RAG 검색 Tool을 추가하여 AI 에이전트가 지식 검색 가능
**Estimated Time**: 3 hours
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 4.1**: `searchKnowledgeBase.tool` 단위 테스트 작성
  - File(s): `tests/unit/application/tools/queries/searchKnowledgeBase.tool.test.ts`
  - Expected: Tests FAIL
  - Details:
    - 쿼리 텍스트 → 임베딩 변환 → 유사 문서 검색 → 포맷된 결과 반환
    - 검색 결과 없을 때 적절한 메시지
    - similarity threshold 이하 결과 필터링

- [x] **Test 4.2**: `registerAllTools` 통합 확인 테스트
  - 기존 17개 Tool + `searchKnowledgeBase` = 18개 등록 확인

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 4.3**: `searchKnowledgeBase.tool.ts` 구현
  - File: `src/application/tools/queries/searchKnowledgeBase.tool.ts`
  - 패턴: 기존 `getPerformanceKPI.tool.ts`와 동일한 factory 패턴
  - Params: `{ query: string, limit?: number, category?: string }`
  - `requiresConfirmation: false`

- [x] **Task 4.4**: `registerAllTools.ts` 업데이트
  - `RegisterAllToolsDeps`에 `embeddingService`, `knowledgeBaseRepository` 추가
  - `searchKnowledgeBase` Tool 등록

- [x] **Task 4.5**: DI 컨테이너 업데이트
  - `src/lib/di/container.ts`에 새 서비스 등록
  - `DI_TOKENS`에 토큰 추가

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 4.6**: 코드 품질 개선
  - [x] Tool description을 AI가 잘 이해하도록 최적화
  - [x] 검색 결과 포맷팅 개선 (출처, 유사도 점수 등)
  - [x] 기존 테스트(`ConversationalAgentService.resilience.test.ts`)가 여전히 통과하는지 확인

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/unit/application/tools/queries/searchKnowledgeBase.tool.test.ts
npx vitest run tests/unit/application/services/ConversationalAgentService.resilience.test.ts
npm run test:run
npm run type-check
npm run lint
```

**Manual Test Checklist**:
- [x] DI 컨테이너에서 `ConversationalAgentService` 정상 resolve 확인
- [x] 기존 Tool 17개 + 신규 1개 = 18개 등록 확인

---

### Phase 5: Intent & Prompt Integration — 인텐트 분류 및 시스템 프롬프트 연동
**Goal**: AI가 지식 관련 질문을 인식하고 자동으로 RAG Tool을 호출하도록 연동
**Estimated Time**: 3 hours
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 5.1**: `ChatIntent` 확장 테스트
  - `ChatIntent.KNOWLEDGE_QUERY` enum 값 추가 확인

- [x] **Test 5.2**: `IntentClassifier` 지식 질문 인식 테스트
  - "메타 광고 정책이 뭐야?" → `KNOWLEDGE_QUERY`
  - "ROAS 높이는 방법 알려줘" → `KNOWLEDGE_QUERY`
  - "내 캠페인 성과 보여줘" → `KPI_ANALYSIS` (기존 유지)

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 5.3**: `ChatIntent.ts`에 `KNOWLEDGE_QUERY` 추가
  - File: `src/domain/value-objects/ChatIntent.ts`

- [x] **Task 5.4**: `ConversationalAgentService.getIntentGuide()` 업데이트
  - `KNOWLEDGE_QUERY` 인텐트에 대한 가이드라인 추가
  - AI에게 "지식 관련 질문이면 `searchKnowledgeBase` 도구를 사용하라"는 지시

- [x] **Task 5.5**: `chatAssistant.ts` 시스템 프롬프트 업데이트
  - 새로운 Tool 사용 가이드 추가
  - "실시간 데이터가 필요하면 기존 Tool 사용, 일반 마케팅 지식이 필요하면 searchKnowledgeBase 사용" 지시

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 5.6**: 코드 품질 개선
  - [x] 프롬프트 토큰 사용량 측정 및 최적화
  - [x] 인텐트 분류 정확도 확인

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/unit/domain/value-objects/
npx vitest run tests/unit/application/services/ConversationalAgentService.resilience.test.ts
npm run test:run
npm run type-check
npm run lint
```

---

### Phase 6: End-to-End Verification & Polish
**Goal**: 전체 플로우 E2E 테스트, 기존 기능 회귀 테스트, 문서화
**Estimated Time**: 3 hours
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 6.1**: RAG 통합 테스트 작성
  - File(s): `tests/integration/rag/knowledge-base-search.test.ts`
  - 전체 플로우: 사용자 질문 → Intent 분류 → RAG Tool 호출 → 검색 결과 포함 응답

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 6.2**: 통합 테스트 통과를 위한 버그 수정 및 누락된 코드 작성

- [x] **Task 6.3**: 기존 전체 테스트 스위트 회귀 확인
  - `npm run test:run` — 모든 기존 테스트 통과 확인

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 6.4**: 최종 클린업 및 문서화
  - [x] `AGENTS.md` 업데이트 (RAG 구조 설명 추가)
  - [x] `chatAssistant.ts` QUERY_PATTERNS에 RAG 관련 패턴 추가
  - [x] 코드 인라인 문서 최종 정리

#### Quality Gate ✋

**Validation Commands**:
```bash
# 전체 테스트 스위트
npm run test:run

# 타입 체크
npm run type-check

# 린트
npm run lint

# 빌드 확인
npm run build
```

**Manual Test Checklist**:
- [x] 개발 서버(`npm run dev`) 실행 후 AI 챗봇에서 마케팅 지식 질문 테스트
- [x] 기존 캠페인 조회/생성 등 Agentic 기능이 정상 즉시 작동하는지 확인
- [x] 지식 질문 시 RAG 검색 결과가 포함된 답변이 생성되는지 확인

---

### Phase 7: GPT-5 Model Upgrade — 전체 AI 모델 업그레이드
**Goal**: 프로젝트 전체의 AI 모델을 GPT-4o 시리즈에서 GPT-5 시리즈로 업그레이드하여 성능 향상 및 컨텍스트 윈도우 확대
**Estimated Time**: 3 hours
**Status**: ✅ Complete

#### Model Migration Map (공식 가격 기준, 2026-03)

| 용도 | 현재 모델 | → 변경 모델 | Input/1M | Output/1M | 컨텍스트 | 이유 |
|------|----------|------------|---------|-----------|---------|------|
| 챗봇 대화 (`ConversationalAgentService`) | `gpt-4o-mini` | → **`gpt-5-mini`** | $0.25 | $2.00 | 400K | Tool Calling에 최적, 컨텍스트 3배 |
| 일반 AI 서비스 (`AIService`, `StreamingAIService`) | `gpt-4o-mini` | → **`gpt-5-nano`** | $0.05 | $0.40 | 400K | 가장 저렴, 단순 분석에 적합 |
| 카피 생성 (`adCopyGeneration`) | `gpt-4o` | → **`gpt-5-mini`** | $0.25 | $2.00 | 400K | GPT-4o보다 저렴하면서 성능 우위 |
| 타겟팅 전략 (`targetingOptimization`) | `gpt-4o` | → **`gpt-5-mini`** | $0.25 | $2.00 | 400K | 복잡한 전략 수립에 적합 |
| 크리에이티브 테스트 (`creativeTestDesign`) | `gpt-4o` | → **`gpt-5-mini`** | $0.25 | $2.00 | 400K | 고품질 크리에이티브 설계 |
| 챗봇 보조 (`chatAssistant`) | `gpt-4o-mini` | → **`gpt-5-nano`** | $0.05 | $0.40 | 400K | 빠른 응답, 비용 절감 |
| 캠페인 최적화 (`campaignOptimization`) | `gpt-4o-mini` | → **`gpt-5-nano`** | $0.05 | $0.40 | 400K | 분석 작업에 nano 충분 |
| 리포트 인사이트 (`reportInsight`) | `gpt-4o-mini` | → **`gpt-5-nano`** | $0.05 | $0.40 | 400K | 정형화된 분석 |
| 경쟁사 분석 (`competitorAnalysis`) | `gpt-4o-mini` | → **`gpt-5-nano`** | $0.05 | $0.40 | 400K | 비용 효율 |
| KPI 인사이트 (`KPIInsightsService`) | `gpt-4o` / `gpt-4o-mini` | → **`gpt-5-mini`** / **`gpt-5-nano`** | - | - | 400K | 우선순위별 분리 유지 |
| 구독 FREE/STARTER (`SubscriptionPlan`) | `gpt-4o-mini` | → **`gpt-5-nano`** | $0.05 | $0.40 | 400K | 무료 플랜 비용 최소화 |
| 구독 PRO/ENTERPRISE (`SubscriptionPlan`) | `gpt-4o` / `gpt-4o-mini` | → **`gpt-5-mini`** | $0.25 | $2.00 | 400K | 유료 플랜 고품질 |
| DI 기본값 (`container.ts`) | `gpt-4o-mini` | → **`gpt-5-nano`** | $0.05 | $0.40 | 400K | 환경변수 미설정 시 기본값 |

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 7.1**: 모델명 변경 후 기존 테스트 통과 확인
  - `ConversationalAgentService.resilience.test.ts` 실행
  - `useAgentChat.test.ts` 실행
  - 모델명이 하드코딩된 테스트가 있다면 업데이트

**🟢 GREEN: Implement Model Changes**
- [x] **Task 7.2**: `gpt-4o` → `gpt-5-mini` 일괄 변경 (고품질 용도)
  - Files:
    - `src/infrastructure/external/openai/prompts/adCopyGeneration.ts`
    - `src/infrastructure/external/openai/prompts/creativeTestDesign.ts`
    - `src/infrastructure/external/openai/prompts/targetingOptimization.ts`
    - `src/infrastructure/external/openai/prompts/kpiInsight.ts`
    - `src/domain/value-objects/SubscriptionPlan.ts` (premiumCopyModel)
    - `src/application/services/KPIInsightsService.ts` (hasHighPriority 분기)

- [x] **Task 7.3**: `gpt-4o-mini` → `gpt-5-nano` 일괄 변경 (비용 효율 용도)
  - Files:
    - `src/infrastructure/external/openai/AIService.ts`
    - `src/infrastructure/external/openai/streaming/StreamingAIService.ts`
    - `src/infrastructure/external/openai/prompts/chatAssistant.ts`
    - `src/infrastructure/external/openai/prompts/campaignOptimization.ts`
    - `src/infrastructure/external/openai/prompts/reportInsight.ts`
    - `src/infrastructure/external/openai/prompts/competitorAnalysis.ts`
    - `src/domain/value-objects/SubscriptionPlan.ts` (copyModel, analysisModel)
    - `src/lib/di/container.ts` (기본값 2곳)

- [x] **Task 7.4**: 챗봇 대화 모델 → `gpt-5-mini`로 변경
  - File: `src/application/services/ConversationalAgentService.ts` (line 143)

- [x] **Task 7.5**: 타입/인터페이스 주석 업데이트
  - File: `src/application/ports/IAIService.ts` — 예시 모델명 주석 수정

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 7.6**: 코드 품질 개선
  - [x] 모델명을 상수/환경변수로 중앙 관리 리팩토링 검토
  - [x] `OPENAI_MODEL` 환경변수 기본값 업데이트 확인
  - [x] `.env.example` 주석 업데이트

#### Quality Gate ✋

**Validation Commands**:
```bash
# 전체 테스트 통과 확인
npm run test:run

# 타입 체크
npm run type-check

# 린트
npm run lint

# 빌드
npm run build
```

**Manual Test Checklist**:
- [x] `npm run dev` 후 챗봇 대화 정상 동작 확인
- [x] AI 카피 생성 기능 정상 동작 확인
- [x] 구독 플랜별 모델 분기 정상 작동 확인

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Supabase Free 플랜에서 pgvector 미지원 | Low | High | 사전에 Supabase 플랜 확인, 필요 시 Pro 업그레이드 |
| OpenAI 임베딩 API 비용 증가 | Medium | Medium | 캐싱 전략 + 배치 처리로 API 호출 최소화, 시드 데이터 크기 제한 |
| 한국어 질문의 벡터 검색 정확도 | Medium | Medium | `text-embedding-3-small`의 한국어 성능 테스트, 필요 시 모델 변경 |
| 기존 Agentic 테스트 회귀 | Low | High | Phase 4~5에서 기존 테스트 반드시 통과 확인 후 진행 |
| Prisma + pgvector raw query 타입 안전성 | Medium | Low | Repository 패턴으로 캡슐화, 통합 테스트로 검증 |
| GPT-5 모델 호환성 (Vercel AI SDK) | Low | Medium | `@ai-sdk/openai` 패키지가 GPT-5 모델명을 지원하는지 사전 확인 |
| GPT-5 모델 가격 변동 | Low | Low | 환경변수로 모델명을 관리하여 빠른 변경 가능 |

---

## 🔄 Rollback Strategy

### If Phase 1 Fails (DB 마이그레이션)
- `npx prisma migrate resolve --rolled-back <migration_name>`
- pgvector 확장 비활성화: `DROP EXTENSION IF EXISTS vector`

### If Phase 2-3 Fails (Embedding/Ingestion)
- 새로 추가된 파일만 삭제, DB 테이블은 유지 (비어 있으므로 무해)

### If Phase 4-5 Fails (Tool/Intent 통합)
- `registerAllTools.ts`에서 `searchKnowledgeBase` 등록 제거
- `ChatIntent.ts`에서 `KNOWLEDGE_QUERY` 제거
- 기존 코드에 대한 수정은 git revert로 원복

### If Phase 7 Fails (GPT-5 모델 업그레이드)
- 모든 모델명을 `gpt-4o` / `gpt-4o-mini`로 원복 (git revert)
- DI 컨테이너 기본값 원복
- GPT-5 모델은 독립적이므로 다른 Phase에 영향 없음

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ✅ 100% — DB 마이그레이션, Repository 구현 완료
- **Phase 2**: ✅ 100% — OpenAIEmbeddingService 구현 완료
- **Phase 3**: ✅ 100% — KnowledgeIngestionService 구현 완료
- **Phase 4**: ✅ 100% — searchKnowledgeBase Tool 등록 완료
- **Phase 5**: ✅ 100% — Intent/Prompt 통합 완료
- **Phase 6**: ✅ 100% — DI 등록, E2E 검증 완료
- **Phase 7**: ✅ 100% — GPT-5 모델 업그레이드 완료

**Overall Progress**: 100% complete ✅

---

## 📝 Notes & Learnings

### Implementation Notes
- (구현 시 추가)

### Key Files Reference
| File | Role |
|------|------|
| `src/application/ports/IConversationalAgent.ts` | AgentTool, IToolRegistry 인터페이스 |
| `src/application/tools/registerAllTools.ts` | 전체 Tool 등록 (현재 18개, RAG 포함) |
| `src/application/services/ConversationalAgentService.ts` | 핵심 Agent 서비스 (611 lines) |
| `src/domain/value-objects/ChatIntent.ts` | 인텐트 분류 (7 types, KNOWLEDGE_QUERY 포함) |
| `src/infrastructure/external/openai/prompts/chatAssistant.ts` | 시스템 프롬프트 |
| `src/app/api/agent/chat/route.ts` | Chat API 라우트 |
| `tests/unit/application/services/ConversationalAgentService.resilience.test.ts` | 기존 Agent 테스트 |
| `src/domain/value-objects/SubscriptionPlan.ts` | 구독 플랜별 모델 설정 |
| `src/infrastructure/external/openai/AIService.ts` | 일반 AI 서비스 (기본 모델) |
| `src/infrastructure/external/openai/streaming/StreamingAIService.ts` | 스트리밍 AI 서비스 |
| `src/lib/di/container.ts` | DI 컨테이너 (모델 기본값) |

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [x] All 7 phases completed with quality gates passed
- [x] Full regression test (`npm run test:run`) passing — 193 files, 2867 tests ✅
- [x] `npm run build` successful
- [x] AGENTS.md documentation updated
- [x] Knowledge base seeded with initial marketing documents
- [x] Manual E2E test: 마케팅 질문 → RAG 기반 답변 확인
- [x] GPT-5 모델로 챗봇/카피생성/분석 정상 동작 확인

---

**Plan Status**: ✅ Complete
**Completed**: 2026-03-08
**All Quality Gates**: ✅ Passed (193 test files, 2867 tests, type-check clean, build successful)
