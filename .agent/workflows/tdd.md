---
description: Implementing features using the TDD Process (RED → GREEN → REFACTOR)
---

# TDD Development Workflow

All feature implementation strictly follows the Test-Driven Development (TDD) cycle. Tests serve as "living documentation" communicating business intent clearly.

## Overall Flow

```
0. SPEC    → Write test case specifications before implementation
1. RED     → Write a failing test → Verify failure (Compile error or test fail)
2. GREEN   → Minimal implementation to pass the test → Verify pass
3. REFACTOR→ Improve code quality → Keep all tests passing
4. REPEAT  → Iterate for the next requirement
```

---

## Step 0: SPEC — Pre-implementation Unit Test Case Specifications

Before writing a single line of code, clearly define:
- Input conditions and expected Outputs
- Edge cases and Error conditions that must be handled
- External dependencies requiring Mocking or Stubbing

---

## Step 1: RED — Write a Failing Test

### Test Writing Pattern (AAA / BDD Recommended)

Write test code following the **Arrange-Act-Assert (AAA)** or **Given-When-Then (BDD)** patterns to improve readability.

**Arrange-Act-Assert (AAA) Pattern Example**:
```typescript
// tests/unit/domain/entities/Campaign.test.ts
import { describe, it, expect } from 'vitest';
import { Campaign } from '@domain/entities';
import { InvalidCampaignError } from '@domain/errors';

describe('Campaign', () => {
  it('should create campaign with valid budget', () => {
    // Arrange
    const props = { name: 'Test Campaign', budget: 100_000, objective: 'SALES' };
    
    // Act
    const campaign = Campaign.create(props);
    
    // Assert
    expect(campaign.name).toBe('Test Campaign');
    expect(campaign.budget).toBe(100_000);
  });
  
  // Given-When-Then (BDD) style specification example
  it('given empty name, when creating campaign, then should throw InvalidCampaignError', () => {
    // Given
    const invalidProps = { name: '', budget: 100_000, objective: 'SALES' };
    
    // When & Then
    expect(() => Campaign.create(invalidProps)).toThrow(InvalidCampaignError);
  });
});
```

### Verify Failure
```bash
// turbo
npx vitest run tests/unit/domain/entities/Campaign.test.ts
```

> ⚠️ You **must** visually confirm a compilation error or test failure before moving to the next step.

---

## Step 2: GREEN — Minimum Implementation

Write **only the minimum code** necessary to pass the test. Avoid over-engineering, and implement exactly what the test demands.

```typescript
// src/domain/entities/Campaign.ts
export class Campaign {
  private constructor(
    readonly name: string,
    readonly budget: number,
    readonly objective: string,
  ) {}

  static create(props: { name: string; budget: number; objective: string }): Campaign {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidCampaignError('Name is required');
    }
    return new Campaign(props.name, props.budget, props.objective);
  }
}
```

### Verify Pass
```bash
// turbo
npx vitest run tests/unit/domain/entities/Campaign.test.ts
```

---

## Step 3: REFACTOR — Clean Up Code (Blue Phase)

Safely improve code structure while maintaining the passing (Green) state:
- Improve unclear naming
- Extract duplicated code or logic (e.g., using Value Objects)
- Separate into cleaner structures

```bash
// turbo
npx vitest run tests/unit/domain/entities/Campaign.test.ts
```

> Ensure tests still pass 100% after each refactoring step.

---

## Stepwise/Layer-by-Layer TDD Application and Coverage Standards

Follow the purpose and recommended coverage targets for each type of test.

### 1. Unit Tests
- **Target**: Individual functions, methods, classes
- **Dependencies**: Completely independent or handled via Mocking/Stubbing (utilizing `vi.fn()` etc.)
- **Speed**: Very fast (<100ms)
- **Coverage Target**: Business core logic (Domain/Application layer) **≥ 90%** goal

```bash
# Domain (Pure logic)
// turbo
npx vitest run tests/unit/domain/

# Application (UseCase) - Mocking DB/External APIs
// turbo
npx vitest run tests/unit/application/
```

**Dependency Mocking Pattern Example**:
```typescript
it('should call dependency correctly', async () => {
  const mockRepository = { save: vi.fn().mockResolvedValue(true) };
  const service = new CampaignService(mockRepository);
  
  await service.createCampaign(props);
  expect(mockRepository.save).toHaveBeenCalledOnce(); // Verify Mock invocation
});
```

### 2. Integration Tests
- **Target**: Interfaces between modules and external systems like databases, external APIs
- **Dependencies**: Actual DB/services or analogous environments (e.g., Test DB)
- **Coverage Target**: Data Access Layer (Repository/DAO) **≥ 80%**, API/Controller Layer **≥ 70%**

```bash
# Infrastructure (Repository) Actual PostgreSQL DB Integration
// turbo
npm run test:integration
```

### 3. E2E Tests (User Scenarios)
- **Target**: Complete core User Journeys from interface to data
- **Speed**: Slow (Seconds to minutes)
- **Coverage Target**: Focus on verifying correct behavior per major UI scenario rather than numerical coverage

```bash
# Running inside an actual browser environment using Playwright etc.
// turbo
npm run test:e2e
```

---

## Self-Healing Rules

- When tests fail due to existing code modifications → **Modify implementation code instead of weakening the test.**
- Immediately infer and recover broken business logic from error messages.

---

## Evidence-Based Completion Verification

Always attach the following evidence to reviews or commits upon completing a task:

| Task Type | Required Evidence | Pass Criteria |
|-----------|-------------------|---------------|
| New Feature | RED Failing → GREEN Passing Logs | Test case and coverage increase |
| Bug Fix | Added recurring bug test first → Pass after fix | No regression bugs generated |
| Refactoring | Pre-existing test suite maintains 100% pass rate | No business operation results change |

```bash
# Final Verification (Common to all task types)
// turbo
npx tsc --noEmit
// turbo
npx vitest run
// turbo
npx next build
```

```text
[Evidence]
- tsc: PASS | vitest: N tests PASS | build: exit 0
- New tests: +N | Changed files: N
```

> ❌ Do not declare a feature implementation complete without successful test evidence.

---

## Testing Anti-Patterns (from Superpowers)

| Anti-Pattern | 문제 | 대안 |
|---|---|---|
| Mock 동작을 테스트 | 실제 동작 검증 안 됨 | 실제 코드 테스트, mock은 불가피할 때만 |
| 프로덕션 클래스에 test-only 메서드 추가 | 경계 오염 | 인터페이스로 분리 |
| mock 없이 의존성 이해 | 왜 mock하는지 모름 | 의존성 먼저 이해 후 mock |
| 테스트 전에 코드 먼저 작성 | TDD가 아님 | RED 단계부터 시작 |

## Red Flags — STOP and Start Over

이런 생각이 들면 TDD 프로세스를 위반하고 있는 것입니다:

- "테스트 나중에 추가하면 되지" → **지금 작성하세요**
- "구현이 먼저, 테스트는 확인용으로" → **순서가 반대입니다**
- "이건 너무 간단해서 테스트 불필요" → **간단한 것이 복잡해짐**
- "이 mock이 맞는지 모르겠지만 일단" → **의존성을 먼저 이해하세요**
- "테스트가 너무 복잡하다" → **설계가 너무 복잡한 것. 인터페이스 단순화**

## Common Rationalizations

| 변명 | 현실 |
|------|------|
| "이슈가 간단하니 프로세스 불필요" | 간단한 이슈도 근본 원인이 있음 |
| "긴급이라 TDD할 시간 없음" | 체계적 TDD가 guess-and-check보다 **빠름** |
| "먼저 수정해보고 안 되면 테스트" | 첫 수정이 패턴을 결정. 처음부터 제대로 |
| "수정 확인 후 테스트 작성" | 테스트 없는 수정은 안 남음. 테스트 먼저 |
| "여러 수정 한 번에 하면 빠름" | 뭐가 먹혔는지 분리 불가. 새 버그 유발 |

## Final Rule

```
프로덕션 코드 → 테스트가 존재하고 먼저 실패함
그렇지 않으면 → TDD가 아님
```

사용자의 명시적 허가 없이 예외 없음.

