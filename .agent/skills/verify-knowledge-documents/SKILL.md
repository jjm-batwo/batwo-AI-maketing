---
name: verify-knowledge-documents
description: Verifies markdown file (knowledge base docs) filename rules (two-digit numeric prefix) and H1 header presence. Use after adding RAG knowledge documents.
---

# Knowledge Base Document Pattern Verification

## Purpose

1. **Filename rule compliance** — Verify `00-name.md` format with two-digit numeric prefix
2. **Required header presence** — Verify markdown documents contain an H1 (`#`) header recognized as the top-level title

## When to Run

- After adding or modifying marketing knowledge documents (`prisma/seeds/marketing-knowledge/*.md`)
- Before running `seed-knowledge-base.ts` script to confirm proper parsing is possible

## Related Files

| File | Purpose |
|------|---------|
| `prisma/seeds/marketing-knowledge/*.md` | Seed knowledge documents loaded into the RAG system |

## Workflow

### Step 1: Filename rule validation

**File:** `prisma/seeds/marketing-knowledge/*.md`

**Check:** Verify filenames start with 2 digits and a hyphen (`00-`) and have `.md` extension.

```bash
find prisma/seeds/marketing-knowledge -name "*.md" | grep -vE '/[0-9]{2}-[a-zA-Z0-9-]+\.md$' || true
```

*(Note: `|| true` is added to prevent pipeline interruption when `grep -vE` returns exit code 1 when no lines remain after filtering)*

**PASS criteria:** No output or empty output (all files comply with the rule)
**FAIL criteria:** Output contains paths (filename rule violations)

**Fix:**
Rename output files to `00-topic-name.md` format.

### Step 2: H1 header presence check

**File:** `prisma/seeds/marketing-knowledge/*.md`

**Check:** Verify each markdown file contains a title header starting with `# `. Required for the parser to extract titles.

```bash
for file in prisma/seeds/marketing-knowledge/*.md; do
  if ! grep -q "^# " "$file"; then
    echo "Missing H1 header: $file"
  fi
done
```

**PASS criteria:** No output from the loop (all files have at least one `# ` header)
**FAIL criteria:** Output files are missing `# ` (H1 title)

**Fix:** Add a `# Title` format header at the top of the file content.

## Output Format

```markdown
### verify-knowledge-documents Results

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Filename rule validation | PASS/FAIL | Violating files: X |
| 2 | H1 header presence check | PASS/FAIL | Files missing H1 header |
```

## Exceptions

The following are **NOT violations**:

1. **README files** — Markdown files not located in the knowledge base seed document directory are excluded.
2. **Non-markdown files** — `.ts`, `.json`, etc. are not check targets.
