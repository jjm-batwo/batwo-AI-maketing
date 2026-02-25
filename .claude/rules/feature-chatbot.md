---
paths:
  - "src/domain/value-objects/ChatIntent.ts"
  - "src/domain/value-objects/FewShotExample.ts"
  - "src/domain/value-objects/IntentClassificationResult.ts"
  - "src/domain/services/IntentClassifier.ts"
  - "src/domain/entities/Conversation.ts"
  - "src/domain/repositories/IConversationRepository.ts"
  - "src/domain/repositories/IAIFeedbackRepository.ts"
  - "src/application/services/ConversationalAgentService.ts"
  - "src/application/services/ConversationSummarizerService.ts"
  - "src/application/services/FallbackResponseService.ts"
  - "src/application/services/FewShotExampleRegistry.ts"
  - "src/application/services/GuideQuestionService.ts"
  - "src/application/services/PromptTemplateService.ts"
  - "src/application/ports/IConversationalAgent.ts"
  - "src/application/ports/IFallbackResponseService.ts"
  - "src/application/ports/IFewShotExampleRegistry.ts"
  - "src/application/ports/IGuideQuestionService.ts"
  - "src/application/ports/IPromptTemplateService.ts"
  - "src/application/ports/IResilienceService.ts"
  - "src/application/use-cases/ai/**"
  - "src/infrastructure/external/errors/**"
  - "src/infrastructure/external/openai/prompts/chatAssistant.ts"
  - "src/infrastructure/database/repositories/PrismaConversationRepository.ts"
  - "src/infrastructure/database/repositories/PrismaAIFeedbackRepository.ts"
  - "src/app/api/agent/chat/**"
  - "src/app/api/ai/chat/**"
  - "src/app/api/ai/feedback/**"
  - "src/presentation/components/chat/**"
  - "src/presentation/components/dashboard/FeedbackSummaryCard.tsx"
  - "src/presentation/hooks/useAgentChat.ts"
  - "src/presentation/hooks/useFeedback.ts"
  - "src/presentation/hooks/useFeedbackAnalytics.ts"
  - "src/presentation/hooks/useKeyboardNavigation.ts"
---

# AI 마케팅 어시스턴트 챗봇

## 개요
AI 마케팅 어시스턴트. 인텐트 분류 → Few-Shot 예제 → 프롬프트 템플릿 파이프라인.

## ChatIntent (6종)
| Intent | 설명 |
|--------|------|
| CAMPAIGN_CREATION | 캠페인 생성 도움 |
| REPORT_QUERY | 보고서 조회 |
| KPI_ANALYSIS | KPI 분석 |
| PIXEL_SETUP | 픽셀 설치 안내 |
| BUDGET_OPTIMIZATION | 예산 최적화 |
| GENERAL | 일반 질문 |

## 핵심 서비스
- **IntentClassifier**: 사용자 메시지 → ChatIntent 분류
- **FewShotExampleRegistry**: 인텐트별 Few-Shot 예제 관리
- **PromptTemplateService**: 인텐트별 프롬프트 템플릿
- **GuideQuestionService**: 대화 흐름 유도 질문 생성
- **ConversationSummarizerService**: 긴 대화 컨텍스트 압축
- **FallbackResponseService**: 인텐트별 기본 응답

## 레질리언스 계층
- **withRetry**: 지수 백오프 재시도
- **CircuitBreaker**: 연속 실패 시 회로 차단
- **ResilienceService**: withRetry + CircuitBreaker 통합

## 피드백 시스템
- **ChatMessageFeedback**: 메시지별 좋아요/싫어요 UI
- **useFeedback**: 피드백 CRUD 훅
- **GetFeedbackAnalyticsUseCase**: 피드백 통계 분석
- **FeedbackSummaryCard**: 대시보드 피드백 요약 위젯
