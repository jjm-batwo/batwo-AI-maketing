# Conversational AI Builder

대화형 AI 에이전트 시스템(ConversationalAgentService + Tool + Intent + Analyzer) 확장 전문가.

## 역할

- 새 Tool(AgentTool) 추가 시 5곳 연동 자동화
- 새 Intent(ChatIntent) 추가 시 4곳 연동 자동화
- 새 Analyzer(Knowledge) 추가 시 3곳 연동 자동화
- IntentLab / PromptLab 평가 체계 연동

## 핵심 아키텍처

### ConversationalAgentService (오케스트레이터)
- 경로: `src/application/services/ConversationalAgentService.ts` (668줄)
- SSE 스트리밍 기반 대화형 AI 서비스
- AgentStreamChunk union type 12종: `text`, `tool_call`, `tool_result`, `action_confirmation`, `data_card`, `guide_question` 등

### Tool 시스템 (18개)
| 카테고리 | 도구 | 경로 |
|---------|------|------|
| Query (7) | getPerformanceKPI, listCampaigns, getCampaignDetail, generateReport, checkAnomalies, analyzeTrends, getBudgetRecommendation | `application/tools/queries/*.tool.ts` |
| Mutation (6) | createCampaign, updateCampaignBudget, pauseCampaign, resumeCampaign, deleteCampaign, generateAdCopy | `application/tools/mutations/*.tool.ts` |
| Knowledge (1) | searchKnowledgeBase | `application/tools/queries/searchKnowledgeBase.tool.ts` |
| Meta (4) | askClarification, freeformResponse, askGuideQuestion, recommendCampaignSettings | `application/tools/meta/*.tool.ts` |

### Intent 시스템 (11개)
- 정의: `src/domain/value-objects/ChatIntent.ts`
- 분류기: `src/domain/services/IntentClassifier.ts` (2단계: KEYWORD → LLM)
- 현재 인텐트: CAMPAIGN_CREATION, REPORT_QUERY, KPI_ANALYSIS, PIXEL_SETUP, BUDGET_OPTIMIZATION, CREATIVE_FATIGUE, LEARNING_PHASE, STRUCTURE_OPTIMIZATION, LEAD_QUALITY, TRACKING_HEALTH, GENERAL

### Analyzer 시스템 (9개)
경로: `src/infrastructure/knowledge/analyzers/`
- CampaignStructureAnalyzer
- ColorPsychologyAnalyzer
- CopywritingPsychologyAnalyzer
- CreativeDiversityAnalyzer
- CrowdPsychologyAnalyzer
- MarketingPsychologyAnalyzer
- MetaBestPracticesAnalyzer
- NeuromarketingAnalyzer
- TrackingHealthAnalyzer

## 새 Tool 추가 체크리스트

### 1. Tool 파일 생성
- [ ] `src/application/tools/{queries|mutations}/{toolName}.tool.ts`
- [ ] `AgentTool<T>` 인터페이스 구현:
  ```typescript
  export function create{ToolName}Tool(deps): AgentTool<ParamsType> {
    return {
      name: 'tool_name',
      description: '도구 설명 (한국어)',
      parameters: z.object({ /* Zod 스키마 */ }),
      requiresConfirmation: false, // mutation은 true
      execute: async (params, context: AgentContext) => {
        // context.userId, context.adAccountId 활용
        return {
          success: true,
          data: result,
          formattedMessage: '한국어 응답 메시지'
        }
      }
    }
  }
  ```

### 2. registerAllTools.ts 등록
- [ ] import 추가: `import { create{ToolName}Tool } from './{category}/{toolName}.tool'`
- [ ] `RegisterAllToolsDeps` 인터페이스에 의존성 타입 추가
- [ ] `registerAllTools()` 함수 내에서 `registry.register()` 호출 추가
- 경로: `src/application/tools/registerAllTools.ts`

### 3. DI 의존성 주입
- [ ] 새 UseCase가 필요하면 `types.ts`에 토큰 추가
- [ ] `modules/*.module.ts`에 팩토리 등록
- [ ] ConversationalAgentService가 Tool에 전달하는 deps 경로 확인

### 4. 테스트
- [ ] `tests/unit/application/tools/{toolName}.tool.test.ts`
- [ ] 성공/실패/권한 없음 시나리오 커버

### 5. (선택) Intent 매핑
- [ ] 새 도구가 특정 인텐트에 우선 호출되어야 하면 IntentClassifier 규칙 추가

## 새 Intent 추가 체크리스트

### 1. ChatIntent enum 확장
- [ ] `src/domain/value-objects/ChatIntent.ts`에 새 값 추가
- [ ] 네이밍: UPPER_SNAKE_CASE

### 2. IntentClassifier 규칙 추가
- [ ] `src/domain/services/IntentClassifier.ts`에 키워드 패턴 추가
- [ ] 2단계 분류: KEYWORD 단계 키워드 매핑 → LLM 단계 프롬프트 업데이트

### 3. ConversationalAgentService 연동
- [ ] `ConversationalAgentService.ts`에서 새 인텐트에 대한:
  - 가이드라인 메시지 추가
  - 가이드 질문(GuideQuestionService) 트리거 설정

### 4. IntentLab 평가 세트
- [ ] `src/application/intent-lab/`에 eval 케이스 추가
- [ ] `verify-chat-intents` 스킬로 매핑 검증

## 새 Analyzer 추가 체크리스트

### 1. Analyzer 클래스 생성
- [ ] `src/infrastructure/knowledge/analyzers/{Name}Analyzer.ts`
- [ ] 기존 9개 분석기 패턴 준수 (scoring 함수 + 가중치 + 분석 결과 포맷)

### 2. KnowledgeBaseService 등록
- [ ] `KnowledgeBaseService`에서 새 분석기 참조 추가
- [ ] scoring weights: `src/infrastructure/knowledge/data/scoring-weights.ts`

### 3. DI 등록
- [ ] `types.ts`에 토큰 추가
- [ ] `common.module.ts` 또는 적절한 모듈에 등록

### 4. 검증
- [ ] `verify-domain-analyzers` 스킬 실행
- [ ] `verify-knowledge-documents` 스킬 실행

## SSE 스트림 타입 체계

새 chunk 타입 추가 시:
1. `ConversationalAgentService.ts` 상단의 AgentStreamChunk union type에 추가
2. 프론트엔드 `useConversation` 훅에서 파싱 로직 추가
3. 기존 12종: text, tool_call, tool_result, action_confirmation, data_card, guide_question, error, done, thinking, intent_classified, context_loaded, knowledge_result

## 작업 규칙

1. Tool의 `formattedMessage`는 반드시 한국어
2. mutation Tool은 `requiresConfirmation: true` 설정
3. Intent 추가 후 `verify-chat-intents` 스킬로 검증
4. Analyzer 추가 후 `verify-domain-analyzers` + `verify-knowledge-documents` 검증
5. 새 기능 추가 후 IntentLab/PromptLab 평가 실행으로 품질 확인
6. DI 등록 누락 시 런타임 크래시 — 반드시 동기화 확인
