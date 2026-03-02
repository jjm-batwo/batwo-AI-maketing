#!/bin/bash

# Git Worktree Manager for Sisyphus Parallel Agent Isolation
# Based on: compound-engineering-plugin + ralph-parallel patterns
# Purpose: Create, list, cleanup, merge git worktrees for parallel AI agent work
#
# Usage:
#   worktree-manager.sh create <task-slug> [base-branch]
#   worktree-manager.sh list
#   worktree-manager.sh remove <task-slug>
#   worktree-manager.sh cleanup
#   worktree-manager.sh merge <task-slug> [target-branch]

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
  for worktree_path in "$WORKTREE_DIR"/*/; do
    if [[ -d "$worktree_path" && -e "$worktree_path/.git" ]]; then
      count=$((count + 1))
      local name=$(basename "$worktree_path")
      local branch=$(git -C "$worktree_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
      local status=""

      # Check for uncommitted changes
      if git -C "$worktree_path" status --porcelain 2>/dev/null | grep -q .; then
        status=" ${YELLOW}(uncommitted changes)${NC}"
      fi

      echo -e "  🌳 ${GREEN}$name${NC} → branch: $branch$status"
    fi
  done

  if [[ $count -eq 0 ]]; then
    echo -e "${YELLOW}No worktrees found${NC}"
  else
    echo ""
    echo -e "Total: $count worktree(s)"
  fi

  echo ""
  echo -e "${BLUE}Main repository:${NC}"
  echo "  Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
  echo "  Path: $GIT_ROOT"
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

  # Check for uncommitted changes
  if git -C "$worktree_path" status --porcelain 2>/dev/null | grep -q .; then
    echo -e "${YELLOW}⚠️  Warning: Worktree has uncommitted changes${NC}"
    echo -e "${YELLOW}   Proceeding with force removal...${NC}"
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

  echo -e "${GREEN}✓ Removed worktree: $task_slug${NC}"

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
Git Worktree Manager (Sisyphus Parallel Agent Isolation)

Usage: worktree-manager.sh <command> [options]

Commands:
  create <task-slug> [base-branch]    Create new worktree for a task
                                      (auto-copies .env files, symlinks node_modules)
  list                                List all active worktrees
  remove <task-slug>                  Remove a specific worktree
  cleanup                             Remove all worktrees
  merge <task-slug> [target-branch]   Merge worktree branch into target
  help                                Show this help

Examples:
  worktree-manager.sh create auth-refactor
  worktree-manager.sh create dashboard-kpi develop
  worktree-manager.sh list
  worktree-manager.sh merge auth-refactor main
  worktree-manager.sh remove auth-refactor
  worktree-manager.sh cleanup

Environment:
  - .env files are auto-copied (excluding .env.example)
  - node_modules is symlinked from main repo
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
