---
name: verify-chat-intents
description: Verifies ChatIntent enum values are correctly mapped to prompt control branches and UI follow-up questions. Use after adding/modifying ChatIntent values.
---

# Intent-Response Mapping Verification

## Purpose

1. Verify all intents added to `ChatIntent.ts` are registered in `conversationalAgentService` (guidelines, suggested questions)
2. Verify no missing or unhandled cases in user interview triggers like `GuideQuestionService.ts`
3. Check that the system prompt falls through to a developer-intended control path rather than defaulting to `GENERAL` on unknown intent input

## When to Run

- After adding new values to or changing existing values in the `ChatIntent` enum
- After modifying intent classification rules in IntentClassifier
- After modifying chat assistant guide response templates (chatAssistant.ts, etc.)

## Related Files

| File Path | Purpose |
|-----------|---------|
| `src/domain/value-objects/ChatIntent.ts` | Intent Enum declaration |
| `src/application/services/ConversationalAgentService.ts` | Per-intent guideline and suggested question mapping implementation |
| `src/application/services/GuideQuestionService.ts` | Per-intent sequential question interview trigger |

## Workflow

### Step 1: Extract declared ChatIntents
**Tool:** `read_file` (or local script-based extraction)
**Path:** `src/domain/value-objects/ChatIntent.ts`
**Condition:** List all keywords (e.g., `CREATIVE_FATIGUE`, `LEARNING_PHASE`, etc.) within the `export enum ChatIntent { ... }` block.

### Step 2: ConversationalAgentService.ts mapping verification
**Path:** `src/application/services/ConversationalAgentService.ts`
**Check:**
- Verify the `guides` object in `getIntentGuide(intent: ChatIntent)` method contains all intents from Step 1 as keys.
- Verify the `followUpMap` in `generateSuggestedQuestions` method contains all intents from Step 1 as keys.
- (Passes if TypeScript `Record<ChatIntent, string>` doesn't error, but also verify via static analysis)
**Pass criteria:** All intents extracted in Step 1 exist as keys in the mapping objects.

### Step 3: GuideQuestionService.ts interview branch verification
**Path:** `src/application/services/GuideQuestionService.ts`
**Check:**
- Verify that the switch statement or object mapping that returns dynamic interview/recommended guides per intent has all intents properly defined.
**Pass criteria:** Unless a guideline is explicitly unnecessary for an intent, there should be no mapping gaps (dead-ends).

## Output Format

| Check Item | Target | Result (Pass/Fail) | Missing Intent Example |
|------------|--------|-------------------|----------------------|
| Enum vs IntentGuide | `ConversationalAgentService` | PASS / FAIL | - |
| Enum vs FollowUp | `ConversationalAgentService` | PASS / FAIL | `LEARNING_PHASE` |
| Enum vs Questions | `GuideQuestionService` | PASS / FAIL | - |

## Exceptions

The following are NOT considered FAIL:
- **Default-handled intents:** When explicitly designated by code review or business rules to be handled in the `GENERAL` branch or Default fallback.
- **Not yet UI-supported:** Added to the backend domain but intentionally commented out from frontend/service exposure (must have a TODO comment).
