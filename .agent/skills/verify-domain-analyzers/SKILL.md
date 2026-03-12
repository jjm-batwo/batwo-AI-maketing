---
name: verify-domain-analyzers
description: Verifies that knowledge domains declared in MarketingScience each have an Analyzer class, are registered in KnowledgeBaseService, and domain weight sum equals 1.0.
---

# Domain Analyzer Verification

## Purpose

1. Verify that each domain added to `KnowledgeDomain` in `MarketingScience.ts` has an appropriate Analyzer class
2. Verify that the combined sum of weights defined in `DEFAULT_DOMAIN_WEIGHTS` map equals exactly `1.0` to prevent statistical errors
3. Verify that all domain analyzers are registered (via `new`) in the `KnowledgeBaseService.ts` orchestration (registry)

## When to Run

- After changing the core or benchmark model in `MarketingScience.ts` (adding new business logic)
- After creating/moving domain analyzer classes
- After readjusting weights

## Related Files

| File Path | Purpose |
|-----------|---------|
| `src/domain/value-objects/MarketingScience.ts` | Domain Enum, weights, scoring core logic |
| `src/infrastructure/knowledge/analyzers/**` | Knowledge domain-based specialized analyzer components |
| `src/infrastructure/knowledge/KnowledgeBaseService.ts` | Analyzer orchestration main controller |

## Workflow

### Step 1: Extract KnowledgeDomain list
**Tool:** `read_file` (or local script-based)
**Path:** `src/domain/value-objects/MarketingScience.ts`
**Condition:** Extract all domains (e.g., `creative_diversity`, `campaign_structure`) from the `export type KnowledgeDomain = ...` block or `ALL_KNOWLEDGE_DOMAINS` array.

### Step 2: Verify Analyzer implementation existence
**Path:** `src/infrastructure/knowledge/analyzers/*.ts`
**Check:**
- Verify that an Analyzer class implementation file matching the function of each extracted domain name exists (e.g., `creative_diversity` -> `CreativeDiversityAnalyzer.ts`)
**Pass criteria:** Each domain has its own analyzer.

### Step 3: Verify KnowledgeBaseService registry registration
**Path:** `src/infrastructure/knowledge/KnowledgeBaseService.ts`
**Check:**
- Verify that all domain keys from Step 1 are declared in `this.analyzers.set()` etc. within the `KnowledgeBaseService` class constructor or `analyzers` Map registration process.
**Pass criteria:** No missing domain/analyzer sets.

### Step 4: Weight sum validation (must equal 1.0)
**Path:** `src/domain/value-objects/MarketingScience.ts`
**Check:**
- Extract values from `DEFAULT_DOMAIN_WEIGHTS` object as floats and verify the sum equals 1.0 (within 0.0001 precision tolerance).
**Pass criteria:** No sum errors (e.g., 1.2).

## Output Format

| Check Item | Target | Result (Pass/Fail) | Issue / Identified Gap |
|------------|--------|-------------------|----------------------|
| 1. Analyzer existence | `src/infrastructure/knowledge/analyzers/` | PASS / FAIL | - |
| 2. Orchestration registration | `KnowledgeBaseService.ts` | PASS / FAIL | `tracking_health` registration missing |
| 3. Weights validation | `MarketingScience.ts` | PASS / FAIL | Exceeds 1.0 (1.15) |

## Exceptions

The following are NOT considered FAIL:
- **Experimental/feature-gated domains:** When analyzer implementation is paused and a dummy analyzer (EmptyAnalyzer) is wired in; requires an intentional comment and weight of 0.0.
