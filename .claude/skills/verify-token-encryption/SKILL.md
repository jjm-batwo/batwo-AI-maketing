---
name: verify-token-encryption
description: DB accessToken 저장/조회 경로에서 암복호화 함수가 일관되게 적용되는지 검증. Meta API 연동 코드 추가/수정 후 사용.
---

## Purpose

1. **저장 경로 암호화** — accessToken을 DB에 저장하는 모든 경로에서 `encryptToken()` 호출 여부 검증
2. **조회 경로 복호화** — DB에서 accessToken을 읽어 외부 API에 전달하는 모든 경로에서 `safeDecryptToken()` 호출 여부 검증
3. **직접 접근 방지** — `prisma.metaAdAccount`의 accessToken을 암복호화 없이 직접 사용하는 코드 탐지

## When to Run

- Meta OAuth 콜백이나 계정 연결 코드 추가/수정 후
- MetaAdAccount의 accessToken을 조회하는 새 API route 추가 후
- 토큰 관련 유스케이스 추가/수정 후
- `TokenEncryption.ts` 유틸리티 수정 후

## Related Files

| File | Purpose |
|------|---------|
| `src/application/utils/TokenEncryption.ts` | AES-256-GCM 암복호화 유틸리티 |
| `src/app/api/meta/callback/route.ts` | Meta OAuth 콜백 — 토큰 저장 (encryptToken) |
| `src/app/api/meta/select-account/route.ts` | 계정 선택 — 토큰 저장 (encryptToken) |
| `src/app/api/meta/pages/route.ts` | Pages 목록 — 토큰 조회 (safeDecryptToken) |
| `src/app/api/meta/pages/[pageId]/insights/route.ts` | Page 인사이트 — 토큰 조회 (safeDecryptToken) |
| `src/application/use-cases/campaign/SyncCampaignsUseCase.ts` | 캠페인 동기화 — 토큰 조회 (safeDecryptToken) |
| `src/application/use-cases/token/RefreshMetaTokenUseCase.ts` | 토큰 갱신 — 복호화 후 교환, 재암호화 저장 |
| `tests/unit/application/utils/TokenEncryption.test.ts` | TokenEncryption 단위 테스트 |

## Workflow

### Step 1: accessToken DB 저장 경로에서 encryptToken 누락 탐지

**도구:** Grep

**검사:** `prisma.metaAdAccount.create` 또는 `prisma.metaAdAccount.update`/`upsert`에서 accessToken을 설정하는 곳에 `encryptToken` 호출이 있는지

```bash
grep -rn 'metaAdAccount\.\(create\|update\|upsert\)' --include='*.ts' src/ | grep -v node_modules
```

발견된 각 파일에서 `encryptToken` import와 사용 여부를 확인합니다.

**PASS:** 모든 저장 경로에서 `encryptToken()` 사용
**FAIL:** accessToken을 평문으로 직접 저장하는 경로 발견

**수정:** 저장 전 `encryptToken(accessToken)` 적용

### Step 2: accessToken 조회 후 외부 API 전달 시 복호화 누락 탐지

**도구:** Grep

**검사:** MetaAdAccount에서 accessToken을 읽어 외부 서비스(MetaAdsClient, MetaPagesClient 등)에 전달하는 경로

```bash
grep -rn 'metaAdAccount.*accessToken\|\.accessToken' --include='*.ts' src/app/api/ src/application/use-cases/ | grep -v 'encryptToken\|decryptToken\|TokenEncryption\|import'
```

**PASS:** 모든 조회 경로에서 `safeDecryptToken()` 사용
**FAIL:** accessToken을 복호화 없이 직접 사용

**수정:** 외부 API 전달 전 `safeDecryptToken(accessToken)` 적용

### Step 3: TokenEncryption 유틸리티 import 일관성

**도구:** Grep

**검사:** accessToken을 다루는 파일에서 TokenEncryption 유틸리티가 import되어 있는지

```bash
grep -rln 'accessToken' --include='*.ts' src/app/api/meta/ src/application/use-cases/ | xargs grep -L 'TokenEncryption\|encryptToken\|decryptToken' 2>/dev/null
```

**PASS:** 결과 없음 (accessToken을 다루는 모든 파일이 암호화 유틸 사용)
**FAIL:** accessToken을 사용하지만 TokenEncryption을 import하지 않는 파일 발견

**수정:** 해당 파일에 적절한 암복호화 함수 적용

## Output Format

| 파일 | 경로 유형 | 함수 | 상태 |
|------|----------|------|------|
| callback/route.ts | 저장 | encryptToken | ✅ PASS |
| pages/route.ts | 조회 | safeDecryptToken | ✅ PASS |
| SyncCampaignsUseCase.ts | 조회 | safeDecryptToken | ✅ PASS |

## Exceptions

1. **OAuthSession의 accessToken** — 임시 세션 저장소로, 짧은 TTL(5분)로 만료되므로 암호화 선택적
2. **테스트 코드** — 테스트에서 mock accessToken을 사용하는 경우 암호화 불필요
3. **TOKEN_ENCRYPTION_KEY 미설정** — 키가 없으면 `encryptToken`이 평문을 그대로 반환하므로 에러가 아님 (마이그레이션 호환성)
4. **Account 모델의 accessToken** — NextAuth의 Account 테이블은 NextAuth 내부에서 관리하므로 직접 암호화 대상이 아님
