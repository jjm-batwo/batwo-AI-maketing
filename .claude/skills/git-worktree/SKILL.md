---
name: git-worktree
description: 병렬 에이전트 작업 격리를 위한 Git Worktree 관리. 코드 변경 작업 요청 시 워크트리 생성 여부를 질문하고, 이미 워크트리가 존재하면 자동 생성합니다.
---

# Git Worktree 병렬 작업 격리

## Purpose

시지푸스 에이전트를 병렬로 실행할 때 발생하는 문제를 방지합니다:

1. **컨텍스트 오염** — 에이전트 간 작업 파일이 섞임
2. **파일 충돌** — 같은 파일을 동시 수정
3. **compact 오염** — 다른 에이전트의 컨텍스트가 혼입
4. **작업 범위 침범** — 독립적이어야 할 작업이 서로 영향

Git worktree는 같은 `.git` DB를 공유하되, **파일/인덱스/HEAD/스테이징이 완전히 분리**된 독립 체크아웃을 제공합니다.

## When to Use

코드 변경이 수반되는 작업 요청을 받으면 **반드시** 워크트리 사용 여부를 결정합니다:

### 판단 플로우

```
작업 요청 수신
    │
    ▼
git worktree list 실행
    │
    ├── .worktrees/ 에 워크트리 없음
    │   └── 사용자에게 질문: "🌳 깃워크트리를 생성할까요?"
    │       ├── "예" → 워크트리 생성 후 작업
    │       └── "아니오" → 메인에서 작업
    │
    └── .worktrees/ 에 워크트리 존재 (1개 이상)
        └── 자동으로 새 워크트리 생성 (질문 없이)
```

### 적용 제외

- 단순 질문, 설명 요청, 코드 리뷰 (코드 변경 없음)
- 빌드, 테스트 실행만 하는 경우
- 이미 워크트리 내에서 작업 중인 경우 (중첩 불가)

## Workflow

### Step 1: 워크트리 상태 확인

```bash
git worktree list
ls .worktrees/ 2>/dev/null || echo "No worktrees"
```

### Step 2: 워크트리 생성 (필요 시)

```bash
bash .agent/skills/git-worktree/scripts/worktree-manager.sh create <task-slug>
```

**자동 수행 사항:**

- `.worktrees/<task-slug>/` 에 워크트리 생성
- `sisyphus/<task-slug>` 브랜치 생성
- `.env*` 파일 자동 복사 (`.env.example` 제외)
- `node_modules` symlink 생성

### Step 3: 워크트리에서 작업

생성된 워크트리 경로(`.worktrees/<task-slug>/`)의 파일을 대상으로 작업합니다.

### Step 4: 작업 완료 후

#### 옵션 A — Merge 후 정리 (권장)

```bash
bash .agent/skills/git-worktree/scripts/worktree-manager.sh merge <task-slug> main
bash .agent/skills/git-worktree/scripts/worktree-manager.sh remove <task-slug>
```

#### 옵션 B — 수동 검토

```bash
# 워크트리 목록 확인
bash .agent/skills/git-worktree/scripts/worktree-manager.sh list

# 전체 정리
bash .agent/skills/git-worktree/scripts/worktree-manager.sh cleanup
```

## Script Commands

| 명령어                              | 설명                                            |
| ----------------------------------- | ----------------------------------------------- |
| `create <task-slug> [base-branch]`  | 워크트리 생성 (env 복사 + node_modules symlink) |
| `list`                              | 활성 워크트리 목록                              |
| `remove <task-slug>`                | 특정 워크트리 삭제                              |
| `cleanup`                           | 모든 워크트리 삭제                              |
| `merge <task-slug> [target-branch]` | 워크트리 브랜치를 대상 브랜치로 merge           |

## Conflict Prevention (충돌 방지)

워크트리 내에서 작업 시, 태스크가 **명시적으로 요구하지 않는 한** 다음 파일은 수정하지 마세요:

- `package.json`, `package-lock.json`, `pnpm-lock.yaml`
- `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- `.env.example`, `.gitignore`, `Makefile`, `Dockerfile`
- `prisma/schema.prisma`
- `AGENTS.md`

이 파일들은 merge 시 충돌이 빈번한 핫스팟입니다.

## Related Files

| File                                                      | Purpose                   |
| --------------------------------------------------------- | ------------------------- |
| `.agent/skills/git-worktree/scripts/worktree-manager.sh` | 워크트리 관리 스크립트    |
| `.agent/rules/worktree.md`                               | 워크트리 자동 트리거 규칙 |
| `.gitignore`                                              | `.worktrees/` 제외        |

## Architecture

```
.worktrees/                          # .gitignore에 포함
├── auth-refactor/                   # Agent 1의 독립 워크트리
│   ├── .env (auto-copied)
│   ├── node_modules -> symlink
│   ├── src/
│   └── ...
├── dashboard-kpi/                   # Agent 2의 독립 워크트리
│   ├── .env (auto-copied)
│   ├── node_modules -> symlink
│   ├── src/
│   └── ...
└── pixel-fix/                       # Agent 3의 독립 워크트리
    └── ...
```

각 워크트리는:

- 독립된 브랜치 (`sisyphus/<task-slug>`)
- 독립된 파일시스템 (HEAD, index, staging area 분리)
- 공유된 `.git` 오브젝트 DB (효율적)
