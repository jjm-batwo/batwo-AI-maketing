# 브랜치 전략 및 배포 플로우

## 브랜치 구조

```
main (production)
│
├── develop (staging)
│   │
│   ├── feature/xxx
│   ├── feature/yyy
│   └── ...
│
├── hotfix/xxx (긴급 수정)
└── release/v1.x.x (릴리스 준비)
```

## 브랜치별 역할

### `main` (Production)
- **환경**: https://batwo.ai
- **자동 배포**: Vercel Production
- **보호 규칙**:
  - PR 필수 (직접 push 금지)
  - 최소 1명 리뷰 승인 필요
  - CI 체크 통과 필수
  - E2E 테스트 통과 필수

### `develop` (Staging)
- **환경**: https://staging.batwo.ai
- **자동 배포**: Vercel Preview (develop)
- **용도**: 프로덕션 배포 전 최종 검증
- **보호 규칙**:
  - PR 권장
  - CI 체크 통과 필수

### `feature/*` (개발)
- **환경**: Vercel Preview (PR별 고유 URL)
- **자동 배포**: PR 생성 시 자동
- **명명 규칙**: `feature/기능-설명` (예: `feature/campaign-analytics`)

### `hotfix/*` (긴급 수정)
- **환경**: 직접 Production 배포 가능
- **용도**: 프로덕션 긴급 버그 수정
- **플로우**: `hotfix/*` → `main` → `develop`

### `release/*` (릴리스)
- **용도**: 릴리스 준비 및 버전 태깅
- **플로우**: `develop` → `release/*` → `main` + `develop`

---

## 배포 플로우

### 일반 개발 플로우

```
1. feature/* 브랜치 생성
   └── git checkout -b feature/new-feature develop

2. 개발 및 커밋
   └── git commit -m "feat: implement new feature"

3. PR 생성 (develop ← feature/*)
   └── CI 자동 실행
   └── Vercel Preview 배포

4. 코드 리뷰 및 승인

5. develop 머지
   └── Staging 자동 배포
   └── E2E 테스트 실행

6. Staging 검증 완료

7. PR 생성 (main ← develop)
   └── 프로덕션 배포 체크리스트 확인

8. Production 배포
   └── GitHub Actions: Deploy to Production 워크플로우 실행
   └── 수동 확인 ("deploy" 입력)
```

### 긴급 수정 플로우

```
1. hotfix/* 브랜치 생성
   └── git checkout -b hotfix/critical-fix main

2. 수정 및 커밋

3. PR 생성 (main ← hotfix/*)
   └── 빠른 리뷰

4. Production 배포
   └── Vercel Instant Rollback 대기

5. develop에도 머지
   └── git checkout develop
   └── git merge hotfix/critical-fix
```

---

## Vercel 배포 설정

### Preview 환경
- **트리거**: 모든 브랜치 push, PR 생성
- **URL 패턴**: `https://batwo-<branch>-<team>.vercel.app`
- **환경변수**: Preview 환경 설정

### Production 환경
- **트리거**: `main` 브랜치 push
- **URL**: https://batwo.ai
- **환경변수**: Production 환경 설정

---

## GitHub Branch Protection Rules

### `main` 브랜치
```yaml
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true

required_status_checks:
  strict: true
  contexts:
    - "CI / Lint & Type Check"
    - "CI / Unit Tests"
    - "CI / Integration Tests"
    - "CI / Build"

restrictions:
  enforce_admins: true

allow_force_pushes: false
allow_deletions: false
```

### `develop` 브랜치
```yaml
required_status_checks:
  strict: true
  contexts:
    - "CI / Lint & Type Check"
    - "CI / Build"

allow_force_pushes: false
```

---

## 환경별 환경변수

| 변수 | Development | Staging | Production |
|------|-------------|---------|------------|
| `NODE_ENV` | development | production | production |
| `NEXT_PUBLIC_APP_URL` | localhost:3000 | staging.batwo.ai | batwo.ai |
| `DATABASE_URL` | Local/Docker | Supabase Staging | Supabase Production |
| `SENTRY_DSN` | (none) | Staging DSN | Production DSN |

---

## 롤백 전략

### Vercel Instant Rollback
1. Vercel Dashboard → Deployments
2. 이전 성공한 배포 선택
3. "Promote to Production" 클릭
4. **소요 시간**: ~30초

### Git Revert
```bash
# 마지막 커밋 되돌리기
git revert HEAD
git push origin main
```

### 데이터베이스 롤백
- Supabase Dashboard → Database → Backups
- Point-in-time Recovery 사용
