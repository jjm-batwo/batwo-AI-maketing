# Application Error Handling Implementation Summary

> Application 계층의 표준화된 에러 핸들링 시스템 구현 완료

## 구현 완료 항목

### 1. Error Class 구조 ✅

**베이스 클래스**:
- `src/application/errors/AppError.ts` - 모든 에러의 추상 기본 클래스

**구체적 에러 클래스** (8개):
1. `ValidationError.ts` - 입력 검증 실패 (400)
2. `NotFoundError.ts` - 리소스 없음 (404)
3. `UnauthorizedError.ts` - 인증 실패 (401)
4. `ForbiddenError.ts` - 권한 부족 (403)
5. `ConflictError.ts` - 상태 충돌 (409)
6. `RateLimitError.ts` - 사용량 제한 초과 (429)
7. `InternalError.ts` - 내부 에러 (500)
8. `ExternalServiceError.ts` - 외부 서비스 실패 (502)

### 2. Result Pattern ✅

**파일**: `src/application/errors/Result.ts`

**타입**:
- `Result<T, E>` - Success | Failure 유니온 타입
- `Success<T>` - 성공 결과
- `Failure<E>` - 실패 결과

**유틸리티 함수**:
- `success()`, `failure()` - 결과 생성
- `isSuccess()`, `isFailure()` - 타입 가드
- `match()` - 패턴 매칭
- `map()`, `chain()`, `mapError()` - 함수형 변환
- `unwrap()`, `unwrapOr()` - 값 추출
- `tryCatch()` - async 함수를 Result로 변환

### 3. Use Case 업데이트 ✅

**BaseReportGenerationUseCase** (`src/application/use-cases/report/BaseReportGenerationUseCase.ts`):
- ✅ `validateInput()` - ValidationError 사용
- ✅ `validateCampaignOwnership()` - NotFoundError, ForbiddenError 사용
- ✅ `buildCampaignSections()` - ExternalServiceError 사용
- ✅ `generateAIInsights()` - ExternalServiceError 사용 (graceful degradation)

**DeleteCampaignUseCase** (예시, `src/application/use-cases/campaign/DeleteCampaignUseCase.ts`):
- ✅ Result 패턴 사용 예시 (`execute()`)
- ✅ Exception 패턴 사용 예시 (`executeWithExceptions()`)

### 4. 문서화 ✅

**상세 가이드**:
- `docs/architecture/error-handling.md` - 완전한 사용 가이드

**README**:
- `src/application/errors/README.md` - 빠른 참조

## 에러 코드 체계

| Code | HTTP Status | 클래스 |
|------|-------------|--------|
| `VALIDATION_ERROR` | 400 | ValidationError |
| `UNAUTHORIZED` | 401 | UnauthorizedError |
| `FORBIDDEN` | 403 | ForbiddenError |
| `NOT_FOUND` | 404 | NotFoundError |
| `CONFLICT` | 409 | ConflictError |
| `RATE_LIMIT_EXCEEDED` | 429 | RateLimitError |
| `INTERNAL_ERROR` | 500 | InternalError |
| `EXTERNAL_SERVICE_ERROR` | 502 | ExternalServiceError |

## 주요 기능

### AppError 베이스 클래스

```typescript
abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number
  readonly timestamp: Date
  readonly context?: Record<string, unknown>
  readonly shouldLog: boolean

  toJSON() // API 응답용 직렬화
  toLogFormat() // 로깅용 직렬화
}
```

### 정적 팩토리 메서드

각 에러 클래스는 사용하기 쉬운 정적 메서드를 제공합니다:

**ValidationError**:
- `missingField(fieldName)`
- `invalidField(fieldName, reason)`
- `multipleFields(errors)`
- `businessRule(rule, details)`

**NotFoundError**:
- `entity(entityName, id)`
- `resource(resourceType, criteria)`

**ExternalServiceError**:
- `metaAds(operation, details)`
- `openAI(operation, details)`
- `database(operation, details)`
- `email(operation, details)`
- `payment(operation, details)`
- `timeout(serviceName, timeoutMs)`
- `generic(serviceName, error)`

### Result Pattern

타입 안전한 에러 처리:

```typescript
// 반환 타입
async function execute(): Promise<Result<User, NotFoundError | ForbiddenError>>

// 성공/실패 생성
return success(user)
return failure(NotFoundError.entity('User', id))

// 타입 가드
if (isSuccess(result)) {
  console.log(result.value)
} else {
  console.error(result.error)
}

// 패턴 매칭
const message = match(result, {
  ok: (user) => `Found: ${user.name}`,
  error: (error) => `Error: ${error.message}`
})

// 함수형 체이닝
const email = await findUser(id)
  .then(r => map(r, user => user.email))
  .then(r => chain(r, validateEmail))
```

## 사용 패턴

### 1. Exception-Based (권장)

API Route에서 에러 미들웨어가 처리하는 경우:

```typescript
async execute(dto: CreateCampaignDTO): Promise<CampaignDTO> {
  // Validate
  if (!dto.name) {
    throw ValidationError.missingField('name')
  }

  // Check authorization
  const user = await this.userRepository.findById(dto.userId)
  if (!user) {
    throw NotFoundError.entity('User', dto.userId)
  }

  // Handle external errors
  try {
    return await this.campaignRepository.save(campaign)
  } catch (error) {
    throw ExternalServiceError.database('save campaign', error.message)
  }
}
```

### 2. Result-Based (선택적)

에러가 비즈니스 로직의 일부인 경우:

```typescript
async execute(id: string): Promise<Result<void, NotFoundError | ForbiddenError>> {
  const campaign = await tryCatch(
    () => this.campaignRepository.findById(id),
    (error) => ExternalServiceError.database('fetch', error.message)
  )

  if (!campaign.ok) return campaign

  if (!campaign.value) {
    return failure(NotFoundError.entity('Campaign', id))
  }

  // ... business logic
  return success(undefined)
}
```

## 로깅 가이드

### 자동 로깅 제어

`shouldLog` 속성으로 자동 로깅 제어:

| Error Type | shouldLog | 이유 |
|-----------|-----------|------|
| ValidationError | false | 정상적인 검증 실패 |
| NotFoundError | false | 정상적인 비즈니스 플로우 |
| UnauthorizedError | false | 정상적인 인증 실패 |
| ForbiddenError | false | 정상적인 권한 검증 |
| ConflictError | false | 정상적인 상태 충돌 |
| RateLimitError | false | 정상적인 사용량 제한 |
| InternalError | true | 예상치 못한 에러 |
| ExternalServiceError | true | 외부 시스템 장애 |

### 로깅 형식

```typescript
if (error instanceof AppError && error.shouldLog) {
  logger.error(error.toLogFormat())
}
```

## API Route 통합

### Exception 처리

```typescript
import { AppError } from '@application/errors'

export async function POST(request: Request) {
  try {
    const result = await useCase.execute(dto)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
```

### Result 처리

```typescript
import { isSuccess } from '@application/errors'

export async function DELETE(request: Request) {
  const result = await useCase.execute(params)

  if (isSuccess(result)) {
    return new Response(null, { status: 204 })
  } else {
    return NextResponse.json(
      result.error.toJSON(),
      { status: result.error.statusCode }
    )
  }
}
```

## 테스트 예시

### Exception 테스트

```typescript
describe('CreateCampaignUseCase', () => {
  it('should throw ValidationError when name is missing', async () => {
    await expect(useCase.execute({ name: '' }))
      .rejects.toThrow(ValidationError)
  })

  it('should throw NotFoundError when user does not exist', async () => {
    await expect(useCase.execute({ userId: 'invalid' }))
      .rejects.toThrow(NotFoundError)
  })
})
```

### Result 테스트

```typescript
import { isSuccess, isFailure } from '@application/errors'

describe('DeleteCampaignUseCase', () => {
  it('should return NotFoundError when campaign does not exist', async () => {
    const result = await useCase.execute('invalid', 'user-1')

    expect(isFailure(result)).toBe(true)
    if (isFailure(result)) {
      expect(result.error).toBeInstanceOf(NotFoundError)
    }
  })

  it('should return success when deleted', async () => {
    const result = await useCase.execute('campaign-1', 'user-1')
    expect(isSuccess(result)).toBe(true)
  })
})
```

## 마이그레이션 가이드

### 기존 UseCase 업데이트 방법

**Before**:
```typescript
if (!user) {
  throw new Error('User not found')
}
```

**After**:
```typescript
if (!user) {
  throw NotFoundError.entity('User', userId)
}
```

**Before**:
```typescript
try {
  await externalAPI.call()
} catch (error) {
  throw new Error('API failed')
}
```

**After**:
```typescript
try {
  await externalAPI.call()
} catch (error) {
  throw ExternalServiceError.metaAds('fetch data', error.message)
}
```

## 파일 구조

```
src/application/errors/
├── AppError.ts                 # 베이스 클래스
├── ValidationError.ts          # 400
├── UnauthorizedError.ts        # 401
├── ForbiddenError.ts           # 403
├── NotFoundError.ts            # 404
├── ConflictError.ts            # 409
├── RateLimitError.ts           # 429
├── InternalError.ts            # 500
├── ExternalServiceError.ts     # 502
├── Result.ts                   # Result 패턴
├── index.ts                    # 통합 export
└── README.md                   # 빠른 참조
```

## 다음 단계

### 권장 마이그레이션 순서

1. ✅ **완료**: BaseReportGenerationUseCase
2. **다음**: CreateCampaignUseCase
3. **다음**: UpdateCampaignUseCase
4. **다음**: PauseCampaignUseCase / ResumeCampaignUseCase
5. **다음**: SyncMetaInsightsUseCase
6. **다음**: GetDashboardKPIUseCase

### API Route 업데이트

모든 UseCase가 표준 에러를 사용하도록 업데이트한 후:
1. API Route에 통합 에러 핸들러 추가
2. 에러 응답 형식 표준화
3. 로깅 시스템 통합

## 모범 사례

1. **구체적인 에러 사용**: 가능한 한 구체적인 에러 타입과 팩토리 메서드 사용
2. **컨텍스트 제공**: 에러에 충분한 디버깅 정보 포함
3. **일관된 패턴**: 프로젝트 전체에서 동일한 패턴 사용
4. **Graceful Degradation**: 중요하지 않은 기능 실패는 전체 작업 중단하지 않음
5. **적절한 로깅**: shouldLog 속성을 활용한 자동 로깅 제어

## 참고 문서

- **상세 가이드**: `docs/architecture/error-handling.md`
- **빠른 참조**: `src/application/errors/README.md`
- **구현 예시**:
  - Exception: `src/application/use-cases/report/BaseReportGenerationUseCase.ts`
  - Result: `src/application/use-cases/campaign/DeleteCampaignUseCase.ts`

---

**구현 완료 일자**: 2026-01-25
**구현자**: Claude Code (Sisyphus-Junior Agent)
