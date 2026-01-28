# Application Error System

Standardized error handling for the Application layer.

## Quick Start

```typescript
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ExternalServiceError,
} from '@application/errors'

// Input validation
if (!dto.name) {
  throw ValidationError.missingField('name')
}

// Resource not found
if (!campaign) {
  throw NotFoundError.entity('Campaign', id)
}

// Authorization check
if (campaign.userId !== requesterId) {
  throw ForbiddenError.resourceAccess('Campaign', id)
}

// External service error
try {
  await metaAdsAPI.fetchCampaigns()
} catch (error) {
  throw ExternalServiceError.metaAds('fetch campaigns', error.message)
}
```

## Error Types

| Error Class | Status Code | When to Use |
|-------------|-------------|-------------|
| `ValidationError` | 400 | Invalid input, business rule violation |
| `UnauthorizedError` | 401 | Missing or invalid authentication |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | State conflict, duplicate resource |
| `RateLimitError` | 429 | Rate limit exceeded |
| `InternalError` | 500 | Unexpected internal error |
| `ExternalServiceError` | 502 | External service failure |

## Result Pattern (Optional)

For operations where errors are expected business cases:

```typescript
import { Result, success, failure, isSuccess } from '@application/errors'

async function deleteUser(id: string): Promise<Result<void, NotFoundError>> {
  const user = await userRepo.findById(id)

  if (!user) {
    return failure(NotFoundError.entity('User', id))
  }

  await userRepo.delete(id)
  return success(undefined)
}

// Usage
const result = await deleteUser('123')

if (isSuccess(result)) {
  console.log('User deleted')
} else {
  console.error(result.error.message)
}
```

## Files

- `AppError.ts` - Base error class
- `ValidationError.ts` - Input validation errors (400)
- `NotFoundError.ts` - Resource not found errors (404)
- `UnauthorizedError.ts` - Authentication errors (401)
- `ForbiddenError.ts` - Authorization errors (403)
- `ConflictError.ts` - State conflict errors (409)
- `RateLimitError.ts` - Rate limit errors (429)
- `InternalError.ts` - Internal errors (500)
- `ExternalServiceError.ts` - External service errors (502)
- `Result.ts` - Result pattern types and utilities

## Documentation

See `/docs/architecture/error-handling.md` for complete documentation.

## Examples

- Exception-based: `src/application/use-cases/report/BaseReportGenerationUseCase.ts`
- Result-based: `src/application/use-cases/campaign/DeleteCampaignUseCase.ts`
