---
name: verify-architecture
description: 클린 아키텍처 레이어 의존성 규칙을 검증합니다. domain/application/infrastructure 레이어 간 잘못된 import를 탐지합니다.
---

# 클린 아키텍처 레이어 의존성 검증

## Purpose

클린 아키텍처의 의존성 규칙(domain <- application <- infrastructure/presentation)이 지켜지는지 검증합니다:

1. **domain -> application 위반** — domain 레이어가 application 레이어를 import
2. **domain -> infrastructure 위반** — domain 레이어가 infrastructure 레이어를 import
3. **domain -> presentation 위반** — domain 레이어가 presentation 레이어를 import
4. **application -> infrastructure 위반** — application 레이어가 infrastructure 구현체를 직접 import
5. **application -> presentation 위반** — application 레이어가 presentation 레이어를 import

## When to Run

- 새로운 엔티티, 유스케이스, 리포지토리를 추가한 후
- 기존 레이어 간 코드를 이동하거나 리팩토링한 후
- import 경로를 수정한 후

## Related Files

| File | Purpose |
|------|---------|
| `src/domain/entities/*.ts` | 도메인 엔티티 (Campaign, Report, KPI, AdSet, Ad, Creative 등) |
| `src/domain/value-objects/*.ts` | 값 객체 (Money, DateRange, SubscriptionPlan 등) |
| `src/domain/repositories/*.ts` | 리포지토리 인터페이스 (포트) |
| `src/domain/errors/*.ts` | 도메인 에러 |
| `src/domain/services/IntentClassifier.ts` | 도메인 서비스 — 채팅 인텐트 분류 (외부 의존 없이 순수 도메인 로직) |
| `src/domain/services/index.ts` | 도메인 서비스 배럴 export |
| `src/application/use-cases/**/*.ts` | 유스케이스 |
| `src/application/dto/**/*.ts` | DTO |
| `src/application/ports/IFallbackResponseService.ts` | 폴백 응답 서비스 포트 인터페이스 |
| `src/application/ports/IFewShotExampleRegistry.ts` | 퓨샷 예시 레지스트리 포트 인터페이스 |
| `src/application/ports/IGuideQuestionService.ts` | 가이드 질문 서비스 포트 인터페이스 |
| `src/application/ports/IPromptTemplateService.ts` | 프롬프트 템플릿 서비스 포트 인터페이스 |
| `src/application/ports/IResilienceService.ts` | 복원력 서비스 포트 인터페이스 |
| `src/application/services/ConversationSummarizerService.ts` | 대화 요약 서비스 (application 레이어) |
| `src/application/services/FallbackResponseService.ts` | 폴백 응답 서비스 구현 (application 레이어) |
| `src/application/services/FewShotExampleRegistry.ts` | 퓨샷 예시 레지스트리 구현 (application 레이어) |
| `src/application/services/GuideQuestionService.ts` | 가이드 질문 서비스 구현 (application 레이어) |
| `src/application/services/PromptTemplateService.ts` | 프롬프트 템플릿 서비스 구현 (application 레이어) |
| `src/application/services/KPIInsightsService.ts` | KPI 인사이트 서비스 — 동적 기준선 + LLM 자연어 인사이트 (application 레이어) |
| `src/application/services/QuotaService.ts` | 쿼터 서비스 — 사용량 제한 관리 (application 레이어) |
| `src/infrastructure/database/**/*.ts` | Prisma 리포지토리 구현 |
| `src/infrastructure/external/**/*.ts` | 외부 API 클라이언트 |
| `src/infrastructure/external/errors/CircuitBreaker.ts` | 서킷 브레이커 (infrastructure 레이어, domain import 금지) |
| `src/infrastructure/external/errors/ResilienceService.ts` | 복원력 서비스 구현 (infrastructure 레이어) |
| `src/infrastructure/external/errors/withRetry.ts` | 재시도 유틸리티 (infrastructure 레이어, domain import 금지) |
| `src/domain/value-objects/AuditScore.ts` | 감사 점수 도메인 값 객체 |
| `src/infrastructure/cache/audit/MemoryAuditCache.ts` | 인메모리 캐시 어댑터 |
| `src/infrastructure/cache/audit/UpstashAuditCache.ts` | Upstash Redis 캐시 어댑터 |
| `src/infrastructure/cache/audit/auditCacheFactory.ts` | 캐시 어댑터 팩토리 |

## Workflow

### Step 1: domain 레이어의 잘못된 import 탐지

**검사:** `src/domain/` 내 파일이 `application`, `infrastructure`, `presentation`, `app/` 을 import하는지 확인합니다.

```bash
grep -rn "from ['\"]@\?.*\(application\|infrastructure\|presentation\|@/app\)" src/domain/ --include="*.ts" --include="*.tsx"
```

**PASS 기준:** 출력이 없으면 통과
**FAIL 기준:** 하나라도 출력되면 위반

**수정 방법:**
- domain이 필요로 하는 타입은 domain 내부에 인터페이스로 정의
- 구체적인 구현체 import를 인터페이스 import로 교체

### Step 2: application 레이어의 infrastructure 직접 import 탐지

**검사:** `src/application/` 내 파일이 `infrastructure` 구현체를 직접 import하는지 확인합니다.

```bash
grep -rn "from ['\"]@\?.*infrastructure" src/application/ --include="*.ts" --include="*.tsx"
```

**PASS 기준:** 출력이 없으면 통과
**FAIL 기준:** 하나라도 출력되면 위반

**수정 방법:**
- infrastructure 구현체 대신 `src/application/ports/` 인터페이스를 사용
- DI 컨테이너에서 구현체를 주입받도록 변경

### Step 3: application 레이어의 presentation import 탐지

**검사:** `src/application/` 내 파일이 `presentation` 레이어를 import하는지 확인합니다.

```bash
grep -rn "from ['\"]@\?.*presentation" src/application/ --include="*.ts" --include="*.tsx"
```

**PASS 기준:** 출력이 없으면 통과
**FAIL 기준:** 하나라도 출력되면 위반

### Step 4: domain 내부의 외부 프레임워크 직접 의존 탐지

**검사:** `src/domain/` 내 파일이 Prisma, Next.js 등 프레임워크를 직접 import하는지 확인합니다.

```bash
grep -rn "from ['\"]@prisma\|from ['\"]next\|from ['\"]react" src/domain/ --include="*.ts" --include="*.tsx"
```

**PASS 기준:** 출력이 없으면 통과
**FAIL 기준:** 하나라도 출력되면 위반

**수정 방법:**
- 프레임워크 타입이 필요한 경우, domain에 자체 타입/인터페이스를 정의하고 infrastructure에서 어댑터로 변환

## Output Format

```markdown
### verify-architecture 결과

| # | 검사 | 상태 | 위반 파일 |
|---|------|------|----------|
| 1 | domain -> application/infra/presentation | PASS/FAIL | 파일:라인 |
| 2 | application -> infrastructure | PASS/FAIL | 파일:라인 |
| 3 | application -> presentation | PASS/FAIL | 파일:라인 |
| 4 | domain -> 외부 프레임워크 | PASS/FAIL | 파일:라인 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **domain 내부 import** — `src/domain/` 내에서 다른 `src/domain/` 파일을 import하는 것은 허용
2. **application의 포트 import** — `src/application/ports/` 파일에서 타입 정의를 위해 domain을 import하는 것은 정상
3. **테스트 파일** — `tests/` 디렉토리 내 파일은 모든 레이어를 import 가능
4. **DI 컨테이너** — `src/lib/di/container.ts`는 의존성 주입을 위해 모든 레이어를 import하는 것이 허용
5. **type-only import** — `import type`으로 타입만 가져오는 경우는 런타임 의존이 아니므로 경고만 표시
6. **domain의 유틸리티 라이브러리** — uuid, zod, date-fns 등 순수 유틸리티는 허용
