# 롤백 전략 가이드

바투 AI 마케팅 솔루션의 배포 롤백 절차 및 복구 전략입니다.

---

## 롤백 시나리오 분류

| 심각도 | 설명 | 예시 | 대응 시간 |
|--------|------|------|-----------|
| 🔴 Critical | 서비스 완전 중단 | 사이트 접속 불가, 전체 API 장애 | 즉시 (5분 이내) |
| 🟠 High | 핵심 기능 장애 | 로그인 불가, 결제 실패 | 15분 이내 |
| 🟡 Medium | 부분 기능 장애 | 특정 페이지 오류, 일부 API 오류 | 1시간 이내 |
| 🟢 Low | 경미한 이슈 | UI 깨짐, 성능 저하 | 다음 배포에서 수정 |

---

## 1. 즉시 롤백 (Vercel Instant Rollback)

### 적용 대상
- 프론트엔드/백엔드 코드 변경으로 인한 장애
- 설정 변경으로 인한 장애
- 환경변수 외 모든 코드 관련 이슈

### 절차 (약 1분 소요)

#### 방법 1: Vercel Dashboard (권장)

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 → **Deployments** 탭
3. 롤백할 이전 배포 버전 찾기 (녹색 체크 ✓ 표시)
4. 해당 배포의 **⋮** 메뉴 클릭
5. **Instant Rollback** 선택
6. 확인 후 롤백 완료 대기

#### 방법 2: Vercel CLI

```bash
# 최근 배포 목록 확인
vercel list

# 특정 배포로 롤백 (URL로 지정)
vercel rollback <deployment-url>

# 예시
vercel rollback batwo-abc123.vercel.app
```

### 롤백 후 확인

```bash
# 헬스체크
curl https://batwo.ai/api/health

# 기본 페이지 접속
curl -I https://batwo.ai

# 로그인 API 확인
curl -X POST https://batwo.ai/api/auth/signin -I
```

---

## 2. 데이터베이스 롤백

### 2.1 마이그레이션 롤백 (Prisma)

#### 마지막 마이그레이션만 롤백

```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 마지막 마이그레이션 표시 (적용 해제)
npx prisma migrate resolve --rolled-back <migration_name>

# 예시
npx prisma migrate resolve --rolled-back 20250101000000_add_new_table
```

#### 스키마 강제 리셋 (주의: 데이터 손실)

```bash
# 개발 환경에서만 사용
npx prisma migrate reset
```

### 2.2 Supabase Point-in-Time Recovery (PITR)

#### 적용 대상
- 데이터 손상/삭제
- 잘못된 데이터 마이그레이션
- 대규모 데이터 변경 실수

#### 절차

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 → **Settings** → **Backups**
3. **Point-in-Time Recovery** 섹션
4. 복구 시점 선택 (최대 7일 전까지)
5. 복구 실행

> ⚠️ **주의**: PITR은 전체 데이터베이스를 지정 시점으로 복구합니다. 해당 시점 이후의 모든 변경사항이 손실됩니다.

### 2.3 수동 데이터 복구

#### 백업에서 특정 테이블 복구

```sql
-- 1. 백업 테이블 생성 (미리 준비된 경우)
CREATE TABLE campaigns_backup AS SELECT * FROM campaigns;

-- 2. 문제 데이터 복구
INSERT INTO campaigns
SELECT * FROM campaigns_backup
WHERE id = 'specific-id';

-- 3. 또는 전체 테이블 교체
TRUNCATE TABLE campaigns;
INSERT INTO campaigns SELECT * FROM campaigns_backup;
```

---

## 3. 환경변수 롤백

### Vercel Dashboard에서 변경

1. Vercel Dashboard → 프로젝트 → **Settings** → **Environment Variables**
2. 변경된 환경변수 수정/복원
3. **Save** 클릭
4. **Redeploy** 트리거 (Settings → Deployments → Redeploy)

### 주요 환경변수 백업 위치

```
.env.example          # 변수명 및 형식 참조
docs/deployment/      # 설정 가이드 문서
```

---

## 4. 롤백 스크립트

### scripts/rollback.sh

```bash
#!/bin/bash
# 롤백 헬퍼 스크립트

set -e

echo "🔄 바투 AI 롤백 도구"
echo "===================="

# 1. Vercel 롤백
rollback_vercel() {
    echo "📦 Vercel 배포 롤백..."

    # 최근 배포 목록
    echo "최근 배포 목록:"
    vercel list --limit 5

    read -p "롤백할 배포 URL 입력: " DEPLOYMENT_URL
    vercel rollback "$DEPLOYMENT_URL"

    echo "✅ Vercel 롤백 완료"
}

# 2. 마이그레이션 롤백
rollback_migration() {
    echo "🗃️ 데이터베이스 마이그레이션 롤백..."

    echo "현재 마이그레이션 상태:"
    npx prisma migrate status

    read -p "롤백할 마이그레이션 이름 입력: " MIGRATION_NAME
    npx prisma migrate resolve --rolled-back "$MIGRATION_NAME"

    echo "✅ 마이그레이션 롤백 완료"
}

# 3. 헬스체크
health_check() {
    echo "🏥 헬스체크 실행..."

    HEALTH_URL="${HEALTH_URL:-https://batwo.ai/api/health}"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

    if [ "$response" == "200" ]; then
        echo "✅ 헬스체크 통과 (HTTP $response)"
    else
        echo "❌ 헬스체크 실패 (HTTP $response)"
        exit 1
    fi
}

# 메뉴
case "${1:-menu}" in
    vercel)
        rollback_vercel
        health_check
        ;;
    migration)
        rollback_migration
        ;;
    health)
        health_check
        ;;
    menu|*)
        echo "사용법: ./scripts/rollback.sh [vercel|migration|health]"
        echo ""
        echo "옵션:"
        echo "  vercel     - Vercel 배포 롤백"
        echo "  migration  - DB 마이그레이션 롤백"
        echo "  health     - 헬스체크 실행"
        ;;
esac
```

---

## 5. 장애 대응 플로우

```
┌─────────────────────────────────────────────────────────────┐
│                      장애 감지                               │
│  - Sentry 알림                                              │
│  - 사용자 제보                                               │
│  - 모니터링 알림                                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   심각도 평가                                │
│  🔴 Critical: 즉시 롤백                                      │
│  🟠 High: 15분 내 롤백 결정                                  │
│  🟡 Medium: 원인 분석 후 결정                                │
│  🟢 Low: 다음 배포에서 수정                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   즉시 롤백     │       │   원인 분석     │
│                 │       │                 │
│ 1. Vercel 롤백  │       │ 1. 로그 확인    │
│ 2. 헬스체크     │       │ 2. Sentry 확인  │
│ 3. 팀 알림     │        │ 3. 재현 테스트  │
└────────┬────────┘       └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    사후 분석 (Postmortem)                    │
│  - 원인 규명                                                │
│  - 재발 방지책                                               │
│  - 문서 업데이트                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 롤백 테스트

### 정기 롤백 테스트 (월 1회 권장)

```bash
# 1. 스테이징 환경에서 테스트 배포
vercel --env staging

# 2. 의도적 오류 배포 (테스트용)
# (테스트 브랜치에서 오류 코드 추가)

# 3. 롤백 실행
vercel rollback <previous-deployment>

# 4. 복구 확인
curl https://staging.batwo.ai/api/health
```

### 체크리스트

- [ ] Vercel Instant Rollback 테스트 완료
- [ ] 마이그레이션 롤백 테스트 완료
- [ ] 롤백 후 헬스체크 통과
- [ ] 롤백 소요 시간 기록: ___분
- [ ] 담당자 롤백 절차 숙지

---

## 7. 연락처 및 에스컬레이션

### 장애 대응 연락망

| 역할 | 담당자 | 연락처 |
|------|--------|--------|
| Primary On-call | TBD | TBD |
| Secondary On-call | TBD | TBD |
| Engineering Lead | TBD | TBD |

### 에스컬레이션 기준

- **5분 이상 서비스 중단**: Engineering Lead 알림
- **30분 이상 서비스 중단**: 경영진 알림
- **데이터 손실 의심**: 즉시 전체 팀 알림

---

## 관련 문서

- [프로덕션 체크리스트](./PRODUCTION_CHECKLIST.md)
- [데이터베이스 마이그레이션](./DATABASE_MIGRATION.md)
- [환경변수 설정](./VERCEL_ENV_SETUP.md)
- [브랜치 전략](./BRANCH_STRATEGY.md)
