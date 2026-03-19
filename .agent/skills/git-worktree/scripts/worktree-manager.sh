#!/bin/bash

# Git Worktree Manager — Parallel Task Isolation + tmux Dashboard
# Purpose: Create/manage git worktrees for parallel AI agent work with tmux monitoring
#
# Worktree commands:
#   create <slug> [base]   — Create worktree (.env copy + node_modules symlink)
#   list                   — List active worktrees
#   remove <slug>          — Remove worktree
#   cleanup                — Remove all worktrees
#   merge <slug> [target]  — Merge worktree branch into target
#
# tmux commands:
#   tmux                   — Create tmux session (background)
#   tmux-live              — Convert current terminal to tmux dashboard
#   tmux-attach            — Attach to existing session
#   tmux-add <slug>        — Add worktree pane to running session
#   tmux-exec <slug> <cmd> — Send command to worktree pane
#   tmux-status            — Show session status
#   tmux-kill              — Kill tmux session (worktrees preserved)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [[ -z "$GIT_ROOT" ]]; then
  echo -e "${RED}Error: Not inside a git repository${NC}"
  exit 1
fi

WORKTREE_DIR="$GIT_ROOT/.worktrees"
BRANCH_PREFIX="sisyphus"
SESSION_NAME="worktrees"

# =============================================================================
# UTILITIES
# =============================================================================

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-|-$//g' | cut -c1-50
}

ensure_gitignore() {
  if ! grep -q "^\.worktrees" "$GIT_ROOT/.gitignore" 2>/dev/null; then
    echo "" >> "$GIT_ROOT/.gitignore"
    echo "# git worktrees for parallel agent work" >> "$GIT_ROOT/.gitignore"
    echo ".worktrees/" >> "$GIT_ROOT/.gitignore"
    echo -e "${GREEN}✓ Added .worktrees/ to .gitignore${NC}"
  fi
}

can_use_worktrees() {
  local git_path="$GIT_ROOT/.git"
  # If .git is a file (linked worktree), we can't nest worktrees
  if [[ -f "$git_path" ]]; then
    return 1
  fi
  [[ -d "$git_path" ]]
}

require_tmux() {
  if ! command -v tmux &>/dev/null; then
    echo -e "${RED}Error: tmux is not installed. Install with: brew install tmux${NC}"
    exit 1
  fi
}

# Open a new terminal tab and run a command in it (macOS only)
# Uses $TERM_PROGRAM to detect the terminal app
_open_terminal_tab() {
  local cmd="$1"

  case "${TERM_PROGRAM:-}" in
    ghostty)
      # Ghostty: open new tab via menu item, then type command
      osascript -e "
        tell application \"Ghostty\" to activate
        delay 0.3
        tell application \"System Events\"
          tell process \"ghostty\"
            click menu item \"New Tab\" of menu \"File\" of menu bar 1
          end tell
        end tell
        delay 0.8
        tell application \"System Events\"
          tell process \"ghostty\"
            keystroke \"$cmd\"
            key code 36
          end tell
        end tell
      " 2>/dev/null && return 0
      ;;
    iTerm.app|iTerm2)
      osascript -e "
        tell application \"iTerm\"
          tell current window
            create tab with default profile
            tell current session
              write text \"$cmd\"
            end tell
          end tell
        end tell
      " 2>/dev/null && return 0
      ;;
    Apple_Terminal)
      osascript -e "
        tell application \"Terminal\"
          activate
          do script \"$cmd\"
        end tell
      " 2>/dev/null && return 0
      ;;
    WarpTerminal)
      osascript -e "
        tell application \"Warp\"
          activate
        end tell
        tell application \"System Events\"
          keystroke \"t\" using command down
          delay 0.5
          keystroke \"$cmd\"
          key code 36
        end tell
      " 2>/dev/null && return 0
      ;;
    vscode)
      # VS Code integrated terminal — can't easily open external tab
      ;;
  esac

  # Fallback: try generic open with Terminal.app
  if [[ "$(uname)" == "Darwin" ]]; then
    osascript -e "
      tell application \"Terminal\"
        activate
        do script \"$cmd\"
      end tell
    " 2>/dev/null && return 0
  fi

  return 1
}

# Collect active worktree names into WORKTREE_NAMES array
# Usage: collect_worktree_names; echo "${WORKTREE_NAMES[@]}"
WORKTREE_NAMES=()
collect_worktree_names() {
  WORKTREE_NAMES=()
  if [[ -d "$WORKTREE_DIR" ]]; then
    for wt_path in "$WORKTREE_DIR"/*/; do
      if [[ -d "$wt_path" && -e "$wt_path/.git" ]]; then
        WORKTREE_NAMES+=("$(basename "$wt_path")")
      fi
    done
  fi
}

require_worktrees() {
  collect_worktree_names
  if [[ ${#WORKTREE_NAMES[@]} -eq 0 ]]; then
    echo -e "${RED}Error: No active worktrees found. Create worktrees first.${NC}"
    exit 1
  fi
}

# =============================================================================
# ENV FILE COPY
# =============================================================================

copy_env_files() {
  local worktree_path="$1"

  echo -e "${BLUE}Copying environment files...${NC}"

  local env_files=()
  for f in "$GIT_ROOT"/.env*; do
    if [[ -f "$f" ]]; then
      local basename=$(basename "$f")
      # Skip .env.example and .env.local.example (committed to git)
      if [[ "$basename" == *.example ]]; then
        continue
      fi
      env_files+=("$basename")
    fi
  done

  if [[ ${#env_files[@]} -eq 0 ]]; then
    echo -e "  ${YELLOW}ℹ️  No .env files found${NC}"
    return
  fi

  local copied=0
  for env_file in "${env_files[@]}"; do
    cp "$GIT_ROOT/$env_file" "$worktree_path/$env_file"
    echo -e "  ${GREEN}✓ $env_file${NC}"
    copied=$((copied + 1))
  done

  echo -e "  ${GREEN}✓ Copied $copied environment file(s)${NC}"
}

# =============================================================================
# NODE_MODULES SYMLINK
# =============================================================================

setup_node_modules() {
  local worktree_path="$1"

  if [[ -d "$GIT_ROOT/node_modules" ]]; then
    echo -e "${BLUE}Creating node_modules symlink...${NC}"
    ln -sf "$GIT_ROOT/node_modules" "$worktree_path/node_modules"
    echo -e "  ${GREEN}✓ Symlinked node_modules${NC}"
  else
    echo -e "  ${YELLOW}ℹ️  No node_modules found in main repo${NC}"
  fi
}

# =============================================================================
# CREATE WORKTREE
# =============================================================================

create_worktree() {
  local task_slug="$1"
  local from_branch="${2:-$(git rev-parse --abbrev-ref HEAD)}"

  if [[ -z "$task_slug" ]]; then
    echo -e "${RED}Error: Task slug required${NC}"
    echo "Usage: worktree-manager.sh create <task-slug> [base-branch]"
    exit 1
  fi

  # Check if we can use worktrees
  if ! can_use_worktrees; then
    echo -e "${RED}Error: Cannot create worktrees (already in a worktree or no .git directory)${NC}"
    exit 1
  fi

  task_slug=$(slugify "$task_slug")
  local branch_name="${BRANCH_PREFIX}/${task_slug}"
  local worktree_path="$WORKTREE_DIR/$task_slug"

  # Check if worktree already exists
  if [[ -d "$worktree_path" ]]; then
    echo -e "${YELLOW}Worktree already exists: $worktree_path${NC}"
    echo -e "Branch: $(git -C "$worktree_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
    exit 0
  fi

  echo -e "${BLUE}Creating worktree: $task_slug${NC}"
  echo "  Branch: $branch_name"
  echo "  From: $from_branch"
  echo "  Path: $worktree_path"
  echo ""

  # Ensure directory and .gitignore
  mkdir -p "$WORKTREE_DIR"
  ensure_gitignore

  # Create worktree with new branch
  git worktree add -b "$branch_name" "$worktree_path" "$from_branch" 2>&1

  # Copy env files
  copy_env_files "$worktree_path"

  # Symlink node_modules
  setup_node_modules "$worktree_path"

  echo ""
  echo -e "${GREEN}✅ Worktree created successfully!${NC}"
  echo ""
  echo "  Path: $worktree_path"
  echo "  Branch: $branch_name"
  echo ""
  echo -e "To work in this worktree, operate on files in: ${BLUE}$worktree_path${NC}"
}

# =============================================================================
# LIST WORKTREES
# =============================================================================

list_worktrees() {
  echo -e "${BLUE}Active worktrees:${NC}"
  echo ""

  if [[ ! -d "$WORKTREE_DIR" ]]; then
    echo -e "${YELLOW}No worktrees found${NC}"
    return
  fi

  local count=0
  local stale_count=0
  for worktree_path in "$WORKTREE_DIR"/*/; do
    [[ -d "$worktree_path" ]] || continue
    local name=$(basename "$worktree_path")

    if [[ -e "$worktree_path/.git" ]]; then
      count=$((count + 1))
      local branch=$(git -C "$worktree_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
      local status=""

      # Check for uncommitted changes
      if git -C "$worktree_path" status --porcelain 2>/dev/null | grep -q .; then
        status=" ${YELLOW}(uncommitted changes)${NC}"
      fi

      echo -e "  ${GREEN}$name${NC} → branch: $branch$status"
    else
      # Stale directory (no .git link — orphaned)
      stale_count=$((stale_count + 1))
      echo -e "  ${RED}$name${NC} → ${RED}stale (no .git, run 'remove $name' to clean)${NC}"
    fi
  done

  if [[ $count -eq 0 && $stale_count -eq 0 ]]; then
    echo -e "${YELLOW}No worktrees found${NC}"
  else
    echo ""
    echo -e "Active: $count | Stale: $stale_count"
  fi

  echo ""
  echo -e "${BLUE}Main repository:${NC}"
  echo "  Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
  echo "  Path: $GIT_ROOT"

  # tmux status (if session exists)
  if command -v tmux &>/dev/null && tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo ""
    echo -e "${BLUE}tmux session:${NC} $SESSION_NAME (active)"
    echo -e "  Attach: tmux attach -t $SESSION_NAME"
  fi
}

# =============================================================================
# REMOVE WORKTREE
# =============================================================================

remove_worktree() {
  local task_slug="$1"

  if [[ -z "$task_slug" ]]; then
    echo -e "${RED}Error: Task slug required${NC}"
    echo "Usage: worktree-manager.sh remove <task-slug>"
    exit 1
  fi

  task_slug=$(slugify "$task_slug")
  local worktree_path="$WORKTREE_DIR/$task_slug"
  local branch_name="${BRANCH_PREFIX}/${task_slug}"

  if [[ ! -d "$worktree_path" ]]; then
    echo -e "${RED}Error: Worktree not found: $task_slug${NC}"
    exit 1
  fi

  # Handle stale directories (no .git link)
  if [[ ! -e "$worktree_path/.git" ]]; then
    echo -e "${YELLOW}Stale directory (no .git link). Removing...${NC}"
    rm -rf "$worktree_path"
    git branch -D "$branch_name" 2>/dev/null || true
    git worktree prune 2>/dev/null || true
    echo -e "${GREEN}Removed stale directory: $task_slug${NC}"
    return
  fi

  # Check for uncommitted changes
  if git -C "$worktree_path" status --porcelain 2>/dev/null | grep -q .; then
    echo -e "${YELLOW}Warning: Worktree has uncommitted changes${NC}"
    echo -e "${YELLOW}Proceeding with force removal...${NC}"
  fi

  echo -e "${BLUE}Removing worktree: $task_slug${NC}"

  # Remove symlink first
  rm -f "$worktree_path/node_modules" 2>/dev/null || true

  # Remove worktree
  git worktree remove --force "$worktree_path" 2>/dev/null || {
    rm -rf "$worktree_path"
    git worktree prune 2>/dev/null || true
  }

  # Delete branch
  git branch -D "$branch_name" 2>/dev/null || true

  echo -e "${GREEN}Removed worktree: $task_slug${NC}"

  # Clean up empty directory
  if [[ -d "$WORKTREE_DIR" ]] && [[ -z "$(ls -A "$WORKTREE_DIR" 2>/dev/null)" ]]; then
    rmdir "$WORKTREE_DIR" 2>/dev/null || true
  fi
}

# =============================================================================
# CLEANUP ALL WORKTREES
# =============================================================================

cleanup_worktrees() {
  if [[ ! -d "$WORKTREE_DIR" ]]; then
    echo -e "${YELLOW}No worktrees to clean up${NC}"
    return
  fi

  echo -e "${BLUE}Cleaning up all worktrees...${NC}"
  echo ""

  local count=0
  for worktree_path in "$WORKTREE_DIR"/*/; do
    if [[ -d "$worktree_path" && -e "$worktree_path/.git" ]]; then
      local name=$(basename "$worktree_path")
      local branch_name="${BRANCH_PREFIX}/${name}"

      # Remove symlink
      rm -f "$worktree_path/node_modules" 2>/dev/null || true

      # Remove worktree
      git worktree remove --force "$worktree_path" 2>/dev/null || {
        rm -rf "$worktree_path"
      }

      # Delete branch
      git branch -D "$branch_name" 2>/dev/null || true

      echo -e "  ${GREEN}✓ Removed: $name${NC}"
      count=$((count + 1))
    fi
  done

  git worktree prune 2>/dev/null || true

  # Clean up directory
  if [[ -d "$WORKTREE_DIR" ]] && [[ -z "$(ls -A "$WORKTREE_DIR" 2>/dev/null)" ]]; then
    rmdir "$WORKTREE_DIR" 2>/dev/null || true
  fi

  if [[ $count -eq 0 ]]; then
    echo -e "${YELLOW}No worktrees found to clean up${NC}"
  else
    echo ""
    echo -e "${GREEN}✅ Cleaned up $count worktree(s)${NC}"
  fi
}

# =============================================================================
# TMUX SESSION MANAGEMENT
# =============================================================================

# Set pane title for reliable worktree-to-pane mapping (survives cd)
_set_pane_title() {
  local pane_target="$1"
  local title="$2"
  tmux select-pane -t "$pane_target" -T "$title" 2>/dev/null || true
}

# Find pane by title (more reliable than path matching which breaks on cd)
_find_pane_by_title() {
  local win_id="$1"
  local title="$2"
  tmux list-panes -t "$win_id" -F '#{pane_index}:#{pane_title}' 2>/dev/null | \
    while IFS=: read -r idx ptitle; do
      if [[ "$ptitle" == "$title" ]]; then
        echo "$idx"
        return 0
      fi
    done
}

# Get the actual pane ID after a split (tmux may not assign sequential indexes)
_last_split_pane_id() {
  local win_id="$1"
  tmux list-panes -t "$win_id" -F '#{pane_index}' | tail -1
}

# Build the main-vertical layout: left 40% main, right 60% stacked worktrees
_apply_layout() {
  local win_id="$1"
  local main_pane_id="$2"

  tmux select-layout -t "$win_id" main-vertical 2>/dev/null || true
  local total_cols=$(tmux display-message -t "$win_id" -p '#{window_width}' 2>/dev/null || echo 200)
  local main_width=$((total_cols * 40 / 100))
  tmux resize-pane -t "$main_pane_id" -x "$main_width" 2>/dev/null || true
  tmux select-pane -t "$main_pane_id"
}

# Start interactive Claude session in a worktree pane
_start_claude_session() {
  local pane_target="$1"
  local wt_name="$2"
  tmux send-keys -t "$pane_target" "claude" Enter
}

# Split panes for worktrees from a given main pane
# Args: win_id main_pane_id worktree_name1 worktree_name2 ...
_split_worktree_panes() {
  local win_id="$1"
  local main_pane_id="$2"
  shift 2
  local wt_names=("$@")

  local first=true
  for wt_name in "${wt_names[@]}"; do
    local wt_path="$WORKTREE_DIR/$wt_name"
    local wt_branch=$(git -C "$wt_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

    if $first; then
      # First worktree: split horizontally from main (creates right column)
      tmux split-window -h -t "$main_pane_id" -c "$wt_path"
      first=false
    else
      # Subsequent: split last pane vertically (stack on right)
      local last_pane=$(_last_split_pane_id "$win_id")
      tmux split-window -v -t "${win_id}.${last_pane}" -c "$wt_path"
    fi

    local new_pane=$(_last_split_pane_id "$win_id")
    _set_pane_title "${win_id}.${new_pane}" "wt:${wt_name}"
    _start_claude_session "${win_id}.${new_pane}" "$wt_name"
  done
}

tmux_setup() {
  require_tmux
  require_worktrees

  # Kill existing session if any
  tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

  local term_cols=$(tput cols 2>/dev/null || echo 200)
  local term_lines=$(tput lines 2>/dev/null || echo 50)

  tmux new-session -d -s "$SESSION_NAME" -c "$GIT_ROOT" -x "$term_cols" -y "$term_lines"
  sleep 0.3

  local win_base=$(tmux show-options -gv base-index 2>/dev/null || echo 0)
  local pane_base=$(tmux show-options -gv pane-base-index 2>/dev/null || echo 0)
  local win_id="${SESSION_NAME}:${win_base}"
  local main_pane_id="${win_id}.${pane_base}"

  tmux rename-window -t "$win_id" "parallel-work"
  _set_pane_title "$main_pane_id" "main"

  # Start Claude session in main pane
  tmux send-keys -t "$main_pane_id" "claude --continue" Enter

  # Split panes for all worktrees
  _split_worktree_panes "$win_id" "$main_pane_id" "${WORKTREE_NAMES[@]}"

  # Apply layout
  if [[ ${#WORKTREE_NAMES[@]} -gt 1 ]]; then
    _apply_layout "$win_id" "$main_pane_id"
  fi

  echo -e "${GREEN}tmux session '$SESSION_NAME' created${NC}"
  echo ""
  echo -e "  Layout: main (40%) | worktrees (60%, stacked)"
  echo -e "  Worktrees: ${WORKTREE_NAMES[*]}"
  echo ""
  echo -e "  ${BLUE}Attach:${NC} tmux attach -t $SESSION_NAME"
  echo -e "  ${BLUE}Navigation:${NC} Ctrl+b arrows | Ctrl+b z (zoom) | Ctrl+b d (detach)"
}

tmux_attach() {
  require_tmux
  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${RED}Error: No tmux session '$SESSION_NAME'. Run 'tmux' first.${NC}"
    exit 1
  fi
  tmux attach -t "$SESSION_NAME"
}

tmux_live() {
  require_tmux
  require_worktrees

  # Already inside tmux — split current window directly
  if [[ -n "$TMUX" ]]; then
    echo -e "${BLUE}Already in tmux. Splitting current window...${NC}"
    _tmux_live_in_tmux
    return
  fi

  # Not in tmux — current terminal IS the main session.
  # Create tmux with worktree panes ONLY (no main pane), open in new tab.
  tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

  local term_cols=$(tput cols 2>/dev/null || echo 200)
  local term_lines=$(tput lines 2>/dev/null || echo 50)

  # First worktree becomes the initial pane
  local first_wt="${WORKTREE_NAMES[0]}"
  local first_wt_path="$WORKTREE_DIR/$first_wt"

  tmux new-session -d -s "$SESSION_NAME" -c "$first_wt_path" -x "$term_cols" -y "$term_lines"
  sleep 0.3

  local win_base=$(tmux show-options -gv base-index 2>/dev/null || echo 0)
  local pane_base=$(tmux show-options -gv pane-base-index 2>/dev/null || echo 0)
  local win_id="${SESSION_NAME}:${win_base}"
  local first_pane_id="${win_id}.${pane_base}"

  tmux rename-window -t "$win_id" "parallel-work"

  # Set up first worktree pane
  local first_branch=$(git -C "$first_wt_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  _set_pane_title "$first_pane_id" "wt:${first_wt}"
  _start_claude_session "$first_pane_id" "$first_wt"

  # Split for remaining worktrees (vertical stack)
  local remaining=("${WORKTREE_NAMES[@]:1}")
  for wt_name in "${remaining[@]}"; do
    local wt_path="$WORKTREE_DIR/$wt_name"
    local wt_branch=$(git -C "$wt_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

    local last_pane=$(_last_split_pane_id "$win_id")
    tmux split-window -v -t "${win_id}.${last_pane}" -c "$wt_path"

    local new_pane=$(_last_split_pane_id "$win_id")
    _set_pane_title "${win_id}.${new_pane}" "wt:${wt_name}"
    _start_claude_session "${win_id}.${new_pane}" "$wt_name"
  done

  # Balance panes evenly (no main-vertical needed, just even-vertical)
  if [[ ${#WORKTREE_NAMES[@]} -gt 1 ]]; then
    tmux select-layout -t "$win_id" even-vertical 2>/dev/null || true
  fi

  tmux select-pane -t "$first_pane_id"

  echo -e "${GREEN}tmux session '$SESSION_NAME' created (worktrees only)${NC}"
  echo -e "  Panes: ${WORKTREE_NAMES[*]}"
  echo -e "  Main session: this terminal (no duplication)"
  echo ""

  # Auto-open new terminal tab and attach
  if _open_terminal_tab "tmux attach -t $SESSION_NAME"; then
    echo -e "  ${GREEN}New tab opened with worktree panes.${NC}"
  else
    echo -e "  ${BLUE}Attach manually from a new terminal tab:${NC}"
    echo -e "    tmux attach -t $SESSION_NAME"
  fi
}

# Split current tmux window (called when already inside tmux)
_tmux_live_in_tmux() {
  local current_win=$(tmux display-message -p '#{window_index}')
  local pane_base=$(tmux show-options -gv pane-base-index 2>/dev/null || echo 0)
  local current_session=$(tmux display-message -p '#{session_name}')
  local win_id="${current_session}:${current_win}"
  local main_pane_id="${win_id}.${pane_base}"

  _set_pane_title "$main_pane_id" "main"
  _split_worktree_panes "$win_id" "$main_pane_id" "${WORKTREE_NAMES[@]}"

  if [[ ${#WORKTREE_NAMES[@]} -gt 1 ]]; then
    _apply_layout "$win_id" "$main_pane_id"
  fi

  echo -e "${GREEN}Split complete! Worktrees: ${WORKTREE_NAMES[*]}${NC}"
}

tmux_add_pane() {
  require_tmux
  local task_slug="$1"

  if [[ -z "$task_slug" ]]; then
    echo -e "${RED}Error: Task slug required${NC}"
    exit 1
  fi

  task_slug=$(slugify "$task_slug")
  local wt_path="$WORKTREE_DIR/$task_slug"

  if [[ ! -d "$wt_path" ]]; then
    echo -e "${RED}Error: Worktree not found: $task_slug${NC}"
    exit 1
  fi

  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}No tmux session. Creating full layout...${NC}"
    tmux_setup
    return
  fi

  local win_id
  win_id="$(tmux show-options -gv base-index 2>/dev/null || echo 0)"
  win_id="${SESSION_NAME}:${win_id}"
  local pane_base=$(tmux show-options -gv pane-base-index 2>/dev/null || echo 0)
  local main_pane_id="${win_id}.${pane_base}"
  local wt_branch=$(git -C "$wt_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

  # Split from the last pane
  local last_pane=$(_last_split_pane_id "$win_id")
  tmux split-window -v -t "${win_id}.${last_pane}" -c "$wt_path"

  local new_pane=$(_last_split_pane_id "$win_id")
  _set_pane_title "${win_id}.${new_pane}" "wt:${task_slug}"
  _start_claude_session "${win_id}.${new_pane}" "$task_slug"

  # Rebalance
  _apply_layout "$win_id" "$main_pane_id"

  echo -e "${GREEN}Added pane for worktree: $task_slug${NC}"
}

tmux_exec() {
  require_tmux
  local task_slug="$1"
  shift
  local cmd="$*"

  if [[ -z "$task_slug" || -z "$cmd" ]]; then
    echo -e "${RED}Usage: worktree-manager.sh tmux-exec <task-slug> <command>${NC}"
    exit 1
  fi

  task_slug=$(slugify "$task_slug")

  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${RED}Error: No tmux session. Run 'tmux' first.${NC}"
    exit 1
  fi

  local win_id
  win_id="$(tmux show-options -gv base-index 2>/dev/null || echo 0)"
  win_id="${SESSION_NAME}:${win_id}"

  # Find pane by title first (reliable even after cd), fallback to path
  local target_pane
  target_pane=$(_find_pane_by_title "$win_id" "wt:${task_slug}")

  if [[ -z "$target_pane" ]]; then
    # Fallback: match by pane_current_path
    local wt_path="$WORKTREE_DIR/$task_slug"
    while IFS=: read -r pane_id pane_path; do
      if [[ "$pane_path" == "$wt_path" ]]; then
        target_pane="$pane_id"
        break
      fi
    done < <(tmux list-panes -t "$win_id" -F '#{pane_index}:#{pane_current_path}')
  fi

  if [[ -z "$target_pane" ]]; then
    echo -e "${RED}Error: No pane found for worktree: $task_slug${NC}"
    echo -e "  Available panes:"
    tmux list-panes -t "$win_id" -F '    #{pane_index}: #{pane_title} (#{pane_current_path})' 2>/dev/null
    exit 1
  fi

  tmux send-keys -t "${win_id}.${target_pane}" "$cmd" Enter
  echo -e "${GREEN}Sent to $task_slug (pane $target_pane): $cmd${NC}"
}

tmux_status() {
  require_tmux
  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}No active tmux session '$SESSION_NAME'${NC}"
    return
  fi

  local win_id
  win_id="$(tmux show-options -gv base-index 2>/dev/null || echo 0)"
  win_id="${SESSION_NAME}:${win_id}"

  echo -e "${BLUE}tmux session: $SESSION_NAME${NC}"
  echo ""
  tmux list-panes -t "$win_id" -F '  Pane #{pane_index}: [#{pane_title}] #{pane_current_path} (#{pane_width}x#{pane_height})' 2>/dev/null
  echo ""

  # Show worktree-pane mapping
  echo -e "${BLUE}Worktree mapping:${NC}"
  collect_worktree_names
  for wt_name in "${WORKTREE_NAMES[@]}"; do
    local pane_idx
    pane_idx=$(_find_pane_by_title "$win_id" "wt:${wt_name}")
    if [[ -n "$pane_idx" ]]; then
      echo -e "  ${GREEN}$wt_name${NC} → pane $pane_idx"
    else
      echo -e "  ${YELLOW}$wt_name${NC} → no pane (run tmux-add $wt_name)"
    fi
  done
  echo ""
  echo -e "Attach: ${GREEN}tmux attach -t $SESSION_NAME${NC}"
}

tmux_kill() {
  require_tmux
  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}No tmux session '$SESSION_NAME' to kill${NC}"
    return
  fi

  tmux kill-session -t "$SESSION_NAME"
  echo -e "${GREEN}Killed tmux session '$SESSION_NAME'${NC}"
  echo -e "  ${BLUE}Note:${NC} Worktrees are preserved. Use 'cleanup' to remove them."
}

# =============================================================================
# MERGE WORKTREE BRANCH
# =============================================================================

merge_worktree() {
  local task_slug="$1"
  local target_branch="${2:-$(git rev-parse --abbrev-ref HEAD)}"

  if [[ -z "$task_slug" ]]; then
    echo -e "${RED}Error: Task slug required${NC}"
    echo "Usage: worktree-manager.sh merge <task-slug> [target-branch]"
    exit 1
  fi

  task_slug=$(slugify "$task_slug")
  local branch_name="${BRANCH_PREFIX}/${task_slug}"

  # Check branch exists
  if ! git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
    echo -e "${RED}Error: Branch not found: $branch_name${NC}"
    exit 1
  fi

  echo -e "${BLUE}Merging $branch_name into $target_branch...${NC}"

  # Ensure we're on target branch
  git checkout "$target_branch" 2>/dev/null

  # Attempt merge
  if git merge --no-ff -m "Merge $branch_name into $target_branch" "$branch_name" 2>&1; then
    echo -e "${GREEN}✅ Successfully merged $branch_name into $target_branch${NC}"
  else
    echo -e "${RED}❌ Merge conflict detected${NC}"
    echo -e "${YELLOW}Resolve conflicts manually, then run:${NC}"
    echo "  git merge --continue"
    echo ""
    echo "Or abort with:"
    echo "  git merge --abort"
    exit 1
  fi
}

# =============================================================================
# MAIN
# =============================================================================

show_help() {
  cat << 'EOF'
Git Worktree Manager — Parallel Task Isolation + tmux Dashboard

Usage: worktree-manager.sh <command> [options]

Worktree Commands:
  create <task-slug> [base-branch]    Create new worktree for a task
  list                                List all active worktrees
  remove <task-slug>                  Remove a specific worktree
  cleanup                             Remove all worktrees
  merge <task-slug> [target-branch]   Merge worktree branch into target

tmux Commands:
  tmux                                Create tmux session (background)
  tmux-live                           Split current terminal into tmux dashboard
  tmux-attach                         Attach to existing tmux session
  tmux-add <task-slug>                Add worktree pane to running session
  tmux-exec <task-slug> <command>     Send command to worktree pane
  tmux-status                         Show session status + pane mapping
  tmux-kill                           Kill tmux session (worktrees preserved)

Examples:
  # Live mode: split current session into tmux dashboard
  worktree-manager.sh create auth-refactor
  worktree-manager.sh create dashboard-kpi
  worktree-manager.sh tmux-live    # current terminal -> tmux, claude resumes

  # Background mode: create separately then attach
  worktree-manager.sh tmux         # create in background
  tmux attach -t worktrees         # attach manually

  # Send claude command to a worktree pane
  worktree-manager.sh tmux-exec auth-refactor "claude -p 'implement auth'"

  # Add a new worktree pane to running session
  worktree-manager.sh create pixel-fix
  worktree-manager.sh tmux-add pixel-fix

Layout:
  ┌──────────────┬──────────────┐
  │              │  worktree-1  │
  │    MAIN      ├──────────────┤
  │   SESSION    │  worktree-2  │
  │   (40%)      ├──────────────┤
  │              │  worktree-3  │
  └──────────────┴──────────────┘

Environment:
  - .env files auto-copied (excluding .env.example)
  - node_modules symlinked from main repo
  - Branch naming: sisyphus/<task-slug>
  - Worktree location: .worktrees/<task-slug>/
EOF
}

main() {
  local command="${1:-help}"

  case "$command" in
    create)
      create_worktree "$2" "$3"
      ;;
    list|ls)
      list_worktrees
      ;;
    remove|rm)
      remove_worktree "$2"
      ;;
    cleanup|clean)
      cleanup_worktrees
      ;;
    merge)
      merge_worktree "$2" "$3"
      ;;
    tmux)
      tmux_setup
      ;;
    tmux-live|live)
      tmux_live
      ;;
    tmux-attach|attach)
      tmux_attach
      ;;
    tmux-add)
      tmux_add_pane "$2"
      ;;
    tmux-exec|exec)
      tmux_exec "$2" "${@:3}"
      ;;
    tmux-status|status)
      tmux_status
      ;;
    tmux-kill|kill)
      tmux_kill
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      echo -e "${RED}Unknown command: $command${NC}"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

main "$@"
