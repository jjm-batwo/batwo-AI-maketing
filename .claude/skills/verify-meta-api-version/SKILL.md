---
name: verify-meta-api-version
description: Meta Graph API 버전이 v25.0으로 통일되어 있는지 검증. Meta API 관련 파일 추가/수정 후 사용.
---

## Purpose

1. **버전 통일성** — 모든 Meta Graph API 호출이 동일 버전(v25.0)을 사용하는지 검증
2. **신규 파일 누락** — 새로 추가된 Meta API 클라이언트가 올바른 버전을 사용하는지 탐지
3. **하드코딩 방지** — 버전 문자열이 상수로 관리되는지 확인

## When to Run

- Meta API 클라이언트 파일 추가/수정 후
- OAuth 관련 코드 변경 후
- 새로운 Meta Graph API 엔드포인트 추가 후
- Meta API 버전 업그레이드 작업 후

## Related Files

| File | Purpose |
|------|---------|
| `src/infrastructure/external/meta-ads/MetaAdsClient.ts` | 메인 Meta Ads API 클라이언트 |
| `src/infrastructure/external/meta-ads/MetaAdsWarmupClient.ts` | API Warmup 클라이언트 |
| `src/infrastructure/external/meta-ads/AdLibraryClient.ts` | Ad Library API 클라이언트 |
| `src/infrastructure/external/meta-pages/MetaPagesClient.ts` | Pages API 클라이언트 |
| `src/infrastructure/auth/auth.ts` | Facebook OAuth 프로바이더 |
| `src/app/api/meta/callback/route.ts` | Meta OAuth 콜백 |
| `scripts/test-token.ts` | 토큰 테스트 스크립트 |
| `scripts/exchange-token.ts` | 토큰 교환 스크립트 |
| `tests/unit/infrastructure/meta-ads/MetaAdsClient.test.ts` | MetaAdsClient 단위 테스트 |

## Workflow

### Step 1: v25.0 외 버전 사용 탐지

**도구:** Grep

**검사:** `graph.facebook.com` 또는 `facebook.com/v` 패턴에서 v25.0 외 버전 사용 여부

```bash
grep -rn 'graph\.facebook\.com/v' --include='*.ts' --include='*.tsx' src/ scripts/ tests/ | grep -v 'v25\.0'
grep -rn 'facebook\.com/v' --include='*.ts' --include='*.tsx' src/ scripts/ tests/ | grep -v 'v25\.0'
```

**PASS:** 결과 없음 (모든 참조가 v25.0)
**FAIL:** v25.0 외 버전이 발견됨

**수정:** 발견된 파일의 버전을 v25.0으로 교체

### Step 2: 버전 상수 사용 확인

**도구:** Grep

**검사:** URL에 버전이 인라인으로 하드코딩되어 있는지 (상수 대신 직접 문자열 사용)

```bash
grep -rn "fetch.*graph\.facebook\.com/v" --include='*.ts' src/ | grep -v META_API
```

**PASS:** fetch 호출에서 직접 URL 하드코딩 없음
**FAIL:** 상수 없이 직접 URL 사용

**수정:** `META_API_BASE` 또는 `META_API_VERSION` 상수를 통해 URL 구성

### Step 3: 테스트의 MSW 핸들러 버전 일치 확인

**도구:** Grep

**검사:** 테스트의 MSW 핸들러가 프로덕션 코드와 동일한 버전을 사용하는지

```bash
grep -rn 'graph\.facebook\.com/v' --include='*.test.ts' --include='*.test.tsx' tests/ | grep -v 'v25\.0'
```

**PASS:** 모든 테스트 MSW 핸들러가 v25.0 사용
**FAIL:** 테스트에서 다른 버전 사용

## Output Format

| 파일 | 현재 버전 | 상태 |
|------|----------|------|
| MetaAdsClient.ts | v25.0 | ✅ PASS |
| auth.ts | v25.0 | ✅ PASS |

## Exceptions

1. **주석 내 버전 참조** — 코드 주석이나 문서에서 이전 버전을 언급하는 것은 위반이 아님
2. **마이그레이션 가이드** — 버전 업그레이드 관련 문서에서 이전 버전을 참조하는 것은 정상
3. **환경변수 기반 버전** — `process.env.META_API_VERSION` 등으로 동적 버전을 사용하는 경우 상수 규칙 예외
