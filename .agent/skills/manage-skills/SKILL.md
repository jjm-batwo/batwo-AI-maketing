---
name: manage-skills
description: Analyzes session changes to detect verification skill gaps. Dynamically discovers existing skills, creates new skills or updates existing ones, then syncs related documents.
disable-model-invocation: true
argument-hint: "[Optional: specific skill name or area to focus on]"
---

# Session-Based Skill Maintenance

## Purpose

Analyzes changes made in the current session to detect verification skill drift and fix it:

1. **Coverage gap** — Changed files not referenced by any verify skill
2. **Invalid references** — Skills referencing deleted or moved files
3. **Missing checks** — New patterns/rules not covered by existing checks
4. **Stale values** — Configuration values or detection commands that no longer match

## When to Run

- After implementing a feature that introduces new patterns or rules
- When you want to check consistency after modifying an existing verify skill
- Before a PR, to confirm verify skills cover changed areas
- When verification runs miss expected issues
- Periodically to align skills with codebase evolution

## Registered Verification Skills

Currently registered verification skills for this project. Update this list when creating/deleting skills.

| Skill | Description | Covered File Patterns |
|-------|-------------|----------------------|
| `verify-architecture` | Clean Architecture layer dependency rule verification | `src/domain/**`, `src/application/**`, `src/infrastructure/**` |
| `verify-di-registration` | DI container token-registration sync verification (incl. modular) | `src/lib/di/types.ts`, `src/lib/di/container.ts`, `src/lib/di/modules/*.module.ts`, `src/domain/repositories/**`, `src/application/ports/**` |
| `verify-cache-tags` | ISR cache tag and revalidateTag mapping consistency verification | `src/app/api/**`, `src/app/(dashboard)/**/page.tsx`, `src/app/(admin)/**/page.tsx` |
| `verify-bundle` | Bundle optimization verification (namespace import, dev-only leak, ssr:false) | `src/**/*.ts`, `src/**/*.tsx`, `package.json` |
| `verify-meta-api-version` | Meta Graph API v25.0 version uniformity verification | `src/infrastructure/external/meta-*/**`, `src/infrastructure/auth/**`, `src/app/api/meta/**`, `scripts/*` |
| `verify-token-encryption` | DB accessToken encryption/decryption consistency verification | `src/app/api/meta/**`, `src/application/use-cases/**`, `src/application/utils/TokenEncryption.ts`, `src/infrastructure/database/repositories/**` |
| `verify-ui-components` | UI component consistency, accessibility, performance pattern verification (landing/dashboard/campaign/chat/optimization/pixel/onboarding/audit) | `src/presentation/components/landing/**`, `src/presentation/components/dashboard/**`, `src/presentation/components/campaign/**`, `src/presentation/components/chat/**`, `src/presentation/components/optimization/**`, `src/presentation/components/pixel/**`, `src/presentation/components/onboarding/**`, `src/presentation/components/audit/**`, `src/presentation/hooks/**`, `src/presentation/utils/**`, `src/app/(dashboard)/campaigns/**/*Client.tsx` |
| `verify-audit-security` | Audit report HMAC signing/verification consistency | `src/lib/security/**`, `src/app/api/audit/**` |

## Workflow

### Step 1: Analyze Session Changes

Collect all files changed in the current session:

```bash
# Uncommitted changes
git diff HEAD --name-only

# Commits on current branch (if branched from main)
git log --oneline main..HEAD 2>/dev/null

# All changes since branching from main
git diff main...HEAD --name-only 2>/dev/null
```

Merge into a deduplicated list. If an optional argument specifies a skill name or area, filter to related files only.

**Display:** Group files by top-level directory (first 1-2 path segments):

```markdown
## Session Changes Detected

**N files changed in this session:**

| Directory | Files |
|-----------|-------|
| src/components | `Button.tsx`, `Modal.tsx` |
| src/server | `router.ts`, `handler.ts` |
| tests | `api.test.ts` |
| (root) | `package.json`, `.eslintrc.js` |
```

### Step 2: Map Changed Files to Registered Skills

Refer to the **Registered Verification Skills** section above to build file-to-skill mapping.

#### Sub-step 2a: Check Registered Skills

Read each skill's name and covered file patterns from the **Registered Verification Skills** table.

If 0 registered skills, skip directly to Step 4 (CREATE vs UPDATE decision). All changed files are treated as "UNCOVERED".

If 1+ registered skills, read each skill's `.agent/skills/verify-<name>/SKILL.md` and extract additional file path patterns from:

1. **Related Files** section — parse tables for file paths and glob patterns
2. **Workflow** section — extract file paths from grep/glob/read commands

#### Sub-step 2b: Match Changed Files to Skills

For each changed file from Step 1, match against registered skill patterns. A file matches a skill when:

- It matches the skill's covered file patterns
- It is located within a directory referenced by the skill
- It matches regex/string patterns used in the skill's detection commands

#### Sub-step 2c: Display Mapping

```markdown
### File → Skill Mapping

| Skill | Trigger Files (changed) | Action |
|-------|------------------------|--------|
| verify-api | `router.ts`, `handler.ts` | CHECK |
| verify-ui | `Button.tsx` | CHECK |
| (no skill) | `package.json`, `.eslintrc.js` | UNCOVERED |
```

### Step 3: Coverage Gap Analysis for Affected Skills

For each AFFECTED skill (with matched changed files), read the full SKILL.md and check:

1. **Missing file references** — Changed files related to this skill's domain not listed in Related Files?
2. **Stale detection commands** — Do the skill's grep/glob patterns still match current file structure? Run sample commands to test.
3. **Uncovered new patterns** — Read changed files and identify new rules, settings, patterns the skill doesn't check. Look for:
   - New type definitions, enum variants, or exported symbols
   - New registrations or configurations
   - New file naming or directory conventions
4. **Orphaned references** — Files in the skill's Related Files that no longer exist in the codebase?
5. **Changed values** — Have specific values the skill checks (identifiers, config keys, type names) been modified in changed files?

Record each gap found:

```markdown
| Skill | Gap Type | Detail |
|-------|----------|--------|
| verify-api | Missing file | `src/server/newHandler.ts` not in Related Files |
| verify-ui | New pattern | New component uses unchecked rule |
| verify-test | Stale value | Test runner pattern in config file changed |
```

### Step 4: CREATE vs UPDATE Decision

Apply this decision tree:

```
For each group of uncovered files:
    IF files are related to an existing skill's domain:
        → Decision: UPDATE existing skill (expand coverage)
    ELSE IF 3+ related files share common rules/patterns:
        → Decision: CREATE new verify skill
    ELSE:
        → Mark as "exempt" (no skill needed)
```

Present results to user:

```markdown
### Proposed Actions

**Decision: UPDATE existing skill** (N)
- `verify-api` — Add 2 missing file references, update detection patterns
- `verify-test` — Update detection commands for new config patterns

**Decision: CREATE new skill** (M)
- New skill needed — covers <pattern description> (X uncovered files)

**No action needed:**
- `package.json` — Config file, exempt
- `README.md` — Documentation, exempt
```

Use `AskUserQuestion` to confirm:
- Which existing skills to update
- Whether to create proposed new skills
- Option to skip entirely

### Step 5: Update Existing Skills

For each skill the user approved for update, read the current SKILL.md and apply targeted edits:

**Rules:**
- **Add/modify only** — Never remove existing checks that still work
- Add new file paths to **Related Files** table
- Add new detection commands for patterns found in changed files
- Add new workflow steps or sub-steps for uncovered rules
- Remove references to files confirmed deleted from codebase
- Update changed specific values (identifiers, config keys, type names)

**Example — Adding file to Related Files:**

```markdown
## Related Files

| File | Purpose |
|------|---------|
| ... existing entries ... |
| `src/server/newHandler.ts` | New request handler with validation |
```

**Example — Adding detection command:**

````markdown
### Step N: Verify New Pattern

**File:** `path/to/file.ts`

**Check:** Description of what to verify.

```bash
grep -n "pattern" path/to/file.ts
```

**Violation:** Description of what a failure looks like.
````

### Step 6: Create New Skills

**Important:** When creating a new skill, you must confirm the skill name with the user.

For each new skill to create:

1. **Explore** — Read related changed files to deeply understand patterns

2. **Confirm skill name with user** — Use `AskUserQuestion`:

   Present the pattern/domain the skill will cover and ask the user to provide or confirm the name.

   **Naming rules:**
   - Name must start with `verify-` (e.g., `verify-auth`, `verify-api`, `verify-caching`)
   - If user provides a name without `verify-` prefix, auto-prepend it and inform the user
   - Use kebab-case (e.g., `verify-error-handling`, not `verify_error_handling`)

3. **Create** — Create `.agent/skills/verify-<name>/SKILL.md` following this template:

```yaml
---
name: verify-<name>
description: <one-line description>. Use after <trigger condition>.
---
```

Required sections:
- **Purpose** — 2-5 numbered verification categories
- **When to Run** — 3-5 trigger conditions
- **Related Files** — Table of actual file paths in the codebase (verified with `ls`, no placeholders)
- **Workflow** — Check steps, each specifying:
  - Tool to use (Grep, Glob, Read, Bash)
  - Exact file paths or patterns
  - PASS/FAIL criteria
  - How to fix on failure
- **Output Format** — Markdown table for results
- **Exceptions** — At least 2-3 realistic "not a violation" cases

4. **Update related skill files** — After creating a new skill, update these files:

   **4a. Update this file (`manage-skills/SKILL.md`):**
   - Add new skill row to the **Registered Verification Skills** table
   - On first skill addition, remove "(No registered verification skills yet)" text and HTML comment, replace with table
   - Format: `| verify-<name> | <description> | <covered file patterns> |`

   **4b. Update `verify-implementation/SKILL.md`:**
   - Add new skill row to the **Target Skills** table
   - On first skill addition, remove "(No registered verification skills yet)" text and HTML comment, replace with table
   - Format: `| <number> | verify-<name> | <description> |`

   **4c. Update `AGENTS.md` (optional):**
   - If the root guide document has a verification skill index section, add the new skill
   - Follow the existing table style in that document

### Step 7: Verification

After all edits:

1. Re-read all modified SKILL.md files
2. Verify markdown format is correct (no unclosed code blocks, consistent table columns)
3. Check for broken file references — verify each path in Related Files exists:

```bash
ls <file-path> 2>/dev/null || echo "MISSING: <file-path>"
```

4. Dry-run one detection command from each updated skill to validate syntax
5. Confirm **Registered Verification Skills** table and **Target Skills** table are in sync

### Step 8: Summary Report

Display final report:

```markdown
## Session Skill Maintenance Report

### Files Analyzed: N

### Skills Updated: X
- `verify-<name>`: N new checks added, Related Files updated
- `verify-<name>`: Detection commands updated for new patterns

### Skills Created: Y
- `verify-<name>`: Covers <pattern>

### Related Files Updated:
- `manage-skills/SKILL.md`: Registered verification skills table updated
- `verify-implementation/SKILL.md`: Target skills table updated
- `AGENTS.md` (optional): Verification skill index synced

### Unaffected Skills: Z
- (no related changes)

### Uncovered Changes (no applicable skill):
- `path/to/file` — Exempt (reason)
```

---

## Quality Criteria for Created/Updated Skills

All created or updated skills must have:

- **Actual file paths from the codebase** (verified with `ls`), not placeholders
- **Working detection commands** — real grep/glob patterns that match current files
- **PASS/FAIL criteria** — clear conditions for pass and fail on each check
- **At least 2-3 realistic exceptions** — explanations of what is NOT a violation
- **Consistent format** — same as existing skills (frontmatter, section headers, table structure)

---

## Related Files

| File | Purpose |
|------|---------|
| `.agent/skills/verify-implementation/SKILL.md` | Integrated verification skill (manages target skill list) |
| `.agent/skills/manage-skills/SKILL.md` | This file (manages registered verification skill list) |
| `AGENTS.md` | Project guidelines document (sync verification skill index if present) |
| `.agent/rules/*.md` | Modular rule files (conditional loading per feature) |

## Exceptions

The following are **NOT problems**:

1. **Lock files and generated files** — `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, auto-generated migration files, build outputs don't need skill coverage
2. **One-off config changes** — Version bumps in `package.json`/`Cargo.toml`, minor linter/formatter config changes don't need a new skill
3. **Documentation files** — `README.md`, `CHANGELOG.md`, `LICENSE` etc. are not code patterns requiring verification
4. **Test fixture files** — Files in test fixture directories (e.g., `fixtures/`, `__fixtures__/`, `test-data/`) are not production code
5. **Unaffected skills** — Skills marked UNAFFECTED don't need review; most skills in most sessions fall into this category
6. **Guide documents themselves** — Changes to `AGENTS.md`, `CLAUDE.md` etc. are documentation updates, not code patterns requiring verification
7. **Vendor/third-party code** — Files in `vendor/`, `node_modules/` or copied library directories follow external rules
8. **CI/CD config** — `.github/`, `.gitlab-ci.yml`, `Dockerfile` etc. are infrastructure, not application patterns requiring verify skills
