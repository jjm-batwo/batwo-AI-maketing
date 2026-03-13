---
name: pre-push-ci-check
description: Push 전 CI 오류를 로컬에서 사전 차단. 환경 검증 → 정적 분석 → 테스트 → 결과 리포트. 커밋/푸시 작업 시 자동 호출.
---

# Pre-Push CI Check

## Purpose

Push 전에 CI와 동일한 검증을 로컬에서 실행하여 CI 실패를 사전에 차단합니다.

**핵심 원칙:** CI에서 실행하는 것 = 로컬에서도 실행

## When to Use

- **자동 호출**: 사용자가 push/커밋을 요청할 때
- **수동 호출**: `/pre-push-ci-check` 슬래시 커맨드
- **연동 호출**: `superpowers-finishing-branch` Step 1에서 호출

## Workflow

### Phase 1: 환경 검증 (2초)

CI 환경과 로컬 환경이 일치하는지 확인합니다.

```bash
# turbo
make check-env
```

**검증 항목:**
- Node.js 버전 ≥ 20 (`ci.yml` NODE_VERSION과 동기화)
- npm 버전 = 11.9.0 (`ci.yml` NPM_VERSION과 동기화)

**npm 버전 불일치 시:** 경고를 출력하되 블로킹하지 않음. 단, 알림 표시:
```
⚠ npm X.Y.Z — CI는 11.9.0 (npm i -g npm@11.9.0)
```

### Phase 2: 정적 분석 (10-15초)

```bash
# turbo
npm run lint
```

```bash
# turbo
npm run type-check
```

```bash
# turbo
npm run format:check
```

**format:check 실패 시:** 자동 수정 제안:
```bash
npm run format
```

### Phase 3: 유닛 테스트 (10-20초)

```bash
# turbo
npm run test:unit -- --pool forks --reporter=dot
```

> [!IMPORTANT]
> `--pool forks` 옵션은 필수입니다. 일부 테스트(AdTable 등)가 기본 pool에서 hang됩니다.

### Phase 4: 결과 리포트

모든 Phase 통과 시:
```
✅ CI 통과 예상 — push 가능
  Phase 1: 환경 검증     ✓ (2초)
  Phase 2: 정적 분석     ✓ (12초)
  Phase 3: 유닛 테스트   ✓ (18초)
  총 소요 시간: 32초
```

**실패 시:**
```
❌ Phase N 실패 — push 중단

실패 원인:
  [실패한 명령어 출력 요약]

수정 제안:
  [자동 분석 기반 수정 방법]
```

실패 원인을 분석하고 자동 수정이 가능한 경우 수정 제안을 합니다.

### Phase 5: 선택적 전체 검증

사용자가 요청하거나, PR 전 전체 검증이 필요한 경우:

```bash
make check-full
```

이 명령은 Phase 1-3 + 통합 테스트 + 프로덕션 빌드를 실행합니다.

## Integration

| 연동 대상 | 관계 |
|-----------|------|
| `superpowers-finishing-branch` | Step 1에서 이 스킬 호출 |
| `/code-review` 워크플로우 | 모든 Step 완료 후 이 스킬 호출 |
| `Makefile` | 이 스킬의 검증 명령어 원본 |
| `.husky/pre-push` | git push 시 자동 실행되는 동등한 검증 |

## Makefile Quick Reference

```bash
make help           # 사용 가능한 명령어 목록
make check-quick    # lint + type-check + test-unit (≈15초)
make check-full     # + format + integration + build (≈60초)
make check-ci       # + security audit (CI 100%)
make check-env      # 환경 검증만
```

## Exceptions

다음은 문제가 **아닙니다**:
1. npm 버전 경고 — warning만 표시, 블로킹하지 않음
2. format:check 실패 — 경고 후 자동 수정 제안, 블로킹하지 않음
3. integration test 스킵 — DB 없는 환경에서는 기본 스킵

## Related Files

| File | Purpose |
|------|---------|
| `Makefile` | CI 미러링 명령어 정의 |
| `.husky/pre-push` | git push 시 자동 실행되는 훅 |
| `.husky/pre-commit` | git commit 시 실행 (gitleaks) |
| `.github/workflows/ci.yml` | CI 파이프라인 (이 스킬의 원본) |
| `.github/workflows/security-scan.yml` | 보안 스캔 파이프라인 |
