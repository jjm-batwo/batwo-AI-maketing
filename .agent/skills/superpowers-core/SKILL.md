---
name: superpowers-core
description: Superpowers skill system entrypoint. Defines rules for checking and activating relevant skills before any task. Includes Antigravity-optimized tool mapping and workflows.
---

# Superpowers for Antigravity

## Instruction Priority

1. **User's explicit instructions** (AGENTS.md, GEMINI.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

## Antigravity Tool Mapping

| Superpowers Reference | Antigravity Equivalent |
|---|---|
| `Read` (file reading) | `view_file` |
| `Write` (file creation) | `write_to_file` |
| `Edit` (file editing) | `replace_file_content` / `multi_replace_file_content` |
| `Bash` (run commands) | `run_command` |
| `Grep` (search content) | `grep_search` |
| `Glob` (search filenames) | `find_by_name` |
| `TodoWrite` (task tracking) | `task.md` artifact + `task_boundary` tool |
| `WebFetch` | `read_url_content` |
| `Task` (subagent dispatch) | ❌ No code subagent — use `executing-plans` approach instead |

## The Core Rule

**Check for and activate relevant skills BEFORE any response or action.**

Even a 1% chance a skill might apply → read the SKILL.md to check.

### Red Flags — Rationalization Signals

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "Let me gather more context first" | Skills tell you HOW to gather context. |
| "Let me explore the codebase first" | Skills define HOW to explore. |
| "This skill is overkill" | Simple things become complex. |
| "I remember this skill's content" | Skills evolve. Read the current version. |

## Available Skills

### Process Skills (check first)
- **superpowers-brainstorming** — Socratic design refinement before building features
- **superpowers-systematic-debugging** — 4-phase root cause process for bugs/errors
- **superpowers-finishing-branch** — Branch completion after implementation

### Existing Project Skills (unchanged)
- **feature-planner** — Feature planning and roadmaps
- **git-worktree** — Worktree isolation for parallel work
- **verify-implementation** — Integrated verification (17 verify-* skills)
- **ui-ux-pro-max** — UI/UX design intelligence
- All 17 verify-* skills

### Existing Workflows
- `/feature-development` — Full feature implementation flow
- `/tdd` — RED → GREEN → REFACTOR
- `/code-review` — Pre-commit checklist
- `/wrap` — Session wrap-up
- `/wrap-todo` — Daily todo organization

## Skill Priority

When multiple skills could apply:

1. **Process skills first** (brainstorming, debugging) — determine HOW to approach
2. **Implementation skills second** (feature-planner, ui-ux-pro-max) — guide execution

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → systematic-debugging first, then domain-specific skills.

## Verification Before Completion

**No completion claims without fresh verification evidence.**

```
BEFORE claiming any status:
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
```

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Build succeeds | Build command: exit 0 | Linter passing |
| Bug fixed | Original symptom test passes | Code changed, assumed fixed |
| Requirements met | Line-by-line checklist | Tests passing only |

**Banned phrases:** "should", "probably", "seems to" — any wording implying success without verification evidence is prohibited.
