# Error Handling Guide

> Application Layer Error Handling 표준

## 개요

Application 계층의 모든 에러는 `AppError`를 상속하여 일관된 구조를 제공합니다.

## 에러 계층 구조

```
AppError (abstract)
├── ValidationError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── RateLimitError (429)
├── InternalError (500)
└── ExternalServiceError (502)
```

## 사용 가이드

### 1. ValidationError (400)

입력 검증 실패 시 사용.

```typescript
import { ValidationError } from '@application/errors'

// 필수 필드 누락
throw ValidationError.missingField('userId')

// 잘못된 필드 값
throw ValidationError.invalidField('email', 'invalid email format')

// 복수 필드 에러
throw ValidationError.multipleFields({
  email: 'invalid format',
  age: 'must be at least 18',
})

// 비즈니스 규칙 위반
throw ValidationError.businessRule('Date range', 'startDate must be before endDate')
```

### 2. NotFoundError (404)

리소스를 찾을 수 없을 때 사용.

```typescript
import { NotFoundError } from '@application/errors'

// 특정 엔티티
throw NotFoundError.entity('Campaign', campaignId)

// 일반 리소스
throw NotFoundError.resource('User settings', { userId })
```

### 3. UnauthorizedError (401)

인증 실패 시 사용.

```typescript
import { UnauthorizedError } from '@application/errors'

// 인증 정보 없음
throw UnauthorizedError.missingAuth()

// 잘못된 인증 정보
throw UnauthorizedError.invalidCredentials()

// 만료된 토큰
throw UnauthorizedError.expiredToken()
```

### 4. ForbiddenError (403)

권한 부족 시 사용.

```typescript
import { ForbiddenError } from '@application/errors'

// 작업 권한 없음
throw ForbiddenError.insufficientPermissions('delete campaign')

// 리소스 접근 거부
throw ForbiddenError.resourceAccess('Campaign', campaignId)

// 역할 필요
throw ForbiddenError.roleRequired('ADMIN')
```

### 5. ConflictError (409)

상태 충돌 시 사용.

```typescript
import { ConflictError } from '@application/errors'

// 중복 리소스
throw ConflictError.duplicate('User', 'email', 'user@example.com')

// 잘못된 상태 전환
throw ConflictError.invalidStateTransition('Campaign', 'COMPLETED', 'ACTIVE')

// 동시 수정
throw ConflictError.concurrentModification('Campaign', campaignId)
```

### 6. RateLimitError (429)

사용량 제한 초과 시 사용.

```typescript
import { RateLimitError } from '@application/errors'

// API 제한
const resetAt = new Date(Date.now() + 60000)
throw RateLimitError.apiLimit(100, resetAt)

// 사용량 할당량
throw RateLimitError.quota('AI Copy Generation', 20, 'day')

// 동시 작업 제한
throw RateLimitError.concurrentOperations(5)
```

### 7. ExternalServiceError (502)

외부 서비스 실패 시 사용.

```typescript
import { ExternalServiceError } from '@application/errors'

// Meta Ads API
throw ExternalServiceError.metaAds('fetch campaigns', error.message)

// OpenAI API
throw ExternalServiceError.openAI('generate insights', error.message)

// 데이터베이스
throw ExternalServiceError.database('save campaign', error.message)

// 이메일 서비스
throw ExternalServiceError.email('send report', error.message)

// 타임아웃
throw ExternalServiceError.timeout('Meta Ads API', 30000)

// 일반 외부 서비스
throw ExternalServiceError.generic('Payment Gateway', error)
```

### 8. InternalError (500)

예상치 못한 내부 에러 시 사용.

```typescript
import { InternalError } from '@application/errors'

// 일반 에러로부터 생성
throw InternalError.fromError(error, { context: 'additional info' })

// 예상치 못한 상태
throw InternalError.unexpectedState('User has no campaigns but report exists', {
  userId,
  reportId,
})

// 미구현 기능
throw InternalError.notImplemented('PDF export for monthly reports')

// 설정 에러
throw InternalError.configuration('DATABASE_URL environment variable is not set')
```

## Result 패턴 (선택적)

에러가 예상되는 비즈니스 로직에서는 Result 패턴을 사용할 수 있습니다.

### 기본 사용법

```typescript
import { Result, success, failure, isSuccess } from '@application/errors'

async function findUser(id: string): Promise<Result<User, NotFoundError>> {
  const user = await userRepository.findById(id)

  if (!user) {
    return failure(NotFoundError.entity('User', id))
  }

  return success(user)
}

// 사용
const result = await findUser('123')

if (isSuccess(result)) {
  console.log(result.value) // User
} else {
  console.error(result.error) // NotFoundError
}
```

### 패턴 매칭

```typescript
import { match } from '@application/errors'

const message = match(result, {
  ok: (user) => `Found user: ${user.name}`,
  error: (error) => `Error: ${error.message}`,
})
```

### 체이닝

```typescript
import { map, chain } from '@application/errors'

const userEmail = await findUser('123')
  .then((r) => map(r, (user) => user.email))
  .then((r) => chain(r, validateEmail))
```

### tryCatch 헬퍼

```typescript
import { tryCatch } from '@application/errors'

const result = await tryCatch(
  () => externalApi.fetchData(),
  (error) => ExternalServiceError.generic('External API', error as Error)
)
```

## UseCase 패턴

### Exception 방식 (권장)

API Route에서 error middleware가 처리하는 경우.

```typescript
export class CreateCampaignUseCase {
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

    // Create
    try {
      const campaign = await this.campaignRepository.save(campaign)
      return toCampaignDTO(campaign)
    } catch (error) {
      throw ExternalServiceError.database('save campaign', error.message)
    }
  }
}
```

### Result 방식

에러가 비즈니스 로직의 일부인 경우.

```typescript
export class DeleteCampaignUseCase {
  async execute(
    campaignId: string,
    userId: string
  ): Promise<Result<void, NotFoundError | ForbiddenError>> {
    const campaign = await this.campaignRepository.findById(campaignId)

    if (!campaign) {
      return failure(NotFoundError.entity('Campaign', campaignId))
    }

    if (campaign.userId !== userId) {
      return failure(ForbiddenError.resourceAccess('Campaign', campaignId))
    }

    await this.campaignRepository.delete(campaignId)
    return success(undefined)
  }
}
```

## API Route 통합

### Exception 처리

```typescript
// src/app/api/campaigns/route.ts
import { AppError } from '@application/errors'

export async function POST(request: Request) {
  try {
    const dto = await request.json()
    const result = await createCampaignUseCase.execute(dto)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }

    // 예상치 못한 에러
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
  const { campaignId, userId } = await getParams(request)
  const result = await deleteCampaignUseCase.execute(campaignId, userId)

  if (isSuccess(result)) {
    return new Response(null, { status: 204 })
  } else {
    return NextResponse.json(result.error.toJSON(), { status: result.error.statusCode })
  }
}
```

## 로깅 가이드

### 로그 레벨

| Error Type | 로그 레벨 | shouldLog |
|-----------|----------|-----------|
| ValidationError | DEBUG | false |
| NotFoundError | DEBUG | false |
| UnauthorizedError | INFO | false |
| ForbiddenError | INFO | false |
| ConflictError | INFO | false |
| RateLimitError | INFO | false |
| ExternalServiceError | ERROR | true |
| InternalError | ERROR | true |

### 로깅 예시

```typescript
try {
  const result = await useCase.execute(dto)
  return result
} catch (error) {
  if (error instanceof AppError) {
    if (error.shouldLog) {
      logger.error(error.toLogFormat())
    }
    throw error
  }

  // 예상치 못한 에러는 항상 로그
  logger.error('Unexpected error', { error })
  throw InternalError.fromError(error as Error)
}
```

## 테스트

### Exception 테스트

```typescript
describe('CreateCampaignUseCase', () => {
  it('should throw ValidationError when name is missing', async () => {
    await expect(
      useCase.execute({ name: '' })
    ).rejects.toThrow(ValidationError)
  })

  it('should throw NotFoundError when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ userId: 'invalid' })
    ).rejects.toThrow(NotFoundError)
  })
})
```

### Result 테스트

```typescript
describe('DeleteCampaignUseCase', () => {
  it('should return NotFoundError when campaign does not exist', async () => {
    campaignRepository.findById.mockResolvedValue(null)

    const result = await useCase.execute('invalid', 'user-1')

    expect(isFailure(result)).toBe(true)
    if (isFailure(result)) {
      expect(result.error).toBeInstanceOf(NotFoundError)
    }
  })

  it('should return success when campaign is deleted', async () => {
    const result = await useCase.execute('campaign-1', 'user-1')

    expect(isSuccess(result)).toBe(true)
  })
})
```

## 마이그레이션 가이드

기존 코드를 표준 에러로 마이그레이션하는 방법:

### Before

```typescript
if (!user) {
  throw new Error('User not found')
}

if (user.id !== requesterId) {
  throw new Error('Unauthorized')
}
```

### After

```typescript
if (!user) {
  throw NotFoundError.entity('User', userId)
}

if (user.id !== requesterId) {
  throw ForbiddenError.resourceAccess('User', userId)
}
```

## 모범 사례

1. **구체적인 에러 타입 사용**: 가능한 한 구체적인 에러 타입을 사용하세요.
2. **컨텍스트 제공**: 에러에 충분한 컨텍스트 정보를 포함하세요.
3. **일관된 패턴**: 프로젝트 전체에서 일관된 에러 처리 패턴을 사용하세요.
4. **Graceful Degradation**: 중요하지 않은 기능의 실패는 전체 작업을 중단하지 않도록 하세요.
5. **로깅**: 중요한 에러는 항상 로그에 기록하세요.
6. **사용자 친화적 메시지**: API 응답에는 사용자가 이해할 수 있는 메시지를 포함하세요.

## 참고

- 에러 클래스: `src/application/errors/`
- 사용 예시: `src/application/use-cases/report/BaseReportGenerationUseCase.ts`
- Result 패턴 예시: `src/application/use-cases/campaign/DeleteCampaignUseCase.ts`
