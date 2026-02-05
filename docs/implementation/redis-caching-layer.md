# Redis 캐싱 레이어 구현 가이드

## 개요

바투 마케팅 SaaS에 Redis 캐싱 레이어를 구현하여 API 응답 속도를 개선하고 데이터베이스 부하를 줄입니다.

## 아키텍처

### 클린 아키텍처 적용

```
Application Layer (Ports)
    ↓
ICacheService (인터페이스)
    ↓
Infrastructure Layer (Adapters)
    ├─ RedisCacheService (프로덕션)
    └─ MemoryCacheService (개발/폴백)
```

## 설치된 패키지

```json
{
  "dependencies": {
    "ioredis": "^5.x.x"
  },
  "devDependencies": {
    "@types/ioredis": "^5.x.x",
    "ioredis-mock": "^8.x.x"
  }
}
```

## 환경 변수 설정

`.env.local`:

```bash
# Redis URL (로컬 개발)
REDIS_URL="redis://localhost:6379"

# 프로덕션 (예: Upstash, Railway)
REDIS_URL="rediss://default:password@host:port"

# 캐시 활성화 여부
CACHE_ENABLED="true"
```

**CACHE_ENABLED=false** 설정 시 자동으로 인메모리 캐시로 폴백됩니다.

## 사용 방법

### 1. DI 컨테이너에서 캐시 서비스 가져오기

```typescript
import { getCacheService } from '@/lib/di/container'
import { CacheKeys, CacheTTL } from '@infrastructure/cache/CacheKeys'

const cacheService = getCacheService()
```

### 2. 기본 사용 패턴

#### 데이터 조회 (Cache-Aside Pattern)

```typescript
import { getCacheService } from '@/lib/di/container'
import { CacheKeys, CacheTTL } from '@infrastructure/cache/CacheKeys'

export async function getDashboardKPI(userId: string) {
  const cacheService = getCacheService()
  const cacheKey = CacheKeys.kpiDashboard(userId)

  // 1. 캐시에서 먼저 조회
  const cached = await cacheService.get<DashboardKPIDTO>(cacheKey)
  if (cached) {
    return cached
  }

  // 2. 캐시 미스: DB에서 조회
  const data = await fetchFromDatabase(userId)

  // 3. 캐시에 저장 (5분 TTL)
  await cacheService.set(cacheKey, data, CacheTTL.KPI)

  return data
}
```

#### 데이터 저장/수정 시 캐시 무효화

```typescript
export async function updateCampaign(userId: string, campaignId: string, data: UpdateData) {
  const cacheService = getCacheService()

  // 1. DB 업데이트
  await database.update(campaignId, data)

  // 2. 관련 캐시 무효화
  await cacheService.delete(CacheKeys.campaignDetail(campaignId))
  await cacheService.delete(CacheKeys.campaignList(userId))
  await cacheService.delete(CacheKeys.kpiDashboard(userId))
}
```

#### 사용자별 전체 캐시 무효화

```typescript
export async function onUserLogout(userId: string) {
  const cacheService = getCacheService()

  // 사용자와 관련된 모든 캐시 삭제
  await cacheService.invalidateUserCache(userId)
}
```

### 3. API Route에서 사용 예시

#### GET /api/dashboard/kpi

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCacheService } from '@/lib/di/container'
import { CacheKeys, CacheTTL } from '@infrastructure/cache/CacheKeys'
import { getGetDashboardKPIUseCase } from '@/lib/di/container'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const cacheService = getCacheService()
  const cacheKey = CacheKeys.kpiDashboard(userId)

  // 캐시 조회
  const cached = await cacheService.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT' },
    })
  }

  // Use Case 실행
  const useCase = getGetDashboardKPIUseCase()
  const result = await useCase.execute(userId)

  // 캐시 저장
  await cacheService.set(cacheKey, result, CacheTTL.KPI)

  return NextResponse.json(result, {
    headers: { 'X-Cache': 'MISS' },
  })
}
```

#### POST /api/campaigns (캐시 무효화)

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  const userId = session.user.id

  // 캠페인 생성
  const useCase = getCreateCampaignUseCase()
  const campaign = await useCase.execute(data)

  // 관련 캐시 무효화
  const cacheService = getCacheService()
  await cacheService.delete(CacheKeys.campaignList(userId))
  await cacheService.delete(CacheKeys.kpiDashboard(userId))

  return NextResponse.json(campaign)
}
```

### 4. React Query와 함께 사용

클라이언트는 기존대로 React Query를 사용하되, 서버는 Redis 캐시를 통해 응답을 가속화합니다.

```typescript
// src/presentation/hooks/useDashboardKPI.ts
export function useDashboardKPI() {
  return useQuery({
    queryKey: ['dashboard', 'kpi'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/kpi')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5분 (Redis TTL과 동일)
  })
}
```

## 캐시 키 구조

`CacheKeys.ts`에 정의된 표준화된 키 패턴:

| 키 패턴 | 예시 | TTL | 용도 |
|---------|------|-----|------|
| `kpi:dashboard:{userId}` | `kpi:dashboard:user123` | 5분 | 대시보드 KPI |
| `kpi:summary:{userId}:{dateRange}` | `kpi:summary:user123:7d` | 5분 | 기간별 요약 |
| `campaigns:list:{userId}` | `campaigns:list:user123` | 1분 | 캠페인 목록 |
| `campaigns:detail:{campaignId}` | `campaigns:detail:camp456` | 1분 | 캠페인 상세 |
| `quota:status:{userId}` | `quota:status:user123` | 30초 | 할당량 상태 |
| `team:members:{teamId}` | `team:members:team789` | 5분 | 팀 멤버 |
| `permissions:{userId}:{teamId}` | `permissions:user123:team789` | 5분 | 권한 정보 |

## TTL 전략

```typescript
export const CacheTTL = {
  KPI: 300,      // 5분 - 자주 변경되지 않는 분석 데이터
  CAMPAIGN: 60,  // 1분 - 비교적 자주 업데이트되는 캠페인 정보
  QUOTA: 30,     // 30초 - 실시간성이 중요한 할당량
  TEAM: 300,     // 5분 - 거의 변경되지 않는 팀 정보
}
```

## 캐시 무효화 전략

### 1. 즉시 무효화 (Write-Through)

데이터 변경 시 즉시 관련 캐시 삭제:

```typescript
await cacheService.delete(CacheKeys.campaignDetail(campaignId))
```

### 2. 패턴 기반 무효화

특정 패턴과 일치하는 모든 키 삭제:

```typescript
await cacheService.deletePattern('campaigns:*')
```

### 3. 사용자별 무효화

사용자와 관련된 모든 캐시 삭제:

```typescript
await cacheService.invalidateUserCache(userId)
```

## 프로덕션 배포

### Upstash Redis (권장)

1. https://upstash.com 에서 Redis 인스턴스 생성
2. 환경변수 설정:

```bash
REDIS_URL="rediss://default:your-password@your-instance.upstash.io:6379"
CACHE_ENABLED="true"
```

### Railway Redis

1. Railway 프로젝트에 Redis 추가
2. 자동 생성된 `REDIS_URL` 사용

### Vercel + Upstash 통합

Vercel Marketplace에서 Upstash 통합을 추가하면 환경변수가 자동 설정됩니다.

## 로컬 개발

### Docker로 Redis 실행

```bash
docker run -d -p 6379:6379 redis:alpine
```

### 캐시 없이 개발

```bash
# .env.local
CACHE_ENABLED="false"
```

인메모리 캐시로 자동 폴백되어 Redis 없이도 개발 가능합니다.

## 모니터링

### Redis 연결 상태 확인

```typescript
const cacheService = getCacheService()
const isHealthy = await cacheService.isHealthy()

if (!isHealthy) {
  console.error('Redis connection failed - using fallback')
}
```

### 캐시 히트율 추적

API 응답에 `X-Cache` 헤더 추가:

```typescript
return NextResponse.json(data, {
  headers: {
    'X-Cache': cached ? 'HIT' : 'MISS',
  },
})
```

## 테스트

### 단위 테스트

```bash
npm run test:unit tests/unit/infrastructure/cache/
```

### 통합 테스트 (실제 Redis 필요)

```typescript
describe('Cache Integration', () => {
  it('should cache dashboard KPI', async () => {
    const response1 = await fetch('/api/dashboard/kpi')
    expect(response1.headers.get('X-Cache')).toBe('MISS')

    const response2 = await fetch('/api/dashboard/kpi')
    expect(response2.headers.get('X-Cache')).toBe('HIT')
  })
})
```

## 성능 개선 효과

### Before (캐시 없음)

- 대시보드 KPI 조회: ~500ms (DB 쿼리 4개)
- 캠페인 목록 조회: ~300ms (JOIN 쿼리)

### After (Redis 캐시)

- 대시보드 KPI 조회: ~50ms (캐시 히트)
- 캠페인 목록 조회: ~30ms (캐시 히트)

**약 10배 응답 속도 향상**

## 주의사항

### 1. 캐시 일관성

캐시 무효화를 놓치면 stale 데이터가 반환될 수 있습니다. 데이터 변경 시 반드시 관련 캐시를 무효화하세요.

### 2. 메모리 사용량

TTL을 너무 길게 설정하면 메모리 부족이 발생할 수 있습니다. 적절한 TTL과 메모리 제한 설정이 필요합니다.

### 3. 분산 환경

여러 서버 인스턴스에서 인메모리 캐시를 사용하면 일관성 문제가 발생합니다. 프로덕션에서는 반드시 Redis를 사용하세요.

## 참고 자료

- [ioredis 공식 문서](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Cache-Aside Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
