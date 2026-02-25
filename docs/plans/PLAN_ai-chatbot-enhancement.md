# Implementation Plan: AI Chatbot Enhancement

**Status**: 🔄 In Progress
**Started**: 2026-02-24
**Last Updated**: 2026-02-24
**Estimated Completion**: 2026-03-03

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

Migrate the legacy chatbot flow into one Conversational Agent architecture and ship a reliability-first enhancement set: intent classification, prompt single-source management, fallback/error resilience, dynamic guide questions, feedback loop, and accessibility-complete UX with E2E verification.

### Success Criteria

- [ ] Legacy `/api/ai/chat` removed; all chat traffic runs through `/api/agent/chat`
- [ ] Error-zero target achieved in product behavior (no silent/no-response outcomes)
- [ ] Prompt source centralized in a single template service
- [ ] Feedback UI/API/analytics end-to-end operational
- [ ] Accessibility verification passes (WCAG 2.1 AA, axe-core automation)

### User Impact

Users get more accurate category-specific guidance, safer/recoverable chat sessions, better accessibility, and measurable quality improvement through feedback-driven iteration.

---

## 🏗️ Architecture Decisions

| Decision                                                                        | Rationale                                                             | Trade-offs                                              |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- |
| Consolidate all chat orchestration into `ConversationalAgentService`            | Removes split-brain behavior and eliminates legacy direct API calls   | Requires broad migration and careful regression testing |
| 2-stage intent flow (keyword first, LLM fallback)                               | Improves speed/cost for common queries while preserving coverage      | More moving pieces than a single classifier             |
| Resilience chain (`withRetry` -> `CircuitBreaker` -> `FallbackResponseService`) | Ensures graceful output under failures and protects upstream services | Slightly increased complexity in error pipeline         |
| Prompt/few-shot/guide-question registries as services                           | Enforces single source and controlled evolution                       | Requires DI and additional config/test surfaces         |

---

## 📦 Dependencies

### Required Before Starting

- [ ] Existing chatbot baseline functional on `/api/agent/chat`
- [ ] Prisma repositories available (`PrismaConversationRepository`, `PrismaAIFeedbackRepository`)
- [ ] Existing chat UI components/hooks available (`ChatPanel`, `ChatInput`, `useAgentChat`)

### External Dependencies

- `@axe-core/playwright` (new dev dependency for Phase 4 accessibility audits)
- Existing stack only: `vitest`, `@playwright/test`, `zod`, `@tanstack/react-query`

---

## 🧪 Test Strategy

### Testing Approach

**TDD Principle**: Write tests FIRST, then implement to make them pass.

### Test Pyramid for This Feature

| Test Type             | Coverage Target                                                       | Purpose                                |
| --------------------- | --------------------------------------------------------------------- | -------------------------------------- |
| **Unit Tests**        | Domain ≥95%, Application ≥90%, Infrastructure ≥85%, Presentation ≥80% | Core logic, services, hooks/components |
| **Integration Tests** | Critical paths                                                        | Service/route/repository interactions  |
| **E2E Tests**         | Key user flows + failure modes                                        | Full chatbot behavior and recovery     |

### Test File Organization

```
tests/
├── unit/
│   ├── domain/services/
│   ├── application/services/
│   ├── application/use-cases/
│   ├── infrastructure/errors/
│   └── presentation/{components,hooks}/
├── integration/
│   └── repositories/
└── e2e/
    ├── chatbot-flow.spec.ts
    ├── chatbot-error.spec.ts
    └── chatbot-accessibility.spec.ts
```

### Coverage Requirements by Phase

- **Phase 1 (Wave 1 Foundation)**: Infrastructure + Presentation + migration baseline
- **Phase 2 (Wave 2 Core)**: Domain/Application heavy logic (intent + resilience + summarization)
- **Phase 3 (Wave 3 Enhancement)**: Application/Presentation + analytics vertical slice
- **Phase 4 (Wave 4 Verification)**: E2E + a11y automation and failure mode coverage
- **Phase 5 (Final Review)**: Whole-plan compliance and release-readiness evidence

---

## 🚀 Implementation Phases

### Phase 1: Wave 1 Foundation (Tasks 1-5)

**Goal**: Complete legacy-to-agent migration and baseline reliability/input correctness foundations.
**Estimated Time**: 4 hours (parallel wave execution)
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 1.1**: Legacy migration regression tests for agent endpoint parity and legacy route removal
  - File(s): `tests/integration/chat/agent-migration.test.ts`, `tests/unit/application/services/ConversationalAgentService.migration.test.ts`
  - Expected: Fails before migration because route/service paths still split
- [ ] **Test 1.2**: Prompt single-source and resilience primitive tests
  - File(s): `tests/unit/application/services/PromptTemplateService.test.ts`, `tests/unit/infrastructure/errors/withRetry.test.ts`, `tests/unit/infrastructure/errors/CircuitBreaker.test.ts`
  - Expected: Fails because services/utilities do not exist yet
- [ ] **Test 1.3**: UI hook/component correctness tests for input validation + concurrency/reconnect
  - File(s): `tests/unit/presentation/components/chat/ChatInput.test.tsx`, `tests/unit/presentation/hooks/useAgentChat.test.ts`
  - Expected: Fails due to missing validations/guards/reconnect behavior

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 1.4 (Task 1)**: Migrate legacy `ChatService` functionality into `ConversationalAgentService`
  - File(s): `src/application/services/ConversationalAgentService.ts`, `src/app/api/agent/chat/route.ts`, delete `src/application/services/ChatService.ts`, delete `src/app/api/ai/chat/route.ts`, delete `src/infrastructure/external/openai/prompts/chatAssistant.ts`
- [ ] **Task 1.5 (Task 2)**: Add prompt single-source service and DI integration
  - File(s): `src/application/services/PromptTemplateService.ts`, `src/application/ports/IPromptTemplateService.ts`, `src/lib/di/types.ts`, `src/lib/di/container.ts`
- [ ] **Task 1.6 (Task 3)**: Add reusable resilience utilities and config/port wiring
  - File(s): `src/infrastructure/external/errors/withRetry.ts`, `src/infrastructure/external/errors/CircuitBreaker.ts`, `src/application/ports/IResilienceService.ts`, `src/lib/di/types.ts`, `src/lib/di/container.ts`
- [ ] **Task 1.7 (Task 4)**: Fix ChatInput validation + accessibility
  - File(s): `src/presentation/components/chat/ChatInput.tsx`
- [ ] **Task 1.8 (Task 5)**: Add `useAgentChat` concurrency guard and stream reconnection/recovery
  - File(s): `src/presentation/hooks/useAgentChat.ts`

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 1.9**: Remove orphaned legacy imports/exports, normalize prompt access, and simplify duplicated stream/error code paths
  - File(s): `src/application/services/ConversationalAgentService.ts`, `src/app/api/agent/chat/route.ts`, `src/lib/di/*`, affected barrel exports

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 2 until ALL checks pass**

**TDD Compliance** (CRITICAL):

- [ ] Red tests created and observed failing first
- [ ] Minimal implementation made tests pass
- [ ] Refactor kept tests green
- [ ] Coverage targets met for touched layers (Infrastructure ≥85%, Presentation ≥80%, Application ≥90 where touched)

**Validation Commands**:

```bash
npm run test:unit
npm run test:integration
npm run type-check
npm run lint
npm run format:check
npm run build
```

---

### Phase 2: Wave 2 Core (Tasks 6-10)

**Goal**: Implement category-intent intelligence and full graceful-error path in agent runtime.
**Estimated Time**: 4 hours (parallel where dependencies allow)
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 2.1**: Intent classification two-stage behavior tests (keyword + LLM fallback)
  - File(s): `tests/unit/domain/services/IntentClassifier.test.ts`
  - Expected: Fails until classifier/value objects/services are implemented
- [ ] **Test 2.2**: Guide question and fallback service tests
  - File(s): `tests/unit/application/services/GuideQuestionService.test.ts`, `tests/unit/application/services/FallbackResponseService.test.ts`
  - Expected: Fails due to missing services/config
- [ ] **Test 2.3**: Conversational agent resilience + summarization integration tests
  - File(s): `tests/unit/application/services/ConversationalAgentService.resilience.test.ts`, `tests/unit/application/services/ConversationSummarizerService.test.ts`
  - Expected: Fails due to missing resilience wiring/summarization strategy

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 2.4 (Task 6)**: Implement domain IntentClassifier + value objects + DI/port
  - File(s): `src/domain/services/IntentClassifier.ts`, `src/domain/value-objects/ChatIntent.ts`, `src/domain/value-objects/IntentClassificationResult.ts`, `src/application/ports/IIntentClassifier.ts`, `src/lib/di/types.ts`, `src/lib/di/container.ts`
- [ ] **Task 2.5 (Task 7)**: Expand category-based guide question generation
  - File(s): `src/application/services/GuideQuestionService.ts`, `src/application/ports/IGuideQuestionService.ts`, `src/application/config/guideQuestions.json`, `src/application/services/ConversationalAgentService.ts`
- [ ] **Task 2.6 (Task 8)**: Implement fallback response service for error classes
  - File(s): `src/application/services/FallbackResponseService.ts`, `src/application/ports/IFallbackResponseService.ts`, `src/lib/di/types.ts`, `src/lib/di/container.ts`
- [ ] **Task 2.7 (Task 9)**: Integrate retry/circuit-breaker/fallback into agent stream path
  - File(s): `src/application/services/ConversationalAgentService.ts`
- [ ] **Task 2.8 (Task 10)**: Add conversation summarization for token-budget control
  - File(s): `src/application/services/ConversationSummarizerService.ts`, `src/application/ports/IConversationSummarizer.ts`, `src/application/services/ConversationalAgentService.ts`, `src/lib/di/types.ts`, `src/lib/di/container.ts`

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 2.9**: Externalize keyword/question templates, tighten type contracts, and isolate classification/error-mapping helpers
  - File(s): `src/domain/services/IntentClassifier.ts`, `src/application/services/ConversationalAgentService.ts`, `src/application/services/GuideQuestionService.ts`

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 3 until ALL checks pass**

**TDD Compliance** (CRITICAL):

- [ ] Red/Green/Refactor cycle documented in commits or task notes
- [ ] Domain coverage ≥95%
- [ ] Application coverage ≥90%
- [ ] Infrastructure coverage ≥85% for resilience integrations

**Validation Commands**:

```bash
npm run test:unit
npm run test:integration
npm run test:coverage
npm run type-check
npm run lint
npm run format:check
npm run build
```

---

### Phase 3: Wave 3 Enhancement (Tasks 11-15)

**Goal**: Improve prompt quality, dynamic suggestion quality, and feedback-to-analytics product loop with a11y-complete chat UI.
**Estimated Time**: 4 hours (parallel vertical slices)
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 3.1**: Few-shot registry + dynamic recommendation tests
  - File(s): `tests/unit/application/services/FewShotExampleRegistry.test.ts`, `tests/unit/application/services/GuideQuestionService.test.ts`
  - Expected: Fails prior to registry/strategy implementation
- [ ] **Test 3.2**: Feedback UI/hook/API tests
  - File(s): `tests/unit/presentation/components/ChatMessageFeedback.test.tsx`, `tests/unit/presentation/hooks/useFeedback.test.ts`, `tests/unit/app/api/ai/feedback.route.test.ts`
  - Expected: Fails until UI/hook/route exists and validates correctly
- [ ] **Test 3.3**: Feedback analytics + chat accessibility tests
  - File(s): `tests/unit/application/use-cases/ai/GetFeedbackAnalyticsUseCase.test.ts`, `tests/unit/presentation/components/FeedbackSummaryCard.test.tsx`, `tests/unit/presentation/components/ChatPanel.accessibility.test.tsx`, `tests/unit/presentation/hooks/useKeyboardNavigation.test.ts`
  - Expected: Fails due to missing analytics use case/API/widget and keyboard/a11y behavior

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 3.4 (Task 11)**: Add few-shot example registry and prompt injection wiring
  - File(s): `src/application/services/FewShotExampleRegistry.ts`, `src/application/ports/IFewShotExampleRegistry.ts`, `src/domain/value-objects/FewShotExample.ts`, `src/application/services/ConversationalAgentService.ts`, `src/lib/di/types.ts`, `src/lib/di/container.ts`
- [ ] **Task 3.5 (Task 12)**: Improve recommended questions with intent/context strategy
  - File(s): `src/application/services/GuideQuestionService.ts`, `src/application/ports/IGuideQuestionService.ts`, `src/application/services/ConversationalAgentService.ts`
- [ ] **Task 3.6 (Task 13)**: Add feedback UI + hook + API endpoint
  - File(s): `src/presentation/components/chat/ChatMessageFeedback.tsx`, `src/presentation/components/chat/ChatMessage.tsx`, `src/presentation/hooks/useFeedback.ts`, `src/app/api/ai/feedback/route.ts`, `src/lib/di/container.ts`
- [ ] **Task 3.7 (Task 14)**: Add feedback analytics repository methods + use case + API + dashboard widget
  - File(s): `src/domain/repositories/IAIFeedbackRepository.ts`, `src/infrastructure/database/repositories/PrismaAIFeedbackRepository.ts`, `src/application/use-cases/ai/GetFeedbackAnalyticsUseCase.ts`, `src/app/api/ai/feedback/analytics/route.ts`, `src/presentation/hooks/useFeedbackAnalytics.ts`, `src/presentation/components/dashboard/FeedbackSummaryCard.tsx`, `src/lib/di/types.ts`, `src/lib/di/container.ts`
- [ ] **Task 3.8 (Task 15)**: Complete ChatPanel accessibility and keyboard navigation
  - File(s): `src/presentation/components/chat/ChatPanel.tsx`, `src/presentation/components/chat/ChatMessage.tsx`, `src/presentation/components/chat/ChatInput.tsx`, `src/presentation/hooks/useKeyboardNavigation.ts`

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 3.9**: Normalize feedback DTO contracts, reduce UI duplication, and align aria attributes/test IDs for stable E2E targeting
  - File(s): `src/presentation/components/chat/*`, `src/app/api/ai/feedback/*`, `src/presentation/components/dashboard/FeedbackSummaryCard.tsx`

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 4 until ALL checks pass**

**TDD Compliance** (CRITICAL):

- [ ] Tests for new services/components/routes authored first
- [ ] Coverage maintained: Application ≥90%, Presentation ≥80%, Domain ≥95% where touched
- [ ] No regressions in chat send/stream/feedback flows

**Validation Commands**:

```bash
npm run test:unit
npm run test:integration
npm run type-check
npm run lint
npm run format:check
npm run build
```

---

### Phase 4: Wave 4 Verification (Tasks 16-18)

**Goal**: Verify full happy path, failure resilience, and WCAG-level accessibility with automated E2E coverage.
**Estimated Time**: 4 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 4.1 (Task 16)**: Happy-path full chatbot E2E flow spec
  - File(s): `tests/e2e/chatbot-flow.spec.ts`
  - Expected: Fails until integrated behaviors exist
- [ ] **Test 4.2 (Task 17)**: Error-scenario resilience E2E spec
  - File(s): `tests/e2e/chatbot-error.spec.ts`
  - Expected: Fails before resilience and UI safeguards are complete
- [ ] **Test 4.3 (Task 18)**: axe-core accessibility automation spec
  - File(s): `tests/e2e/chatbot-accessibility.spec.ts`
  - Expected: Fails before full a11y semantics/keyboard flow pass scans

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 4.4**: Implement/complete all E2E scenarios with Playwright intercept/mocks and evidence generation
  - File(s): `tests/e2e/chatbot-flow.spec.ts`, `tests/e2e/chatbot-error.spec.ts`
- [ ] **Task 4.5**: Integrate axe-core Playwright scanning and JSON evidence export
  - File(s): `tests/e2e/chatbot-accessibility.spec.ts`, `package.json` (dev dependency)

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 4.6**: Remove flaky waits, stabilize selectors, and ensure deterministic mocks
  - File(s): `tests/e2e/*.spec.ts`

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 5 until ALL checks pass**

**TDD Compliance** (CRITICAL):

- [ ] New E2E specs created before any E2E test fixture adjustments
- [ ] Happy/error/a11y suites all passing
- [ ] Evidence files produced per scenario

**Validation Commands**:

```bash
npm run test:e2e -- tests/e2e/chatbot-flow.spec.ts
npm run test:e2e -- tests/e2e/chatbot-error.spec.ts
npm run test:e2e -- tests/e2e/chatbot-accessibility.spec.ts
npm run type-check
npm run lint
npm run build
```

---

### Phase 5: Final Review (F1-F4)

**Goal**: Independent quality sign-off across compliance, code quality, manual QA evidence, and scope fidelity.
**Estimated Time**: 3 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 5.1**: Compliance checklist verification script/checklist fails when any must-have is missing
  - File(s): `docs/plans/PLAN_ai-chatbot-enhancement.md` checklist + audit notes in `.sisyphus/evidence/final-review/`
- [ ] **Test 5.2**: Quality gate command suite fails-fast on lint/type/test/build regressions
  - File(s): command evidence logs under `.sisyphus/evidence/final-review/`

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 5.3 (F1)**: Plan compliance audit (must-have/must-not-have/tasks coverage)
- [ ] **Task 5.4 (F2)**: Code quality review (`as any`, `@ts-ignore`, dead code, unsafe patterns)
- [ ] **Task 5.5 (F3)**: Manual QA replay of all task scenarios (Playwright/curl evidence)
- [ ] **Task 5.6 (F4)**: Scope fidelity check vs task-by-task intended diff boundaries

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 5.7**: Apply only review fixes required for approval; avoid scope creep

#### Quality Gate ✋

**⚠️ STOP: Do NOT mark plan complete until ALL checks pass**

**Validation Commands**:

```bash
npm run test:run
npm run test:coverage
npm run test:integration
npm run test:e2e
npm run type-check
npm run lint
npm run format:check
npm run build
```

---

## ⚠️ Risk Assessment

| Risk                                                 | Probability | Impact | Mitigation Strategy                                                                                              |
| ---------------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Legacy migration breaks active chat routes           | Medium      | High   | Phase 1 route parity tests + explicit `/api/ai/chat` 404 and `/api/agent/chat` streaming assertions before merge |
| Error resilience introduces hidden retry loops       | Medium      | High   | Strict max retry config tests, circuit breaker state tests, and timeout-bound integration tests                  |
| Intent classification drift lowers answer quality    | Medium      | Medium | 20+ keyword pattern tests + LLM fallback contract tests + category coverage checks                               |
| Feedback analytics query performance regression      | Low         | Medium | Repository query tests, constrained `limit`, indexed query paths, and API response time checks                   |
| Accessibility regressions in dynamic chat states     | Medium      | High   | Phase 3 unit a11y tests + Phase 4 axe-core scans across idle/input/error/streaming states                        |
| Parallel wave execution causes integration conflicts | Medium      | Medium | Enforce dependency matrix gates and run full integration/E2E suite at every phase gate                           |

---

## 🔄 Rollback Strategy

### If Phase 1 Fails

**Steps to revert**:

- `git log --oneline -- docs/plans/PLAN_ai-chatbot-enhancement.md src/application/services src/app/api src/presentation`
- `git revert <phase1_commit_sha>` for each Phase 1 commit in reverse order
- If not yet committed: `git restore --staged <files> && git restore <files>`
- Re-run `npm run type-check && npm run test:unit`

### If Phase 2 Fails

**Steps to revert**:

- `git revert <phase2_commit_sha>` for Tasks 6-10 commits
- Preserve Phase 1 stable baseline tag/commit (`git checkout <phase1_stable_sha> -- <target-files>` if partial rollback required)
- Re-run `npm run test:unit && npm run test:integration && npm run type-check`

### If Phase 3 Fails

**Steps to revert**:

- `git revert <phase3_commit_sha>` for Tasks 11-15
- Roll back feedback-related schema/API/UI files together to avoid half states
- Re-run `npm run test:unit && npm run test:integration && npm run build`

### If Phase 4 Fails

**Steps to revert**:

- Revert only E2E/test tooling commits first: `git revert <phase4_commit_sha>`
- If `@axe-core/playwright` causes conflicts: `git revert <dependency_commit_sha>` and remove spec file updates
- Re-run baseline checks: `npm run test:unit && npm run type-check`

### If Phase 5 Fails

**Steps to revert**:

- Keep code unchanged; rollback only review-only patch commits if needed: `git revert <review_fix_commit_sha>`
- Re-run full pipeline and regenerate evidence

---

## 📊 Progress Tracking

### Completion Status

- **Phase 1**: ⏳ 0% | 🔄 50% | ✅ 100%
- **Phase 2**: ⏳ 0% | 🔄 50% | ✅ 100%
- **Phase 3**: ⏳ 0% | 🔄 50% | ✅ 100%
- **Phase 4**: ⏳ 0% | 🔄 50% | ✅ 100%
- **Phase 5**: ⏳ 0% | 🔄 50% | ✅ 100%

**Overall Progress**: 0% complete

### Time Tracking

| Phase     | Estimated    | Actual | Variance |
| --------- | ------------ | ------ | -------- |
| Phase 1   | 4 hours      | -      | -        |
| Phase 2   | 4 hours      | -      | -        |
| Phase 3   | 4 hours      | -      | -        |
| Phase 4   | 4 hours      | -      | -        |
| Phase 5   | 3 hours      | -      | -        |
| **Total** | **19 hours** | -      | -        |

---

## 📝 Notes & Learnings

### Implementation Notes

- Prometheus source mapped to feature-planner phases as: Wave1->Phase1, Wave2->Phase2, Wave3->Phase3, Wave4->Phase4, Final Review->Phase5.
- Coverage targets are enforced by architecture layer: Domain ≥95%, Application ≥90%, Infrastructure ≥85%, Presentation ≥80%.

### Blockers Encountered

- **Blocker 1**: None yet -> N/A

### Improvements for Future Plans

- Track per-task evidence file naming convention from day 1 to reduce final review reconciliation time.

---

## 📚 References

### Documentation

- Source Plan: `.sisyphus/plans/ai-chatbot-enhancement.md`
- Template: `/Users/jm/.claude/skills/feature-planner/plan-template.md`
- Project scripts: `package.json`

### Related Issues

- N/A (plan conversion task)

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:

- [ ] All phases completed with quality gates passed
- [ ] Full integration testing performed
- [ ] Documentation updated
- [ ] Performance benchmarks meet targets
- [ ] Security review completed
- [ ] Accessibility requirements met
- [ ] All stakeholders notified
- [ ] Plan document archived for future reference

---

**Plan Status**: 🔄 In Progress
**Next Action**: Execute Phase 1 RED tasks and capture failing-test evidence
**Blocked By**: None
