---
name: git-worktree
description: Git Worktree management for parallel agent task isolation. Prompts worktree creation on code change requests; auto-creates if worktrees already exist.
---

# Git Worktree — Parallel Task Isolation

## Purpose

Prevents issues when running agents in parallel:

1. **Context pollution** — work files get mixed between agents
2. **File conflicts** — simultaneous edits to the same file
3. **Compact pollution** — another agent's context leaks in
4. **Scope creep** — independent tasks affecting each other

Git worktree shares the same `.git` DB but provides **fully isolated checkout** (files, index, HEAD, staging).

## When to Use

When receiving a code-change request, **always** decide on worktree usage:

### Decision Flow

```
Request received
    │
    ▼
Run: git worktree list
    │
    ├── No worktrees in .worktrees/
    │   └── Ask user: "🌳 Should I create a git worktree?"
    │       ├── "Yes" → Create worktree, then proceed
    │       └── "No"  → Work on main
    │
    └── Worktrees already exist in .worktrees/ (1+)
        └── Auto-create new worktree (no prompt)
```

### Exclusions

- Simple questions, explanations, code reviews (no code changes)
- Build or test execution only
- Already working inside a worktree (no nesting)

## Workflow

### Step 1: Check worktree status

```bash
git worktree list
ls .worktrees/ 2>/dev/null || echo "No worktrees"
```

### Step 2: Create worktree (if needed)

```bash
bash .agent/skills/git-worktree/scripts/worktree-manager.sh create <task-slug>
```

**Automatically performed:**

- Worktree created at `.worktrees/<task-slug>/`
- Branch `sisyphus/<task-slug>` created
- `.env*` files auto-copied (excluding `.env.example`)
- `node_modules` symlink created

### Step 3: Work in worktree

Operate on files in the created worktree path (`.worktrees/<task-slug>/`).

### Step 4: After completion

#### Option A — Merge and cleanup (recommended)

```bash
bash .agent/skills/git-worktree/scripts/worktree-manager.sh merge <task-slug> main
bash .agent/skills/git-worktree/scripts/worktree-manager.sh remove <task-slug>
```

#### Option B — Manual review

```bash
# List worktrees
bash .agent/skills/git-worktree/scripts/worktree-manager.sh list

# Full cleanup
bash .agent/skills/git-worktree/scripts/worktree-manager.sh cleanup
```

## Script Commands

| Command                              | Description                                          |
| ------------------------------------ | ---------------------------------------------------- |
| `create <task-slug> [base-branch]`   | Create worktree (env copy + node_modules symlink)    |
| `list`                               | List active worktrees                                |
| `remove <task-slug>`                 | Remove specific worktree                             |
| `cleanup`                            | Remove all worktrees                                 |
| `merge <task-slug> [target-branch]`  | Merge worktree branch into target branch             |

## Conflict Prevention

When working inside a worktree, do NOT modify these files unless explicitly required by the task:

- `package.json`, `package-lock.json`, `pnpm-lock.yaml`
- `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- `.env.example`, `.gitignore`, `Makefile`, `Dockerfile`
- `prisma/schema.prisma`
- `AGENTS.md`

These files are frequent merge conflict hotspots.

## Related Files

| File                                                     | Purpose                     |
| -------------------------------------------------------- | --------------------------- |
| `.agent/skills/git-worktree/scripts/worktree-manager.sh` | Worktree management script  |
| `.agent/rules/worktree.md`                               | Worktree auto-trigger rules |
| `.gitignore`                                             | Excludes `.worktrees/`      |

## Architecture

```
.worktrees/                          # Included in .gitignore
├── auth-refactor/                   # Agent 1's isolated worktree
│   ├── .env (auto-copied)
│   ├── node_modules -> symlink
│   ├── src/
│   └── ...
├── dashboard-kpi/                   # Agent 2's isolated worktree
│   ├── .env (auto-copied)
│   ├── node_modules -> symlink
│   ├── src/
│   └── ...
└── pixel-fix/                       # Agent 3's isolated worktree
    └── ...
```

Each worktree has:

- Independent branch (`sisyphus/<task-slug>`)
- Independent file system (HEAD, index, staging area separated)
- Shared `.git` object DB (efficient)
