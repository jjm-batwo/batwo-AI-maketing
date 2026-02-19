---
name: verify-cache-tags
description: ISR 캐시 태그와 mutation API의 revalidateTag 호출이 일관되게 매핑되어 있는지 검증합니다.
---

# ISR 캐시 태그 일관성 검증

## Purpose

Next.js ISR의 캐시 태그 시스템이 올바르게 구성되어 있는지 검증합니다:

1. **revalidateTag 누락** — mutation API에서 관련 태그의 `revalidateTag()` 호출이 누락된 경우
2. **revalidateTag 2인자 누락** — Next.js 16에서 `revalidateTag('tag', 'default')` 형식의 2번째 인자가 누락된 경우
3. **태그 불일치** — fetch에서 사용한 태그와 revalidateTag에서 무효화하는 태그가 일치하지 않는 경우
4. **mutation API에 revalidateTag 미호출** — POST/PATCH/PUT/DELETE 메서드가 있지만 revalidateTag가 없는 경우

## When to Run

- 새로운 API 라우트를 추가한 후
- 기존 API 라우트의 mutation 로직을 수정한 후
- 서버 컴포넌트 페이지의 fetch 호출을 수정한 후

## Related Files

| File | Purpose |
|------|---------|
| `src/app/api/campaigns/route.ts` | 캠페인 생성 API — `campaigns`, `kpi`, `admin-dashboard` 태그 무효화 |
| `src/app/api/campaigns/[id]/route.ts` | 캠페인 수정/삭제 API — `campaigns`, `kpi`, `admin-dashboard` 태그 무효화 |
| `src/app/api/campaigns/[id]/status/route.ts` | 캠페인 상태변경 API — `campaigns`, `kpi`, `admin-dashboard` 태그 무효화 |
| `src/app/api/reports/route.ts` | 보고서 생성 API — `reports` 태그 무효화 |
| `src/app/api/reports/[id]/route.ts` | 보고서 삭제 API — `reports` 태그 무효화 |
| `src/app/api/admin/refunds/[id]/route.ts` | 환불 처리 API — `admin-dashboard` 태그 무효화 |
| `src/app/api/admin/users/[id]/route.ts` | 사용자 관리 API — `admin-dashboard` 태그 무효화 |
| `src/app/api/admin/settings/admins/route.ts` | 관리자 설정 API — `admin-dashboard` 태그 무효화 |
| `src/app/(dashboard)/campaigns/page.tsx` | 캠페인 목록 페이지 — `campaigns`, `kpi` 태그 사용 |
| `src/app/(dashboard)/campaigns/[id]/page.tsx` | 캠페인 상세 페이지 — `campaigns` 태그 사용 |
| `src/app/(dashboard)/reports/page.tsx` | 보고서 목록 페이지 — `reports` 태그 사용 |
| `src/app/(admin)/admin/page.tsx` | 관리자 대시보드 — `admin-dashboard` 태그 사용 |

## Workflow

### Step 1: mutation API의 revalidateTag 호출 수집

**검사:** API 라우트에서 `revalidateTag()` 호출을 추출합니다.

```bash
grep -rn "revalidateTag(" src/app/api/ --include="*.ts"
```

**결과:** API별 무효화 태그 목록 수집

### Step 2: revalidateTag 2인자 검증 (Next.js 16 필수)

**검사:** `revalidateTag()` 호출이 2개의 인자를 받는지 확인합니다.

```bash
# 1인자만 사용하는 revalidateTag 호출 탐지
grep -Prn "revalidateTag\(['\"][^'\"]*['\"](?!\s*,)" src/app/api/ --include="*.ts"
```

**PASS 기준:** 모든 `revalidateTag` 호출이 2인자 형식
**FAIL 기준:** 1인자만 사용하는 호출이 존재

**수정 방법:**
```typescript
// Before (위반)
revalidateTag('campaigns')

// After (수정)
revalidateTag('campaigns', 'default')
```

### Step 3: mutation API의 revalidateTag 누락 탐지

**검사:** POST/PATCH/PUT/DELETE 메서드를 export하는 API 라우트 중 `revalidateTag`를 호출하지 않는 라우트를 탐지합니다.

```bash
# mutation 메서드가 있는 API 라우트 파일 목록
grep -rl "export async function \(POST\|PATCH\|PUT\|DELETE\)" src/app/api/ --include="*.ts"
```

이 파일 목록에서 `revalidateTag`가 없는 파일을 필터링합니다.

**PASS 기준:** 모든 mutation API가 적절한 revalidateTag를 호출
**FAIL 기준:** mutation API에 revalidateTag가 누락

### Step 4: 태그 매핑 일관성 검증

**검사:** 다음 매핑 규칙이 지켜지는지 확인합니다:

| 태그 | fetch 사용 페이지 | revalidateTag 사용 API |
|------|------------------|----------------------|
| `campaigns` | campaigns 페이지들 | campaigns CRUD + status API |
| `kpi` | campaigns 페이지 (KPI 섹션) | campaigns CRUD + status API |
| `reports` | reports 페이지 | reports CRUD API |
| `admin-dashboard` | admin 페이지 | admin mutation + campaigns CRUD + status API |

**PASS 기준:** 모든 태그가 fetch↔revalidateTag 양방향으로 매핑됨
**FAIL 기준:** 태그가 한쪽에만 존재하거나 매핑이 누락됨

## Output Format

```markdown
### verify-cache-tags 결과

| # | 검사 | 상태 | 상세 |
|---|------|------|------|
| 1 | revalidateTag 수집 | 완료 | X개 API, Y개 호출 |
| 2 | 2인자 형식 검증 | PASS/FAIL | 위반: N개 |
| 3 | mutation API 누락 | PASS/FAIL | 누락: route 경로 |
| 4 | 태그 매핑 일관성 | PASS/FAIL | 불일치: 태그명 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **Meta 연결 상태 API** — 실시간 데이터 API는 캐시를 사용하지 않으므로 revalidateTag가 불필요
2. **읽기 전용 API** — GET만 export하는 API 라우트는 mutation이 아니므로 revalidateTag가 불필요
3. **웹훅 API** — `src/app/api/webhooks/` 외부 웹훅 수신 API는 별도 캐시 전략 가능
4. **인증 API** — `src/app/api/auth/` 관련 API는 세션 기반이므로 ISR 태그와 무관
5. **AdSet/Ad/Creative/Asset API** — 새로 추가된 API로 아직 ISR 페이지와 연결되지 않은 경우 경고만 표시
6. **KPI/Cron API** — 배치/동기화 전용 API는 직접 캐시 무효화가 아닌 별도 메커니즘 사용 가능
