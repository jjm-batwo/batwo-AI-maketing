# Implementation Plan: RAG 2026 알고리즘 정렬 (Meta Trinity 기반 지식 코드 통합)

**Status**: ⏳ Pending
**Created**: 2026-03-09
**Last Updated**: 2026-03-09
**Estimated Completion**: 2026-03-15

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
현재 프로젝트의 마케팅 지식 시드 데이터(7개 문서)는 2026년 메타 알고리즘 보고서를 충실히 반영하고 있으나, **챗봇 시스템 프롬프트, 응답 템플릿, ChatIntent, 질문 분류기, 도메인 분석기** 등 실제 코드 실행 경로에 이 지식이 반영되지 않아 "지식은 있지만 사용하지 못하는" 상태임.

이 계획은 지식 시드와 실행 코드 간의 간극을 메워 챗봇이 2026 Meta Trinity(GEM/Lattice/Andromeda) 관점의 진단과 조언을 실제로 수행하도록 정렬하는 것을 목표로 함.

### Success Criteria
- [ ] 시스템 프롬프트가 Meta Trinity 관점 진단, Entity ID 다양성, 학습단계/피로도 수치 기준을 포함
- [ ] 응답 템플릿(ROAS, Scaling)이 2026 알고리즘 기반으로 업데이트됨
- [ ] ChatIntent에 5개 신규 인텐트(CREATIVE_FATIGUE, LEARNING_PHASE, STRUCTURE_OPTIMIZATION, LEAD_QUALITY, TRACKING_HEALTH) 추가
- [ ] 질문 분류 프롬프트가 14개 카테고리를 지원
- [ ] KnowledgeBaseService에 3개 신규 도메인 분석기 추가
- [ ] 모든 변경사항에 대한 단위 테스트 통과 (≥80% 커버리지)

### User Impact
- 사용자가 "예산 소진이 안 됩니다" 같은 질문을 하면, 학습 단계(50회/주) 미달과 입찰가 불일치를 구체적으로 진단
- "CPM이 급등합니다" 질문에 Entity ID 피로도와 3.5회 임계치를 기반으로 명확한 소재 교체 지침 제공
- 구시대적 "룩어라이크 활용" 조언 대신 "광범위 타겟팅 + 소재 다양성" 기반 권고

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| 시스템 프롬프트에 2026 알고리즘 원칙을 직접 임베딩 | RAG 검색 전에도 기본 진단 프레임이 적용되어야 함 | 프롬프트 토큰 증가 (~500 tokens) |
| ChatIntent enum 확장 (5개 추가) | 인텐트별 특화된 컨텍스트 주입과 응답 로직 분기 가능 | 인텐트 분기 로직 복잡도 증가 |
| KnowledgeBaseService에 분석기 추가 (3개) | 기존 아키텍처 패턴 준수, 독립 테스트 가능 | 분석기 간 정합성 테스트 필요 |
| 응답 템플릿을 하드코딩 대신 시드 기반으로 전환하지 않음 | 기존 패턴 유지, 이번 스코프는 내용 정렬에 집중 | 향후 동적 템플릿이 필요하면 별도 계획 필요 |

---

## 📦 Dependencies

### Required Before Starting
- [ ] `PLAN_ai-chatbot-enhancement.md` Phase 1 완료 (Legacy → Agent 마이그레이션) — 현재 In Progress
- [ ] 마케팅 지식 시드 7개 파일이 DB에 ingested 상태 (이미 완료)

### External Dependencies
- 없음 (모두 기존 내부 코드 수정)

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥80% | 프롬프트 빌더, 인텐트 enum, 분석기, 분류 프롬프트 |
| **Integration Tests** | Critical paths | ChatIntent → 프롬프트 → 응답 플로우 |

### Test File Organization
```
tests/
├── unit/
│   ├── infrastructure/external/openai/prompts/
│   │   └── chatAssistant.test.ts      (Phase 1~2)
│   ├── domain/value-objects/
│   │   └── ChatIntent.test.ts          (Phase 3)
│   └── infrastructure/knowledge/analyzers/
│       ├── CreativeDiversityAnalyzer.test.ts     (Phase 5)
│       ├── CampaignStructureAnalyzer.test.ts     (Phase 5)
│       └── TrackingHealthAnalyzer.test.ts        (Phase 5)
├── integration/
│   └── knowledge/
│       └── KnowledgeBaseService.integration.test.ts (Phase 6)
```

---

## 🚀 Implementation Phases

### Phase 1: 시스템 프롬프트 2026 알고리즘 정렬
**Goal**: `CHAT_ASSISTANT_SYSTEM_PROMPT`에 Meta Trinity 진단 프레임워크와 2026 수치 기준을 통합
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 1.1**: 시스템 프롬프트에 핵심 2026 키워드가 포함되는지 검증하는 단위 테스트
  - File(s): `tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts`
  - Expected: Tests FAIL — 현재 프롬프트에 'Meta Trinity', 'Entity ID', 'Learning Phase', '50회', '3.5회' 등의 키워드가 없으므로 실패
  - Details:
    - `CHAT_ASSISTANT_SYSTEM_PROMPT`에 'GEM', 'Lattice', 'Andromeda' 개념 포함 여부
    - '학습 단계', '50회 전환', '광고 피로도', '3.5회' 수치 기준 포함 여부
    - 'Entity ID', '시각적 다양성', '광범위 타겟팅' 원칙 포함 여부
    - 'Advantage+', '10~20%', '점진적 스케일업' 지침 포함 여부

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.2**: `CHAT_ASSISTANT_SYSTEM_PROMPT` 업데이트
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts` (L98~131)
  - Goal: 시스템 프롬프트에 2026년 Meta 알고리즘 진단 프레임워크와 구체적 수치 기준 추가
  - Details:
    - **전문 분야**에 'Meta 알고리즘 삼위일체(GEM/Lattice/Andromeda)' 추가
    - **핵심 역할**에 'Meta Trinity 관점 병목 단계 분리 진단' 추가
    - **진단 원칙** 섹션 신규 추가:
      1. 성과 진단 시 Andromeda(노출) → GEM(전환) → Lattice(지면) 순서로 단계별 분리 분석
      2. 크리에이티브 진단 시 Entity ID 다양성을 최우선 평가 기준으로 사용
      3. 학습 단계: 주 50회 전환 미달 시 구조 통합 권고
      4. 광고 피로도: 빈도 3.5회 이상 시 소재 교체 긴급 권고
      5. 스케일링: 10~20% 점진적 증액, Stabilization Window 필수
      6. 타겟팅: 광범위 타겟팅(Broad) > 수동 타겟팅 원칙
      7. UTIS 점수가 Lattice 랭킹에 직접 영향 → 품질 기반 최적화

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 1.3**: 프롬프트 가독성 및 구조 정리
  - Files: `src/infrastructure/external/openai/prompts/chatAssistant.ts`
  - Goal: 프롬프트 섹션을 논리적 블록으로 분리, 토큰 효율성 검토
  - Checklist:
    - [ ] 프롬프트 섹션이 명확한 마크다운 헤더로 구분
    - [ ] 중복 지침 제거
    - [ ] 총 토큰 수 2500 이내 유지 확인

#### Quality Gate ✋

**⚠️ STOP: Phase 2로 진행하기 전에 모든 체크 통과 필수**

**TDD Compliance**:
- [ ] Tests written FIRST and initially failed
- [ ] Production code written to make tests pass
- [ ] Code improved while tests still pass

**Build & Tests**:
- [ ] `npx vitest run tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts` 통과
- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과

**Validation Commands**:
```bash
npx vitest run tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts
npm run type-check
npm run lint
npm run build
```

**Manual Test Checklist**:
- [ ] 프롬프트 내용이 한국어로 자연스럽게 읽히는지 확인
- [ ] 프롬프트 길이가 과도하지 않은지 확인 (2500 tokens 이내)

---

### Phase 2: 응답 템플릿 2026 기반 업데이트
**Goal**: `ROAS_IMPROVEMENT_TEMPLATE`과 `SCALING_TEMPLATE`을 2026 알고리즘 원칙에 맞게 수정
**Estimated Time**: 1.5시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 2.1**: ROAS 템플릿에 2026 원칙이 반영되었는지 검증
  - File(s): `tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts`
  - Expected: Tests FAIL — 현재 '룩어라이크', 'A/B 테스트' 등 구시대적 내용 포함
  - Details:
    - '룩어라이크 오디언스' 키워드 부재 확인 (제거해야 함)
    - '구조 단순화', '예산 통합', 'Entity ID', '소재 다양성' 키워드 존재 확인
    - '광범위 타겟팅(Broad Targeting)' 포함 여부

- [ ] **Test 2.2**: Scaling 템플릿 2026 정렬 검증
  - File(s): `tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts`
  - Expected: Tests FAIL — 현재 '20-30%씩' (정확한 기준: 10~20%), '포화도 50% 미만' (무의미) 포함
  - Details:
    - 스케일링 비율 '10~20%' 포함 확인
    - 'Stabilization Window' 안정화 기간 언급 확인
    - '타겟 오디언스 포화도' 키워드 부재 확인

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 2.3**: `ROAS_IMPROVEMENT_TEMPLATE` 업데이트
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts` (L243~266)
  - Goal: 2026 크리에이티브 중심 최적화로 전면 개편
  - Details:
    - **크리에이티브 최적화** → Entity ID 다양성 확보 (시각적으로 상이한 10~15개 소재)
    - **타겟팅 조정** → 광범위 타겟팅 전환 + 수동 관심사 제거
    - **캠페인 구조** → 예산 통합 ($50+ 일일), 학습 단계 통과 조건 명시
    - **입찰 전략** → 가치 기반 입찰, ROAS 목표 설정

- [ ] **Task 2.4**: `SCALING_TEMPLATE` 업데이트
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts` (L271~293)
  - Goal: 2026 스케일링 원칙 기반으로 개편
  - Details:
    - 확장 기준: Entity ID 다양성 확보 상태, 학습 단계 통과 여부
    - 확장 방법: 10~20% 점진적 증액, Stabilization Window
    - 주의사항: 소재 다양성 우선, 구조 단순화 유지

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 2.5**: suggestedQuestions를 2026 맥락에 맞게 업데이트
  - Files: `src/infrastructure/external/openai/prompts/chatAssistant.ts`
  - Goal: 후속 질문 목록이 2026 핵심 개념을 반영하도록 개선

#### Quality Gate ✋

**⚠️ STOP: Phase 3으로 진행하기 전에 모든 체크 통과 필수**

**TDD Compliance**:
- [ ] Tests written FIRST and initially failed
- [ ] Production code written to make tests pass
- [ ] Refactored code while tests still pass

**Validation Commands**:
```bash
npx vitest run tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts
npm run type-check
npm run lint
npm run build
```

---

### Phase 3: ChatIntent 확장 및 질문 분류기 업데이트
**Goal**: 5개 신규 인텐트 추가, 질문 분류 프롬프트 14개 카테고리 확장, QUERY_PATTERNS 업데이트
**Estimated Time**: 3시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 3.1**: ChatIntent enum에 신규 5개 인텐트 존재 검증
  - File(s): `tests/unit/domain/value-objects/ChatIntent.test.ts`
  - Expected: Tests FAIL — 현재 enum에 CREATIVE_FATIGUE 등 없으므로 실패
  - Details:
    - `CREATIVE_FATIGUE`, `LEARNING_PHASE`, `STRUCTURE_OPTIMIZATION`, `LEAD_QUALITY`, `TRACKING_HEALTH` 존재 확인
    - 기존 7개 인텐트 유지 확인 (하위 호환성)

- [ ] **Test 3.2**: 질문 분류 프롬프트에 14개 카테고리가 포함되었는지 검증
  - File(s): `tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts`
  - Expected: Tests FAIL — 현재 9개 카테고리만 존재
  - Details:
    - `learning_phase`, `creative_fatigue`, `campaign_structure`, `lead_quality`, `tracking_health` 카테고리 존재 확인

- [ ] **Test 3.3**: QUERY_PATTERNS에 신규 패턴이 추가되었는지 검증
  - File(s): `tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts`
  - Expected: Tests FAIL — 현재 creativeFatigue, learningPhase 등 패턴 없음

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 3.4**: ChatIntent enum 확장
  - File(s): `src/domain/value-objects/ChatIntent.ts`
  - Goal: 5개 신규 인텐트 추가
  - Details: `CREATIVE_FATIGUE`, `LEARNING_PHASE`, `STRUCTURE_OPTIMIZATION`, `LEAD_QUALITY`, `TRACKING_HEALTH`

- [ ] **Task 3.5**: `buildQueryClassificationPrompt` 14개 카테고리로 확장
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts` (L193~215)
  - Goal: 5개 신규 카테고리 추가
  - Details:
    - `10. learning_phase - 학습 단계/예산 소진 정체`
    - `11. creative_fatigue - 광고 피로도/소재 교체`
    - `12. campaign_structure - 캠페인 구조/예산 통합`
    - `13. lead_quality - 리드 품질/허수 고객`
    - `14. tracking_health - 픽셀/CAPI/EMQ 건전성`

- [ ] **Task 3.6**: QUERY_PATTERNS에 5개 신규 패턴 추가
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts` (L16~88)
  - Goal: 신규 인텐트에 대한 키워드/서브패턴 정의
  - Details:
    - `creativeFatigue`: keywords=['피로도', '피로', '반복', '노출', 'fatigue', '빈도'], subPatterns={cpmSurge, frequencyHigh}
    - `learningPhase`: keywords=['학습', '소진', '예산이 안', '노출이 안', '학습단계'], subPatterns={budgetStalled, noDelivery}
    - `campaignStructure`: keywords=['구조', '통합', '파편', '세트 개수', '캠페인 수'], subPatterns={tooMany, consolidate}
    - `leadQuality`: keywords=['리드', '허수', '품질', '연락', '부재'], subPatterns={lowQuality, wrongData}
    - `trackingHealth`: keywords=['픽셀', 'CAPI', 'EMQ', '추적', '전환 추적', '이벤트'], subPatterns={emqLow, pixelIssue}

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 3.7**: ChatIntent 사용처 일괄 확인 및 누락된 분기 처리 추가
  - Files: ChatIntent를 import하는 모든 파일
  - Goal: 신규 인텐트에 대한 switch-case / 핸들러 분기를 최소한 fallback으로 처리
  - Checklist:
    - [ ] ChatIntent 사용처에서 exhaustive switch 패턴 유지
    - [ ] 신규 인텐트에 대한 기본 동작이 GENERAL fallback으로 처리됨

#### Quality Gate ✋

**⚠️ STOP: Phase 4로 진행하기 전에 모든 체크 통과 필수**

**TDD Compliance**:
- [ ] Tests written FIRST and initially failed
- [ ] Production code written to make tests pass
- [ ] Refactored code while tests still pass

**Validation Commands**:
```bash
npx vitest run tests/unit/domain/value-objects/ChatIntent.test.ts
npx vitest run tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts
npm run type-check
npm run lint
npm run build
```

**Manual Test Checklist**:
- [ ] ChatIntent 변경이 기존 코드에 type error를 유발하지 않는지 `npm run type-check`로 확인
- [ ] 기존 인텐트 기반 기능이 정상 동작하는지 확인

---

### Phase 4: 신규 진단 시나리오 응답 템플릿 추가
**Goal**: 5개 신규 인텐트에 대한 전용 응답 템플릿 생성
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 4.1**: 5개 신규 응답 템플릿의 구조 및 내용 검증
  - File(s): `tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts`
  - Expected: Tests FAIL — 아직 템플릿이 존재하지 않으므로 실패
  - Details:
    - `CREATIVE_FATIGUE_TEMPLATE` 존재 및 'Entity ID', '3.5회', '소재 교체' 키워드 포함
    - `LEARNING_PHASE_TEMPLATE` 존재 및 '50회', '예산 통합', '$50' 키워드 포함
    - `STRUCTURE_OPTIMIZATION_TEMPLATE` 존재 및 '구조 단순화', '광범위 타겟팅' 키워드 포함
    - `LEAD_QUALITY_TEMPLATE` 존재 및 '마찰(Friction)', '주관식 질문', '인증' 키워드 포함
    - `TRACKING_HEALTH_TEMPLATE` 존재 및 'EMQ', 'CAPI', '6.0' 키워드 포함
    - 모든 템플릿이 `ChatResponseTemplate` 인터페이스를 준수

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 4.2**: `CREATIVE_FATIGUE_TEMPLATE` 생성
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts`
  - Details: 보고서 §3 + 시드 `02-creative-as-targeting-entity-id.md` 기반 — Entity ID 다양성 진단, 소재 교체 주기, DCO 활용 가이드

- [ ] **Task 4.3**: `LEARNING_PHASE_TEMPLATE` 생성
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts`
  - Details: 보고서 §4 + 시드 `03-advantage-plus-campaign-structure.md` 기반 — 주 50회 전환 기준, 예산집중, 입찰전략 변경 가이드

- [ ] **Task 4.4**: `STRUCTURE_OPTIMIZATION_TEMPLATE` 생성
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts`
  - Details: ASC 운영 3대 원칙, CPA 34% 절감 벤치마크 데이터, 캠페인 비교표

- [ ] **Task 4.5**: `LEAD_QUALITY_TEMPLATE` 생성
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts`
  - Details: 보고서 §9 시나리오 3, 시드 `07-rag-chatbot-diagnostic-scenarios.md` 기반 — 폼 마찰(Friction) 전략

- [ ] **Task 4.6**: `TRACKING_HEALTH_TEMPLATE` 생성
  - File(s): `src/infrastructure/external/openai/prompts/chatAssistant.ts`
  - Details: 보고서 §5 + 시드 `04-data-infrastructure-capi-tracking.md` 기반 — EMQ 6.0 임계치, 하이브리드 트래킹 체크리스트

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 4.7**: 응답 템플릿 파일 분리 검토
  - Files: `src/infrastructure/external/openai/prompts/chatAssistant.ts`
  - Goal: 파일이 과도하게 커진 경우 템플릿만 별도 파일로 분리
  - Checklist:
    - [ ] 파일 라인 수가 500줄 이상이면 `chatResponseTemplates.ts`로 분리 고려
    - [ ] import 경로 일관성 유지

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/unit/infrastructure/external/openai/prompts/chatAssistant.test.ts
npm run type-check
npm run lint
npm run build
```

---

### Phase 5: 도메인 분석기 3개 추가 (KnowledgeBaseService 확장)
**Goal**: CreativeDiversityAnalyzer, CampaignStructureAnalyzer, TrackingHealthAnalyzer를 KnowledgeBaseService에 통합
**Estimated Time**: 4시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 5.1**: `CreativeDiversityAnalyzer` 단위 테스트
  - File(s): `tests/unit/infrastructure/knowledge/analyzers/CreativeDiversityAnalyzer.test.ts`
  - Expected: Tests FAIL — 분석기 클래스가 존재하지 않으므로 실패
  - Details:
    - `DomainAnalyzer` 인터페이스 구현 여부
    - 소재 수 < 5일 때 낮은 점수 반환
    - 소재 수 ≥ 10이고 유형이 다양할 때 높은 점수 반환
    - '시각적 다양성 부족' 관련 recommendation 생성
    - Entity ID 개념 기반 권장사항 포함

- [ ] **Test 5.2**: `CampaignStructureAnalyzer` 단위 테스트
  - File(s): `tests/unit/infrastructure/knowledge/analyzers/CampaignStructureAnalyzer.test.ts`
  - Expected: Tests FAIL — 분석기 클래스가 존재하지 않으므로 실패
  - Details:
    - 광고세트 수 > 5이고 일일예산 < $50일 때 '구조 파편화' 진단
    - 학습 단계 통과 조건 (주 50회 전환) 미달 시 경고
    - ASC 사용 여부에 따른 점수 차등

- [ ] **Test 5.3**: `TrackingHealthAnalyzer` 단위 테스트
  - File(s): `tests/unit/infrastructure/knowledge/analyzers/TrackingHealthAnalyzer.test.ts`
  - Expected: Tests FAIL — 분석기 클래스가 존재하지 않으므로 실패
  - Details:
    - CAPI 미설정 시 critical 경고 생성
    - EMQ < 6.0일 때 낮은 점수 및 데이터 보강 권고
    - 픽셀만 단독 사용 시 '하이브리드 전환' 권고

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 5.4**: `CreativeDiversityAnalyzer` 구현
  - File(s): `src/infrastructure/knowledge/analyzers/CreativeDiversityAnalyzer.ts`
  - Goal: `DomainAnalyzer` 인터페이스 구현, domain = 'creative_diversity'
  - Details: Entity ID 다양성 점수화, 소재 유형/포맷 기반 factor 평가, citation은 시드 02번 활용

- [ ] **Task 5.5**: `CampaignStructureAnalyzer` 구현
  - File(s): `src/infrastructure/knowledge/analyzers/CampaignStructureAnalyzer.ts`
  - Goal: `DomainAnalyzer` 인터페이스 구현, domain = 'campaign_structure'
  - Details: 예산 파편화 감지, 학습 단계 통과 가능성 계산, ASC 활용도 평가

- [ ] **Task 5.6**: `TrackingHealthAnalyzer` 구현
  - File(s): `src/infrastructure/knowledge/analyzers/TrackingHealthAnalyzer.ts`
  - Goal: `DomainAnalyzer` 인터페이스 구현, domain = 'tracking_health'
  - Details: EMQ 점수 평가, CAPI 상태 체크, 하이브리드 트래킹 건전성 점수화

- [ ] **Task 5.7**: `KnowledgeDomain` enum 확장
  - File(s): `src/domain/value-objects/MarketingScience.ts`
  - Goal: 'creative_diversity', 'campaign_structure', 'tracking_health' 도메인 추가

- [ ] **Task 5.8**: `KnowledgeBaseService` 생성자에 3개 분석기 등록
  - File(s): `src/infrastructure/knowledge/KnowledgeBaseService.ts` (L39~48)
  - Goal: 분석기 배열에 3개 추가, `getDomainNameKorean` 매핑 추가

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 5.9**: 분석기 공통 로직 추출
  - Files: 모든 분석기 파일
  - Goal: 기존 6개 + 신규 3개 분석기 간 중복 로직이 있다면 베이스 클래스나 유틸로 추출
  - Checklist:
    - [ ] 점수 계산 로직의 일관성 확인
    - [ ] Citation 생성 패턴 통일
    - [ ] Recommendation priority 기준 통일

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/unit/infrastructure/knowledge/analyzers/CreativeDiversityAnalyzer.test.ts
npx vitest run tests/unit/infrastructure/knowledge/analyzers/CampaignStructureAnalyzer.test.ts
npx vitest run tests/unit/infrastructure/knowledge/analyzers/TrackingHealthAnalyzer.test.ts
npm run type-check
npm run lint
npm run build
```

**Manual Test Checklist**:
- [ ] 기존 6개 분석기의 테스트가 모두 통과 (회귀 없음)
- [ ] `KnowledgeBaseService.analyzeAll()` 호출 시 9개 분석기 모두 실행 확인

---

### Phase 6: 통합 테스트 및 최종 검증
**Goal**: 전체 변경사항의 통합 동작 확인 및 회귀 테스트
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 6.1**: KnowledgeBaseService 통합 테스트 — 9개 분석기 오케스트레이션
  - File(s): `tests/integration/knowledge/KnowledgeBaseService.integration.test.ts`
  - Expected: 기존 테스트가 있다면 6개 분석기 기준이므로, 9개로 기대치 업데이트 시 실패
  - Details:
    - `analyzeAll()` 결과에 9개 도메인 점수 포함 확인
    - `getDomainNameKorean()` 결과에 3개 신규 한국어명 포함 확인
    - 부분 실패 시 graceful degradation 동작 확인 (MIN_REQUIRED_DOMAINS)

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 6.2**: 기존 통합 테스트 업데이트
  - File(s): `tests/integration/knowledge/KnowledgeBaseService.integration.test.ts`
  - Goal: 9개 분석기 기준으로 기대치 업데이트

- [ ] **Task 6.3**: 전체 테스트 스위트 실행 및 회귀 확인
  - Goal: 전체 단위/통합 테스트 통과 확인

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 6.4**: 최종 코드 리뷰 및 문서화
  - Files: 모든 변경 파일
  - Checklist:
    - [ ] 모든 신규 export에 JSDoc 주석
    - [ ] 마케팅 지식 시드 문서와 코드 간 참조 주석 추가
    - [ ] `MIN_REQUIRED_DOMAINS` 값 조정 필요 여부 검토 (6→9개 분석기)

#### Quality Gate ✋

**Validation Commands**:
```bash
# 전체 단위 테스트
npx vitest run tests/unit/

# 통합 테스트
npx vitest run --config vitest.config.integration.ts tests/integration/knowledge/

# 코드 품질
npm run type-check
npm run lint
npm run build
```

**Manual Test Checklist**:
- [ ] 전체 빌드 성공 (`npm run build`)
- [ ] 기존 챗봇 API 호출 시 응답 정상 (기존 기능 회귀 없음)

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| 시스템 프롬프트 토큰 증가로 API 비용 상승 | Medium | Low | 프롬프트 최적화로 2500 tokens 이내 유지, 불필요한 중복 제거 |
| ChatIntent 확장이 기존 인텐트 분기 코드에 영향 | Low | Medium | exhaustive switch 패턴 확인, 신규 인텐트는 GENERAL fallback 처리 |
| KnowledgeDomain enum 변경으로 MarketingScience 관련 코드 영향 | Medium | Medium | 기존 enum에 추가만 하고 수정하지 않음, `buildCompositeScore` 하위 호환성 확인 |
| PLAN_ai-chatbot-enhancement와의 충돌 | Low | High | Phase 1 (Legacy migration) 완료 후에만 시작, 파일 수준 충돌 최소화 |
| 분석기 추가로 전체 분석 시간 증가 | Low | Low | 분석기는 순차 실행이므로 성능 영향 미미, 필요 시 병렬화 검토 |

---

## 🔄 Rollback Strategy

### If Phase 1~2 Fails (프롬프트/템플릿)
- `chatAssistant.ts`의 변경사항만 git revert
- 프롬프트/템플릿은 독립 상수이므로 다른 코드에 영향 없음

### If Phase 3 Fails (ChatIntent 확장)
- `ChatIntent.ts` revert
- `chatAssistant.ts`의 QUERY_PATTERNS와 분류 프롬프트 revert
- 신규 인텐트를 참조하는 코드가 있다면 함께 revert

### If Phase 5 Fails (분석기 추가)
- 3개 분석기 파일 삭제
- `KnowledgeBaseService.ts`의 생성자와 `getDomainNameKorean` revert
- `MarketingScience.ts`의 enum 추가분 revert

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ⏳ 0%
- **Phase 2**: ⏳ 0%
- **Phase 3**: ⏳ 0%
- **Phase 4**: ⏳ 0%
- **Phase 5**: ⏳ 0%
- **Phase 6**: ⏳ 0%

**Overall Progress**: 0% complete

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1: 시스템 프롬프트 정렬 | 2 hours | - | - |
| Phase 2: 응답 템플릿 업데이트 | 1.5 hours | - | - |
| Phase 3: ChatIntent 확장 | 3 hours | - | - |
| Phase 4: 신규 응답 템플릿 | 2 hours | - | - |
| Phase 5: 도메인 분석기 추가 | 4 hours | - | - |
| Phase 6: 통합 테스트 | 2 hours | - | - |
| **Total** | **14.5 hours** | - | - |

---

## 📝 Notes & Learnings

### Implementation Notes
- (Phase 진행 시 기록)

### Blockers Encountered
- (발생 시 기록)

---

## 📚 References

### Documentation
- [Gap Analysis](file:///Users/woals/.gemini/antigravity/brain/e37f86ed-ff26-4d99-a5d9-0d2f93fcf1dd/rag_gap_analysis.md) — 연구 보고서 vs 프로젝트 비교 분석
- [원본 연구 보고서](file:///Users/woals/Downloads/%EB%A9%94%ED%83%80%20%EA%B4%91%EA%B3%A0%20RAG%20%EC%8B%9C%EC%8A%A4%ED%85%9C%20%EC%9E%90%EB%A3%8C%20%EC%88%98%EC%A7%91.md)

### Related Plans
- [PLAN_ai-chatbot-enhancement](PLAN_ai-chatbot-enhancement.md) — AI 챗봇 인프라 강화 (선행 의존성)
- [PLAN_hybrid-rag-integration](PLAN_hybrid-rag-integration.md) — Agentic + RAG 하이브리드 아키텍처 (후행 연계)

### Marketing Knowledge Seeds (참조 소스)
- `prisma/seeds/marketing-knowledge/01-meta-ai-trinity-architecture.md`
- `prisma/seeds/marketing-knowledge/02-creative-as-targeting-entity-id.md`
- `prisma/seeds/marketing-knowledge/03-advantage-plus-campaign-structure.md`
- `prisma/seeds/marketing-knowledge/04-data-infrastructure-capi-tracking.md`
- `prisma/seeds/marketing-knowledge/05-marketing-api-version-updates.md`
- `prisma/seeds/marketing-knowledge/06-case-studies-global-korea.md`
- `prisma/seeds/marketing-knowledge/07-rag-chatbot-diagnostic-scenarios.md`

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All phases completed with quality gates passed
- [ ] Full integration testing performed
- [ ] 전체 빌드 성공 (`npm run build`)
- [ ] 전체 테스트 통과 (`npx vitest run`)
- [ ] 프롬프트 토큰 예산 적정 (2500 tokens 이내)
- [ ] 기존 챗봇 기능 회귀 없음
- [ ] Plan document archived for future reference

---

**Plan Status**: ⏳ Pending
**Next Action**: Phase 1 시작 (시스템 프롬프트 2026 알고리즘 정렬)
**Blocked By**: `PLAN_ai-chatbot-enhancement` Phase 1 완료
