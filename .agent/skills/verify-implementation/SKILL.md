---
name: verify-implementation
description: Runs all verify skills sequentially to generate an integrated verification report. Use after feature implementation, before PR, or during code review.
disable-model-invocation: true
argument-hint: "[Optional: specific verify skill name]"
---

# Implementation Verification

## Purpose

Sequentially executes all registered `verify-*` skills to perform integrated verification:

- Run checks defined in each skill's Workflow
- Reference each skill's Exceptions to prevent false positives
- Suggest fixes for discovered issues
- Apply fixes and re-verify after user approval

## When to Run

- After implementing a new feature
- Before creating a Pull Request
- During code review
- When auditing codebase rule compliance

## Target Skills

List of verification skills this skill executes sequentially. `/manage-skills` auto-updates this list when creating/deleting skills.

| # | Skill | Description |
|---|-------|-------------|
| 1 | `verify-architecture` | Clean Architecture layer dependency rule verification |
| 2 | `verify-di-registration` | DI container token-registration sync verification |
| 3 | `verify-cache-tags` | ISR cache tag and revalidateTag mapping consistency verification |
| 4 | `verify-bundle` | Bundle optimization verification (namespace import, dev-only leak) |
| 5 | `verify-meta-api-version` | Meta Graph API v25.0 version uniformity verification |
| 6 | `verify-token-encryption` | DB accessToken encryption/decryption consistency verification |
| 7 | `verify-ui-components` | UI component consistency, accessibility, performance pattern verification |
| 8 | `verify-audit-security` | Audit report HMAC signing/verification consistency |
| 9 | `verify-chat-intents` | ChatIntent enum correctly mapped to prompt control branches and UI questions |
| 10 | `verify-domain-analyzers` | Domain analyzer class existence, registry DI, and weight validation |
| 11 | `verify-knowledge-documents` | Markdown file (knowledge base docs) filename rules and H1 header presence |

## Workflow

### Step 1: Introduction

Check the skills listed in the **Target Skills** section above.

If an optional argument is provided, filter to that skill only.

**If 0 registered skills:**

```markdown
## Implementation Verification

No verification skills found. Run `/manage-skills` to create verification skills for your project.
```

End workflow in this case.

**If 1+ registered skills:**

Display the target skills table contents:

```markdown
## Implementation Verification

Running the following verification skills sequentially:

| # | Skill | Description |
|---|-------|-------------|
| 1 | verify-<name1> | <description1> |
| 2 | verify-<name2> | <description2> |

Starting verification...
```

### Step 2: Sequential Execution

For each skill listed in the **Target Skills** table:

#### 2a. Read Skill SKILL.md

Read the skill's `.agent/skills/verify-<name>/SKILL.md` and parse these sections:

- **Workflow** — Check steps and detection commands to execute
- **Exceptions** — Patterns considered not violations
- **Related Files** — Target file list for checks

#### 2b. Execute Checks

Execute each check defined in the Workflow section in order:

1. Use the tool specified in the check (Grep, Glob, Read, Bash) for pattern detection
2. Compare detected results against the skill's PASS/FAIL criteria
3. Exempt patterns matching the Exceptions section
4. Record issues on FAIL:
   - File path and line number
   - Problem description
   - Suggested fix (with code example)

#### 2c. Record Per-Skill Results

Display progress after each skill completes:

```markdown
### verify-<name> Verification Complete

- Check items: N
- Passed: X
- Issues: Y
- Exempted: Z

[Moving to next skill...]
```

### Step 3: Integrated Report

After all skills complete, consolidate results into a single report:

```markdown
## Implementation Verification Report

### Summary

| Verification Skill | Status | Issues | Detail |
|-------------------|--------|--------|--------|
| verify-<name1> | PASS / X issues | N | Detail... |
| verify-<name2> | PASS / X issues | N | Detail... |

**Total issues found: X**
```

**When all verifications pass:**

```markdown
All verifications passed!

Implementation complies with all project rules:

- verify-<name1>: <pass summary>
- verify-<name2>: <pass summary>

Ready for code review.
```

**When issues are found:**

List each issue with file path, problem description, and suggested fix:

```markdown
### Issues Found

| # | Skill | File | Problem | Fix |
|---|-------|------|---------|-----|
| 1 | verify-<name1> | `path/to/file.ts:42` | Problem description | Fix code example |
| 2 | verify-<name2> | `path/to/file.tsx:15` | Problem description | Fix code example |
```

### Step 4: User Action Confirmation

When issues are found, use `AskUserQuestion` to confirm with the user:

```markdown
---

### Fix Options

**X issues found. How would you like to proceed?**

1. **Fix all** — Automatically apply all recommended fixes
2. **Fix individually** — Review and apply each fix one by one
3. **Skip** — Exit without changes
```

### Step 5: Apply Fixes

Apply fixes based on user selection.

**When "Fix all" selected:**

Apply all fixes in order and display progress:

```markdown
## Applying fixes...

- [1/X] verify-<name1>: `path/to/file.ts` fix complete
- [2/X] verify-<name2>: `path/to/file.tsx` fix complete

X fixes complete.
```

**When "Fix individually" selected:**

For each issue, show fix content and confirm approval via `AskUserQuestion`.

### Step 6: Re-verification After Fixes

When fixes are applied, re-run only skills that had issues and compare Before/After:

```markdown
## Post-Fix Re-verification

Re-running skills that had issues...

| Verification Skill | Before | After |
|-------------------|--------|-------|
| verify-<name1> | X issues | PASS |
| verify-<name2> | Y issues | PASS |

All verifications passed!
```

**When issues remain:**

```markdown
### Remaining Issues

| # | Skill | File | Problem |
|---|-------|------|---------|
| 1 | verify-<name> | `path/to/file.ts:42` | Cannot auto-fix — manual review required |

Resolve manually then run `/verify-implementation` again.
```

---

## Exceptions

The following are **NOT problems**:

1. **Projects with no registered skills** — Display guidance message, not an error; end workflow
2. **Skill's own exceptions** — Patterns defined in each verify skill's Exceptions section are not reported as issues
3. **verify-implementation itself** — Does not include itself in the target skills list
4. **manage-skills** — Does not start with `verify-` so is not included in target list

## Related Files

| File | Purpose |
|------|---------|
| `.agent/skills/manage-skills/SKILL.md` | Skill maintenance (manages this file's target skill list) |
| `AGENTS.md` | Project guidelines |
