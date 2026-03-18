# 📋 Google Ads 통합 구현 계획서

**Status**: 📝 Draft v4 — 분자 단위 분할 + plan-deep-validation 검증 반영  
**Created**: 2026-03-13  
**Updated**: 2026-03-14 (plan-deep-validation 검증 → Phase 0/5 분자 단위 분할)  
**Estimated Scope**: Very Large (8~10주, 18,000~24,000줄)

---

## 📊 현재 Meta Ads 구현 규모 (기준선)

| 구분 | 현재 Meta 규모 | 비고 |
|------|---------------|------|
| **MetaAdsClient** | 1,735줄 / 55개 async 메서드 | 인프라 핵심 |
| **IMetaAdsService** (포트) | 344줄 / 28개 메서드 | 어플리케이션 포트 |
| **캠페인 유스케이스** | 10개 파일 | Create/Get/List/Update/Delete/Sync/Bulk/Pause/Resume/Advantage |
| **감사 유스케이스** | 1개 파일 | AuditAdAccountUseCase |
| **AI/최적화 유스케이스** | 9개 파일 | AutoOptimize, Rules CRUD, Savings, Apply 등 |
| **크리에이티브/리포트** | 7개 파일 | Upload, Create, Report Generation |
| **API 라우트 (meta/)** | 10개 | accounts, ads, adsets, insights 등 |
| **챗봇 도구** | 18개 (query 8 + mutation 6 + meta 4) | 전부 Meta 하드코딩 |
| **DI 토큰** | 125개 | 전체 |
| **소스 총 줄수** | 214,358줄 | src/ 전체 |
| **테스트 총 줄수** | 72,128줄 | tests/ 전체 |

---

## 🔄 Meta vs Google Ads 구조 차이점

| 항목 | Meta Ads | Google Ads | 영향 |
|------|----------|------------|------|
| **인증** | OAuth 2.0 `accessToken` 1개 | OAuth 2.0 + `developerToken` + `loginCustomerId` + `clientCustomerId` **4개** | 인증 레이어 전면 재설계 |
| **API 프로토콜** | REST (Graph API v25.0) | gRPC 기반 (`google-ads-api` npm) | 클라이언트 패턴 완전 다름 |
| **API 버전 관리** | 안정적 (Graph API) | **반기별 deprecation** (v19 → 2026.02.11 sunset) | 버전 관리 전략 필수 |
| **계층 구조** | Campaign → AdSet → Ad | Campaign → AdGroup → Ad | 매핑 가능 (AdSet ≈ AdGroup) |
| **자원 생성** | REST POST 개별 호출 | **`mutateResources` 원자적 일괄 생성** (임시 리소스 ID) | 생성 패턴 근본 다름 |
| **인사이트 조회** | `/insights?level=ad` (REST) | **GAQL** (SQL-like 쿼리 언어) | 쿼리 빌더 필요 |
| **예산 설정** | Campaign/AdSet 레벨 (`daily_budget`) | Campaign 레벨 (`CampaignBudget` 별도 리소스, **micros 단위**) | 예산 VO 확장 |
| **목표(Objective)** | `CONVERSIONS`, `TRAFFIC` 등 | `CampaignType` + `BiddingStrategy` 조합 | 단순 매핑 불가 |
| **크리에이티브** | Ad Creative → Image/Video | **ResponsiveSearchAd** (헤드라인 15개 + 설명 4개) | 완전 다른 모델 |
| **타겟팅** | Interests, Demographics | **Keywords** + Match Types + Negative Keywords | 새 도메인 필요 |
| **Pixel/전환** | Meta Pixel + CAPI | Google Tag + Conversion Tracking | 전환 추적 별도 |

---

## 🔍 코드 레벨 근본 원인 분석 (7개 문제점)

> 실제 소스 코드를 분석하며 발견한 구조적 문제와, 검색으로 확인한 검증된 해결 방향입니다.

---

### 문제 1: Campaign 엔티티에 `platform` 식별자 없음 ⛔ CRITICAL

#### 코드 근거

```typescript
// src/domain/entities/Campaign.ts (실제 코드)
export interface CampaignProps extends CreateCampaignProps {
  id: string
  status: CampaignStatus
  metaCampaignId?: string      // ← Meta 전용 필드
  buyingType?: string
  advantageConfig?: AdvantageConfig  // ← Meta Advantage+ 전용
  createdAt: Date
  updatedAt: Date
}
```

```sql
-- prisma/schema.prisma (실제 코드)
model Campaign {
  metaCampaignId  String?           -- ← Meta 전용, platform 구분 없음
  ...
}
```

**근본 원인**: Campaign 엔티티와 Prisma 모델 모두 `metaCampaignId`로 Meta에 하드코딩됨. `platform` 구분 필드가 없어 Google 캠페인을 저장할 방법 자체가 없음.

#### 검증된 해결 방향

> **근거**: Clean Architecture의 핵심 원칙 — 도메인 엔티티는 **외부 시스템(Meta, Google 등)에 독립적**이어야 함. DDD의 Bounded Context 개념에 따르면 "Campaign"은 플랫폼 중립적 핵심 Aggregate이며, 외부 플랫폼 ID는 Value Object로 분리해야 함. ([출처: DDD by Eric Evans / Clean Architecture by Robert C. Martin](https://medium.com))
>
> **실무 사례**: [Unified.to](https://unified.to)같은 멀티 플랫폼 광고 통합 API 서비스들은 `campaigns`, `ad_groups`, `ads` 등 **플랫폼 중립적 데이터 모델**을 사용하고, 각 플랫폼의 고유 ID를 `remote_id` 필드로 저장하는 패턴 사용.

**해결 코드 방향**:
```typescript
// src/domain/value-objects/AdPlatform.ts (신규)
export enum AdPlatform {
  META = 'META',
  GOOGLE = 'GOOGLE',
  LOCAL = 'LOCAL',  // API 연동 없이 DB만
}

// Campaign 엔티티 수정
export interface CampaignProps {
  platform: AdPlatform           // 신규 — 어떤 플랫폼 캠페인인지
  externalCampaignId?: string    // 신규 — metaCampaignId 대체 (플랫폼 중립)
  // metaCampaignId → deprecated, externalCampaignId로 마이그레이션
}
```

```sql
-- Prisma 마이그레이션
ALTER TABLE "Campaign" ADD COLUMN "platform" TEXT NOT NULL DEFAULT 'META';
ALTER TABLE "Campaign" RENAME COLUMN "metaCampaignId" TO "externalCampaignId";
```

---

### 문제 2: MetaAdAccount `userId @unique` — 1인 다중 플랫폼 불가 ⛔ CRITICAL

#### 코드 근거

```sql
-- prisma/schema.prisma (실제 코드)
model MetaAdAccount {
  userId        String    @unique  -- ← 사용자당 Meta 계정 1개만 허용
  metaAccountId String
  accessToken   String    @db.Text
  tokenExpiry   DateTime?
}
```

**근본 원인**: `userId @unique` 제약으로 사용자당 광고 계정이 **물리적으로 1개만** 가능. Google 추가 시 같은 패턴을 적용하면 Meta 1개 + Google 1개는 가능하나, 같은 플랫폼 내 **멀티 계정 불가**. 향후 Naver/Kakao 확장도 테이블마다 복제해야 함.

#### 검증된 해결 방향

> **근거**: NextAuth.js v5는 **기본적으로 `Account` 모델에서 `@@unique([provider, providerAccountId])`를 사용**하여 동일 사용자가 여러 OAuth provider를 연결할 수 있게 설계됨. 이미 프로젝트의 `Account` 모델이 이 패턴을 사용 중. ([출처: Auth.js 공식 문서](https://authjs.dev))
>
> **실무 사례**: NextAuth의 Database Adapter 패턴에서는 같은 유저에게 "meta"와 "google" 두 개의 Account row가 생김. 광고 계정 정보도 동일한 패턴으로 관리하면 됨.

**해결 코드 방향 — 방법 A: 별도 테이블 유지 (점진적 접근)**:
```sql
-- GoogleAdAccount 별도 모델 (추가)
model GoogleAdAccount {
  id                String    @id @default(cuid())
  userId            String    @unique  -- 1:1 (MVP 단계)
  googleCustomerId  String             -- Google Ads 고객 ID
  refreshToken      String    @db.Text -- 암호화 저장
  developerToken    String             -- Developer Token
  loginCustomerId   String?            -- MCC ID (선택)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

**해결 코드 방향 — 방법 B: 통합 모델 (장기적 접근)**:
```sql
-- AdPlatformAccount 통합 모델 (대체)
model AdPlatformAccount {
  id                String      @id @default(cuid())
  userId            String
  platform          AdPlatform  -- META | GOOGLE
  externalAccountId String      -- Meta: act_xxx, Google: 1234567890
  credentials       Json        -- 암호화된 토큰 정보 (platform별 다른 구조)
  isActive          Boolean     @default(true)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@unique([userId, platform])   -- 플랫폼당 1계정 (MVP)
  -- 향후: @@unique([userId, platform, externalAccountId]) -- 멀티 계정
}
```

**MVP 결정**: **방법 A** 권장. 이유:
1. 기존 `MetaAdAccount` 참조 코드 수정 최소화
2. Google 토큰 구조가 Meta와 근본적으로 다름 (4개 요소 vs 1개)
3. 통합 모델은 Phase 7 리팩터링 시 검토

---

### 문제 3: 유스케이스 12개가 `IMetaAdsService`에 직접 결합 ⚠️ HIGH

#### 코드 근거

```typescript
// src/application/use-cases/campaign/CreateCampaignUseCase.ts (실제 코드)
import { IMetaAdsService } from '@application/ports/IMetaAdsService'  // ← Meta 직접 참조

export class CreateCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService,  // ← Meta 직접 주입
  ) {}

  async execute(dto: CreateCampaignDTO) {
    if (dto.syncToMeta && dto.accessToken) {  // ← syncToMeta 플래그
      const metaCampaign = await this.metaAdsService.createCampaign(...)
    }
  }
}
```

**영향 범위 (실측)**:
```
grep -rn 'IMetaAdsService' src/application/use-cases/ → 24 matches (12개 파일)
```
- `CreateCampaignUseCase`, `UpdateCampaignUseCase`, `PauseCampaignUseCase`, `ResumeCampaignUseCase`
- `SyncCampaignsUseCase`, `BulkUpdateCampaignsUseCase`, `CreateAdvantageCampaignUseCase`
- `AutoOptimizeCampaignUseCase`, `AuditAdAccountUseCase`
- `SyncMetaInsightsUseCase`, `SyncAllInsightsUseCase`, `GetLiveDashboardKPIUseCase`

**근본 원인**: Clean Architecture에서 Application Layer의 Use Case가 **Infrastructure 의존 인터페이스(IMetaAdsService)를 직접 참조**. `syncToMeta` 플래그 패턴은 새 플랫폼 추가 시 `syncToGoogle` → `syncToNaver` → ... **if문 폭주**.

#### 검증된 해결 방향

> **근거**: Strategy 패턴 + Factory 패턴 조합이 멀티 플랫폼 광고 관리에서 **업계 표준**. Spotify의 광고 아키텍처에서도 Strategy 패턴으로 플랫폼별 로직을 캡슐화하고, 중앙 Context에서 적절한 Strategy를 선택하는 방식 사용. ([출처: Spotify Engineering Blog](https://atspotify.com))
>
> **DDD 관점**: 유스케이스는 "캠페인을 외부 플랫폼에 동기화한다"는 **도메인 개념**만 알면 되고, 어느 플랫폼인지는 Infrastructure 관심사. **Ports & Adapters 패턴**으로 유스케이스 ↔ 플랫폼 간 결합도를 끊어야 함.

**해결 코드 방향**:
```typescript
// src/application/ports/IPlatformSyncService.ts (신규)
export interface IPlatformSyncService {
  syncCampaign(
    platform: AdPlatform,
    credentials: PlatformCredentials,
    campaign: Campaign
  ): Promise<{ externalId: string }>

  pauseCampaign(platform: AdPlatform, credentials: PlatformCredentials, externalId: string): Promise<void>
  resumeCampaign(platform: AdPlatform, credentials: PlatformCredentials, externalId: string): Promise<void>
  // ...
}

// src/infrastructure/services/PlatformSyncService.ts (신규)
export class PlatformSyncService implements IPlatformSyncService {
  private adapters = new Map<AdPlatform, IAdsService>()

  register(platform: AdPlatform, adapter: IAdsService) {
    this.adapters.set(platform, adapter)
  }

  async syncCampaign(platform: AdPlatform, credentials: PlatformCredentials, campaign: Campaign) {
    const adapter = this.adapters.get(platform)
    if (!adapter) throw new UnsupportedPlatformError(platform)
    return adapter.createCampaign(credentials, campaign)
  }
}

// CreateCampaignUseCase 수정 후
export class CreateCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly platformSync: IPlatformSyncService,  // ← 플랫폼 중립
  ) {}

  async execute(dto: CreateCampaignDTO) {
    if (dto.syncToExternal && dto.credentials) {  // ← syncToMeta → syncToExternal
      const result = await this.platformSync.syncCampaign(
        dto.platform, dto.credentials, campaign
      )
    }
  }
}
```

---

### 문제 4: 챗봇 도구 18개 전부 Meta 하드코딩 ⚠️ HIGH

#### 코드 근거

```typescript
// src/application/tools/mutations/createCampaign.tool.ts (실제 코드)
export function createCreateCampaignTool(createCampaignUseCase) {
  return {
    name: 'createCampaign',
    description: '새로운 Meta 광고 캠페인을 생성합니다.',  // ← "Meta" 하드코딩
    parameters: z.object({
      objective: z.enum([
        'AWARENESS', 'TRAFFIC', ...   // ← Meta 전용 Objective만
      ]),
    }),
    async buildConfirmation(params) {
      return {
        warnings: [
          'Meta 광고 계정에 실제 캠페인이 생성됩니다',  // ← "Meta" 하드코딩
        ],
      }
    },
  }
}
```

```typescript
// src/domain/value-objects/CampaignObjective.ts (실제 코드)
export enum CampaignObjective {
  AWARENESS = 'AWARENESS',   // Meta 전용 값
  TRAFFIC = 'TRAFFIC',
  ENGAGEMENT = 'ENGAGEMENT', // Google에는 없는 개념
  // Google 전용 값 없음: MAXIMIZE_CLICKS, TARGET_CPA, PERFORMANCE_MAX 등
}
```

**근본 원인**: 
1. 도구 description에 플랫폼명 하드코딩 → Google 추가 시 도구 36개로 폭증 또는 전체 수정 필요
2. `CampaignObjective` enum이 Meta 값만 포함 → Google Ads 타입 (`SEARCH`, `DISPLAY`, `PERFORMANCE_MAX`) 수용 불가
3. `AgentContext`에 `activePlatform` 정보 부재 → AI가 사용자의 의도(Meta vs Google) 판단 불능

#### 검증된 해결 방향

> **근거**: Google Ads API의 "캠페인 생성"은 Meta와 **구조적으로 완전히 다름**. Meta는 Campaign 1개를 REST POST로 생성하지만, Google은 `CampaignBudget` + `Campaign` + `AdGroup` + `AdGroupAd` + `AdGroupCriterion(Keyword)`를 **`mutateResources`로 원자적으로 일괄 생성해야 유효한 캠페인**이 됨. ([출처: Google Ads API 공식 - Campaign Creation Best Practice](https://developers.google.com/google-ads/api))
>
> **`google-ads-api` npm (v23.0.0)** 실제 코드:
> ```typescript
> const operations: MutateOperation<ICampaignBudget | ICampaign>[] = [
>   { entity: "campaign_budget", operation: "create", resource: { ... } },
>   { entity: "campaign", operation: "create", resource: { 
>     campaign_budget: budgetResourceName,  // temp ID -1 참조
>   }},
> ]
> const result = await customer.mutateResources(operations)
> ```

**해결 코드 방향**:
```typescript
// 도구를 플랫폼 중립으로 수정
export function createCreateCampaignTool(createCampaignUseCase) {
  return {
    name: 'createCampaign',
    description: '새로운 광고 캠페인을 생성합니다.',  // 플랫폼 이름 제거
    parameters: z.object({
      platform: z.enum(['meta', 'google']).optional()
        .describe('광고 플랫폼 (생략 시 활성 플랫폼 사용)'),
      // objective는 플랫폼에 따라 다른 값 셋을 사용
    }),
    async buildConfirmation(params, context) {
      const platform = params.platform ?? context.activePlatform
      return {
        warnings: [
          `${platform === 'google' ? 'Google Ads' : 'Meta'} 계정에 실제 캠페인이 생성됩니다`,
        ],
      }
    },
  }
}
```

---

### 문제 5: Google OAuth 인증이 Meta보다 4배 복잡 ⚠️ HIGH

#### 코드 근거 (기존 Meta 패턴)

```typescript
// 현재 IMetaAdsService의 모든 메서드 시그니처 패턴:
createCampaign(accessToken: string, adAccountId: string, input: ...) 
//              ^^^^^^^^^^^^ 단 1개 토큰으로 모든 API 호출
```

#### 검증된 Google 인증 구조

> **근거 (`google-ads-api` npm README + Google 공식 문서)**:
> ```typescript
> const client = new GoogleAdsApi({
>   client_id: "...",        // 1. OAuth 클라이언트 ID
>   client_secret: "...",    // 2. OAuth 시크릿
>   developer_token: "...",  // 3. 개발자 토큰 (MCC에서 발급)
> })
>
> const customer = client.Customer({
>   customer_id: "...",       // 4. 하위 광고 계정 ID
>   login_customer_id: "...", // 5. MCC(매니저) 계정 ID
>   refresh_token: "...",     // 6. OAuth refresh token
> })
> ```
>
> **`refresh_token` 중요 사항 (Google 공식 문서)**:
> - Google OAuth는 `refresh_token`을 **첫 인증 시에만** 반환
> - `prompt: 'consent'` + `access_type: 'offline'` 설정 필수
> - Refresh Token Rotation: 새 refresh_token 발급 시 이전 것 무효화 가능 → 반드시 DB 업데이트 필요
> - Google 계정당 OAuth 클라이언트 ID별 refresh_token **최대 100개** 제한
>
> **v19 API sunset 주의**: Google Ads API v19는 **2026.02.11에 중단 예정** → 프로젝트에서는 **v21 이상** 사용 필수. Demand Gen 캠페인 최소 예산 $5 USD 강제 (2026.04.01부터)

**해결 코드 방향**:
```typescript
// src/domain/value-objects/PlatformCredentials.ts (신규)
export type PlatformCredentials = MetaCredentials | GoogleCredentials

export interface MetaCredentials {
  readonly platform: 'META'
  readonly accessToken: string
  readonly adAccountId: string
}

export interface GoogleCredentials {
  readonly platform: 'GOOGLE'
  readonly refreshToken: string      // DB에서 복호화하여 가져옴
  readonly clientCustomerId: string  // 하위 광고 계정
  readonly loginCustomerId?: string  // MCC ID (선택)
  // developerToken, client_id, client_secret은 환경변수에서 로드
}
```

---

### 문제 6: 대시보드 KPI에 플랫폼 필터 없음 ⚠️ MEDIUM

#### 코드 근거

```typescript
// src/application/use-cases/kpi/GetDashboardKPIUseCase.ts (실제 코드)
async execute(dto: GetDashboardKPIDTO): Promise<DashboardKPIDTO> {
  let campaigns = await this.campaignRepository.findByUserId(dto.userId)
  // ← 플랫폼 구분 없이 전체 캠페인 조회. Google 캠페인 추가 시 혼합.

  if (dto.campaignIds && dto.campaignIds.length > 0) {
    campaigns = campaigns.filter(c => dto.campaignIds!.includes(c.id))
  }
  // ← platformFilter 파라미터 없음
}
```

**근본 원인**: `GetDashboardKPIDTO`에 `platform` 필터가 없고, `ICampaignRepository.findByUserId()`도 platform 매개변수를 받지 않음.

#### 검증된 해결 방향

> **근거**: 멀티 채널 광고 대시보드의 업계 표준은 **"전체 보기" + "플랫폼별 보기"** 필터 제공. Shared Data Model 패턴으로 KPI 지표(Impressions, Clicks, Spend, Conversions)를 플랫폼 중립적으로 정규화하고, 시각화 시 플랫폼별 색상 코딩. ([출처: thisisglance.com](https://thisisglance.com))

**해결 코드 방향**:
```typescript
// GetDashboardKPIDTO 수정
export interface GetDashboardKPIDTO {
  userId: string
  dateRange: DateRangePreset
  campaignIds?: string[]
  platformFilter?: AdPlatform[]  // 신규: ['META'], ['GOOGLE'], 또는 ['META', 'GOOGLE']
}

// ICampaignRepository 확장
findByUserIdAndPlatform(userId: string, platforms?: AdPlatform[]): Promise<Campaign[]>
```

---

### 문제 7: CampaignObjective가 Meta 전용이어서 Google 캠페인 타입 수용 불가 ⚠️ MEDIUM

#### 코드 근거

```typescript
// src/domain/value-objects/CampaignObjective.ts (실제 코드)
export enum CampaignObjective {
  AWARENESS = 'AWARENESS',
  TRAFFIC = 'TRAFFIC',
  ENGAGEMENT = 'ENGAGEMENT',   // ← Google에 없는 개념
  LEADS = 'LEADS',
  APP_PROMOTION = 'APP_PROMOTION',
  SALES = 'SALES',
  CONVERSIONS = 'CONVERSIONS',
}
// Google Ads 타입 없음: SEARCH, DISPLAY, SHOPPING, VIDEO, PERFORMANCE_MAX 등
```

**근본 원인**: Meta의 "목표(Objective)"와 Google의 "캠페인 타입(AdvertisingChannelType) + 입찰 전략(BiddingStrategyType)" 조합은 **1:1 매핑이 불가능**한 근본적으로 다른 개념.

#### 검증된 해결 방향

> **근거 (Google Ads API 공식)**:
> - Google Ads의 캠페인 "목표"는 `AdvertisingChannelType` (SEARCH, DISPLAY, SHOPPING, VIDEO, PERFORMANCE_MAX) + `BiddingStrategy` (MAXIMIZE_CONVERSIONS, TARGET_CPA, TARGET_ROAS 등) **2개 차원의 조합**
> - Meta의 `objective`는 **1개 차원** (AWARENESS, TRAFFIC 등)
> - 무리한 1:1 매핑은 두 플랫폼 모두의 기능을 제한시킴

**해결 코드 방향 — Objective를 플랫폼별로 분리**:
```typescript
// 기존 CampaignObjective.ts는 유지하지만, 추상 레벨 정의 추가
export enum UnifiedGoal {
  AWARENESS = 'AWARENESS',          // Meta: AWARENESS    / Google: MAXIMIZE_IMPRESSIONS + DISPLAY
  TRAFFIC = 'TRAFFIC',              // Meta: TRAFFIC      / Google: MAXIMIZE_CLICKS + SEARCH
  ENGAGEMENT = 'ENGAGEMENT',        // Meta: ENGAGEMENT   / Google: 직접 대응 없음
  LEADS = 'LEADS',                  // Meta: LEADS        / Google: TARGET_CPA + SEARCH
  CONVERSIONS = 'CONVERSIONS',      // Meta: CONVERSIONS  / Google: MAXIMIZE_CONVERSIONS + SEARCH
  SALES = 'SALES',                  // Meta: SALES        / Google: TARGET_ROAS + SHOPPING/PMAX
  APP_PROMOTION = 'APP_PROMOTION',  // Meta: APP_PROMOTION/ Google: APP campaign type
}

// Google 전용 확장 (분리)
export enum GoogleCampaignType {
  SEARCH = 'SEARCH',
  DISPLAY = 'DISPLAY',
  SHOPPING = 'SHOPPING',
  VIDEO = 'VIDEO',
  PERFORMANCE_MAX = 'PERFORMANCE_MAX',
  DEMAND_GEN = 'DEMAND_GEN',
}

// 매핑 테이블
export const GOAL_TO_GOOGLE_DEFAULTS: Record<UnifiedGoal, {
  campaignType: GoogleCampaignType
  biddingStrategy: string
}> = {
  [UnifiedGoal.TRAFFIC]: {
    campaignType: GoogleCampaignType.SEARCH,
    biddingStrategy: 'MAXIMIZE_CLICKS'
  },
  [UnifiedGoal.CONVERSIONS]: {
    campaignType: GoogleCampaignType.SEARCH,
    biddingStrategy: 'MAXIMIZE_CONVERSIONS'
  },
  // ...
}
```

---

## 🏗️ 검증 기반 수정 설계

### 아키텍처 (검증된 패턴: Strategy + Factory + Ports & Adapters)

```
┌──────────────────────────────────────────────────────┐
│                   Application Layer                  │
│  유스케이스 (플랫폼 독립적)                             │
│                                                      │
│  CreateCampaignUseCase                               │
│   ↓ IPlatformSyncService (Port - 플랫폼 중립)         │
│                                                      │
├───────────────────────↓──────────────────────────────┤
│              Infrastructure Layer                    │
│                                                      │
│  PlatformSyncService (Strategy 패턴 오케스트레이터)     │
│   ├── MetaAdsAdapter (IMetaAdsService 래핑)           │
│   │   └── MetaAdsClient (기존 유지)                   │
│   └── GoogleAdsAdapter (신규)                         │
│       └── GoogleAdsClient (google-ads-api npm)       │
└──────────────────────────────────────────────────────┘
```

### GoogleAdsClient 구현 (검증된 `google-ads-api` npm 패턴)

```typescript
// src/infrastructure/external/google-ads/GoogleAdsClient.ts
import { GoogleAdsApi, enums, resources, MutateOperation, ResourceNames, toMicros } from 'google-ads-api'

export class GoogleAdsClient {
  private api: GoogleAdsApi

  constructor() {
    this.api = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    })
  }

  private getCustomer(credentials: GoogleCredentials) {
    return this.api.Customer({
      customer_id: credentials.clientCustomerId,
      login_customer_id: credentials.loginCustomerId,
      refresh_token: credentials.refreshToken,
    })
  }

  // 캠페인 생성 — Google은 Budget + Campaign을 원자적으로 생성
  async createCampaign(credentials: GoogleCredentials, input: GoogleCampaignInput) {
    const customer = this.getCustomer(credentials)

    const budgetResource = ResourceNames.campaignBudget(
      credentials.clientCustomerId, '-1'
    )

    const operations: MutateOperation<resources.ICampaignBudget | resources.ICampaign>[] = [
      {
        entity: 'campaign_budget',
        operation: 'create',
        resource: {
          resource_name: budgetResource,
          name: `${input.name} Budget`,
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
          amount_micros: toMicros(input.dailyBudget),
        },
      },
      {
        entity: 'campaign',
        operation: 'create',
        resource: {
          name: input.name,
          advertising_channel_type: input.channelType,
          status: enums.CampaignStatus.PAUSED,
          campaign_budget: budgetResource,
        },
      },
    ]

    return customer.mutateResources(operations)
  }

  // GAQL 기반 인사이트 조회
  async getCampaignInsights(credentials: GoogleCredentials, dateRange: string) {
    const customer = this.getCustomer(credentials)
    return customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date DURING ${dateRange}
    `)
  }

  // 키워드 스트리밍 조회
  async getKeywords(credentials: GoogleCredentials, adGroupId: string) {
    const customer = this.getCustomer(credentials)
    return customer.report({
      entity: 'ad_group_criterion',
      attributes: ['ad_group_criterion.keyword.text', 'ad_group_criterion.status'],
      constraints: { 'ad_group_criterion.type': enums.CriterionType.KEYWORD },
    })
  }
}
```

---

## 🚀 수정된 Phase별 구현 로드맵 (v4 — 분자 단위 분할)

> [!NOTE]
> **v3 → v4 변경**: plan-deep-validation 검증 결과, Phase 0(20~30파일)과 Phase 5(12~18파일)가
> "유기체 크기"로 판정되어 **분자 단위(1~3파일, 1~3시간)로 분할**했습니다.
> 근거: Liu et al. "Lost in the Middle" — 컨텍스트 중간 정보 30%+ 성능 저하.

### Phase 0: 멀티 플랫폼 선행 리팩터링 (1~1.5주)

**Goal**: 기존 코드를 멀티 플랫폼 대응 가능한 구조로 변환 (신규 코드 zero, 구조만 변경)

---

#### Phase 0a: 도메인 레이어 준비 (1~3파일, 1~2시간)

- [ ] `AdPlatform` enum VO 생성 (`META | GOOGLE | LOCAL`)
- [ ] `PlatformCredentials` discriminated union 타입 생성
- [ ] `Campaign` 도메인 엔티티에 `platform`, `externalCampaignId` 추가 (기존 `metaCampaignId` 위임)

**🔬 검증 게이트**: `npx tsc --noEmit` 통과

---

#### Phase 0b: 데이터 레이어 마이그레이션 (2~3파일, 1~2시간)

- [ ] Prisma 마이그레이션:
  - `Campaign.platform` 필드 추가 (`@default(META)`)
  - `Campaign.metaCampaignId` → `Campaign.externalCampaignId` 리네임
  - **`Campaign.platform` 컬럼 인덱스 추가** (`@@index([userId, platform])`)
- [ ] `CampaignMapper` 수정 (toDomain/toPersistence에 platform 매핑)
- [ ] `ICampaignRepository`에 `findByUserIdAndPlatform()` 추가

**🔬 검증 게이트**: `npx prisma migrate dev` + `npx tsc --noEmit` 통과

---

#### Phase 0c: 포트/어댑터 생성 (3~4파일, 2~3시간)

- [ ] `IPlatformSyncService` 포트 인터페이스 생성 (Application Layer)
- [ ] `MetaAdsAdapter`: `IMetaAdsService`를 `IPlatformSyncService`에 맞게 래핑
- [ ] `PlatformSyncService` 구현 (Infrastructure) — Strategy 패턴
- [ ] DI 컨테이너: `PlatformSyncService` + `MetaAdsAdapter` 등록

**🔬 검증 게이트**: `npx tsc --noEmit` + `npm run test:unit -- tests/unit/infrastructure` 통과

---

#### Phase 0d: 유스케이스 마이그레이션 (12파일, 3회 분할)

> **12개 유스케이스를 한 번에 바꾸지 않음.** 3~4개씩 전환하고 매 라운드마다 검증.

**0d-1**: Campaign CRUD 유스케이스 4개 전환 (1~2시간)
- [ ] `CreateCampaignUseCase` → `IPlatformSyncService`
- [ ] `UpdateCampaignUseCase` → `IPlatformSyncService`
- [ ] `PauseCampaignUseCase` → `IPlatformSyncService`
- [ ] `ResumeCampaignUseCase` → `IPlatformSyncService`
- 🔬 `npx tsc --noEmit` + `npm run test:unit -- tests/unit/application/use-cases/campaign`

**0d-2**: Campaign Sync/Bulk 유스케이스 3개 전환 (1~2시간)
- [ ] `SyncCampaignsUseCase` → `IPlatformSyncService`
- [ ] `BulkUpdateCampaignsUseCase` → `IPlatformSyncService`
- [ ] `CreateAdvantageCampaignUseCase` → `IPlatformSyncService`
- 🔬 `npx tsc --noEmit` + `npm run test:unit -- tests/unit/application/use-cases/campaign`

**0d-3**: KPI/Audit/Optimization 유스케이스 5개 전환 (1~2시간)
- [ ] `SyncMetaInsightsUseCase` → `IPlatformSyncService`
- [ ] `SyncAllInsightsUseCase` → `IPlatformSyncService`
- [ ] `GetLiveDashboardKPIUseCase` → `IPlatformSyncService`
- [ ] `AuditAdAccountUseCase` → `IPlatformSyncService`
- [ ] `AutoOptimizeCampaignUseCase` → `IPlatformSyncService`
- 🔬 `npx tsc --noEmit` + `npm run test:unit`

---

#### Phase 0e: DTO 수정 + 전체 회귀 검증 (2~3파일, 1시간)

- [ ] `CreateCampaignDTO.syncToMeta` → `syncToExternal` + `platform` 추가
- [ ] 기타 DTO 수정 (CampaignDTO 등)
- [ ] **기존 3,325+ 테스트 전체 통과 확인** (회귀 검증)

**예상 합계**: ~2,000줄 수정 + 500줄 신규 + 20~30 테스트 수정

> [!CAUTION]
> **Phase 0 최종 품질 게이트**: 기존 기능 zero 변경이 목표. 모든 기존 테스트 100% 통과 필수.
> ```bash
> npm run test:unit && npm run test:integration && npm run type-check && npm run build
> ```

---

### Phase 1: Google OAuth + 계정 연결 (1.5~2주)

**Goal**: Google Ads 계정 연결 및 광고 계정 목록 조회

#### 필수 태스크

- [ ] **Google Cloud Console 설정 가이드** 문서 작성
- [ ] NextAuth GoogleProvider 설정:
  ```typescript
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        prompt: 'consent',        // 항상 동의 화면 → refresh_token 보장
        access_type: 'offline',   // offline 접근 → refresh_token 발급
        scope: 'openid email profile https://www.googleapis.com/auth/adwords',
      },
    },
  })
  ```
- [ ] NextAuth 콜백에서 **refresh_token 보존 + 갱신 로직** (Token Rotation 대응)
- [ ] `GoogleAdsCredentials` VO 생성
- [ ] `GoogleAdAccount` Prisma 모델 + 마이그레이션
- [ ] `GoogleAdsClient` 기본 골격 (`google-ads-api` npm v23 래핑)
- [ ] 토큰 **자동 갱신** 미들웨어 (`google-auth-library`의 `OAuth2Client`)
- [ ] `GoogleAdsAdapter`: `IPlatformSyncService` 구현체 (빈 메서드 + 계정 목록만)
- [ ] API 라우트: `api/google/connect`, `api/google/callback`, `api/google/accounts`
- [ ] UI: Google 계정 연결 버튼 + 계정 선택

> [!WARNING]
> **Google refresh_token 함정:**
> - `prompt: 'consent'` 없으면 첫 인증 이후 refresh_token 미발급
> - Token Rotation 발생 시 새 refresh_token으로 DB 즉시 업데이트 필수
> - Google 계정당 OAuth 클라이언트 ID별 최대 100개 refresh_token 제한

**예상**: 2,500~3,500줄 + 20~25개 테스트

---

### Phase 2: Campaign CRUD (1주)

**Goal**: Google Ads 캠페인 생성/조회/수정/삭제

- [ ] `GoogleAdsClient`에 캠페인 CRUD 구현:
  - Create: `mutateResources` (CampaignBudget + Campaign 원자적 생성, temp ID `-1`)
  - Read: GAQL `SELECT FROM campaign WHERE ...`
  - Update: `mutateResources` (update operation)
  - Delete: `mutateResources` (remove operation → `REMOVED` 상태)
- [ ] `GoogleAdsAdapter`에 캠페인 메서드 구현
- [ ] `UnifiedGoal` → Google `AdvertisingChannelType` + `BiddingStrategy` 매핑 테이블
- [ ] `CreateCampaignUseCase` 테스트: `platform: GOOGLE` → `PlatformSyncService` → `GoogleAdsAdapter` 경로 확인
- [ ] API 라우트: `api/google/campaigns/` (CRUD)
- [ ] UI: 캠페인 목록에 **platform 필터 탭** 추가

**예상**: 3,000~4,000줄 + 20~30개 테스트

> [!IMPORTANT]
> **Google 캠페인 생성의 핵심 차이**: Meta는 Campaign 1개를 단독 생성 가능하지만, Google에서 **유효한 Search 캠페인**을 만들려면 `CampaignBudget` + `Campaign` + `AdGroup` + `ResponsiveSearchAd` + `Keywords`를 모두 생성해야 함. 최소 5개 리소스 원자적 생성.

---

### Phase 3: AdGroup + Ad + 키워드 관리 (1.5주)

**Goal**: 광고그룹, 광고, 키워드 CRUD (Google 고유 도메인)

- [ ] AdGroup CRUD (GAQL 조회 + mutateResources 변경)
- [ ] ResponsiveSearchAd 관리:
  - 헤드라인 최소 3개(최대 15개, 30자), 설명 최소 2개(최대 4개, 90자)
  - Pinning 지원 (특정 위치 고정)
- [ ] **Keyword 도메인 모델** (Google 고유):
  - `Keyword` 엔티티 (text, matchType, status, adGroupId)
  - `MatchType` VO (BROAD, PHRASE, EXACT)
  - `NegativeKeyword` 개념
  - `IKeywordRepository` 인터페이스
- [ ] `Keyword` Prisma 모델 추가
- [ ] Keyword CRUD 유스케이스
- [ ] 키워드 아이디어 조회: `KeywordPlanIdeaService` (GAQL)
- [ ] API 라우트 + UI (키워드 테이블, 부정 키워드 관리, RSA 에디터)

**예상**: 3,500~4,500줄 + 25~30개 테스트

---

### Phase 4: 인사이트/대시보드 통합 (1주)

**Goal**: Google Ads 성과 데이터를 대시보드에 통합

- [ ] GAQL 기반 인사이트 조회 구현:
  ```sql
  SELECT campaign.id, metrics.impressions, metrics.clicks,
         metrics.cost_micros, metrics.conversions, metrics.conversions_value
  FROM campaign WHERE segments.date DURING LAST_7_DAYS
  ```
  (`cost_micros` → `cost` 변환: `/ 1_000_000`)
- [ ] `GetDashboardKPIDTO`에 `platformFilter` 추가
- [ ] `GetDashboardKPIUseCase` 수정: 플랫폼별 필터링 + 합산
- [ ] 대시보드 UI: **플랫폼 필터 탭** (전체 | Meta | Google)
- [ ] 차트: 플랫폼별 색상 구분 (Meta: 파란색, Google: 초록색)

**예상**: 2,500~3,500줄 + 15~20개 테스트

---

### Phase 5: AI 챗봇 + 자동 최적화 (1.5~2주)

**Goal**: 챗봇을 통한 Google Ads 자동 생성/최적화

---

#### Phase 5a: 기존 도구 플랫폼 중립화 (6~8파일, 2~3시간)

- [ ] 기존 18개 챗봇 도구에서 "Meta" 하드코딩 제거
- [ ] 각 도구에 `platform` 파라미터 추가
- [ ] `CampaignObjective` → `UnifiedGoal` 확장 + 매핑

**🔬 검증 게이트**: `npx tsc --noEmit` + `npm run test:unit -- tests/unit/application/use-cases/chat`

---

#### Phase 5b: AgentContext + ChatIntent 확장 (3~4파일, 1~2시간)

- [ ] `AgentContext` 확장: `activePlatform`, `googleCredentials`
- [ ] `ChatIntent` 확장: `KEYWORD_MANAGEMENT`, `BIDDING_STRATEGY`
- [ ] AI 시스템 프롬프트 수정: 플랫폼 컨텍스트 주입

**🔬 검증 게이트**: `npx tsc --noEmit` + 기존 챗봇 테스트 통과

---

#### Phase 5c: Google 전용 도구 신규 생성 (4~5파일, 2~3시간)

- [ ] `manageKeywords.tool.ts`: 키워드 추가/제거/매칭 타입 변경
- [ ] `changeBiddingStrategy.tool.ts`: Smart Bidding 전략 변경
- [ ] 도구 등록 + DI 연결
- [ ] 유닛 테스트 작성

**🔬 검증 게이트**: `npx tsc --noEmit` + `npm run test:unit`

> [!IMPORTANT]
> **Smart Bidding(Target CPA, Target ROAS 등)은 Meta의 예산 최적화와 근본적으로 다름.** 무리한 공통화를 하지 말고 Google 전용 로직으로 분리.

**예상 합계**: 2,500~3,500줄 + 20~25개 테스트

---

### Phase 6: 전환 추적 + 감사 + 리포트 (1주)

- [ ] Google Ads Conversion Tracking API 연동
- [ ] Google 계정 감사 (Quality Score 분석, 키워드 성과 분석)
- [ ] 리포트에 Google 데이터 통합

**예상**: 1,500~2,000줄 + 10~15개 테스트

---

### Phase 7: 통합 테스트 + 안정화 (1주)

- [ ] E2E 테스트: Google 전체 플로우
- [ ] E2E 테스트: 멀티 플랫폼 대시보드
- [ ] E2E 테스트: 챗봇 멀티 플랫폼 대화
- [ ] 기존 테스트 전체 회귀
- [ ] 문서 업데이트

**예상**: 1,500~2,000줄 + 문서

---

## 📊 최종 규모 예측

| 항목 | 현재 (Meta only) | Google 추가 후 | 증가량 |
|------|-----------------|---------------|--------|
| **소스 줄수** | ~214,000줄 | ~234,000~238,000줄 | **+10~11%** |
| **테스트 줄수** | ~72,000줄 | ~79,000~84,000줄 | **+10~17%** |
| **소스 파일** | 1,086개 | ~1,200~1,260개 | **+110~170개** |
| **Prisma 모델** | 40개 | 44~46개 | **+4~6개** |
| **DI 토큰** | 125개 | ~145~155개 | **+20~30개** |

### 시간 예측

| Phase | 기간 | 난이도 |
|-------|------|--------|
| Phase 0: 선행 리팩터링 | 1~1.5주 | ⭐⭐⭐⭐ |
| Phase 1: OAuth + 계정 | 1.5~2주 | ⭐⭐⭐ |
| Phase 2: Campaign CRUD | 1주 | ⭐⭐⭐ |
| Phase 3: AdGroup/Ad/키워드 | 1.5주 | ⭐⭐⭐⭐ |
| Phase 4: 인사이트/대시보드 | 1주 | ⭐⭐⭐ |
| Phase 5: AI 챗봇 + 최적화 | 1.5~2주 | ⭐⭐⭐⭐⭐ |
| Phase 6: 전환 추적 + 감사 | 1주 | ⭐⭐⭐ |
| Phase 7: 통합 테스트 | 1주 | ⭐⭐⭐ |
| **총 소요** | **8~10주** | |

---

## ⚠️ 리스크 매트릭스 (검증 기반)

| 리스크 | 확률 | 영향 | 근거 | 완화 전략 |
|--------|------|------|------|-----------|
| **Phase 0 리팩터링 중 기존 파손** | 중간 | 🔴 매우 높음 | 12개 유스케이스 의존성 변경 | 기존 3,325+ 테스트 회귀, 1 task씩 커밋 |
| **Google refresh_token 미보존** | 높음 | 🔴 매우 높음 | Google 공식 문서: 첫 인증 시에만 발급 | `prompt:'consent'` + `access_type:'offline'` |
| **Google Ads API 버전 sunset** | 확정 | 🟡 | v19: 2026.02.11 종료 확정 | v21+ 사용, 반기별 업그레이드 계획 |
| **Demand Gen 최소 예산 $5 강제** | 확정 | 🟢 | 2026.04.01부터 적용 (전 버전) | 캠페인 생성 시 예산 validate |
| **GAQL 학습 곡선** | 중간 | 중간 | SQL-like이지만 자체 문법 | `google-ads-api` npm의 report builder 활용 |
| **키워드 도메인 복잡도** | 높음 | 중간 | 완전 새 도메인 (Match Type, Negative 등) | MVP CRUD로 시작 |
| **Smart Bidding 추상화** | 높음 | 높음 | Google 전용 입찰 최적화 알고리즘 | Google 전용 로직으로 분리 |
| **기존 Meta 회귀** | 낮음 | 높음 | Phase 0 리팩터링 영향 | 3,325+ 테스트로 보호 |
| **대시보드 성능 저하** | 중간 | 중간 | 2개 플랫폼 API 동시 호출 | 플랫폼별 병렬 조회 + ISR 캐싱 |

---

## 📚 필요 외부 의존성 (검증 완료)

| 패키지 | 버전 | 비고 |
|--------|------|------|
| `google-ads-api` | ^23.0.0 | 비공식이지만 npm 기준 가장 활발한 Google Ads Node.js 클라이언트 |
| `google-auth-library` | latest | 토큰 갱신용 (`OAuth2Client.refreshAccessToken`) |

> [!NOTE]
> `googleapis` 패키지는 Google Ads API를 직접 지원하지 않음. `google-ads-api` npm이 gRPC client를 자체 래핑하여 사용.

> [!WARNING]
> **장기 리스크**: `google-ads-api`는 메인테이너 1명의 비공식 패키지입니다.
> 장기적으로 Google이 공식 `@google-ads/google-ads` Node.js 패키지를 출시할 경우
> 마이그레이션이 필요할 수 있습니다. 6개월마다 npm 생태계 변화를 모니터링하세요.

---

## 🔑 사전 준비 체크리스트

```
□ Google Ads MCC(Manager) 계정 생성
□ Google Cloud Console 프로젝트 생성
□ OAuth 2.0 클라이언트 ID 발급 (Web application 타입)
  - Authorized redirect URI: https://{domain}/api/google/callback
□ Google Ads Developer Token 발급 (MCC > API Center)
  - 접근 레벨: Test Account → 개발 시작 → Basic/Standard 승격 신청
□ Google Ads 테스트 계정 생성 (무료)
□ 환경 변수 설정:
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_ADS_DEVELOPER_TOKEN=
  GOOGLE_ADS_LOGIN_CUSTOMER_ID=  (MCC 계정 ID, 대시 없이)
```

---

## 💡 결론 (v3 — 근거 기반)

### v2 → v3 변경 요약

| 항목 | v2 (추측) | v3 (검증) |
|------|----------|-----------|
| 문제 원인 | "platform 필드 없음" 수준 | **실제 코드 12개 파일, 24 import** 정확 추적 |
| Google 인증 | "4개 요소 필요" | **`google-ads-api` npm 실제 코드** (`GoogleAdsApi` + `Customer` 초기화 패턴) 확인 |
| 캠페인 생성 차이 | "API 방식 다름" | **원자적 `mutateResources`** (Budget + Campaign 동시, temp ID `-1`) 확인 |
| Objective 매핑 | "매핑 테이블 필요" | **1:1 불가** (`ChannelType` + `BiddingStrategy` 2차원 조합) 확인 |
| refresh_token | "미보존 주의" | **Google 공식 문서**: 첫 인증 시에만 발급, Token Rotation, 100개 제한 |
| API 버전 | 미언급 | **v19 → 2026.02.11 sunset 확정**, v21+ 필수 |
| 예산 제약 | 미언급 | **Demand Gen 최소 $5 USD** (2026.04.01 전 버전 적용) |

### 핵심 실행 전략

1. **Phase 0 (선행 리팩터링) 반드시 먼저** — `IMetaAdsService` 의존성 12개 파일을 `IPlatformSyncService`로 전환
2. **`google-ads-api` npm v23** 사용 — 비공식이지만 유일한 활발한 Node.js 클라이언트
3. **`mutateResources` 원자적 패턴** — Campaign 생성 시 Budget+Campaign을 temp ID로 일괄 생성
4. **GAQL** 활용 — 인사이트 조회는 REST가 아닌 SQL-like 쿼리 사용
5. **Objective 무리한 통합 지양** — 플랫폼별 최적 설정 분리 유지
