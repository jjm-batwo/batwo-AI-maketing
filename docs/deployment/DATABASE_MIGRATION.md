# 데이터베이스 마이그레이션 가이드

Prisma를 사용한 데이터베이스 스키마 변경 및 마이그레이션 절차를 안내합니다.

---

## 개요

### 마이그레이션 전략

| 환경 | 마이그레이션 방식 | 트리거 |
|------|------------------|--------|
| Development | 자동 (`prisma migrate dev`) | 로컬 개발 |
| Staging | 자동 (CI/CD) | develop 브랜치 푸시 |
| Production | 수동 승인 | workflow_dispatch |

### 데이터베이스 연결

```
┌─────────────────────────────────────────────────────────────┐
│                       Application                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Connection Pooler (PgBouncer)          │
│                    Port: 6543 (Transaction Mode)             │
│                         DATABASE_URL                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
│                    Port: 5432 (Direct)                        │
│                         DIRECT_URL                            │
└─────────────────────────────────────────────────────────────┘
```

- **DATABASE_URL**: Connection Pooler를 통한 연결 (일반 쿼리)
- **DIRECT_URL**: 직접 연결 (마이그레이션, 스키마 변경)

---

## 로컬 개발

### 새 마이그레이션 생성

```bash
# 스키마 변경 후 마이그레이션 생성
npx prisma migrate dev --name add_new_feature

# 예시: 새 테이블 추가
npx prisma migrate dev --name add_notifications_table
```

### 마이그레이션 없이 스키마 동기화 (개발용)

```bash
# 데이터베이스에 스키마 즉시 적용 (마이그레이션 파일 생성 안함)
npx prisma db push
```

### 데이터베이스 리셋 (개발용)

```bash
# 모든 데이터 삭제 후 마이그레이션 재적용
npx prisma migrate reset

# 시드 데이터도 함께 적용
npx prisma migrate reset --force
npx prisma db seed
```

---

## 스테이징 배포

### 자동 마이그레이션

1. `develop` 브랜치에 푸시
2. CI 테스트 통과
3. Vercel Preview 배포
4. E2E 테스트 통과
5. 마이그레이션 자동 실행 (migrate.yml)

### 수동 마이그레이션

```bash
# GitHub Actions에서 수동 실행
# Actions → Database Migration → Run workflow → environment: staging
```

---

## 프로덕션 배포

### 배포 전 체크리스트

- [ ] 스테이징에서 마이그레이션 테스트 완료
- [ ] 마이그레이션 롤백 계획 준비
- [ ] 팀에 배포 알림
- [ ] 데이터베이스 백업 확인 (Supabase 자동 백업)
- [ ] 트래픽 낮은 시간대 선택

### 마이그레이션 실행

1. **GitHub Actions 사용**:
   ```
   Actions → Database Migration → Run workflow
   → environment: production
   → dry_run: true (먼저 미리보기)
   → Run workflow
   ```

2. **스크립트 직접 실행**:
   ```bash
   # 환경변수 설정
   export DATABASE_URL="postgresql://..."
   export DIRECT_URL="postgresql://..."

   # 마이그레이션 실행
   ./scripts/migrate.sh deploy
   ```

### 마이그레이션 검증

```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 데이터베이스 스키마 확인
npx prisma db pull --force
```

---

## 마이그레이션 스크립트

### migrate.sh

```bash
# 상태 확인
./scripts/migrate.sh status

# 스키마 검증
./scripts/migrate.sh validate

# 미리보기
./scripts/migrate.sh dry-run

# 마이그레이션 실행
./scripts/migrate.sh deploy

# Prisma Client 재생성
./scripts/migrate.sh generate
```

### rollback.sh

```bash
# 상태 확인
./scripts/rollback.sh status

# 마이그레이션 히스토리
./scripts/rollback.sh list

# 마이그레이션 롤백 표시
./scripts/rollback.sh mark-rolled-back <migration_name>

# 데이터베이스 리셋 (개발 환경만)
./scripts/rollback.sh reset

# Supabase PITR 가이드
./scripts/rollback.sh pitr
```

---

## 롤백 전략

### 1. Prisma 롤백 (스키마만)

```bash
# 마이그레이션을 롤백 상태로 표시
npx prisma migrate resolve --rolled-back <migration_name>

# 수동으로 스키마 변경 취소 SQL 실행
psql $DATABASE_URL < rollback_migration.sql
```

### 2. Supabase Point-in-Time Recovery

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. Database → Backups
3. Point in time recovery 선택
4. 복구할 시점 지정
5. 새 프로젝트로 복구

> ⚠️ PITR은 Pro 플랜 이상에서만 사용 가능

### 3. 애플리케이션 롤백

```bash
# Vercel Instant Rollback
# Vercel Dashboard → Deployments → 이전 배포 선택 → Promote to Production
```

---

## 시드 데이터

### 환경별 시드

| 환경 | 시드 내용 |
|------|----------|
| Development | 테스트 사용자, 캠페인, KPI, 리포트 |
| Staging | 테스트 데이터 (Development와 동일) |
| Production | 필수 시스템 데이터만 |

### 시드 실행

```bash
# 시드 실행
npx prisma db seed

# package.json에 시드 스크립트 설정 필요
# "prisma": {
#   "seed": "tsx prisma/seed.ts"
# }
```

---

## 트러블슈팅

### "Migration failed to apply cleanly"

```bash
# 1. 상태 확인
npx prisma migrate status

# 2. 충돌 해결
npx prisma migrate resolve --applied <migration_name>
# 또는
npx prisma migrate resolve --rolled-back <migration_name>

# 3. 다시 시도
npx prisma migrate deploy
```

### "Cannot connect to database"

1. 환경변수 확인
   ```bash
   echo $DATABASE_URL
   echo $DIRECT_URL
   ```

2. Supabase 대시보드에서:
   - Database 상태 확인
   - Connection pooling 설정 확인
   - IP 허용 목록 확인

### "Drift detected"

데이터베이스 스키마와 Prisma 스키마가 다를 때:

```bash
# 1. 현재 DB 스키마 가져오기
npx prisma db pull

# 2. 차이점 확인
git diff prisma/schema.prisma

# 3. 해결 방법 선택
# a) DB 기준으로 스키마 업데이트
# b) 스키마 기준으로 DB 업데이트 (새 마이그레이션)
```

---

## 베스트 프랙티스

### DO ✅

- 작은 단위로 마이그레이션 분리
- 마이그레이션 이름에 날짜 포함
- 스테이징에서 먼저 테스트
- 롤백 계획 수립
- 배포 전 팀 알림

### DON'T ❌

- 프로덕션에서 `prisma db push` 사용
- 수동으로 SQL 직접 실행 (마이그레이션 추적 불가)
- 마이그레이션 파일 삭제
- 여러 환경에서 다른 마이그레이션 순서
- 데이터 손실 가능성 있는 마이그레이션 (컬럼 삭제 등) 무분별 실행

---

## 관련 문서

- [Prisma Migrate 공식 문서](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool)
- [ROLLBACK_STRATEGY.md](./ROLLBACK_STRATEGY.md)
- [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)
