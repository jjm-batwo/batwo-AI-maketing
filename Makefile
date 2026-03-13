# ──────────────────────────────────────────────────
# Batwo AI Marketing SaaS — CI Mirror Makefile
# CI와 동일한 검증을 로컬에서 실행
# ──────────────────────────────────────────────────

# CI에서 사용하는 버전 (ci.yml과 동기화)
REQUIRED_NODE_MAJOR := 20
REQUIRED_NPM := 11.9.0

# ── 색상 ──
GREEN  := \033[0;32m
RED    := \033[0;31m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RESET  := \033[0m

# ============================================================
# 환경 검증
# ============================================================

.PHONY: check-env
check-env: ## Node.js/npm 버전이 CI와 일치하는지 검증
	@echo "$(CYAN)── 환경 검증 ──$(RESET)"
	@node_major=$$(node -v | sed 's/v\([0-9]*\).*/\1/'); \
	if [ "$$node_major" -lt "$(REQUIRED_NODE_MAJOR)" ]; then \
		echo "$(RED)✗ Node.js v$$node_major — v$(REQUIRED_NODE_MAJOR)+ 필요$(RESET)"; exit 1; \
	else \
		echo "$(GREEN)✓ Node.js $$(node -v)$(RESET)"; \
	fi
	@npm_ver=$$(npm -v); \
	if [ "$$npm_ver" != "$(REQUIRED_NPM)" ]; then \
		echo "$(YELLOW)⚠ npm $$npm_ver — CI는 $(REQUIRED_NPM) (npm i -g npm@$(REQUIRED_NPM))$(RESET)"; \
	else \
		echo "$(GREEN)✓ npm $$npm_ver$(RESET)"; \
	fi

# ============================================================
# 개별 검사
# ============================================================

.PHONY: lint
lint: ## ESLint 실행
	@echo "$(CYAN)── ESLint ──$(RESET)"
	npm run lint

.PHONY: type-check
type-check: ## TypeScript 타입 검사
	@echo "$(CYAN)── Type Check ──$(RESET)"
	npm run type-check

.PHONY: format-check
format-check: ## Prettier 포맷 검사
	@echo "$(CYAN)── Format Check ──$(RESET)"
	npm run format:check

.PHONY: test-unit
test-unit: ## 유닛 테스트 실행
	@echo "$(CYAN)── Unit Tests ──$(RESET)"
	npm run test:unit -- --pool forks --reporter=dot

.PHONY: test-integration
test-integration: ## 통합 테스트 실행 (DB 필요)
	@echo "$(CYAN)── Integration Tests ──$(RESET)"
	npm run test:integration -- --reporter=verbose

.PHONY: build
build: ## 프로덕션 빌드 검증
	@echo "$(CYAN)── Production Build ──$(RESET)"
	SKIP_ENV_VALIDATION=true npm run build

.PHONY: security-audit
security-audit: ## npm 보안 감사 (critical만)
	@echo "$(CYAN)── Security Audit ──$(RESET)"
	npm audit --audit-level=critical --omit=dev || true

# ============================================================
# 복합 타겟 (Composite)
# ============================================================

.PHONY: check-quick
check-quick: check-env lint type-check test-unit ## 빠른 검사 (≈15초) — pre-push 동등
	@echo ""
	@echo "$(GREEN)✅ Quick check 통과! push 가능$(RESET)"

.PHONY: check-full
check-full: check-quick format-check test-integration build ## 전체 검사 (≈60초)
	@echo ""
	@echo "$(GREEN)✅ Full check 통과! CI 통과 예상$(RESET)"

.PHONY: check-ci
check-ci: check-full security-audit ## CI 100% 미러링
	@echo ""
	@echo "$(GREEN)✅ CI mirror 통과! 모든 CI 검사 통과 예상$(RESET)"

# ============================================================
# 도움말
# ============================================================

.PHONY: help
help: ## 사용 가능한 명령어 목록
	@echo "$(CYAN)사용법: make <target>$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)권장 조합:$(RESET)"
	@echo "  make check-quick    — push 전 빠른 검증 (lint + type + test)"
	@echo "  make check-full     — PR 전 전체 검증 (+ format + integration + build)"
	@echo "  make check-ci       — CI 완전 미러링 (+ security audit)"

.DEFAULT_GOAL := help
