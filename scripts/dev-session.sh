#!/bin/bash
# dev-session.sh — tmux + worktree 병렬 작업 환경 셋업
# Usage: ./scripts/dev-session.sh

set -euo pipefail

PROJECT_ROOT="/Users/woals/Batwo-AI/project/batwo-maketting service-saas"
SESSION="batwo-p0"

# 색상
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── 1. 브랜치 + 워크트리 생성 ────────────────────────────────
echo -e "${BLUE}[1/3] 워크트리 생성 중...${NC}"

cd "$PROJECT_ROOT"

# 브랜치가 없으면 생성
for branch in p0/readme p0/health-report; do
  if ! git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
    git branch "$branch" main
    echo -e "  ${GREEN}✅ 브랜치 생성: $branch${NC}"
  else
    echo "  ⏭️  브랜치 존재: $branch"
  fi
done

# 워크트리 경로 (공백 없는 경로로 심볼릭)
WT_README="/Users/woals/Batwo-AI/project/batwo-wt-readme"
WT_REPORT="/Users/woals/Batwo-AI/project/batwo-wt-report"

for wt_pair in "$WT_README:p0/readme" "$WT_REPORT:p0/health-report"; do
  wt_path="${wt_pair%%:*}"
  wt_branch="${wt_pair##*:}"
  if [ ! -d "$wt_path" ]; then
    git worktree add "$wt_path" "$wt_branch"
    echo -e "  ${GREEN}✅ 워크트리 생성: $wt_path ($wt_branch)${NC}"
  else
    echo "  ⏭️  워크트리 존재: $wt_path"
  fi
done

echo ""
git worktree list
echo ""

# ─── 2. tmux 세션 생성 ────────────────────────────────────────
echo -e "${BLUE}[2/3] tmux 세션 구성 중...${NC}"

# 기존 세션 있으면 attach만
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "  ⏭️  세션 존재. attach 합니다."
  tmux attach -t "$SESSION"
  exit 0
fi

# Window 1: main (T1 빌드 → IntentClassifier → T5 테스트)
tmux new-session -d -s "$SESSION" -n "main" -c "$PROJECT_ROOT"
tmux send-keys -t "$SESSION:main" "echo '🏠 Main: T1 빌드검증 → IntentClassifier config → T5 테스트'" Enter

# Window 2: readme (T2)
tmux new-window -t "$SESSION" -n "readme" -c "$WT_README"
tmux send-keys -t "$SESSION:readme" "echo '📝 Worktree: T2 README.md 작성 (p0/readme)'" Enter
tmux send-keys -t "$SESSION:readme" "git branch --show-current" Enter

# Window 3: report (T3)
tmux new-window -t "$SESSION" -n "report" -c "$WT_REPORT"
tmux send-keys -t "$SESSION:report" "echo '📊 Worktree: T3 진단 리포트 보정 (p0/health-report)'" Enter
tmux send-keys -t "$SESSION:report" "git branch --show-current" Enter

# ─── 3. 각 윈도우 패널 분할 ──────────────────────────────────
echo -e "${BLUE}[3/3] 패널 분할 중...${NC}"

# main: 상(작업) + 하(상태 모니터)
tmux split-window -t "$SESSION:main" -v -c "$PROJECT_ROOT" -p 25
tmux send-keys -t "$SESSION:main.1" "echo '── 상태 패널 ──' && git status -s && echo '' && echo '할일: npx next build → config 수정 → npx vitest run'" Enter

# readme: 상(에디터) + 하(터미널)
tmux split-window -t "$SESSION:readme" -v -c "$WT_README" -p 25
tmux send-keys -t "$SESSION:readme.1" "echo '── 터미널 ──'" Enter

# report: 상(에디터) + 하(터미널)
tmux split-window -t "$SESSION:report" -v -c "$WT_REPORT" -p 25
tmux send-keys -t "$SESSION:report.1" "echo '── 터미널 ──'" Enter

# main 윈도우, 상단 패널로 포커스
tmux select-window -t "$SESSION:main"
tmux select-pane -t "$SESSION:main.0"

echo -e "${GREEN}✅ 세션 준비 완료!${NC}"
echo ""
echo "  tmux attach -t $SESSION"
echo ""
echo "  조작법:"
echo "    Ctrl+b 1  → main (T1→config→T5)"
echo "    Ctrl+b 2  → readme (T2)"
echo "    Ctrl+b 3  → report (T3)"
echo "    Ctrl+b d  → detach (상태 유지)"
echo ""

tmux attach -t "$SESSION"
