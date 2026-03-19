---
name: git-worktree
description: 독립적인 작업 2개 이상을 동시에 진행할 때 Git Worktree로 작업 환경을 격리하고 tmux 대시보드로 모니터링합니다. "병렬로", "동시에", "한꺼번에", "parallel" 키워드와 함께 여러 태스크/기능/도메인을 나눠서 작업하라는 요청, 또는 워크트리 생성·머지·정리·상태확인, tmux 패널 추가·정리 요청 시 트리거됩니다. feature-planner 계획서의 독립 태스크를 병렬 실행하거나, 기존 워크트리에 Claude 세션을 추가하거나, stale 워크트리를 정리하는 작업도 포함합니다. 단일 브랜치 생성, 단일 파일 수정, 코드 리팩토링, git rebase 등 하나의 작업 흐름에서 순차적으로 진행하는 작업에는 사용하지 않습니다.
---

# Git Worktree + tmux — 병렬 작업 대시보드

## 이 스킬이 하는 일

독립적인 작업 여러 개를 동시에 진행할 때, 각 작업을 git worktree로 격리하고 tmux 분할 화면에서 모든 작업 진행 상황을 한눈에 모니터링할 수 있게 합니다.

```
┌──────────────────┬──────────────────┐
│                  │  워크트리 A       │
│                  │  (Claude Code)   │
│    MAIN          ├──────────────────┤
│    SESSION       │  워크트리 B       │
│    (Claude Code) │  (Claude Code)   │
│                  ├──────────────────┤
│                  │  워크트리 C       │
│                  │  (Claude Code)   │
└──────────────────┴──────────────────┘
```

## 언제 트리거되는가

아래 상황 중 하나라도 해당되면 이 스킬을 사용합니다:

1. **독립 태스크 2개 이상** — 구현 계획에서 서로 의존성 없는 태스크가 2개 이상일 때
2. **사용자가 병렬 실행을 언급** — "병렬로", "동시에", "한꺼번에", "나눠서", "parallel" 등
3. **기존 워크트리가 있을 때** — `.worktrees/` 디렉토리에 활성 워크트리가 이미 존재하면 자연스럽게 추가

### 트리거하지 않는 경우

- 단일 작업 (순차적 의존성이 있는 작업들)
- 질문, 설명, 코드 리뷰 (코드 변경 없음)
- 이미 워크트리 내부에서 작업 중 (중첩 불가)

## 전체 워크플로우

### Phase 1: 작업 분석 및 워크트리 생성

```bash
# 1. 독립 태스크 식별
#    계획서나 요청에서 동시 진행 가능한 작업들을 파악

# 2. 각 태스크별 워크트리 생성
bash .agent/skills/git-worktree/scripts/worktree-manager.sh create <task-slug-1>
bash .agent/skills/git-worktree/scripts/worktree-manager.sh create <task-slug-2>
bash .agent/skills/git-worktree/scripts/worktree-manager.sh create <task-slug-3>
```

### Phase 2: tmux 대시보드 생성

두 가지 모드 중 선택:

**A. 이미 tmux 안에 있을 때 (권장)**
```bash
# 현재 윈도우를 바로 분할
bash .agent/skills/git-worktree/scripts/worktree-manager.sh tmux-live
```

**B. tmux 밖에서 실행할 때**
```bash
# tmux 세션 생성 + 새 터미널 탭 자동 열기
bash .agent/skills/git-worktree/scripts/worktree-manager.sh tmux-live
```

`tmux-live`는 macOS 터미널 앱을 자동 감지(Ghostty, iTerm2, Terminal.app, Warp)하여 **새 탭/창에 tmux 세션을 자동으로 attach**합니다. 현재 Claude Code 세션은 중단되지 않습니다.

> 대화 세션과 분리해서 백그라운드로만 생성하려면 `tmux` 명령 사용

### Phase 3: 각 워크트리에 태스크 전송

`tmux-live`가 각 워크트리 패널에 대화형 Claude 세션을 자동으로 시작합니다. `tmux-exec`로 **태스크 설명만** 보내면 사용자가 직접 타이핑한 것처럼 동작합니다.

```bash
# 이미 실행 중인 Claude 세션에 태스크 텍스트 전송
bash .agent/skills/git-worktree/scripts/worktree-manager.sh tmux-exec <task-slug-1> \
  "태스크 1 설명. 충돌 방지: package.json, prisma/schema.prisma 수정 금지."

bash .agent/skills/git-worktree/scripts/worktree-manager.sh tmux-exec <task-slug-2> \
  "태스크 2 설명. 충돌 방지: package.json, prisma/schema.prisma 수정 금지."
```

> `tmux-exec`는 `claude` 명령이 아닌 **태스크 텍스트만** 전송합니다. 패널의 Claude 세션이 이를 사용자 입력으로 받아 바로 작업을 시작합니다.

### Phase 4: 모니터링 및 완료

사용자는 tmux 내에서:
- `Ctrl+b ←/→/↑/↓` — 패널 간 이동
- `Ctrl+b z` — 현재 패널 전체화면 토글
- `Ctrl+b d` — 세션 디태치 (백그라운드 유지)

상태 확인:
```bash
bash .agent/skills/git-worktree/scripts/worktree-manager.sh tmux-status
```

### Phase 5: 작업 완료 후 정리

사용자가 "작업 끝났다", "머지해줘" 등을 말하면 **`/merge-worktree` 스킬을 사용합니다**.

`/merge-worktree`는 워크트리 내부에서 실행하며, squash merge + 구조화된 커밋 메시지를 자동 생성합니다. `worktree-manager.sh merge`보다 정교한 6-Phase 워크플로우입니다.

```bash
# 1. 머지할 워크트리의 Claude 세션에 /merge-worktree 전송
bash .agent/skills/git-worktree/scripts/worktree-manager.sh tmux-exec <task-slug-1> \
  "/merge-worktree main"

# 2. 머지 완료 후 워크트리 제거
bash .agent/skills/git-worktree/scripts/worktree-manager.sh remove <task-slug-1>

# 3. 머지 불필요한 워크트리는 바로 제거
bash .agent/skills/git-worktree/scripts/worktree-manager.sh remove <task-slug-2>

# 4. tmux 세션 종료
bash .agent/skills/git-worktree/scripts/worktree-manager.sh tmux-kill
```

> **`worktree-manager.sh merge`는 단순 `--no-ff` 머지 전용입니다.** 커밋 메시지 품질이 중요한 경우 반드시 `/merge-worktree`를 사용하세요.

## 스크립트 명령어 레퍼런스

### Worktree 관리

| Command | Description |
|---------|-------------|
| `create <slug> [base]` | 워크트리 생성 (.env 복사 + node_modules 심링크) |
| `list` | 활성/stale 워크트리 + tmux 상태 표시 |
| `remove <slug>` | 워크트리 제거 (stale 디렉토리도 처리) |
| `cleanup` | 전체 워크트리 제거 |
| `merge <slug> [target]` | 워크트리 브랜치를 target에 머지 |

### tmux 대시보드

| Command | Description |
|---------|-------------|
| `tmux` | tmux 세션 백그라운드 생성 |
| `tmux-live` | 현재 터미널을 tmux 대시보드로 전환 |
| `tmux-attach` | 기존 tmux 세션에 연결 |
| `tmux-add <slug>` | 실행 중인 세션에 워크트리 패널 추가 |
| `tmux-exec <slug> <cmd>` | 특정 워크트리 패널에 명령 전송 |
| `tmux-status` | tmux 세션 상태 + 패널 매핑 표시 |
| `tmux-kill` | tmux 세션 종료 (워크트리는 보존) |

## 충돌 방지

워크트리 내부에서 아래 파일은 변경하지 않습니다 (머지 충돌 핫스팟):

- `package.json`, `package-lock.json`
- `prisma/schema.prisma`
- `AGENTS.md`, `CLAUDE.md`
- `.gitignore`, `Makefile`

## 실전 예시

### 구현 계획에서 독립 태스크 3개를 병렬 실행

```
사용자: "계획서의 Step 2, 3, 4를 동시에 진행해줘"

→ 스킬이 감지: 3개 독립 태스크
→ 워크트리 3개 생성: step-2, step-3, step-4
→ tmux 대시보드 생성
→ 각 패널에서 Claude Code가 해당 태스크 실행
→ 사용자는 좌측 main에서 진행 상황 모니터링
```

### 작업 완료 후 머지 + 정리

```
사용자: "작업 끝났어. step-2는 머지하고, step-3은 버려"

→ step-2 패널에서 /merge-worktree main 실행 (squash merge + 커밋)
→ step-2 워크트리 remove
→ step-3 워크트리 remove (머지 없이)
→ tmux-kill
```

### 기존 워크트리에 작업 추가

```
사용자: "이 버그 수정도 병렬로 진행해"

→ .worktrees/에 기존 워크트리 존재 확인
→ 새 워크트리 생성: bug-fix
→ tmux 세션에 패널 추가 (tmux-add)
→ 새 패널에서 Claude Code 실행 (tmux-exec)
```

## 아키텍처

```
.worktrees/                          # .gitignore에 포함
├── step-2/                          # 독립 워크트리 1
│   ├── .env (자동 복사)
│   ├── node_modules -> symlink
│   └── src/ ...
├── step-3/                          # 독립 워크트리 2
└── step-4/                          # 독립 워크트리 3

tmux session "worktrees"
├── pane 0 [main]: main repo (좌측 40%)
├── pane 1 [wt:step-2]: .worktrees/step-2/ (우측)
├── pane 2 [wt:step-3]: .worktrees/step-3/ (우측)
└── pane 3 [wt:step-4]: .worktrees/step-4/ (우측)
```

각 패널에는 `wt:<slug>` 타이틀이 설정되어, 사용자가 `cd`로 경로를 변경해도 `tmux-exec`가 올바른 패널을 찾습니다.

## 트러블슈팅

| 증상 | 해결 |
|------|------|
| `tmux-exec`가 패널을 못 찾음 | `tmux-status`로 매핑 확인, 타이틀 없으면 `tmux-add`로 재추가 |
| stale 디렉토리 잔류 | `list`에서 빨간색 표시됨, `remove <slug>`로 정리 |
| 새 탭 자동 열기 실패 | `$TERM_PROGRAM` 미지원 터미널 — 수동으로 새 탭에서 `tmux attach -t worktrees` |
| 워크트리 중첩 불가 에러 | 이미 워크트리 내부에서 실행 중 — main repo에서 실행 |
