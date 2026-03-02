---
alwaysApply: true
---

# Git Worktree 병렬 작업 격리 규칙

## 트리거 조건 (작업 시작 전 MANDATORY 체크)

코드 변경이 수반되는 작업 요청(기능 구현, 리팩토링, 버그 수정 등)을 받으면 **반드시** 다음을 수행:

### Step 1: 기존 워크트리 감지

```bash
git worktree list
```

### Step 2: 판단 분기

**Case A — 워크트리가 없는 경우 (메인 repo만 존재):**

- 사용자에게 질문:
  > "🌳 깃워크트리를 생성하여 격리된 환경에서 작업할까요? (병렬 작업 시 충돌 방지용)"
- "예" → 워크트리 생성 후 작업 시작
- "아니오" → 메인 레포에서 기존 방식대로 작업

**Case B — 워크트리가 이미 존재하는 경우 (`.worktrees/` 하위에 1개 이상):**

- **질문 없이 자동으로** 새 워크트리를 생성하여 작업 시작
- 이유: 다른 에이전트가 이미 워크트리에서 작업 중 → 병렬 작업으로 간주 → 격리 필수

### 워크트리 생성 방법

```bash
bash .claude/skills/git-worktree/scripts/worktree-manager.sh create <task-slug>
```

그 후 **생성된 워크트리 경로에서** 작업을 진행합니다.

## 충돌 방지 (워��트리 내에서)

태스크가 **명시적으로 요구하지 않는 한** 다음 파일은 수정 금지:

- `package.json`, `package-lock.json`, `pnpm-lock.yaml`
- `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- `.env.example`, `.gitignore`, `Makefile`, `Dockerfile`
- `prisma/schema.prisma`
- `AGENTS.md`

## 적용 제외

다음 상황에서는 워크트리 질문/생성을 하지 않음:

- 단순 질문, 설명 요청, 코드 리뷰 (코드 변경 없음)
- 빌드, 테스트 실행만 하는 경우
- 이미 워크트리 내에서 작업 중인 경우 (중첩 불가)
