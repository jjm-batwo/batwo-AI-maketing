# Implementation Plan: IntentClassifier LLM Fallback

**Status**: ⏳ Pending
**Started**: 2026-03-17
**Last Updated**: 2026-03-17
**Estimated Completion**: 2026-03-17

---

**CRITICAL INSTRUCTIONS**: After completing each phase:
1. Check off completed task checkboxes
2. Run all quality gate validation commands
3. Verify ALL quality gate items pass
4. Update "Last Updated" date above
5. Document learnings in Notes section
6. Only then proceed to next phase

DO NOT skip quality gates or proceed with failing checks

---

## Overview

### Feature Description
IntentClassifier의 Stage 2 LLM fallback을 실제 LLM 호출로 전환.
키워드 매칭(Stage 1)의 confidence가 낮을 때만 LLM을 호출하여 비용을 통제하면서 정확도를 올린다.

### 현재 상태
- 합성 eval: 93%, 실패턴 eval: 86.7%, GAP: 6.3pp
- 남은 실패 15개: 멀티인텐트 충돌, 맥락 의존적 입력 → 키워드 매칭 구조적 한계

### 핵심 설계: 2-Tier 분리
```
classify(message)        → 동기, 기존 keyword+context (IntentLab/테스트용, $0)
classifyAsync(message)   → 비동기, confidence 낮으면 LLM 호출 (프로덕션 챗봇용)
```

### Success Criteria
- [ ] 실패턴 정확도 95%+ (현재 86.7%)
- [ ] 기존 classify() 동기 호출 변경 없음
- [ ] LLM 호출은 전체 입력의 ~15%에서만 발생
- [ ] LLM 장애 시 기존 classify() 결과로 graceful fallback
- [ ] 기존 테스트 전부 통과

---

## Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| classify() 동기 유지 + classifyAsync() 신규 | IntentLab 수만 회 루프와 2,770 테스트에 영향 없음 | 함수 두 개 관리 |
| IAIService.chatCompletion() 재활용 | 이미 존재하는 포트, DI 연결됨, gpt-4o-mini 사용 | IntentClassifier가 IAIService에 의존 (domain→application 역전) |
| Domain에 IIntentLLMPort 추가 | 의존성 역전 유지, 테스트에서 mock 가능 | 파일 1개 추가 |
| confidence threshold 0.5 | keyword 단일 매칭 0.6, 복수 매칭 0.95 → 0.5 미만만 LLM | 임계값 조정 필요할 수 있음 |
| classifyAsync 결과 캐싱 (per-message) | 같은 메시지로 2회 호출 방지 (line 367, 555) | 메모리 약간 사용 |
| LLM 입력 500자 truncate | 장문 메시지 비용 폭발 방지 (10K자 → 5K 토큰 방지) | 극히 드문 케이스에서 맥락 손실 |
| LLM 호출을 DB 작업과 병렬화 | 첫 토큰 지연 은닉 (~500ms) | setup phase 에러 핸들링 복잡도 증가 |

### 심층 검증에서 발견된 이슈 및 해결

| # | 이슈 | 판정 | 해결 |
|---|------|------|------|
| 1 | DI 연결 경로 누락: IntentClassifier.create()가 필드 초기화로 직접 호출 | **FAIL→해결** | create(config?, llmPort?) 2번째 파라미터 추가 + ConversationalAgentService 생성자에 IIntentLLMPort 주입 + auth.module DI 등록 |
| 2 | 같은 메시지로 classify 2회 호출 (line 367, 555) → LLM 2회 | **WARN→해결** | chat() 메서드 내에서 첫 classifyAsync 결과를 변수에 캐싱, generateSuggestedQuestions에 전달 |
| 3 | 장문 메시지 LLM 비용 폭발 | **WARN→해결** | IntentLLMAdapter에서 입력 500자 truncate |
| 4 | 첫 토큰 지연 500ms-1s | **WARN→해결** | buildSystemPrompt의 LLM 호출을 DB 작업과 Promise.all 병렬화 |
| 5 | evaluateAsync가 mutation loop에 혼입 가능 | **WARN→해결** | IntentLabAsyncEval.ts로 물리적 파일 분리 |

---

## Dependencies

### Required Before Starting
- [x] EvalSet에 REAL_EVAL_SET 60개 추가 완료
- [x] GapReport 구조 완료 (baseline 수치 확보)
- [x] keyword/context config v2 적용 완료

### External Dependencies
- `ai` (Vercel AI SDK): 이미 설치됨
- `@ai-sdk/openai`: 이미 설치됨
- `gpt-4o-mini`: 이미 사용 중

---

## Implementation Phases

### Phase 1: Domain Port + classifyAsync 인터페이스
**Goal**: IIntentLLMPort 정의 + IntentClassifier에 classifyAsync() 추가 (LLM stub)
**Estimated Time**: 1시간

#### Tasks

**RED: Write Failing Tests First**
- [ ] **Test 1.1**: classifyAsync() 테스트 — confidence 높으면 LLM 미호출
  - File: `tests/unit/domain/services/IntentClassifier.test.ts`
  - 케이스: "캠페인 만들어줘" → keyword 매칭 confidence 0.95 → LLM 호출 안 함
  - mock IIntentLLMPort의 classifyIntent가 호출되지 않았음을 검증

- [ ] **Test 1.2**: classifyAsync() 테스트 — confidence 낮으면 LLM 호출
  - 케이스: "일단 뭐라도 좀 해봐요" → keyword confidence 낮음 → LLM port 호출
  - mock IIntentLLMPort가 ChatIntent.CAMPAIGN_CREATION 반환

- [ ] **Test 1.3**: classifyAsync() 테스트 — LLM 에러 시 기존 classify() 결과 fallback
  - mock IIntentLLMPort가 throw → 기존 keyword/context 결과 반환 (GENERAL이더라도)

- [ ] **Test 1.4**: classifyAsync() 테스트 — llmPort 미주입 시 classify() 결과 그대로
  - IntentClassifier.create(config) — llmPort 없이 생성
  - classifyAsync()가 classify()와 동일 결과 반환

**GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.5**: IIntentLLMPort 인터페이스 정의
  - File: `src/domain/ports/IIntentLLMPort.ts`
  ```typescript
  export interface IIntentLLMPort {
    classifyIntent(message: string, candidates: ChatIntent[]): Promise<ChatIntent>
  }
  ```

- [ ] **Task 1.6**: IntentClassifier.create() 시그니처 확장
  - File: `src/domain/services/IntentClassifier.ts`
  - `create(config?, llmPort?)` — llmPort를 private readonly 필드로 저장
  - 기존 `create()` 호출은 llmPort 없이 그대로 동작 (하위호환)

- [ ] **Task 1.7**: IntentClassifier에 classifyAsync() 구현
  - File: `src/domain/services/IntentClassifier.ts`
  - 로직:
    1. classify() 먼저 실행 → IntentClassificationResult 획득
    2. confidence >= threshold → 그대로 반환 (LLM 미호출)
    3. confidence < threshold + llmPort 있음 → llmPort.classifyIntent() 호출
    4. llmPort 에러 → try/catch → classify() 결과 fallback
    5. llmPort 없음 → classify() 결과 그대로

**REFACTOR**
- [ ] **Task 1.8**: confidence threshold를 IntentClassifierConfig에 추가
  - `llmFallbackThreshold: number` (default: 0.5)

#### Quality Gate
- [ ] `npx tsc --noEmit` 통과 (IntentClassifier 관련 에러 없음)
- [ ] `npx vitest run tests/unit/domain/services/IntentClassifier` 통과
- [ ] 기존 IntentLab 테스트 32개 전부 통과
- [ ] classify() 동기 호출 — 변경 없음 확인
- [ ] 기존 `IntentClassifier.create()` (인자 없이) 호출하는 코드 전부 컴파일 통과

---

### Phase 2: Infrastructure 어댑터 구현
**Goal**: IAIService.chatCompletion()을 활용한 IntentLLMAdapter 구현 (입력 truncate 포함)
**Estimated Time**: 1시간

#### Tasks

**RED: Write Failing Tests First**
- [ ] **Test 2.1**: IntentLLMAdapter 단위 테스트
  - File: `tests/unit/infrastructure/IntentLLMAdapter.test.ts`
  - mock IAIService.chatCompletion() → "CAMPAIGN_CREATION" 반환
  - adapter가 ChatIntent.CAMPAIGN_CREATION으로 파싱하는지 검증

- [ ] **Test 2.2**: LLM 응답 파싱 엣지케이스
  - 소문자 응답: "campaign_creation" → ChatIntent.CAMPAIGN_CREATION
  - 잘못된 응답: "UNKNOWN_INTENT" → ChatIntent.GENERAL fallback
  - 빈 응답: "" → ChatIntent.GENERAL fallback

- [ ] **Test 2.3**: 입력 truncate 검증
  - 1000자 메시지 → chatCompletion에 500자로 잘려서 전달되는지 검증
  - 100자 메시지 → 잘리지 않고 그대로 전달

**GREEN: Implement to Make Tests Pass**
- [ ] **Task 2.4**: IntentLLMAdapter 구현
  - File: `src/infrastructure/external/openai/IntentLLMAdapter.ts`
  - implements IIntentLLMPort
  - 프롬프트: 11개 인텐트 enum + 한글 설명 나열 + 사용자 메시지 → 하나만 반환 요청
  - config: temperature 0, maxTokens 20 (인텐트 이름만 반환)
  - **입력 truncate: message.slice(0, 500)**

- [ ] **Task 2.5**: DI 컨테이너에 IntentLLMAdapter 등록
  - File: `src/infrastructure/di/container.ts` (또는 `src/lib/di/modules/auth.module.ts`)
  - IIntentLLMPort 토큰 추가 + IntentLLMAdapter 바인딩
  - IAIService 의존성 주입

**REFACTOR**
- [ ] **Task 2.6**: 프롬프트를 상수로 추출, 인텐트 설명 한글화
- [ ] **Task 2.7**: TRUNCATE_LENGTH를 상수로 추출 (default: 500)

#### Quality Gate
- [ ] adapter 테스트 통과
- [ ] `npx tsc --noEmit` 통과
- [ ] 기존 테스트 전부 통과

---

### Phase 3: ConversationalAgentService 통합 + Eval 검증
**Goal**: 프로덕션 챗봇에서 classifyAsync() 사용 + eval set으로 정확도 측정
**Estimated Time**: 1.5시간

#### Tasks

**RED: Write Failing Tests First**
- [ ] **Test 3.1**: IntentLabAsyncEval에 evaluateAsync 함수 테스트
  - File: `tests/unit/application/intent-lab/IntentLabAsyncEval.test.ts`
  - **별도 파일** (mutation loop 혼입 방지)
  - mock LLM port와 함께 동작하는지 검증

- [ ] **Test 3.2**: ConversationalAgentService — classifyAsync 결과 캐싱 검증
  - File: `tests/unit/application/services/ConversationalAgentService.test.ts`
  - 같은 메시지로 chat() 호출 시 LLM classify가 1회만 호출되는지 검증

**GREEN: Implement to Make Tests Pass**
- [ ] **Task 3.3**: evaluateAsync()를 별도 파일로 구현
  - File: `src/application/intent-lab/IntentLabAsyncEval.ts` ← 물리적 분리
  - classifyAsync()를 사용하는 async 버전 evaluate
  - IntentLabRunner/Mutator에서 import 불가하도록 분리

- [ ] **Task 3.4**: ConversationalAgentService DI 연결
  - File: `src/application/services/ConversationalAgentService.ts`
  - 생성자에 `IIntentLLMPort` 파라미터 추가 (optional)
  - `IntentClassifier.create(config, llmPort)` 로 생성
  - File: `src/lib/di/modules/auth.module.ts`
  - ConversationalAgentService 생성 시 IIntentLLMPort resolve & inject

- [ ] **Task 3.5**: ConversationalAgentService에서 classifyAsync() 사용 + 캐싱
  - File: `src/application/services/ConversationalAgentService.ts`
  - chat() 메서드 초반에 `const intentResult = await this.intentClassifier.classifyAsync(message)`
  - line 367 (buildSystemPrompt): 캐싱된 intentResult.intent 사용
  - line 555 (generateSuggestedQuestions): 캐싱된 intentResult 전달
  - **LLM 호출 1회로 제한됨**

- [ ] **Task 3.6**: LLM 호출을 DB 작업과 병렬화
  - File: `src/application/services/ConversationalAgentService.ts`
  - setup phase에서 `Promise.all([classifyAsync(message), dbOperations()])` 패턴
  - classifyAsync 실패해도 DB 작업에 영향 없도록 독립 에러 핸들링

- [ ] **Task 3.7**: eval 스크립트에 async 모드 추가
  - File: `scripts/run-intent-lab.ts`
  - `--llm` 플래그로 실제 LLM 호출 포함 eval 실행
  - 비용 경고 출력 (예: "~$0.01 per run")
  - evaluateAsync는 IntentLabAsyncEval에서 import

**REFACTOR**
- [ ] **Task 3.8**: LLM 호출 비율 로깅 추가 (전체 중 몇 %가 LLM으로 갔는지)

#### Quality Gate
- [ ] `npx vitest run tests/unit/application/intent-lab/` 통과
- [ ] `npx vitest run tests/unit/application/services/ConversationalAgentService` 통과
- [ ] `npx tsc --noEmit` 통과
- [ ] evaluateAsync() + mock LLM으로 실패턴 정확도 95%+ 확인
- [ ] 기존 classify() 동기 호출 경로 — 변경 없음 재확인
- [ ] IntentLabRunner가 evaluateAsync를 import하지 않음 확인

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM 응답이 유효하지 않은 인텐트 반환 | Medium | Low | enum 파싱 실패 시 GENERAL fallback |
| LLM 호출 지연으로 챗봇 응답 느려짐 | Medium | Medium | DB 작업과 병렬화 + confidence threshold (~15%만 호출) |
| OpenAI API 장애 | Low | Medium | try/catch → 기존 classify() 결과 fallback |
| 프롬프트 변경 시 정확도 퇴행 | Medium | High | eval set으로 before/after 측정 필수 |
| 장문 메시지 비용 폭발 | Low | Medium | 입력 500자 truncate |
| 같은 메시지 중복 LLM 호출 | - | - | chat() 내 결과 캐싱으로 해결 |
| evaluateAsync가 mutation loop 혼입 | Low | High | 물리적 파일 분리 (IntentLabAsyncEval.ts) |

---

## Rollback Strategy

### If Phase 1 Fails
- IntentClassifier.ts에서 classifyAsync() + llmPort 필드 제거
- IIntentLLMPort.ts 삭제
- create() 시그니처 원복 (config만)

### If Phase 2 Fails
- IntentLLMAdapter.ts 삭제
- container.ts / auth.module.ts에서 등록 제거
- Phase 1은 그대로 유지 (classify() 영향 없음, llmPort null이면 sync fallback)

### If Phase 3 Fails
- ConversationalAgentService에서 classify()로 롤백 (생성자에서 llmPort 제거)
- IntentLabAsyncEval.ts 삭제
- auth.module.ts에서 IIntentLLMPort inject 제거
- Phase 1-2는 dead code로 남지만 런타임 영향 없음

---

## Cost Simulation

| 월간 메시지 | LLM 호출 (15%) | 비용/월 |
|------------|----------------|---------|
| 1K | 150 | ~$0.005 |
| 10K | 1,500 | ~$0.05 |
| 100K | 15,000 | ~$0.50 |

gpt-4o-mini 기준, input ~200 tokens + output ~5 tokens = ~$0.00003/call

---

## Progress Tracking

- **Phase 1**: ⏳ 0%
- **Phase 2**: ⏳ 0%
- **Phase 3**: ⏳ 0%

**Overall Progress**: 0%

**Validation Commands**:
```bash
npx tsc --noEmit 2>&1 | grep -i intent
npx vitest run tests/unit/domain/services/IntentClassifier
npx vitest run tests/unit/application/intent-lab/
npx vitest run  # 전체
```

---

## Notes & Learnings

### Key Numbers (baseline before LLM)
- 합성 정확도: 93.0%
- 실패턴 정확도: 86.7%
- GAP: 6.3pp
- 남은 실패: 15개 (멀티인텐트 충돌 + 맥락 의존)

### LLM 프롬프트 설계 고려사항
- 인텐트 11개를 한글 설명과 함께 나열
- 사용자 메시지를 제공하고 "가장 적합한 인텐트 1개만 반환" 지시
- temperature 0 + maxTokens 20 → 결정론적 + 최소 비용
- **입력 500자 truncate** → 장문 비용 방지
- 예상 비용: input ~200 tokens + output ~5 tokens = ~$0.00003/call

### 심층 검증 결과 (2026-03-17)
- FAIL 1건: DI 연결 경로 → create(config?, llmPort?) + 생성자 주입으로 해결
- WARN 5건: 중복 호출 캐싱, 입력 truncate, 병렬화, 파일 분리 → 모두 계획에 반영
- PASS 4건: 아키텍처, 비용, 롤백, 장기 유지보수
