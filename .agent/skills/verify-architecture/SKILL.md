---
name: verify-architecture
description: Verifies Clean Architecture layer dependency rules. Detects invalid imports between domain/application/infrastructure layers.
---

# Clean Architecture Layer Dependency Verification

## Purpose

Verifies that Clean Architecture dependency rules (domain <- application <- infrastructure/presentation) are followed:

1. **domain -> application violation** — domain layer importing from application layer
2. **domain -> infrastructure violation** — domain layer importing from infrastructure layer
3. **domain -> presentation violation** — domain layer importing from presentation layer
4. **application -> infrastructure violation** — application layer directly importing infrastructure implementations
5. **application -> presentation violation** — application layer importing from presentation layer

## When to Run

- After adding new entities, use cases, or repositories
- After moving or refactoring code between layers
- After modifying import paths

## Related Files

| File | Purpose |
|------|---------|
| `src/domain/entities/*.ts` | Domain entities (Campaign, Report, KPI, AdSet, Ad, Creative, etc.) |
| `src/domain/value-objects/*.ts` | Value objects (Money, DateRange, SubscriptionPlan, etc.) |
| `src/domain/repositories/*.ts` | Repository interfaces (ports) |
| `src/domain/errors/*.ts` | Domain errors |
| `src/domain/services/IntentClassifier.ts` | Domain service — chat intent classification (pure domain logic, no external deps) |
| `src/domain/services/index.ts` | Domain services barrel export |
| `src/application/use-cases/**/*.ts` | Use cases |
| `src/application/dto/**/*.ts` | DTOs |
| `src/application/ports/IFallbackResponseService.ts` | Fallback response service port interface |
| `src/application/ports/IFewShotExampleRegistry.ts` | Few-shot example registry port interface |
| `src/application/ports/IGuideQuestionService.ts` | Guide question service port interface |
| `src/application/ports/IPromptTemplateService.ts` | Prompt template service port interface |
| `src/application/ports/IResilienceService.ts` | Resilience service port interface |
| `src/application/services/ConversationSummarizerService.ts` | Conversation summarizer service (application layer) |
| `src/application/services/FallbackResponseService.ts` | Fallback response service implementation (application layer) |
| `src/application/services/FewShotExampleRegistry.ts` | Few-shot example registry implementation (application layer) |
| `src/application/services/GuideQuestionService.ts` | Guide question service implementation (application layer) |
| `src/application/services/PromptTemplateService.ts` | Prompt template service implementation (application layer) |
| `src/application/services/KPIInsightsService.ts` | KPI insights service — dynamic baseline + LLM natural language insights (application layer) |
| `src/application/services/QuotaService.ts` | Quota service — usage limit management (application layer) |
| `src/infrastructure/database/**/*.ts` | Prisma repository implementations |
| `src/infrastructure/external/**/*.ts` | External API clients |
| `src/infrastructure/external/errors/CircuitBreaker.ts` | Circuit breaker (infrastructure layer, no domain imports) |
| `src/infrastructure/external/errors/ResilienceService.ts` | Resilience service implementation (infrastructure layer) |
| `src/infrastructure/external/errors/withRetry.ts` | Retry utility (infrastructure layer, no domain imports) |
| `src/domain/value-objects/AuditScore.ts` | Audit score domain value object |
| `src/infrastructure/cache/audit/MemoryAuditCache.ts` | In-memory cache adapter |
| `src/infrastructure/cache/audit/UpstashAuditCache.ts` | Upstash Redis cache adapter |
| `src/infrastructure/cache/audit/auditCacheFactory.ts` | Cache adapter factory |
| `src/application/ports/IEmbeddingService.ts` | Embedding service port interface (RAG) |
| `src/application/ports/IKnowledgeBaseRepository.ts` | Vector search repository port interface (RAG) |
| `src/application/services/KnowledgeIngestionService.ts` | Knowledge ingestion pipeline service (RAG, application layer) |
| `src/application/tools/queries/searchKnowledgeBase.tool.ts` | RAG search tool (application layer) |
| `src/infrastructure/database/repositories/PrismaKnowledgeBaseRepository.ts` | pgvector vector search repository implementation (infrastructure layer) |
| `src/infrastructure/external/openai/OpenAIEmbeddingService.ts` | OpenAI embedding service implementation (infrastructure layer) |
| `src/lib/middleware/routeWrapper.ts` | Route handler wrapper (`withAuth`/`withErrorHandling`) — lib layer |
| `src/domain/repositories/IPermissionRepository.ts` | Permission repository port interface (domain layer) |
| `src/infrastructure/database/repositories/PrismaPermissionRepository.ts` | Permission repository Prisma implementation (infrastructure layer) |
| `src/application/ports/IAppConfig.ts` | App config port interface (application layer) |
| `src/application/services/ReportNotificationService.ts` | Report notification service (Email + Slack) |
| `src/application/services/EnhancedReportDataBuilder.ts` | Enhanced report data builder with AI integration |
| `src/application/ports/IReportPDFGenerator.ts` | PDF generator port interface |
| `src/infrastructure/pdf/ReportPDFGenerator.ts` | PDF generator infrastructure impl |

## Workflow

### Step 1: Detect invalid imports in domain layer

**Check:** Verify that files in `src/domain/` do not import from `application`, `infrastructure`, `presentation`, or `app/`.

```bash
grep -rn "from ['\"]@\?.*\(application\|infrastructure\|presentation\|@/app\)" src/domain/ --include="*.ts" --include="*.tsx"
```

**PASS criteria:** No output
**FAIL criteria:** Any output indicates a violation

**Fix:**
- Define interfaces within domain for types domain needs
- Replace concrete implementation imports with interface imports

### Step 2: Detect direct infrastructure imports in application layer

**Check:** Verify that files in `src/application/` do not directly import infrastructure implementations.

```bash
grep -rn "from ['\"]@\?.*infrastructure" src/application/ --include="*.ts" --include="*.tsx"
```

**PASS criteria:** No output
**FAIL criteria:** Any output indicates a violation

**Fix:**
- Use `src/application/ports/` interfaces instead of infrastructure implementations
- Inject implementations via DI container

### Step 3: Detect presentation imports in application layer

**Check:** Verify that files in `src/application/` do not import from the presentation layer.

```bash
grep -rn "from ['\"]@\?.*presentation" src/application/ --include="*.ts" --include="*.tsx"
```

**PASS criteria:** No output
**FAIL criteria:** Any output indicates a violation

### Step 4: Detect external framework dependencies in domain

**Check:** Verify that files in `src/domain/` do not directly import frameworks like Prisma, Next.js, etc.

```bash
grep -rn "from ['\"]@prisma\|from ['\"]next\|from ['\"]react" src/domain/ --include="*.ts" --include="*.tsx"
```

**PASS criteria:** No output
**FAIL criteria:** Any output indicates a violation

**Fix:**
- If framework types are needed, define custom types/interfaces in domain and convert via adapters in infrastructure

## Output Format

```markdown
### verify-architecture Results

| # | Check | Status | Violating Files |
|---|-------|--------|----------------|
| 1 | domain -> application/infra/presentation | PASS/FAIL | file:line |
| 2 | application -> infrastructure | PASS/FAIL | file:line |
| 3 | application -> presentation | PASS/FAIL | file:line |
| 4 | domain -> external frameworks | PASS/FAIL | file:line |
```

## Exceptions

The following are **NOT violations**:

1. **Intra-domain imports** — Importing other `src/domain/` files within `src/domain/` is allowed
2. **Port imports from application** — `src/application/ports/` files importing from domain for type definitions is normal
3. **Test files** — Files in `tests/` directory may import from all layers
4. **DI container and modules** — `src/lib/di/container.ts` and `src/lib/di/modules/*.module.ts` are allowed to import from all layers for dependency injection
5. **Type-only imports** — `import type` for types only is not a runtime dependency; show warning only
6. **Domain utility libraries** — Pure utility libraries like uuid, zod, date-fns are allowed in domain
7. **routeWrapper** — `src/lib/middleware/routeWrapper.ts` is in the lib layer and may import infrastructure/application (Express middleware pattern)
