#!/bin/bash
# =============================================================================
# Prisma 마이그레이션 롤백 스크립트
# 마이그레이션 실패 시 데이터베이스를 이전 상태로 복구합니다.
# =============================================================================

set -e  # 에러 발생 시 즉시 종료

# =============================================================================
# 색상 정의
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# 헬퍼 함수
# =============================================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# 환경변수 확인
# =============================================================================
check_env() {
    log_info "환경변수 확인 중..."

    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL 환경변수가 설정되지 않았습니다."
        exit 1
    fi

    log_success "환경변수 확인 완료"
}

# =============================================================================
# 마이그레이션 상태 확인
# =============================================================================
check_migration_status() {
    log_info "현재 마이그레이션 상태:"
    npx prisma migrate status
}

# =============================================================================
# 마이그레이션 히스토리 조회
# =============================================================================
list_migrations() {
    log_info "마이그레이션 히스토리:"
    echo ""

    if [ -d "prisma/migrations" ]; then
        ls -la prisma/migrations/ | grep -E "^d" | awk '{print NR". "$NF}'
    else
        log_warning "마이그레이션 디렉토리가 없습니다."
    fi
}

# =============================================================================
# 실패한 마이그레이션 롤백 (표시만)
# =============================================================================
mark_rolled_back() {
    local migration_name="$1"

    if [ -z "$migration_name" ]; then
        log_error "마이그레이션 이름을 입력해주세요."
        echo "사용법: $0 mark-rolled-back <migration_name>"
        exit 1
    fi

    log_warning "마이그레이션 '$migration_name'을 롤백 상태로 표시합니다..."
    log_warning "⚠️ 이 작업은 데이터베이스를 변경하지 않습니다."
    log_warning "⚠️ 실제 스키마 변경은 수동으로 처리해야 합니다."

    read -p "계속하시겠습니까? (y/N) " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "롤백이 취소되었습니다."
        exit 0
    fi

    if npx prisma migrate resolve --rolled-back "$migration_name"; then
        log_success "마이그레이션이 롤백 상태로 표시되었습니다."
    else
        log_error "롤백 표시 실패"
        exit 1
    fi
}

# =============================================================================
# 마이그레이션 적용 완료 표시
# =============================================================================
mark_applied() {
    local migration_name="$1"

    if [ -z "$migration_name" ]; then
        log_error "마이그레이션 이름을 입력해주세요."
        echo "사용법: $0 mark-applied <migration_name>"
        exit 1
    fi

    log_info "마이그레이션 '$migration_name'을 적용됨 상태로 표시합니다..."

    if npx prisma migrate resolve --applied "$migration_name"; then
        log_success "마이그레이션이 적용됨 상태로 표시되었습니다."
    else
        log_error "적용 표시 실패"
        exit 1
    fi
}

# =============================================================================
# 데이터베이스 리셋 (개발 환경 전용)
# =============================================================================
reset_database() {
    log_warning "⚠️ 이 작업은 모든 데이터를 삭제합니다!"
    log_warning "⚠️ 개발 환경에서만 사용해야 합니다!"

    if [ "$NODE_ENV" = "production" ]; then
        log_error "프로덕션 환경에서는 데이터베이스 리셋이 금지됩니다."
        exit 1
    fi

    read -p "정말로 데이터베이스를 리셋하시겠습니까? (yes/no) " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "리셋이 취소되었습니다."
        exit 0
    fi

    log_info "데이터베이스 리셋 중..."

    if npx prisma migrate reset --force; then
        log_success "데이터베이스가 리셋되었습니다."
    else
        log_error "데이터베이스 리셋 실패"
        exit 1
    fi
}

# =============================================================================
# Supabase Point-in-Time Recovery 안내
# =============================================================================
show_pitr_guide() {
    echo ""
    echo "=================================================="
    echo "  Supabase Point-in-Time Recovery (PITR) 가이드"
    echo "=================================================="
    echo ""
    echo "Supabase Pro 플랜에서는 PITR을 사용할 수 있습니다."
    echo ""
    echo "1. Supabase Dashboard 접속"
    echo "   https://supabase.com/dashboard/project/[project-id]"
    echo ""
    echo "2. Database → Backups 메뉴로 이동"
    echo ""
    echo "3. 'Point in time recovery' 섹션에서:"
    echo "   - 복구할 시점 선택"
    echo "   - 'Restore' 클릭"
    echo ""
    echo "4. 새 프로젝트가 생성되며 해당 시점의 데이터가 복구됩니다."
    echo ""
    log_warning "주의: PITR은 Pro 플랜 이상에서만 사용 가능합니다."
    echo ""
}

# =============================================================================
# 도움말
# =============================================================================
show_help() {
    echo "사용법: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status            - 현재 마이그레이션 상태 확인"
    echo "  list              - 마이그레이션 히스토리 조회"
    echo "  mark-rolled-back  - 마이그레이션을 롤백 상태로 표시"
    echo "  mark-applied      - 마이그레이션을 적용됨 상태로 표시"
    echo "  reset             - 데이터베이스 리셋 (개발 환경 전용)"
    echo "  pitr              - Supabase PITR 가이드 표시"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 mark-rolled-back 20231225120000_add_users"
    echo "  $0 reset"
}

# =============================================================================
# 메인 함수
# =============================================================================
main() {
    echo "=================================================="
    echo "  바투 AI 마케팅 솔루션 - 마이그레이션 롤백"
    echo "=================================================="
    echo ""

    case "${1:-help}" in
        "status")
            check_env
            check_migration_status
            ;;
        "list")
            list_migrations
            ;;
        "mark-rolled-back")
            check_env
            mark_rolled_back "$2"
            ;;
        "mark-applied")
            check_env
            mark_applied "$2"
            ;;
        "reset")
            check_env
            reset_database
            ;;
        "pitr")
            show_pitr_guide
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "알 수 없는 명령어: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"
