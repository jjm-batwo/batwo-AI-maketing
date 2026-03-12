---
description: Comprehensive workflow for implementing new features across Clean Architecture layers
---

# Feature Development Workflow

New features should be implemented in this order: Domain → Application → Infrastructure → Presentation → App.
Apply TDD at every step (RED → GREEN → REFACTOR).

## Step 0: Brainstorming Gate (from Superpowers)

**새 기능 구현 전 brainstorming 프로세스를 거쳤는지 확인합니다.**

| 질문 | No이면 |
|------|--------|
| 요구사항이 명확한가? | → `superpowers-brainstorming` 스킬 활성화 |
| 설계 문서가 존재하는가? | → brainstorming으로 스펙 문서 생성 |
| 사용자 승인을 받았는가? | → 사용자에게 리뷰 요청 |

모든 답이 Yes면 → Step 1로 진행
하나라도 No면 → **brainstorming 먼저**

> 💡 "이건 너무 간단해서 설계가 필요 없다"는 anti-pattern입니다. 간단한 프로젝트에서 검토하지 않은 가정이 가장 많은 시간을 낭비합니다.
---

## Step 1: Domain Modeling

### 1-1. Entity Design and Testing

```bash
# Create test file
# tests/unit/domain/entities/[EntityName].test.ts
```

- Entities use a `private constructor` + `static create()` factory.
- Replace primitives with Value Objects (e.g., `Money`, `DateRange`).
- Self-validation (check validity on creation, throw domain errors).

### 1-2. Repository Interface Definition

```
src/domain/repositories/I[EntityName]Repository.ts
```

- Define CRUD method signatures only.
- Use Domain Entities for input and output.

### 1-3. Error Class Definition

```
src/domain/errors/Invalid[EntityName]Error.ts
```

---

## Step 2: UseCase Implementation

### 2-1. DTO Definition

```
src/application/dto/[feature]/Create[Entity]DTO.ts
src/application/dto/[feature]/[Entity]DTO.ts
```

- Define exactly the Zod schema + TypeScript type simultaneously.

### 2-2. UseCase Testing and Implementation

```bash
# Test file
# tests/unit/application/use-cases/Create[Entity]UseCase.test.ts
```

- Mock the Repository with `vi.fn()`.
- Use constructor injection.
- Single Responsibility: One UseCase per workflow.

### 2-3. Port Interfaces (If external services are needed)

```
src/application/ports/I[Service]Service.ts
```

---

## Step 3: Infrastructure Implementation

### 3-1. Prisma Schema Update (If needed)

```bash
# After modifying prisma/schema.prisma
npx prisma migrate dev --name add_[entity]
npx prisma generate
```

### 3-2. Mapper Implementation

```
src/infrastructure/database/mappers/[Entity]Mapper.ts
```

- `toDomain()`: Prisma model → Domain Entity
- `toPersistence()`: Domain Entity → Prisma model

### 3-3. Repository Implementation + Integration Tests

```
src/infrastructure/database/repositories/Prisma[Entity]Repository.ts
tests/integration/repositories/Prisma[Entity]Repository.test.ts
```

---

## Step 4: DI Container Registration

```typescript
// src/lib/di/types.ts — Add Tokens
export const DI_TOKENS = {
  // ...
  [Entity]Repository: Symbol('[Entity]Repository'),
  Create[Entity]UseCase: Symbol('Create[Entity]UseCase'),
};

// src/lib/di/container.ts — Add Bindings
container.register(DI_TOKENS.[Entity]Repository, Prisma[Entity]Repository);
container.register(DI_TOKENS.Create[Entity]UseCase, Create[Entity]UseCase);
```

> ⚠️ Verify token-registration synchronization using the `verify-di-registration` skill.

---

## Step 5: API Route Implementation

```
src/app/api/[resource]/route.ts
```

1. Check Authentication (`auth()`)
2. Validate Input (Zod `schema.parse()`)
3. Retrieve UseCase from DI (`DI.get()`)
4. Execute UseCase
5. Error Mapping (ZodError→400, DomainError→422)

---

## Step 6: Presentation Implementation

### 6-1. TanStack Query Hook

```
src/presentation/hooks/use[Entities].ts
```

### 6-2. React Components

```
src/presentation/components/[feature]/[Component].tsx
```

### 6-3. Zustand Store (If needed)

```
src/presentation/stores/[feature]Store.ts
```

---

## Step 7: Final Verification

```bash
// turbo
npx tsc --noEmit
// turbo
npx vitest run
// turbo
npx next build
```

---

## Step 8: Plan Index Update

새 Plan 문서를 `docs/plans/PLAN_*.md`에 생성한 경우, 반드시 `docs/plans/MASTER_INDEX.md`를 업데이트합니다.

1. 해당 계획의 상태에 따라 올바른 섹션에 추가:
   - `✅ 완료된 계획` — 완료된 기능
   - `⏳ 진행 중` — 현재 작업 중
   - `📝 미착수` — 아직 시작 안 된 계획
2. 테이블에 계획명, 날짜, 요약, 파일 링크 추가
3. `📊 통계 요약` 섹션의 수량 업데이트

> ⚠️ 이 단계는 Plan 문서를 새로 생성하거나 상태가 변경될 때만 필요합니다.
