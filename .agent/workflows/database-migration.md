---
description: Migration and code update procedures when modifying the Prisma schema
---

# Database Migration Workflow

When modifying the Prisma schema, follow the steps below in order.

---

## Step 1: Modify Schema

Add/edit models in the `prisma/schema.prisma` file.

```prisma
model NewEntity {
  id        String   @id @default(cuid())
  name      String
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Step 2: Create Migration

```bash
npx prisma migrate dev --name [description]
```

Example:
```bash
npx prisma migrate dev --name add_new_entity
```

This command will:
1. Create a SQL migration file (`prisma/migrations/`)
2. Apply the migration to the development DB
3. Regenerate the Prisma Client

---

## Step 3: Check Prisma Client

```bash
// turbo
npx prisma generate
```

Types are updated in the `src/generated/prisma/` directory.

---

## Step 4: Update Code

### 4-1. Domain Entity

```
src/domain/entities/NewEntity.ts
```

- Define domain entities **independent** of Prisma models.
- Include business logic.

### 4-2. Repository Interface

```
src/domain/repositories/INewEntityRepository.ts
```

### 4-3. Mapper

```
src/infrastructure/database/mappers/NewEntityMapper.ts
```

- `toDomain(raw)`: Prisma model → Domain Entity
- `toPersistence(entity)`: Domain Entity → Prisma CreateInput

### 4-4. Repository Implementation

```
src/infrastructure/database/repositories/PrismaNewEntityRepository.ts
```

### 4-5. DI Registration

Update `src/lib/di/types.ts` and `src/lib/di/container.ts`.

---

## Step 5: Update Tests

### Unit Tests
```bash
# Domain Entity Tests
// turbo
npx vitest run tests/unit/domain/entities/NewEntity.test.ts
```

### Integration Tests
```bash
# Repository Integration Tests (Real DB)
npm run test:integration
```

---

## Step 6: Verification

```bash
// turbo
npx tsc --noEmit
// turbo
npx vitest run
// turbo
npx next build
```

---

## Migration Rollback

If problems occur:

```bash
# Check migration status
npx prisma migrate status

# Reset entire development environment (⚠️ Data will be deleted)
npx prisma migrate reset

# See scripts/rollback.sh for production rollbacks
```

---

## Special Notes

- Modifying `prisma/schema.prisma` is a file subject to worktree conflict prevention, so modify it only when a task explicitly demands it.
- In CI, apply migrations using `npx prisma migrate deploy` (not dev).
- If there is an existing Mapper, adding new field mappings is mandatory.
