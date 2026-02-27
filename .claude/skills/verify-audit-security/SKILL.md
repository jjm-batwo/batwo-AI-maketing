---
name: verify-audit-security
description: 감사 보고서 HMAC 서명/검증 일관성을 검증합니다. 감사 API 또는 HMAC 유틸리티 변경 후 사용.
---

# 감사 보고서 HMAC 서명/검증 일관성 검증

## Purpose

감사 보고서 HMAC 서명/검증 시스템이 모든 관련 엔드포인트에 일관되게 적용되어 있는지 검증합니다:

1. **HMAC 유틸 존재 확인** — `signReport`, `verifyReport` 함수가 올바르게 export되어 있는지
2. **Prod 강제 정책 확인** — 프로덕션 환경에서 비밀키 미설정 시 throw하는 정책이 존재하는지
3. **서명 생성 확인** — `analyze` 엔드포인트에서 `signReport`를 호출하는지
4. **서명 검증 확인** — `pdf`, `share` 엔드포인트에서 `verifyReport`를 호출하는지
5. **클라이언트 전달 확인** — 콜백 페이지에서 `signature`를 상태 관리 및 API 요청에 포함하는지
6. **환경변수 문서화 확인** — `.env.example`에 `AUDIT_HMAC_SECRET` 항목이 존재하는지
7. **테스트 커버리지 확인** — 단위 테스트가 존재하고 환경별 정책을 커버하는지

## When to Run

- `src/lib/security/auditHmac.ts`를 추가하거나 수정한 후
- 감사 관련 API 엔드포인트(`analyze`, `pdf`, `share`)를 추가하거나 수정한 후
- HMAC 비밀키 환경변수 정책을 변경한 후
- 감사 콜백 페이지(`src/app/audit/callback/page.tsx`)를 수정한 후

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/security/auditHmac.ts` | HMAC 서명/검증 유틸리티 — `signReport`, `verifyReport` export |
| `src/app/api/audit/analyze/route.ts` | 서명 생성 엔드포인트 — `signReport` 호출 |
| `src/app/api/audit/pdf/route.ts` | 서명 검증 엔드포인트 — `verifyReport` 호출 |
| `src/app/api/audit/share/route.ts` | 서명 검증 엔드포인트 — `verifyReport` 호출 |
| `src/app/audit/callback/page.tsx` | 클라이언트 — `signature` 상태 관리 및 API 요청 전달 |
| `.env.example` | 환경변수 문서 — `AUDIT_HMAC_SECRET` 항목 존재 여부 |
| `tests/unit/lib/auditHmac.test.ts` | 단위 테스트 — 환경별 정책, 서명/검증 시나리오 |

## Workflow

### Step 1: HMAC 유틸 존재 및 export 확인

**파일:** `src/lib/security/auditHmac.ts`

**검사:** `signReport`와 `verifyReport` 함수가 export되어 있는지 확인합니다.

```bash
grep -n "export" "src/lib/security/auditHmac.ts"
```

**PASS 기준:** `signReport`와 `verifyReport` 두 함수 모두 export됨
**FAIL 기준:** 둘 중 하나라도 export가 없거나 파일 자체가 없음

**수정 방법:**
```typescript
// auditHmac.ts
export async function signReport(payload: ReportPayload): Promise<string> { ... }
export async function verifyReport(payload: ReportPayload, signature: string): Promise<boolean> { ... }
```

### Step 2: Prod 강제 정책 확인

**파일:** `src/lib/security/auditHmac.ts`

**검사:** `getSecret()` 또는 유사 내부 함수에서 `production` 분기와 `throw` 또는 에러 반환이 존재하는지 확인합니다.

```bash
grep -n "production\|throw\|Error" "src/lib/security/auditHmac.ts"
```

**PASS 기준:** `process.env.NODE_ENV === 'production'` 조건과 `throw` 가 함께 존재
**FAIL 기준:** 프로덕션 환경 강제 정책이 없음

**수정 방법:**
```typescript
function getSecret(): string {
  const secret = process.env.AUDIT_HMAC_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUDIT_HMAC_SECRET is required in production');
  }
  return secret ?? 'dev-fallback-secret';
}
```

### Step 3: 서명 생성 확인 (analyze 엔드포인트)

**파일:** `src/app/api/audit/analyze/route.ts`

**검사:** `signReport` import 및 호출이 존재하는지 확인합니다.

```bash
grep -n "signReport" "src/app/api/audit/analyze/route.ts"
```

**PASS 기준:** `signReport` import와 호출이 모두 존재
**FAIL 기준:** import 또는 호출 중 하나라도 없음

**수정 방법:**
```typescript
import { signReport } from '@/lib/security/auditHmac';

// POST 핸들러 내부
const signature = await signReport(reportPayload);
return NextResponse.json({ ...result, signature });
```

### Step 4: 서명 검증 확인 (pdf, share 엔드포인트)

**파일:** `src/app/api/audit/pdf/route.ts`, `src/app/api/audit/share/route.ts`

**검사:** `verifyReport` import 및 호출이 각 파일에 존재하는지 확인합니다.

```bash
grep -n "verifyReport" "src/app/api/audit/pdf/route.ts"
grep -n "verifyReport" "src/app/api/audit/share/route.ts"
```

**PASS 기준:** 두 파일 모두 `verifyReport` import와 호출 존재
**FAIL 기준:** 둘 중 하나라도 `verifyReport`가 없음

**수정 방법:**
```typescript
import { verifyReport } from '@/lib/security/auditHmac';

// POST 핸들러 내부
const isValid = await verifyReport(reportPayload, signature);
if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### Step 5: 클라이언트 signature 전달 확인

**파일:** `src/app/audit/callback/page.tsx`

**검사:** `signature` 상태 관리 및 API 요청 body에 포함되는지 확인합니다.

```bash
grep -n "signature" "src/app/audit/callback/page.tsx"
```

**PASS 기준:** `signature` 관련 상태(useState/useRef 등) 선언과 API 요청 body에 `signature` 포함 모두 존재
**FAIL 기준:** 상태 선언 또는 API 전달 중 하나라도 없음

**수정 방법:**
```typescript
// callback/page.tsx 내부
const [signature, setSignature] = useState<string>('');

// analyze API 응답에서 signature 저장
const { signature: sig } = await response.json();
setSignature(sig);

// pdf/share API 요청 시 signature 포함
await fetch('/api/audit/pdf', {
  method: 'POST',
  body: JSON.stringify({ ...reportData, signature }),
});
```

### Step 6: 환경변수 문서화 확인

**파일:** `.env.example`

**검사:** `AUDIT_HMAC_SECRET` 항목이 존재하는지 확인합니다.

```bash
grep -n "AUDIT_HMAC_SECRET" ".env.example"
```

**PASS 기준:** `AUDIT_HMAC_SECRET` 키가 `.env.example`에 문서화되어 있음
**FAIL 기준:** `.env.example`에 해당 항목 없음

**수정 방법:**
```bash
# .env.example에 추가
AUDIT_HMAC_SECRET=your-64-character-hex-secret-here
```

### Step 7: 테스트 커버리지 확인

**파일:** `tests/unit/lib/auditHmac.test.ts`

**검사:** 테스트 파일이 존재하고 환경별 정책(production throw)을 테스트하는지 확인합니다.

```bash
ls "tests/unit/lib/auditHmac.test.ts" 2>/dev/null || echo "MISSING"
grep -n "production\|throw\|NODE_ENV" "tests/unit/lib/auditHmac.test.ts" 2>/dev/null
```

**PASS 기준:** 테스트 파일 존재 + `production` 환경 정책 테스트 포함
**FAIL 기준:** 테스트 파일 없음 또는 환경별 분기 테스트 없음

## Output Format

```markdown
### verify-audit-security 결과

| # | 검사 | 상태 | 상세 |
|---|------|------|------|
| 1 | HMAC 유틸 export 확인 | PASS/FAIL | signReport, verifyReport 존재 여부 |
| 2 | Prod 강제 정책 확인 | PASS/FAIL | production throw 정책 존재 여부 |
| 3 | 서명 생성 (analyze) | PASS/FAIL | signReport import/호출 여부 |
| 4 | 서명 검증 (pdf, share) | PASS/FAIL | verifyReport import/호출 여부 |
| 5 | 클라이언트 signature 전달 | PASS/FAIL | 상태 관리 및 API 포함 여부 |
| 6 | 환경변수 문서화 | PASS/FAIL | .env.example 항목 존재 여부 |
| 7 | 테스트 커버리지 | PASS/FAIL | 테스트 파일 및 환경별 정책 테스트 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **auth-url/route.ts** — OAuth 인증 URL 생성만 담당하는 엔드포인트로 HMAC 서명 대상이 아님
2. **callback/route.ts** — Meta OAuth 콜백 수신만 담당하는 엔드포인트로 HMAC 서명 대상이 아님
3. **accounts/route.ts** — 광고 계정 목록 조회만 담당하는 읽기 전용 엔드포인트로 HMAC 서명 대상이 아님
4. **share/[token]/route.ts** — 공개 공유 API로 HMAC 서명 방식이 다를 수 있음 (토큰 기반 검증 허용)
5. **개발 환경의 fallback 시크릿** — `NODE_ENV !== 'production'`에서 하드코딩 fallback 사용은 정상 동작
6. **테스트 파일 미존재** — `auditHmac.ts`가 아직 구현되지 않은 경우 경고만 표시하고 FAIL 처리하지 않음
