---
description: Mandatory verification checklist and PR guide before committing code
---

# Code Review Workflow

Before committing code, you must execute the following checklist in sequence.

---

## Step 1: Type Checking

```bash
// turbo
npx tsc --noEmit
```

There should be no TypeScript compilation errors.

---

## Step 2: Linting

```bash
// turbo
npm run lint
```

There should be no ESLint errors. If they can be auto-fixed:

```bash
npm run lint:fix
```

---

## Step 3: Formatting

```bash
// turbo
npm run format:check
```

If the Prettier format is incorrect:

```bash
npm run format
```

---

## Step 4: Unit Testing

```bash
// turbo
npm run test:run
```

Ensure all unit tests pass.

---

## Step 5: Integration Testing (Upon DB modifications)

```bash
npm run test:integration
```

Mandatory execution if there have been changes to Repositories or DB schemas.

---

## Step 6: Build Verification

```bash
// turbo
npm run build
```

The production build must succeed.

---

## Step 7: Architecture Verification (Optional)

Execute verification skills if changes span multiple layers:

- `verify-architecture` — Check for layer dependency violations
- `verify-di-registration` — Check DI token/registration synchronization
- `verify-bundle` — Check bundle size impact
- `verify-token-encryption` — Meta token encryption/decryption consistency

---

## Step 8: Commit

Commit message format: `[type]: [description]`

```bash
git add -A
git commit -m "feat: add Campaign entity with budget validation"
```

| type     | Description |
|----------|-------------|
| feat     | New feature |
| fix      | Bug fix |
| refactor | Refactoring |
| test     | Add/modify tests |
| docs     | Documentation changes |
| chore    | Build/configuration changes |
| style    | Code formatting |
| perf     | Performance optimization |

---

## Step 9: Create PR (Optional)

Contents to include in the PR description:
- Summary of changes
- Relevant test results
- Screenshots (if UI modified)
- Whether a migration is necessary

---

## Summary Checklist

```
[ ] tsc --noEmit → PASS
[ ] npm run lint → PASS
[ ] npm run format:check → PASS
[ ] npm run test:run → PASS
[ ] npm run test:integration → PASS (if applicable)
[ ] npm run build → PASS
[ ] Architecture Verification → PASS (if applicable)
[ ] Adheres to commit message format
```

---

## Issue Severity Classification (from Superpowers)

리뷰 이슈 발견 시 심각도를 분류합니다:

| 심각도 | 설명 | 조치 |
|---|---|---|
| 🔴 **Critical** | 런타임 에러, 데이터 손실, 보안 취약점 | **작업 중단** — 반드시 수정 후 진행 |
| 🟡 **Major** | 로직 오류, 성능 이슈, 테스트 누락 | 커밋 전 수정 |
| 🟢 **Minor** | 네이밍, 포매팅, 사소한 개선 | 가능하면 수정, 아니면 후속 이슈 |

> **Critical 이슈가 1개라도 있으면 머지/PR 진행 금지**

---

## Receiving Code Review (from Superpowers)

코드 리뷰 피드백을 받았을 때:

1. **방어하지 마세요** — 피드백은 코드에 대한 것, 사람에 대한 게 아님
2. **모든 이슈에 응답** — 각 이슈에 "수정 완료" 또는 "반대 의견과 이유"
3. **수정 후 재검증** — 수정사항이 다른 것을 깨뜨리지 않았는지 확인
4. **"동의하지 않음"은 OK** — 이유를 설명하고 논의

