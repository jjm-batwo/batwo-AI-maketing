---
name: verify-chat-intents
description: ChatIntent 열거형에 정의된 인텐트가 프롬프트 제어 분기 및 UI 후속 질문에 올바르게 매핑되어 있는지 검증합니다. ChatIntent 값 추가/수정 후 사용.
---

# 인텐트 응답 매핑 검증

## 목적

1. `ChatIntent.ts`에 추가된 모든 인텐트가 `conversationalAgentService` (가이드라인, 추천 질문)에 등록되었는지 확인합니다
2. `GuideQuestionService.ts` 등 사용자 인터뷰 트리거에서 누락이나 예외 처리 부재가 없는지 확인합니다
3. 시스템 프롬프트가 모르는 인텐트 입력 시 기본 폴백(`GENERAL`)으로 떨어지지 않고 개발자 의도대로 제어되고 있는지 검사합니다

## 언제 실행하는가 (When to Run)

- `ChatIntent` enum의 새로운 값을 추가하거나 기존 값을 변경한 경우
- IntentClassifier에서 반환하는 인텐트 분류 규칙을 수정한 경우
- 챗 어시스턴트의 가이드 응답 템플릿(chatAssistant.ts 등)을 수정한 경우

## Related Files

| 파일 경로 | 파일 목적 |
|-----------------------------------------------|--------------------------------------------------|
| `src/domain/value-objects/ChatIntent.ts` | 인텐트 Enum 선언 |
| `src/application/services/ConversationalAgentService.ts` | 인텐트별 가이드라인 및 추천 질문 매핑 구현 |
| `src/application/services/GuideQuestionService.ts` | 인텐트별 순차 질문 인터뷰 트리거 |

## Workflow

### Step 1: 선언된 ChatIntent 추출
**도구:** `read_file` (또는 로컬 스크립트 기반 추출)
**경로:** `src/domain/value-objects/ChatIntent.ts`
**조건:** `export enum ChatIntent { ... }` 블록 내의 키워드(예: `CREATIVE_FATIGUE`, `LEARNING_PHASE` 등)를 전부 목록화합니다.

### Step 2: ConversationalAgentService.ts 매핑 검증
**경로:** `src/application/services/ConversationalAgentService.ts`
**검사:**
- `getIntentGuide(intent: ChatIntent)` 메서드 내 `guides` 객체에서 Step 1의 모든 인텐트를 키로 가지고 있는지 확인.
- `generateSuggestedQuestions` 메서드 내 `followUpMap`에서 Step 1의 모든 인텐트를 키로 가지고 있는지 확인.
- (TypeScript `Record<ChatIntent, string>` 에러가 안 나면 통과, 하지만 정적 분석으로도 체크)
**통과 기준:** Step 1에서 추출한 모든 인텐트가 매핑 객체의 키로 존재해야 함.

### Step 3: GuideQuestionService.ts 인터뷰 분기 검증
**경로:** `src/application/services/GuideQuestionService.ts`
**검사:**
- 인텐트에 따라 동적 인터뷰/추천 가이드를 반환하는 switch 문이나 객체 매핑에 인텐트들이 적절히 정의되어 있는지 확인.
**통과 기준:** 가이드라인이 명시적으로 불필요한 인텐트가 아니라면, 매핑 누락(dead-ends)이 없어야 함.

## Output Format

| 검증 항목 | 대상 | 결과 (통과 여부) | 누락된 인텐트 예시 |
|---------------------|--------------------------------|------------------|-----------------------|
| Enum vs IntentGuide | `ConversationalAgentService` | PASS / FAIL | - |
| Enum vs FollowUp | `ConversationalAgentService` | PASS / FAIL | `LEARNING_PHASE` |
| Enum vs Questions | `GuideQuestionService` | PASS / FAIL | - |

## Exceptions

다음 조건에서는 FAIL로 간주하지 않습니다:
- **Default 처리된 인텐트:** 코드 리뷰나 비즈니스 룰에 의해 `GENERAL` 브랜치나 Default fallback에서 처리하도록 명시된 경우.
- **아직 UI 지원 전:** 백엔드 도메인에는 추가되었지만, 의도적으로 프론트엔드/서비스 노출을 주석 처리해둔 경우 (단, TODO 주석이 있어야 함).
