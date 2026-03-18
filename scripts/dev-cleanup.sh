#!/bin/bash
# dev-cleanup.sh — tmux 세션 + 워크트리 정리
# Usage: ./scripts/dev-cleanup.sh [--force]

set -euo pipefail

SESSION="batwo-p0"
PROJECT_ROOT="/Users/woals/Batwo-AI/project/batwo-maketting service-saas"
WT_README="/Users/woals/Batwo-AI/project/batwo-wt-readme"
WT_REPORT="/Users/woals/Batwo-AI/project/batwo-wt-report"

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

FORCE="${1:-}"

# ─── 1. 머지 안 된 변경사항 확인 ──────────────────────────────
echo -e "${YELLOW}[1/3] 워크트리 변경사항 확인...${NC}"

for wt in "$WT_README" "$WT_REPORT"; do
  if [ -d "$wt" ]; then
    changes=$(git -C "$wt" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    branch=$(git -C "$wt" branch --show-current 2>/dev/null || echo "unknown")
    if [ "$changes" -gt 0 ] && [ "$FORCE" != "--force" ]; then
      echo -e "  ⚠️  $wt ($branch): 커밋되지 않은 변경 ${changes}개"
      echo "  --force 옵션으로 강제 정리하거나, 먼저 커밋하세요."
      exit 1
    fi

    # main에 머지 안 된 커밋 확인
    ahead=$(git -C "$wt" rev-list main..HEAD --count 2>/dev/null || echo "0")
    if [ "$ahead" -gt 0 ] && [ "$FORCE" != "--force" ]; then
      echo -e "  ⚠️  $wt ($branch): main 대비 ${ahead}개 커밋 미머지"
      echo "  먼저 main에 머지하거나 --force로 강제 정리하세요."
      exit 1
    fi
  fi
done

# ─── 2. tmux 세션 종료 ────────────────────────────────────────
echo -e "${YELLOW}[2/3] tmux 세션 정리...${NC}"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux kill-session -t "$SESSION"
  echo -e "  ${GREEN}✅ 세션 종료: $SESSION${NC}"
else
  echo "  ⏭️  세션 없음"
fi

# ─── 3. 워크트리 제거 ─────────────────────────────────────────
echo -e "${YELLOW}[3/3] 워크트리 제거...${NC}"

cd "$PROJECT_ROOT"

for wt in "$WT_README" "$WT_REPORT"; do
  if [ -d "$wt" ]; then
    git worktree remove "$wt" ${FORCE:+--force}
    echo -e "  ${GREEN}✅ 워크트리 제거: $wt${NC}"
  else
    echo "  ⏭️  없음: $wt"
  fi
done

# 브랜치 정리 (머지된 것만)
for branch in p0/readme p0/health-report; do
  if git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
    merged=$(git branch --merged main | grep -c "$branch" || true)
    if [ "$merged" -gt 0 ] || [ "$FORCE" = "--force" ]; then
      git branch -D "$branch"
      echo -e "  ${GREEN}✅ 브랜치 삭제: $branch${NC}"
    else
      echo -e "  ⏭️  미머지 브랜치 유지: $branch"
    fi
  fi
done

echo ""
echo -e "${GREEN}✅ 정리 완료!${NC}"
git worktree list
