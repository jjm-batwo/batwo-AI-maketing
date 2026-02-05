# Science-Backed Marketing Intelligence Layer

## Context

### Original Request
Add a deep research + science-backed recommendations layer to the AI marketing SaaS platform. Instead of calling OpenAI directly with basic prompts, the system should research across 6 knowledge domains (neuromarketing, psychology, crowd psychology, Meta best practices, color psychology, copywriting psychology), apply science-backed frameworks, and provide recommendations with citations, scores, and evidence.

### Research Findings

**Current Architecture:**
- Clean Architecture with well-defined layers: `domain` -> `application` -> `infrastructure` -> `presentation`
- AI services implemented via `IAIService` port (`src/application/ports/IAIService.ts`) with `AIService` adapter (`src/infrastructure/external/openai/AIService.ts`)
- Prompts are modular files in `src/infrastructure/external/openai/prompts/` (8 prompt files: adCopy, campaignOptimization, reportInsight, budgetRecommendation, creativeTestDesign, targetingOptimization, competitorAnalysis, chatAssistant)
- DI container at `src/lib/di/container.ts` with token-based resolution (`src/lib/di/types.ts`)
- Existing industry benchmarks and Korean market data already codified in prompt files (e.g., `INDUSTRY_BENCHMARKS`, `INDUSTRY_COPY_EXAMPLES`, `KOREAN_COMMERCIAL_EVENTS`)
- Quota system (`QuotaService`) tracks usage types: `CAMPAIGN_CREATE`, `AI_COPY_GEN`, `AI_ANALYSIS`
- All AI calls use `chatCompletion()` pattern: system prompt + user prompt + AI config -> JSON parse
- `chatCompletion()` is currently `private` on `AIService` -- this creates technical debt visible in `ChatService`, which duplicates the OpenAI HTTP call because it cannot access `chatCompletion()` through the `IAIService` port

**Key Design Patterns Observed:**
1. Each AI feature has: system prompt constant, prompt builder function, AI config constant
2. Prompts contain embedded domain knowledge (benchmarks, examples, guidelines)
3. `AIService.chatCompletion()` is the single entry point for all OpenAI calls
4. Response parsing via `parseJsonResponse<T>()` with markdown code block extraction
5. Telemetry via `withSpan()` wrapper on each method

**What Already Exists (Partial Science):**
- `CopyHookType` already models 7 psychological hooks (benefit, urgency, social_proof, curiosity, fear_of_missing, authority, emotional) -- maps loosely to Cialdini
- `HOOK_GUIDELINES` provides brief psychological rationale per hook
- Industry benchmarks with CTR/CVR data
- Seasonal/event context awareness (Korean market calendar)
- Some implicit neuromarketing (character limits, attention capture in creative test design)

**Gap Analysis:**
- No formal knowledge base structure -- science is scattered across prompt strings
- No citation or evidence tracking in responses
- No scoring framework (e.g., "this ad scores 7/10 on neuromarketing principles")
- No multi-domain analysis orchestration
- No research layer for real-time data augmentation
- Psychology is superficial -- mentions hooks but lacks depth (no cognitive load theory, no loss aversion quantification, no color psychology)

---

## Work Objectives

### Core Objective
Build a modular, science-backed marketing intelligence layer that enriches all AI outputs with evidence-based analysis across 6 knowledge domains, without breaking existing API contracts.

### Deliverables
1. **Marketing Knowledge Base** -- Codified frameworks for 6 domains as structured TypeScript modules at `src/infrastructure/knowledge/`
2. **Domain Value Objects** -- `CompositeScore`, `DomainScore`, `Citation` etc. as immutable domain value objects in `src/domain/value-objects/MarketingScience.ts`
3. **IKnowledgeBaseService Port** -- Application-layer port with DTOs (`AnalysisInput`, `AnalysisOutput`, `KnowledgeContext`) at `src/application/ports/IKnowledgeBaseService.ts`
4. **Public `chatCompletion` on IAIService** -- Expose `chatCompletion()` via the port to fix existing `ChatService` technical debt and enable the decorator pattern
5. **ScienceAIService (Decorator)** -- Decorator wrapping `IAIService` that enriches inputs with `scienceContext` before delegating to the inner service
6. **Multi-Domain Analysis Engine** -- `MarketingIntelligenceService` orchestrator that runs domain-specific analyzers and aggregates findings
7. **Science-Backed Response Types** -- New DTOs with citations, scores, and evidence fields
8. **Research Enhancement Layer** (Optional Phase 3) -- External research integration for real-time data
9. **UI Components** -- Display science-backed recommendations with citations and confidence scores

### Definition of Done
- [ ] All 6 knowledge domains codified as TypeScript modules with test coverage >= 90%
- [ ] `chatCompletion()` is public on `IAIService` interface and `AIService` class
- [ ] `IKnowledgeBaseService` port created with DTOs in application layer
- [ ] Grade boundaries defined ONLY in `MarketingScience.ts` (single source of truth)
- [ ] Multi-domain analysis engine produces scored, cited recommendations
- [ ] Partial domain failure handled gracefully (minimum 3/6 required)
- [ ] Existing API endpoints unchanged (backward compatible)
- [ ] New `/api/ai/science-*` endpoints available with science-backed responses
- [ ] Each recommendation includes domain citations, confidence score (0-100), and evidence summary
- [ ] `useMarketingIntelligence()` hook with TanStack Query integration
- [ ] Unit tests for all knowledge base modules, analysis engine, and enhanced service methods
- [ ] Integration test: end-to-end flow from input -> multi-domain analysis -> cited output

---

## Guardrails

### MUST Have
- Backward compatibility -- existing `IAIService` methods and API endpoints must not break
- Follow existing Clean Architecture patterns (ports/adapters, DI tokens)
- All knowledge base data must be sourced from peer-reviewed research or established frameworks
- Korean market focus in all examples and defaults
- Cost management -- science layer must not multiply API call costs beyond 2x per request
- Each knowledge domain must be independently testable
- Citation format for every science-backed claim
- Grade boundaries defined in ONE place only (`MarketingScience.ts`)
- `MarketingIntelligenceService` depends on `IKnowledgeBaseService` port, NOT on infrastructure class
- Knowledge base at `src/infrastructure/knowledge/` (NOT inside `external/`)
- ScienceAIService uses INPUT ENRICHMENT (populating `scienceContext` field), not prompt replacement

### MUST NOT Have
- No database schema changes in Phase 1-2 (knowledge is codified in code, not DB)
- No removal or modification of existing prompt files -- only additive changes
- No new external API dependencies in Phase 1-2 (Perplexity/search is Phase 3 only)
- No breaking changes to `GenerateAdCopyInput`, `GenerateOptimizationInput`, or any existing input types
- No hard-coding of specific product names or brands in knowledge base
- No storing API keys in code -- use existing `env` pattern
- No duplicate grade boundary definitions -- single source of truth only
- No direct dependency from application layer to infrastructure knowledge classes

---

## Architecture Design

### New Architectural Components

```
src/
+-- domain/
|   +-- value-objects/
|   |   +-- MarketingScience.ts              # SINGLE SOURCE OF TRUTH for:
|   |                                         #   CompositeScore, DomainScore, ScoringFactor, Citation (value objects)
|   |                                         #   KnowledgeDomain enum
|   |                                         #   Grade boundaries, scoring formulas
|   |                                         #   Industry-specific benchmarks
|   |                                         #   Pure utility functions for score calculation
|   +-- errors/
|       +-- InsufficientAnalysisError.ts     # NEW - thrown when < 3/6 domains succeed
|
+-- application/
|   +-- ports/
|   |   +-- IAIService.ts                    # MODIFIED - add public chatCompletion() method
|   |   +-- IKnowledgeBaseService.ts         # NEW - port with AnalysisInput, AnalysisOutput, KnowledgeContext DTOs
|   |   +-- IResearchService.ts              # NEW - Phase 3 research port
|   |
|   +-- services/
|       +-- MarketingIntelligenceService.ts  # NEW - orchestrator (depends on IKnowledgeBaseService port)
|
+-- infrastructure/
|   +-- external/
|   |   +-- openai/
|   |       +-- AIService.ts                 # MODIFIED - chatCompletion() becomes public
|   |       +-- ScienceAIService.ts          # NEW - decorator that enriches scienceContext on inputs
|   |       +-- prompts/
|   |           +-- (existing files)         # UNCHANGED
|   |           +-- science/                 # NEW - science-enhanced prompts
|   |               +-- index.ts
|   |               +-- scienceSystemPrompt.ts
|   |               +-- domainAnalysisPrompt.ts
|   |               +-- scienceCopyPrompt.ts
|   |
|   +-- knowledge/                           # NEW - Marketing Knowledge Base (NOT inside external/)
|       +-- KnowledgeBaseService.ts          # Implements IKnowledgeBaseService
|       +-- analyzers/
|       |   +-- NeuromarketingAnalyzer.ts
|       |   +-- MarketingPsychologyAnalyzer.ts
|       |   +-- CrowdPsychologyAnalyzer.ts
|       |   +-- MetaBestPracticesAnalyzer.ts
|       |   +-- ColorPsychologyAnalyzer.ts
|       |   +-- CopywritingPsychologyAnalyzer.ts
|       +-- data/
|       |   +-- industry-benchmarks.ts
|       |   +-- psychological-principles.ts
|       |   +-- seasonal-factors.ts
|       |   +-- scoring-weights.ts
|       |   +-- korean-power-words.ts        # Minimum 30 Korean power words
|       +-- index.ts
|
+-- presentation/
    +-- components/
    |   +-- ai/                              # NEW - Science-backed UI components
    |       +-- ScienceScore.tsx
    |       +-- CitationCard.tsx
    |       +-- DomainBreakdown.tsx
    |       +-- EvidenceBadge.tsx
    +-- hooks/
        +-- useMarketingIntelligence.ts      # NEW - TanStack Query hook
```

### Data Flow

```
User Request
    |
    v
API Route (/api/ai/science-copy)
    |
    v
MarketingIntelligenceService (Orchestrator)
    |-- IKnowledgeBaseService.analyzeAll(analysisInput)
    |   |-- NeuromarketingAnalyzer.analyze(input)         -> DomainScore + Citations
    |   |-- MarketingPsychologyAnalyzer.analyze(input)    -> DomainScore + Citations
    |   |-- CrowdPsychologyAnalyzer.analyze(input)        -> DomainScore + Citations
    |   |-- MetaBestPracticesAnalyzer.analyze(input)      -> DomainScore + Citations
    |   |-- ColorPsychologyAnalyzer.analyze(input)        -> DomainScore + Citations
    |   +-- CopywritingPsychologyAnalyzer.analyze(input)  -> DomainScore + Citations
    |
    |-- CompositeScore computed from successful domains (min 3/6 required)
    |   (If analyzer throws: log warning, exclude from composite, track in analyzedDomains)
    |
    +-- ScienceAIService (Decorator around IAIService)
        |-- Maps analysis results to scienceContext string
        |-- Populates input.scienceContext field on each input DTO
        |-- Delegates to inner IAIService (existing prompt builders include scienceContext if present)
        |-- Returns enriched result + scienceAnalysis
    |
    v
ScienceBackedResponse {
    result: <original response type>,          <- backward compatible
    scienceAnalysis: {
        compositeScore: CompositeScore,
        analyzedDomains: KnowledgeDomain[],   <- tracks which domains succeeded
        totalDomains: 6,
        citations: Citation[],
        recommendations: DomainRecommendation[],
    }
}
```

### Input Mapping: GenerateAdCopyInput -> AnalysisInput

```
GenerateAdCopyInput               ->  AnalysisInput
------------------------------------------------------
productName                       ->  content.brand
productDescription                ->  content.primaryText
targetAudience                    ->  context.targetAudience
tone                              ->  context.tone
objective                         ->  context.objective
keywords                          ->  context.keywords
(industry from extended input)    ->  context.industry
```

This mapping is implemented as a utility method in `MarketingIntelligenceService.mapAdCopyToAnalysisInput()`. Similar mappers exist for `GenerateOptimizationInput` and other input types.

### Key Design Decisions

1. **Decorator Pattern with INPUT ENRICHMENT**: `ScienceAIService` wraps `IAIService` and populates a `scienceContext?: string` field on each input DTO before delegating to the inner service. Existing prompt builder functions check for `scienceContext` and include it when present. This keeps prompts consolidated in their existing files and maintains the decorator pattern faithfully.

2. **Public `chatCompletion()` on IAIService**: Adding `chatCompletion(systemPrompt: string, userPrompt: string, config?: AIConfig): Promise<string>` to the `IAIService` interface fixes the `ChatService` technical debt (which currently duplicates the OpenAI HTTP call) and enables the decorator to access the underlying completion mechanism when needed for new science-only endpoints.

3. **Knowledge as Code, Not Database**: All 6 knowledge domains are TypeScript modules with exported constants, functions, and scoring logic. This avoids DB migration, is version-controlled, and is extremely fast (no I/O).

4. **Single Enhanced Prompt Strategy**: Rather than making 6 separate AI calls per domain, the knowledge base pre-scores the input locally, then injects the relevant knowledge context into the input's `scienceContext` field. This keeps costs at 1 AI call per request (same as today, just with richer context).

5. **Infrastructure Knowledge vs External**: Knowledge base lives at `src/infrastructure/knowledge/` (NOT `external/`). This is codified internal knowledge, not an external API integration.

6. **Types Split Between Domain and Application**:
   - **Domain layer** (`MarketingScience.ts`): Value objects (`CompositeScore`, `DomainScore`, `ScoringFactor`, `Citation`), `KnowledgeDomain` enum, grade boundaries, scoring formulas, pure utility functions
   - **Application layer** (`IKnowledgeBaseService.ts`): DTOs (`AnalysisInput`, `AnalysisOutput`, `KnowledgeContext`), `IKnowledgeBaseService` interface, `DomainAnalyzer` interface

7. **Port-Based Dependency**: `MarketingIntelligenceService` depends on `IKnowledgeBaseService` port, never on the infrastructure `KnowledgeBaseService` class directly.

8. **Additive API Surface**: New endpoints (`/api/ai/science-copy`, `/api/ai/science-score`, `/api/ai/science-analyze`) sit alongside existing ones. Users can opt into science-backed analysis.

9. **Single Source of Truth for Grades**: Grade boundaries are defined ONLY in `src/domain/value-objects/MarketingScience.ts`. All other code (scoring engine, UI, etc.) imports from there.

10. **Partial Domain Failure Resilience**: If a domain analyzer throws, it is logged as a warning and excluded from the composite score. `CompositeScore.analyzedDomains` tracks which domains succeeded. If fewer than 3/6 domains succeed, `InsufficientAnalysisError` is thrown.

11. **Korean NLP v1 Strategy**: Simple keyword matching (no external NLP library). Character-based word counting for Korean text (not space-based). Curated Korean power word dictionary (minimum 30 words) in `data/korean-power-words.ts`. Future: Add mecab-ko integration in Phase 3.

---

## Implementation Phases

---

### Phase 1: Foundation + Marketing Knowledge Base (Priority: CRITICAL)

**Goal:** Establish domain value objects, application port, and codify all 6 knowledge domains as structured TypeScript modules with scoring logic and citation tracking.

**Estimated effort:** 4-5 days
**Files to create:** 16 new files
**Files to modify:** 1 existing file (IAIService.ts -- additive)

#### Task 1.1: Domain Value Objects (Single Source of Truth)

**File:** `src/domain/value-objects/MarketingScience.ts`

Create the SINGLE SOURCE OF TRUTH for all science-related value objects, enums, grade boundaries, and pure scoring utility functions:

```typescript
/**
 * Marketing Science Value Objects
 *
 * SINGLE SOURCE OF TRUTH for:
 * - KnowledgeDomain enum
 * - CompositeScore, DomainScore, ScoringFactor, Citation value objects
 * - Grade boundaries and grade calculation
 * - Industry-specific benchmarks
 * - Scoring formula utilities
 */

export type KnowledgeDomain =
  | 'neuromarketing'
  | 'marketing_psychology'
  | 'crowd_psychology'
  | 'meta_best_practices'
  | 'color_psychology'
  | 'copywriting_psychology'

export const ALL_KNOWLEDGE_DOMAINS: readonly KnowledgeDomain[] = [
  'neuromarketing',
  'marketing_psychology',
  'crowd_psychology',
  'meta_best_practices',
  'color_psychology',
  'copywriting_psychology',
] as const

// --- Grade Boundaries (SINGLE SOURCE OF TRUTH) ---
export type ScienceGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'

export const GRADE_BOUNDARIES: readonly { min: number; grade: ScienceGrade }[] = [
  { min: 90, grade: 'A+' },
  { min: 80, grade: 'A' },
  { min: 70, grade: 'B+' },
  { min: 60, grade: 'B' },
  { min: 50, grade: 'C+' },
  { min: 40, grade: 'C' },
  { min: 30, grade: 'D' },
  { min: 0, grade: 'F' },
] as const

export function getGrade(score: number): ScienceGrade {
  for (const { min, grade } of GRADE_BOUNDARIES) {
    if (score >= min) return grade
  }
  return 'F'
}

// --- Value Objects ---
export interface Citation {
  id: string
  domain: KnowledgeDomain
  source: string                // e.g., "Kahneman & Tversky (1979)"
  finding: string               // what the research found
  applicability: string         // how it applies to current context
  confidenceLevel: 'high' | 'medium' | 'low'
  year?: number
  category: string
}

export interface ScoringFactor {
  name: string
  score: number                 // 0-100
  weight: number                // 0.0-1.0, must sum to 1.0 within domain
  explanation: string
  citation?: Citation
}

export interface DomainScore {
  domain: KnowledgeDomain
  score: number                 // 0-100
  maxScore: 100
  grade: ScienceGrade
  factors: ScoringFactor[]
  citations: Citation[]
  recommendations: DomainRecommendation[]
}

export interface DomainRecommendation {
  domain: KnowledgeDomain
  priority: 'critical' | 'high' | 'medium' | 'low'
  recommendation: string
  scientificBasis: string
  expectedImpact: string
  citations: Citation[]
}

export interface CompositeScore {
  overall: number               // 0-100, weighted average
  grade: ScienceGrade
  domainScores: DomainScore[]
  analyzedDomains: KnowledgeDomain[]    // which domains were successfully scored
  failedDomains: KnowledgeDomain[]      // which domains threw errors
  topRecommendations: DomainRecommendation[]  // top 5 across all domains
  totalCitations: Citation[]
  summary: string               // 1-2 sentence summary in Korean
}

// --- Default Domain Weights ---
export const DEFAULT_DOMAIN_WEIGHTS: Record<KnowledgeDomain, number> = {
  neuromarketing: 0.20,
  marketing_psychology: 0.20,
  crowd_psychology: 0.15,
  meta_best_practices: 0.20,
  color_psychology: 0.10,
  copywriting_psychology: 0.15,
}

// --- Pure Scoring Utilities ---
export function calculateWeightedAverage(
  domainScores: DomainScore[],
  weights: Record<KnowledgeDomain, number> = DEFAULT_DOMAIN_WEIGHTS
): number {
  let totalWeight = 0
  let weightedSum = 0
  for (const ds of domainScores) {
    const w = weights[ds.domain] ?? 0
    weightedSum += ds.score * w
    totalWeight += w
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

export function rankRecommendations(
  recommendations: DomainRecommendation[]
): DomainRecommendation[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  )
}

export function buildCompositeScore(
  domainScores: DomainScore[],
  failedDomains: KnowledgeDomain[],
  weights?: Record<KnowledgeDomain, number>
): CompositeScore {
  const overall = calculateWeightedAverage(domainScores, weights)
  const allRecs = domainScores.flatMap(ds => ds.recommendations)
  const allCitations = domainScores.flatMap(ds => ds.citations)
  return {
    overall,
    grade: getGrade(overall),
    domainScores,
    analyzedDomains: domainScores.map(ds => ds.domain),
    failedDomains,
    topRecommendations: rankRecommendations(allRecs).slice(0, 5),
    totalCitations: allCitations,
    summary: '', // Filled by MarketingIntelligenceService
  }
}

// --- Industry Benchmarks ---
export const INDUSTRY_BENCHMARKS: Record<string, { avgCTR: number; avgCVR: number; avgROAS: number }> = {
  ecommerce: { avgCTR: 1.2, avgCVR: 2.5, avgROAS: 3.0 },
  food_beverage: { avgCTR: 1.5, avgCVR: 3.0, avgROAS: 2.5 },
  beauty: { avgCTR: 1.8, avgCVR: 3.5, avgROAS: 4.0 },
  fashion: { avgCTR: 1.4, avgCVR: 2.8, avgROAS: 3.5 },
  education: { avgCTR: 0.9, avgCVR: 1.5, avgROAS: 2.0 },
  service: { avgCTR: 1.0, avgCVR: 2.0, avgROAS: 2.5 },
  saas: { avgCTR: 0.8, avgCVR: 1.2, avgROAS: 3.0 },
  health: { avgCTR: 1.3, avgCVR: 2.2, avgROAS: 2.8 },
}

// Minimum number of domains required for a valid composite score
export const MIN_REQUIRED_DOMAINS = 3
```

**Acceptance criteria:**
- All value objects are immutable (readonly properties)
- `getGrade()` returns correct grade for all boundary values (0, 29, 30, 39, 40, ..., 90, 100)
- `calculateWeightedAverage()` normalizes weights correctly
- `buildCompositeScore()` produces valid composite with grade
- `MIN_REQUIRED_DOMAINS = 3` exported as constant
- All types exported; no imports from infrastructure or application layers
- `DEFAULT_DOMAIN_WEIGHTS` sums to 1.0
- Grade boundaries: A+ (90-100), A (80-89), B+ (70-79), B (60-69), C+ (50-59), C (40-49), D (30-39), F (0-29)

---

**File:** `src/domain/errors/InsufficientAnalysisError.ts`

```typescript
import type { KnowledgeDomain } from '@domain/value-objects/MarketingScience'

export class InsufficientAnalysisError extends Error {
  constructor(
    public readonly analyzedCount: number,
    public readonly requiredCount: number,
    public readonly failedDomains: KnowledgeDomain[]
  ) {
    super(
      `Insufficient domain analysis: ${analyzedCount}/${requiredCount} domains succeeded. ` +
      `Failed: ${failedDomains.join(', ')}`
    )
    this.name = 'InsufficientAnalysisError'
  }
}
```

**Acceptance criteria:**
- Extends `Error`
- Contains `analyzedCount`, `requiredCount`, `failedDomains` fields
- Descriptive error message in English (internal error, not user-facing)

---

#### Task 1.2: IKnowledgeBaseService Port + DTOs

**File:** `src/application/ports/IKnowledgeBaseService.ts`

Create the application-layer port with DTOs, following the existing `IAIService.ts` co-location pattern:

```typescript
import type {
  KnowledgeDomain,
  CompositeScore,
  DomainScore,
} from '@domain/value-objects/MarketingScience'

// --- DTOs (Application Layer) ---

export interface AnalysisInput {
  content?: {
    headline?: string
    primaryText?: string
    description?: string
    callToAction?: string
    brand?: string
  }
  context?: {
    industry?: string
    targetAudience?: string
    objective?: 'awareness' | 'consideration' | 'conversion'
    tone?: 'professional' | 'casual' | 'playful' | 'urgent'
    keywords?: string[]
  }
  metrics?: {
    ctr?: number
    cvr?: number
    roas?: number
    cpa?: number
    frequency?: number
  }
  creative?: {
    format?: 'image' | 'video' | 'carousel'
    dominantColors?: string[]
    hasVideo?: boolean
    videoDuration?: number
  }
}

export interface AnalysisOutput {
  compositeScore: CompositeScore
  knowledgeContext: string    // Formatted string for prompt injection
}

export interface KnowledgeContext {
  domain: KnowledgeDomain
  findings: string[]
  score: DomainScore
  contextString: string      // Formatted for prompt injection
}

// --- Domain Analyzer Interface ---

export interface DomainAnalyzer {
  domain: KnowledgeDomain
  analyze(input: AnalysisInput): DomainScore
}

// --- Port ---

export interface IKnowledgeBaseService {
  /**
   * Run all 6 domain analyzers and aggregate results.
   * Handles partial failures: logs warning, excludes failed domain.
   * Throws InsufficientAnalysisError if fewer than 3 domains succeed.
   */
  analyzeAll(input: AnalysisInput): AnalysisOutput

  /**
   * Run specific domains only (for cost/performance optimization)
   */
  analyzeSpecific(input: AnalysisInput, domains: KnowledgeDomain[]): AnalysisOutput

  /**
   * Get relevant knowledge for prompt injection.
   * Returns formatted string for system prompt enhancement.
   */
  getKnowledgeContext(input: AnalysisInput): string

  /**
   * Get domain-specific recommendations only.
   */
  getRecommendations(input: AnalysisInput): import('@domain/value-objects/MarketingScience').DomainRecommendation[]
}
```

**Acceptance criteria:**
- `AnalysisInput` includes `content.brand` field (for mapping from `GenerateAdCopyInput.productName`)
- `AnalysisInput` includes `context.tone` and `context.keywords` fields (for mapping from `GenerateAdCopyInput`)
- DTOs do NOT import from infrastructure
- `IKnowledgeBaseService` methods are synchronous (no API calls -- pure computation)
- `DomainAnalyzer` interface defined here (used by infrastructure analyzers)
- File follows same pattern as `IAIService.ts` (types + interface co-located)

---

#### Task 1.3: Make chatCompletion Public on IAIService

**File:** `src/application/ports/IAIService.ts` (MODIFY -- additive)

Add `chatCompletion` to the `IAIService` interface:

```typescript
// Add to the IAIService interface (at the end, before closing brace):
  chatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config?: AIConfig
  ): Promise<string>
```

**File:** `src/infrastructure/external/openai/AIService.ts` (MODIFY)

Change `chatCompletion` from `private` to `public`:

```typescript
// Line 97: Change from:
private async chatCompletion(
// To:
async chatCompletion(
```

**Acceptance criteria:**
- `IAIService` interface now includes `chatCompletion()` method
- `AIService.chatCompletion()` visibility changed from `private` to `public` (no `public` keyword needed, just remove `private`)
- All existing code continues to compile (chatCompletion was already called internally)
- This enables `ChatService` to eventually remove its duplicated OpenAI HTTP call (separate follow-up task)

---

#### Task 1.4: Neuromarketing Analyzer

**File:** `src/infrastructure/knowledge/analyzers/NeuromarketingAnalyzer.ts`

Codify neuromarketing principles as a domain analyzer:

```typescript
// Key frameworks to codify:
//
// 1. Cognitive Load Theory
//    - Source: Miller (1956), Sweller (1988)
//    - Rules: 3-5 focal points max, 20 words max for static ads
//    - Scoring: count focal points, word count, visual complexity
//    - Korean: character-based word counting (not space-based)
//
// 2. Dopamine & Reward System
//    - Source: Schultz (1997), Berridge & Robinson (1998)
//    - Rules: anticipation > reward, unpredictability increases engagement
//    - Scoring: presence of anticipation triggers, novelty signals
//
// 3. Attention Economy
//    - Source: Davenport & Beck (2001)
//    - Rules: first 3 seconds critical, visual hierarchy, F-pattern
//    - Scoring: hook strength in first line, visual weight distribution
//
// 4. Emotional Processing
//    - Source: Damasio (1994), LeDoux (1996)
//    - Rules: 95% decisions subconscious, emotion > logic for purchase
//    - Scoring: emotional word density, sentiment analysis
//
// 5. Dual Process Theory
//    - Source: Kahneman (2011)
//    - Rules: System 1 (fast/intuitive) for awareness, System 2 (slow/analytical) for consideration
//    - Scoring: match processing style to campaign objective
```

**Korean NLP Strategy (v1):**
- Character-based word counting: count Korean characters (Hangul Unicode range U+AC00-U+D7AF) for content length analysis
- Simple keyword matching: maintain lists of Korean trigger words per psychological principle
- No external NLP library required for v1
- Future: mecab-ko integration planned for Phase 3

**Acceptance criteria:**
- Minimum 5 scoring factors with real citations
- `analyze()` returns `DomainScore` based on input content analysis
- Each citation has source, year, and finding
- Korean text analysis uses character-based counting (not space-based)
- Grade imported from `MarketingScience.getGrade()` (NOT redefined)
- Implements `DomainAnalyzer` interface from `IKnowledgeBaseService.ts`

---

#### Task 1.5: Marketing Psychology Analyzer

**File:** `src/infrastructure/knowledge/analyzers/MarketingPsychologyAnalyzer.ts`

Codify Cialdini's 7 principles + cognitive biases:

```typescript
// Frameworks:
// 1. Cialdini's 7 Principles (2021 edition)
//    - Reciprocity, Commitment/Consistency, Social Proof, Authority, Liking, Scarcity, Unity
//    - Scoring: detect which principles are used in copy, check proper application
//
// 2. Loss Aversion - Kahneman & Tversky (1979) - losses feel 2.5x stronger
// 3. Anchoring Bias - Tversky & Kahneman (1974)
// 4. Framing Effects - Tversky & Kahneman (1981)
// 5. Endowment Effect - Thaler (1980)
```

**Acceptance criteria:**
- All 7 Cialdini principles codified with detection logic
- At least 3 cognitive biases with scoring
- Korean language pattern matching for principle detection (keyword lists)
- Each principle has usage guidelines for Korean market
- Grade imported from `MarketingScience.getGrade()`

---

#### Task 1.6: Crowd Psychology Analyzer

**File:** `src/infrastructure/knowledge/analyzers/CrowdPsychologyAnalyzer.ts`

```typescript
// Frameworks:
// 1. Bandwagon Effect - Leibenstein (1950) - "10,000명이 선택"
// 2. FOMO - Przybylski et al. (2013) - 62% of consumers influenced
// 3. Social Proof Hierarchy - Cialdini (2009), Korean market modified
//    Hierarchy: expert > celebrity > UGC > crowd numbers > badges
// 4. Herd Behavior - Banerjee (1992)
// 5. Information Cascade - Bikhchandani, Hirshleifer & Welch (1992)
```

**Acceptance criteria:**
- Social proof hierarchy scoring (1-5 scale based on tier used)
- FOMO detection in Korean copy
- Korean-specific crowd signals (e.g., "인기", "베스트", "품절임박")

---

#### Task 1.7: Meta Ads Best Practices Analyzer

**File:** `src/infrastructure/knowledge/analyzers/MetaBestPracticesAnalyzer.ts`

```typescript
// Frameworks (2025 Meta Guidelines):
// 1. Andromeda Algorithm (Creative-first targeting)
// 2. Format Optimization (4:5 vertical, Reels, Carousel)
// 3. Creative Diversity Requirements (3-5 creatives per ad set)
// 4. Testing Framework (20% budget, 7 days minimum)
// 5. Advantage+ Campaigns
// 6. Korean Market Specifics (mobile-first 95%+, Instagram dominance)
```

**Acceptance criteria:**
- Format scoring based on Meta's own performance data
- Testing framework validation (budget %, duration)
- Korean market mobile optimization checks
- 2025-specific Andromeda algorithm considerations

---

#### Task 1.8: Color Psychology Analyzer

**File:** `src/infrastructure/knowledge/analyzers/ColorPsychologyAnalyzer.ts`

```typescript
// Frameworks:
// 1. Industry-Aligned Color Mapping - Labrecque & Milne (2012)
// 2. CTA Contrast Optimization - Shaouf, Lu & Li (2016)
// 3. Cultural Color Context (Korean Market)
//    Red: luck, celebration (positive in Korea vs warning in West)
//    White: purity, mourning (dual meaning)
//    Blue: trust, corporate
//    Gold: premium, luxury
// 4. Emotional Color Associations - Elliot & Maier (2014)
```

**Acceptance criteria:**
- Industry-color mapping for all 8 supported industries
- Korean cultural color context
- CTA contrast recommendations
- Seasonal color recommendations (Korean market calendar alignment)

---

#### Task 1.9: Copywriting Psychology Analyzer

**File:** `src/infrastructure/knowledge/analyzers/CopywritingPsychologyAnalyzer.ts`

```typescript
// Frameworks:
// 1. Power Word Density - Bly (2020), various A/B test meta-analyses
//    - Rule: 2-3 power words per sentence optimal
//    - Korean power words from data/korean-power-words.ts
//
// 2. Emotional Trigger Audit - Heath & Heath (2007) "Made to Stick"
//    - SUCCESs framework: Simple, Unexpected, Concrete, Credible, Emotional, Stories
//
// 3. Headline Formulas
//    - PAS (Problem-Agitation-Solution)
//    - Benefit-Emotion-Objection
//    - Number-Adjective-Noun-Promise
//
// 4. Readability & Scanability - Nielsen (2006)
//    - Korean: character-based measurement
//
// 5. Call-to-Action Psychology
//    - First person > second person ("내 쿠폰 받기" > "쿠폰 받기")
//    - Specific > generic ("지금 50% 할인 받기" > "자세히 보기")
```

**Acceptance criteria:**
- Korean power word dictionary (minimum 30 words) imported from `data/korean-power-words.ts`
- Headline formula detection for Korean copy
- PAS/AIDA framework scoring
- CTA optimization scoring with Korean-specific patterns
- Character-based word counting for Korean text

---

#### Task 1.10: Korean Power Words Data

**File:** `src/infrastructure/knowledge/data/korean-power-words.ts`

Curated dictionary of Korean marketing power words organized by category:

```typescript
export const KOREAN_POWER_WORDS = {
  urgency: ['즉시', '지금', '바로', '오늘만', '마감임박', '한정'],
  free: ['무료', '공짜', '0원', '무상', '증정'],
  trust: ['보장', '검증', '인증', '공식', '정품'],
  exclusivity: ['독점', '단독', '최초', '프리미엄', 'VIP'],
  emotion: ['놀라운', '환상적', '꿈의', '기적', '감동'],
  result: ['확실한', '즉각적', '완벽한', '극대화', '효과'],
  social: ['인기', '베스트', '화제', '추천', '1위'],
  savings: ['할인', '세일', '특가', '파격', '최저가'],
} as const

// Total: minimum 30 unique power words across all categories
export const ALL_POWER_WORDS: string[] = Object.values(KOREAN_POWER_WORDS).flat()
```

**Acceptance criteria:**
- Minimum 30 unique Korean power words
- Organized by category (urgency, free, trust, exclusivity, emotion, result, social, savings)
- Exported as typed constant
- `ALL_POWER_WORDS` flat array for quick lookup

---

#### Task 1.11: Scoring Weights Data

**File:** `src/infrastructure/knowledge/data/scoring-weights.ts`

```typescript
import { DEFAULT_DOMAIN_WEIGHTS } from '@domain/value-objects/MarketingScience'

// Re-export domain weights (single source of truth is in MarketingScience.ts)
export { DEFAULT_DOMAIN_WEIGHTS }

// Objective-specific weight adjustments
export const OBJECTIVE_WEIGHT_OVERRIDES: Record<string, Partial<Record<string, number>>> = {
  awareness: { neuromarketing: 0.25, crowd_psychology: 0.20 },
  consideration: { marketing_psychology: 0.25, copywriting_psychology: 0.20 },
  conversion: { meta_best_practices: 0.25, marketing_psychology: 0.25 },
}
```

**Acceptance criteria:**
- Imports default weights from `MarketingScience.ts` (single source of truth)
- Objective-specific overrides are partial (only override what changes)

---

#### Task 1.12: Other Data Modules

**File:** `src/infrastructure/knowledge/data/industry-benchmarks.ts`

Re-exports `INDUSTRY_BENCHMARKS` from `MarketingScience.ts` and adds extended benchmark data.

**File:** `src/infrastructure/knowledge/data/psychological-principles.ts`

Codified Cialdini principles, cognitive biases, and neuromarketing constants as structured data.

**File:** `src/infrastructure/knowledge/data/seasonal-factors.ts`

Korean market seasonal calendar with psychological implications.

**Acceptance criteria:**
- Each data module is pure (no side effects, no I/O)
- All industry data covers the 8 supported industries
- Seasonal data covers major Korean commercial events

---

#### Task 1.13: Knowledge Base Service (Infrastructure Implementation)

**File:** `src/infrastructure/knowledge/KnowledgeBaseService.ts`

Implements `IKnowledgeBaseService` from the application port:

```typescript
import type { IKnowledgeBaseService, AnalysisInput, AnalysisOutput, DomainAnalyzer }
  from '@application/ports/IKnowledgeBaseService'
import type { KnowledgeDomain, DomainScore } from '@domain/value-objects/MarketingScience'
import { buildCompositeScore, MIN_REQUIRED_DOMAINS } from '@domain/value-objects/MarketingScience'
import { InsufficientAnalysisError } from '@domain/errors/InsufficientAnalysisError'

export class KnowledgeBaseService implements IKnowledgeBaseService {
  private analyzers: DomainAnalyzer[]

  constructor() {
    this.analyzers = [
      new NeuromarketingAnalyzer(),
      new MarketingPsychologyAnalyzer(),
      new CrowdPsychologyAnalyzer(),
      new MetaBestPracticesAnalyzer(),
      new ColorPsychologyAnalyzer(),
      new CopywritingPsychologyAnalyzer(),
    ]
  }

  analyzeAll(input: AnalysisInput): AnalysisOutput {
    const successScores: DomainScore[] = []
    const failedDomains: KnowledgeDomain[] = []

    for (const analyzer of this.analyzers) {
      try {
        successScores.push(analyzer.analyze(input))
      } catch (error) {
        console.warn(`Domain analyzer ${analyzer.domain} failed:`, error)
        failedDomains.push(analyzer.domain)
      }
    }

    if (successScores.length < MIN_REQUIRED_DOMAINS) {
      throw new InsufficientAnalysisError(
        successScores.length,
        MIN_REQUIRED_DOMAINS,
        failedDomains
      )
    }

    const compositeScore = buildCompositeScore(successScores, failedDomains)
    const knowledgeContext = this.formatKnowledgeContext(compositeScore)

    return { compositeScore, knowledgeContext }
  }

  // ... analyzeSpecific, getKnowledgeContext, getRecommendations
}
```

**Acceptance criteria:**
- Implements `IKnowledgeBaseService` interface from application port
- Handles partial domain failures: logs warning, excludes from composite
- Throws `InsufficientAnalysisError` if fewer than 3/6 domains succeed
- `analyzeAll()` returns `AnalysisOutput` with `compositeScore` and `knowledgeContext`
- Default weights from `MarketingScience.ts` (not redefined)
- `getKnowledgeContext()` produces formatted string under 2000 tokens

---

#### Task 1.14: Knowledge Base Index

**File:** `src/infrastructure/knowledge/index.ts`

Export all modules cleanly.

**Acceptance criteria:**
- All 6 analyzers exported
- `KnowledgeBaseService` exported
- Data modules exported
- Clean barrel file pattern

---

### Phase 1 Verification Steps

1. **Unit Tests:**
   - `tests/unit/domain/value-objects/MarketingScience.test.ts` -- test grade boundaries, scoring utilities
   - `tests/unit/infrastructure/knowledge/analyzers/NeuromarketingAnalyzer.test.ts` -- test scoring with sample Korean ads
   - `tests/unit/infrastructure/knowledge/analyzers/MarketingPsychologyAnalyzer.test.ts` -- test Cialdini detection
   - `tests/unit/infrastructure/knowledge/analyzers/CrowdPsychologyAnalyzer.test.ts` -- test FOMO/social proof detection
   - `tests/unit/infrastructure/knowledge/analyzers/MetaBestPracticesAnalyzer.test.ts` -- test format scoring
   - `tests/unit/infrastructure/knowledge/analyzers/ColorPsychologyAnalyzer.test.ts` -- test industry color matching
   - `tests/unit/infrastructure/knowledge/analyzers/CopywritingPsychologyAnalyzer.test.ts` -- test power word density
   - `tests/unit/infrastructure/knowledge/KnowledgeBaseService.test.ts` -- test aggregation + partial failure handling

2. **Integration Test:**
   - Feed a real Korean ad copy through all 6 analyzers
   - Verify composite score is reasonable (not 0, not 100)
   - Verify at least 10 citations produced
   - Verify recommendations are actionable
   - Verify partial failure: mock one analyzer to throw, verify 5/6 still produces valid result
   - Verify insufficient failure: mock 4 analyzers to throw, verify `InsufficientAnalysisError`

3. **Type Safety:**
   - `npm run type-check` passes with zero errors
   - Grade boundaries only defined in `MarketingScience.ts` (grep confirms no duplicates)

---

### Phase 2: Multi-Domain Analysis Engine + Enhanced AI Service

**Goal:** Create the orchestrator service and the ScienceAIService decorator that enriches inputs with science context before delegating to the inner IAIService.

**Estimated effort:** 3-4 days
**Files to create:** 7 new files
**Files to modify:** 3 existing files (additive only, plus IAIService from Phase 1)

#### Task 2.1: Add scienceContext Field to Input DTOs

**File:** `src/application/ports/IAIService.ts` (MODIFY -- additive)

Add optional `scienceContext` field to each input DTO that the decorator will populate:

```typescript
// Add to GenerateAdCopyInput:
export interface GenerateAdCopyInput {
  // ... existing fields unchanged ...
  /** Science-backed context injected by ScienceAIService decorator */
  scienceContext?: string
}

// Add to GenerateOptimizationInput:
export interface GenerateOptimizationInput {
  // ... existing fields unchanged ...
  scienceContext?: string
}

// Add to GenerateCreativeVariantsInput:
export interface GenerateCreativeVariantsInput {
  // ... existing fields unchanged ...
  scienceContext?: string
}
```

**File:** `src/infrastructure/external/openai/prompts/adCopyGeneration.ts` (MODIFY -- additive)

Update prompt builder to include scienceContext if present:

```typescript
// In buildAdCopyPrompt():
export function buildAdCopyPrompt(input: GenerateAdCopyInput): string {
  // ... existing prompt building logic unchanged ...

  // Add at end of prompt, before return:
  if (input.scienceContext) {
    prompt += `\n\n## Science-Backed Marketing Intelligence\n${input.scienceContext}`
  }

  return prompt
}
```

Similarly update `buildCampaignOptimizationPrompt()` and `buildCreativeTestDesignPrompt()`.

**Acceptance criteria:**
- `scienceContext` is optional (undefined by default) -- no breaking changes
- Existing callers that don't provide `scienceContext` see identical behavior
- Prompt builders only include science section when `scienceContext` is present
- Type-check passes

---

#### Task 2.2: MarketingIntelligenceService (Orchestrator)

**File:** `src/application/services/MarketingIntelligenceService.ts`

```typescript
import type { IKnowledgeBaseService, AnalysisInput } from '@application/ports/IKnowledgeBaseService'
import type { GenerateAdCopyInput } from '@application/ports/IAIService'
import type { CompositeScore } from '@domain/value-objects/MarketingScience'

export class MarketingIntelligenceService {
  constructor(
    private readonly knowledgeBase: IKnowledgeBaseService  // PORT, not infrastructure class
  ) {}

  /**
   * Analyze input across all 6 domains.
   * Returns composite score and formatted knowledge context string.
   */
  analyze(input: AnalysisInput): { compositeScore: CompositeScore; knowledgeContext: string } {
    const output = this.knowledgeBase.analyzeAll(input)
    return {
      compositeScore: output.compositeScore,
      knowledgeContext: output.knowledgeContext,
    }
  }

  /**
   * Score existing content without generating new content (no AI call).
   */
  scoreContent(input: AnalysisInput): CompositeScore {
    return this.knowledgeBase.analyzeAll(input).compositeScore
  }

  /**
   * Map GenerateAdCopyInput -> AnalysisInput
   */
  mapAdCopyToAnalysisInput(input: GenerateAdCopyInput & { industry?: string }): AnalysisInput {
    return {
      content: {
        brand: input.productName,
        primaryText: input.productDescription,
      },
      context: {
        targetAudience: input.targetAudience,
        objective: input.objective,
        tone: input.tone,
        keywords: input.keywords,
        industry: input.industry,
      },
    }
  }

  /**
   * Map GenerateOptimizationInput -> AnalysisInput
   */
  mapOptimizationToAnalysisInput(input: import('@application/ports/IAIService').GenerateOptimizationInput): AnalysisInput {
    return {
      context: {
        targetAudience: input.targetAudience?.ageRange,
        objective: input.objective as 'awareness' | 'consideration' | 'conversion' | undefined,
        industry: input.industry,
      },
      metrics: {
        ctr: input.currentMetrics.ctr,
        cvr: input.currentMetrics.cvr,
        roas: input.currentMetrics.roas,
        cpa: input.currentMetrics.cpa,
      },
    }
  }
}
```

**Acceptance criteria:**
- Depends on `IKnowledgeBaseService` port (NOT infrastructure `KnowledgeBaseService`)
- `mapAdCopyToAnalysisInput()` maps: productName -> content.brand, productDescription -> content.primaryText, targetAudience -> context.targetAudience, tone -> context.tone, keywords -> context.keywords
- `mapOptimizationToAnalysisInput()` maps metrics and context correctly
- Knowledge base analysis is synchronous (no API calls)
- Unit testable with mocked `IKnowledgeBaseService`

---

#### Task 2.3: ScienceAIService (Decorator)

**File:** `src/infrastructure/external/openai/ScienceAIService.ts`

Decorator that wraps `IAIService`, enriches inputs with `scienceContext`, and delegates:

```typescript
import type {
  IAIService,
  GenerateAdCopyInput,
  GenerateOptimizationInput,
  AdCopyVariant,
  CampaignOptimizationSuggestion,
  // ... other types
} from '@application/ports/IAIService'
import type { CompositeScore } from '@domain/value-objects/MarketingScience'
import type { MarketingIntelligenceService } from '@application/services/MarketingIntelligenceService'
import { withSpan } from '@infrastructure/telemetry'

export interface ScienceBackedResult<T> {
  result: T
  scienceAnalysis: CompositeScore
}

export class ScienceAIService implements IAIService {
  constructor(
    private readonly inner: IAIService,
    private readonly intelligence: MarketingIntelligenceService
  ) {}

  // --- Decorator methods: enrich input, then delegate ---

  async generateAdCopy(input: GenerateAdCopyInput): Promise<AdCopyVariant[]> {
    // Enrich with science context
    const analysisInput = this.intelligence.mapAdCopyToAnalysisInput(input)
    const { knowledgeContext } = this.intelligence.analyze(analysisInput)
    const enrichedInput: GenerateAdCopyInput = { ...input, scienceContext: knowledgeContext }
    // Delegate to inner service
    return this.inner.generateAdCopy(enrichedInput)
  }

  // Science-backed version that also returns the analysis
  async generateScienceBackedAdCopy(
    input: GenerateAdCopyInput & { industry?: string }
  ): Promise<ScienceBackedResult<AdCopyVariant[]>> {
    return withSpan('science.generateAdCopy', async () => {
      const analysisInput = this.intelligence.mapAdCopyToAnalysisInput(input)
      const { compositeScore, knowledgeContext } = this.intelligence.analyze(analysisInput)
      const enrichedInput: GenerateAdCopyInput = { ...input, scienceContext: knowledgeContext }
      const result = await this.inner.generateAdCopy(enrichedInput)
      return { result, scienceAnalysis: compositeScore }
    })
  }

  // Passthrough for chatCompletion (public via IAIService)
  async chatCompletion(systemPrompt: string, userPrompt: string, config?: import('@application/ports/IAIService').AIConfig): Promise<string> {
    return this.inner.chatCompletion(systemPrompt, userPrompt, config)
  }

  // ... all other IAIService methods delegate to inner with same pattern
  // For methods without clear science mapping, delegate directly without enrichment

  async generateCampaignOptimization(input: GenerateOptimizationInput) {
    const analysisInput = this.intelligence.mapOptimizationToAnalysisInput(input)
    const { knowledgeContext } = this.intelligence.analyze(analysisInput)
    return this.inner.generateCampaignOptimization({ ...input, scienceContext: knowledgeContext })
  }

  // generateReportInsights, generateBudgetRecommendation, generateCreativeVariants
  // delegate directly to inner (enrich where mapping exists)
}
```

**Acceptance criteria:**
- Implements `IAIService` interface fully (all methods including new `chatCompletion`)
- All existing `IAIService` methods work through decorator (passthrough or enriched)
- Enrichment is INPUT-based: populates `scienceContext` field on input DTOs, NOT prompt replacement
- Does NOT call `chatCompletion` directly for existing methods (uses input enrichment pattern)
- `generateScienceBackedAdCopy()` is a NEW method (not on `IAIService` interface) that returns both result and analysis
- Telemetry spans for science-enhanced methods
- Can be used as drop-in replacement for `IAIService` in DI container

---

#### Task 2.4: Science-Enhanced Prompts

**File:** `src/infrastructure/external/openai/prompts/science/scienceSystemPrompt.ts`

```typescript
/**
 * Builds a science-enhanced system prompt by appending science context
 * to an existing base system prompt.
 * Used by science-only endpoints (not by the decorator pattern).
 */
export function buildScienceEnhancedSystemPrompt(
  baseSystemPrompt: string,
  knowledgeContext: string,
  compositeScore: import('@domain/value-objects/MarketingScience').CompositeScore
): string {
  return `${baseSystemPrompt}

## Science-Backed Marketing Intelligence

Analysis Results (Composite Score: ${compositeScore.overall}/100, Grade: ${compositeScore.grade})

${knowledgeContext}

### Response Enhancement Rules
1. Reference specific scientific findings when making recommendations
2. Include the relevant citation for each major recommendation
3. Prioritize recommendations that address the lowest-scoring domains
4. For Korean market: always consider cultural context from the analysis`
}
```

**File:** `src/infrastructure/external/openai/prompts/science/domainAnalysisPrompt.ts`

Templates for formatting each domain's analysis as prompt context.

**File:** `src/infrastructure/external/openai/prompts/science/scienceCopyPrompt.ts`

Enhanced ad copy prompt for science-only endpoints.

**File:** `src/infrastructure/external/openai/prompts/science/index.ts`

Barrel export.

**Acceptance criteria:**
- System prompt stays under 4000 tokens after injection
- Knowledge context is formatted concisely (not full citations, just key findings)
- Korean language maintained throughout
- These prompts are used by science-ONLY endpoints, NOT by the decorator pattern (which uses input enrichment)

---

#### Task 2.5: DI Container Registration

**File:** `src/lib/di/types.ts` (MODIFY -- additive)

Add new DI tokens:

```typescript
// Add to DI_TOKENS object:

  // Knowledge Base
  KnowledgeBaseService: Symbol.for('KnowledgeBaseService'),

  // Science Services
  MarketingIntelligenceService: Symbol.for('MarketingIntelligenceService'),
  ScienceAIService: Symbol.for('ScienceAIService'),
```

**File:** `src/lib/di/container.ts` (MODIFY -- additive)

Register new services:

```typescript
// Add imports:
import type { IKnowledgeBaseService } from '@application/ports/IKnowledgeBaseService'
import { KnowledgeBaseService } from '@infrastructure/knowledge/KnowledgeBaseService'
import { MarketingIntelligenceService } from '@application/services/MarketingIntelligenceService'
import { ScienceAIService } from '@infrastructure/external/openai/ScienceAIService'

// Add after existing AIService registration:
container.registerSingleton<IKnowledgeBaseService>(
  DI_TOKENS.KnowledgeBaseService,
  () => new KnowledgeBaseService()
)

container.registerSingleton(
  DI_TOKENS.MarketingIntelligenceService,
  () => new MarketingIntelligenceService(
    container.resolve(DI_TOKENS.KnowledgeBaseService)
  )
)

container.registerSingleton(
  DI_TOKENS.ScienceAIService,
  () => new ScienceAIService(
    container.resolve(DI_TOKENS.AIService),
    container.resolve(DI_TOKENS.MarketingIntelligenceService)
  )
)

// Add convenience functions:
export function getMarketingIntelligenceService(): MarketingIntelligenceService {
  return container.resolve(DI_TOKENS.MarketingIntelligenceService)
}

export function getScienceAIService(): ScienceAIService {
  return container.resolve(DI_TOKENS.ScienceAIService)
}

export function getKnowledgeBaseService(): IKnowledgeBaseService {
  return container.resolve(DI_TOKENS.KnowledgeBaseService)
}
```

**Acceptance criteria:**
- No changes to existing registrations
- New tokens follow naming convention (PascalCase symbol name)
- New services registered as singletons (same as existing pattern)
- `MarketingIntelligenceService` resolves `KnowledgeBaseService` via DI (port-based)
- `ScienceAIService` wraps the existing `AIService` (decorator pattern)
- Convenience functions: `getScienceAIService()`, `getMarketingIntelligenceService()`, `getKnowledgeBaseService()`

---

#### Task 2.6: New API Endpoints

**File:** `src/app/api/ai/science-copy/route.ts`

New endpoint that returns science-backed ad copy.

```typescript
// POST /api/ai/science-copy
// Same input as /api/ai/copy but returns { variants: AdCopyVariant[], scienceAnalysis: CompositeScore }
// Uses quota type: AI_SCIENCE (NEW, separate from AI_ANALYSIS)
// Quota limit: 10/week
```

**File:** `src/app/api/ai/science-score/route.ts`

New endpoint that scores existing content (FREE, no quota).

```typescript
// POST /api/ai/science-score
// Input: { headline?, primaryText?, description?, callToAction?, industry?, targetAudience? }
// Returns: CompositeScore (no AI call needed -- pure knowledge base scoring)
// NO QUOTA -- this is free, pure local computation
```

**File:** `src/app/api/ai/science-analyze/route.ts`

New endpoint for full science analysis with AI-enhanced recommendations.

```typescript
// POST /api/ai/science-analyze
// Input: AnalysisInput (full analysis input)
// Returns: { scienceAnalysis: CompositeScore, aiRecommendations: string[] }
// Uses quota type: AI_SCIENCE (10/week)
```

**Acceptance criteria:**
- Same auth/rate-limiting pattern as existing `/api/ai/copy`
- `/api/ai/science-score` is FREE -- no quota enforcement
- `/api/ai/science-copy` and `/api/ai/science-analyze` use new `AI_SCIENCE` quota type
- New `AI_SCIENCE` quota: 10/week (separate from existing `AI_ANALYSIS` which is 5/week)
- Error handling matches existing patterns
- Returns proper HTTP status codes

---

#### Task 2.7: Quota System Update

**File:** `src/domain/repositories/IUsageLogRepository.ts` (MODIFY -- additive)

```typescript
// Change:
export type UsageType = 'CAMPAIGN_CREATE' | 'AI_COPY_GEN' | 'AI_ANALYSIS'
// To:
export type UsageType = 'CAMPAIGN_CREATE' | 'AI_COPY_GEN' | 'AI_ANALYSIS' | 'AI_SCIENCE'
```

**File:** `src/application/services/QuotaService.ts` (MODIFY -- additive)

```typescript
// Add to QUOTA_LIMITS:
const QUOTA_LIMITS: QuotaLimits = {
  CAMPAIGN_CREATE: { count: 5, period: 'week' },
  AI_COPY_GEN: { count: 20, period: 'day' },
  AI_ANALYSIS: { count: 5, period: 'week' },
  AI_SCIENCE: { count: 10, period: 'week' },  // NEW: higher because it provides more value
}
```

**Acceptance criteria:**
- `AI_SCIENCE` is a separate quota type (does NOT consume `AI_ANALYSIS` quota)
- 10/week limit for `AI_SCIENCE`
- `/api/ai/science-score` does NOT consume any quota
- Existing quota types and limits unchanged
- `QuotaLimits` type updated to include `AI_SCIENCE`

---

### Phase 2 Verification Steps

1. **Unit Tests:**
   - `tests/unit/application/services/MarketingIntelligenceService.test.ts` -- test with mocked IKnowledgeBaseService
   - `tests/unit/infrastructure/openai/ScienceAIService.test.ts` -- test decorator enrichment + delegation
   - `tests/unit/infrastructure/openai/ScienceAIService.test.ts` -- verify scienceContext populated on input
   - Input mapping tests: `GenerateAdCopyInput` -> `AnalysisInput` field mapping

2. **Integration Test:**
   - Call `/api/ai/science-score` with sample Korean ad copy -- verify response, verify NO quota consumed
   - Call `/api/ai/science-copy` -- verify enriched output with science analysis
   - Verify `AI_SCIENCE` quota is consumed (not `AI_ANALYSIS`)
   - Verify `/api/ai/science-score` is free (call 100 times, no quota error)

3. **Backward Compatibility:**
   - Call `/api/ai/copy` (original endpoint) -- verify unchanged behavior
   - Verify `scienceContext` is NOT present in original endpoint responses
   - Run all existing tests -- verify zero regressions

4. **Performance:**
   - Science scoring (no AI call) completes in < 50ms
   - Science-backed copy generation completes in < 10 seconds (same as regular copy)
   - Input enrichment adds < 5ms overhead

---

### Phase 3: Research Enhancement Layer (OPTIONAL)

**Goal:** Add optional real-time research capability via external APIs (Perplexity, Tavily, or similar) for market trends and competitor data. Also: add mecab-ko Korean NLP integration for improved text analysis.

**Estimated effort:** 2-3 days
**Files to create:** 4 new files
**Files to modify:** 2 files

#### Task 3.1: IResearchService Port

**File:** `src/application/ports/IResearchService.ts`

```typescript
export interface ResearchQuery {
  topic: string
  market: 'KR' | 'US' | 'global'
  recency: 'last_week' | 'last_month' | 'last_quarter' | 'last_year'
}

export interface ResearchResult {
  findings: string[]
  sources: { title: string; url: string; date: string }[]
  relevanceScore: number
}

export interface IResearchService {
  research(query: ResearchQuery): Promise<ResearchResult>
  getMarketTrends(industry: string, market: string): Promise<ResearchResult>
  getCompetitorIntelligence(keywords: string[]): Promise<ResearchResult>
}
```

#### Task 3.2: Research Service Implementation

**File:** `src/infrastructure/external/research/PerplexityResearchService.ts`

Implementation using Perplexity API (or Tavily as alternative).

#### Task 3.3: Korean NLP Enhancement (mecab-ko)

Optional mecab-ko integration for improved Korean text analysis:
- Morphological analysis for more accurate word counting
- Part-of-speech tagging for power word detection
- Graceful fallback to keyword matching when mecab not available

#### Task 3.4: Integration with Intelligence Service

Modify `MarketingIntelligenceService` to optionally include research results in knowledge context.

#### Task 3.5: Environment Variables

Add to `.env.example`:
```
# Research API (Optional - Phase 3)
PERPLEXITY_API_KEY=""
RESEARCH_ENABLED=false
```

**Acceptance criteria:**
- Research is opt-in via `RESEARCH_ENABLED` env var
- Graceful degradation when research API is unavailable
- Research results cached (in-memory, 1 hour TTL)
- Cost: max 1 research API call per user request
- mecab-ko is optional; system works without it

---

### Phase 3 Verification Steps

1. Test with `RESEARCH_ENABLED=false` -- system works without research
2. Test with `RESEARCH_ENABLED=true` -- research results included in analysis
3. Test API error handling -- graceful degradation

---

### Phase 4: UI/UX for Science-Backed Recommendations

**Goal:** Display science scores, citations, and domain breakdowns in the frontend using TanStack Query for data fetching.

**Estimated effort:** 2-3 days
**Files to create:** 6 new files
**Files to modify:** 2-3 existing files

#### Task 4.1: useMarketingIntelligence Hook

**File:** `src/presentation/hooks/useMarketingIntelligence.ts`

TanStack Query hook for fetching science analysis:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'

interface UseMarketingIntelligenceOptions {
  headline?: string
  primaryText?: string
  description?: string
  callToAction?: string
  industry?: string
  targetAudience?: string
}

export function useMarketingIntelligence(options: UseMarketingIntelligenceOptions) {
  // Query for scoring (free, no quota)
  const scoreQuery = useQuery({
    queryKey: ['science-score', options],
    queryFn: () => fetch('/api/ai/science-score', {
      method: 'POST',
      body: JSON.stringify(options),
    }).then(r => r.json()),
    staleTime: 300_000, // 5 minutes cache
    enabled: !!(options.headline || options.primaryText),
  })

  // Mutation for full analysis (uses quota)
  const analyzeMutation = useMutation({
    mutationFn: (input: UseMarketingIntelligenceOptions) =>
      fetch('/api/ai/science-analyze', {
        method: 'POST',
        body: JSON.stringify(input),
      }).then(r => r.json()),
  })

  return {
    score: scoreQuery.data,
    isScoring: scoreQuery.isLoading,
    analyze: analyzeMutation.mutate,
    analysis: analyzeMutation.data,
    isAnalyzing: analyzeMutation.isPending,
  }
}
```

**Acceptance criteria:**
- Uses TanStack Query (already in project dependencies)
- Score query: staleTime 300000ms (5 minutes)
- No new Zustand store needed
- Integrates with existing query client
- Score query is enabled only when there is content to analyze
- Full analysis uses mutation (since it costs quota)

---

#### Task 4.2: ScienceScore Component

**File:** `src/presentation/components/ai/ScienceScore.tsx`

Visual score display with circular progress, grade badge, and color coding.

**Acceptance criteria:**
- Uses shadcn/ui components
- Circular progress indicator (0-100)
- Grade badge with color: A+/A = green, B+/B = blue, C+/C = yellow, D/F = red
- Grade boundaries imported from `MarketingScience.ts` (via utility, not redefined)
- Korean labels

---

#### Task 4.3: CitationCard Component

**File:** `src/presentation/components/ai/CitationCard.tsx`

Expandable card showing source, finding, and applicability.

---

#### Task 4.4: DomainBreakdown Component

**File:** `src/presentation/components/ai/DomainBreakdown.tsx`

Radar chart or bar chart showing 6 domain scores. Shows `analyzedDomains` count (e.g., "5/6 domains analyzed").

---

#### Task 4.5: EvidenceBadge Component

**File:** `src/presentation/components/ai/EvidenceBadge.tsx`

Small inline badge for individual recommendations showing confidence level.

---

#### Task 4.6: Integration with Existing Pages

Modify ad copy generation page to optionally show science analysis alongside results.

**Acceptance criteria:**
- Components use shadcn/ui and Tailwind CSS 4 (existing design system)
- Korean text throughout
- Responsive design (mobile-first)
- Accessible (WCAG 2.1 AA)
- Score visualization is intuitive (green = good, red = needs work)
- Shows partial analysis indicator when some domains failed (e.g., "5/6 domains analyzed")

---

### Phase 4 Verification Steps

1. Visual review of all new components in dev server
2. Accessibility audit (color contrast, screen reader, keyboard navigation)
3. Mobile responsiveness check
4. E2E test: user generates science-backed copy and sees analysis
5. Verify `useMarketingIntelligence` hook caches score results for 5 minutes

---

## Risk Identification

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Prompt too long after science injection** | Medium | High | Limit knowledge context to top 3 findings per domain; set 4000 token budget for science context |
| **Science scoring is inaccurate for Korean text** | Medium | Medium | Build Korean-specific word lists (30+ words); test with real Korean ad samples; iterate with native speakers; plan mecab-ko for Phase 3 |
| **OpenAI cost increase from longer prompts** | Low | Medium | Knowledge context adds ~1000 tokens; cost increase is ~$0.003/request; monitor via telemetry |
| **Backward compatibility break** | Low | Critical | Zero modifications to existing methods; all changes are additive; run full test suite before merge |
| **Knowledge base becomes stale** | Medium | Low | Version knowledge base with dates; add "last verified" field; Phase 3 research layer provides fresh data |
| **Over-engineering for MVP** | Medium | Medium | Phase 1 is the critical deliverable; Phases 3-4 are optional; start simple, iterate |
| **Analysis too slow** | Low | Medium | Knowledge base analysis is pure computation (no I/O); expect < 50ms; add telemetry to verify |
| **Partial domain failure cascade** | Low | Medium | Minimum 3/6 domains required; InsufficientAnalysisError with clear diagnostics; individual analyzer errors logged but isolated |
| **Grade boundary inconsistency** | Low | High | Single source of truth in MarketingScience.ts; all other code imports from there; no duplicate definitions |
| **ScienceAIService decorator breaks IAIService contract** | Low | Critical | Decorator implements full IAIService interface; existing callers unaware of enrichment; all methods tested |

---

## Commit Strategy

| Phase | Commit | Description |
|-------|--------|-------------|
| 1.1 | `feat(domain): add MarketingScience value objects with grade boundaries and scoring utilities` | Single source of truth for types, grades, scoring |
| 1.2 | `feat(application): add IKnowledgeBaseService port with AnalysisInput/Output DTOs` | Application-layer port and DTOs |
| 1.3 | `feat(ports): expose chatCompletion on IAIService interface` | Make chatCompletion public, fix ChatService tech debt |
| 1.4-1.9 | `feat(knowledge): codify 6 marketing science domain analyzers with citations` | All 6 analyzers in infrastructure/knowledge/ |
| 1.10-1.12 | `feat(knowledge): add Korean power words and scoring data modules` | Data files |
| 1.13-1.14 | `feat(knowledge): implement KnowledgeBaseService with partial failure handling` | Aggregator service |
| 1.tests | `test(knowledge): add unit tests for all 6 domains and aggregation` | Test files |
| 2.1 | `feat(ports): add scienceContext field to input DTOs for decorator enrichment` | Input DTO changes + prompt builder updates |
| 2.2 | `feat(intelligence): add MarketingIntelligenceService with input mappers` | Orchestrator service |
| 2.3 | `feat(ai): implement ScienceAIService decorator with input enrichment pattern` | Decorator implementation |
| 2.4 | `feat(prompts): add science-enhanced prompt templates` | Science prompts |
| 2.5 | `feat(di): register knowledge base and science AI services in DI container` | DI changes |
| 2.6-2.7 | `feat(api): add science-copy, science-score, science-analyze endpoints with AI_SCIENCE quota` | API routes + quota type |
| 2.tests | `test(intelligence): add tests for science AI service, decorator, and endpoints` | Test files |
| 3.* | `feat(research): add optional research enhancement layer with Korean NLP` | Research integration |
| 4.1 | `feat(hooks): add useMarketingIntelligence TanStack Query hook` | Data fetching hook |
| 4.2-4.6 | `feat(ui): add science-backed recommendation display components` | UI components |

---

## Success Criteria

1. **Functional:** Science-backed copy generation produces output with 6-domain scores, 10+ citations, and actionable recommendations
2. **Quality:** All domain analyzers have >= 90% test coverage
3. **Performance:** Science scoring adds < 50ms to response time; total API response time < 12 seconds
4. **Compatibility:** All existing tests pass; existing API endpoints return identical responses; `scienceContext` field is invisible to existing callers
5. **Accuracy:** Science scores correlate with ad performance (validated manually on 10 sample Korean ads)
6. **Usability:** Science analysis is understandable by non-technical Korean e-commerce operators
7. **Resilience:** Partial domain failure (up to 3/6) produces valid results; fewer than 3/6 throws clear error
8. **Architecture:** No duplicate grade boundaries; `MarketingIntelligenceService` depends only on port; knowledge base at `infrastructure/knowledge/` (not `external/`)
9. **Quota:** `science-score` is free; `science-copy` and `science-analyze` use separate `AI_SCIENCE` quota (10/week)
10. **UI:** `useMarketingIntelligence` hook caches scores for 5 minutes via TanStack Query

---

## Estimated File Changes Summary

| Phase | New Files | Modified Files | Test Files |
|-------|-----------|---------------|------------|
| Phase 1 | 16 | 1 (IAIService.ts, AIService.ts) | 9 |
| Phase 2 | 7 | 4 (IAIService.ts, adCopy prompt, container, types, quota) | 4 |
| Phase 3 | 4 | 2 | 3 |
| Phase 4 | 6 | 3 | 2 |
| **Total** | **33** | **10** | **18** |

---

## Priority Recommendation

**Phase 1 is the highest-value, lowest-risk deliverable.** It requires minimal modifications to existing code (only making `chatCompletion` public), introduces no new external dependencies, and delivers the core differentiator (science-backed analysis with proper domain/application layer separation).

Phase 2 connects the knowledge base to the AI pipeline via the decorator pattern with input enrichment -- this is where users see the value. Ship Phase 1 + 2 together as the MVP.

Phases 3 and 4 are enhancements. Phase 3 (research + mecab-ko) adds cost and complexity. Phase 4 (UI + TanStack Query hook) adds polish. Both can be deferred.

**Critical architectural invariants to maintain:**
1. Grade boundaries ONLY in `MarketingScience.ts`
2. `MarketingIntelligenceService` depends on `IKnowledgeBaseService` port, not infrastructure class
3. Knowledge base at `src/infrastructure/knowledge/` (NOT `external/`)
4. ScienceAIService uses INPUT ENRICHMENT (`scienceContext` field), not prompt replacement
5. `/api/ai/science-score` is always FREE (no quota)
