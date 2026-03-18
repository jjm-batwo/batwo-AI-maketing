# 보고서 개선 Phase 1: Ad 레벨 KPI 인프라 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ad 레벨 KPI 데이터 인프라 구축 (AdKPISnapshot DB + Meta API 동기화)

**Architecture:** Clean Architecture 4레이어. AdKPI 도메인 엔티티 -> IAdKPIRepository 포트 -> PrismaAdKPIRepository 어댑터 -> SyncAdInsightsUseCase 오케스트레이션 -> Cron 라우트 트리거.

**Tech Stack:** Prisma 7, TypeScript, Vitest, Meta Graph API v25.0

**Spec:** `docs/superpowers/specs/2026-03-17-report-enhancement-design.md` (섹션 1, 2, 8)

---

## 어드바이저리 노트 (리뷰어 피드백)

구현 시 반드시 확인해야 할 사항:

| 코드 | 내용 | 적용 태스크 |
|------|------|------------|
| A1 | `video_views_3s` -> Meta API 응답에서 먼저 `video_3s_views` 필드를 직접 요청(fields에 포함)하고, 값이 없거나 `0`이면 `actions` 배열에서 `action_type === 'video_view'`인 항목의 `value`로 fallback한다. 두 소스 모두 없으면 `0`으로 처리. | Task 5 |
| A2 | `getAccountInsights`에 `timeIncrement` 추가 시 Map 키를 `${entityId}_${date}`로 변경 필요 | Task 5 |
| A3 | 500+ Ad 계정에서 페이지네이션 처리 필요 (`paging.next` 반복 호출) | Task 5 |
| A5 | `cpm`/`cpc`는 `number`로 저장 (Money 아님 -- Meta API에서 pre-calculated 값) | Task 2 |

---

## Task 1: Prisma 스키마 -- AdKPISnapshot 모델 + 마이그레이션

**예상 시간:** 3분
**파일:**
- `prisma/schema.prisma`

### Steps

- [x]**1.1** `prisma/schema.prisma`에 AdKPISnapshot 모델 추가 (Ad 모델 뒤에 배치)

```prisma
// ========================================
// Ad-Level KPI Tracking
// ========================================

model AdKPISnapshot {
  id          String   @id @default(cuid())
  adId        String
  ad          Ad       @relation(fields: [adId], references: [id], onDelete: Cascade)
  adSetId     String
  campaignId  String
  creativeId  String

  // 기본 메트릭 (KPISnapshot과 동일)
  impressions Int      @default(0)
  clicks      Int      @default(0)
  linkClicks  Int      @default(0)
  conversions Int      @default(0)
  spend       Decimal  @db.Decimal(15, 2)
  currency    String   @default("KRW")
  revenue     Decimal  @db.Decimal(15, 2)

  // 추가 메트릭 (소재 피로도 / 포맷 분석용)
  reach       Int      @default(0)
  frequency   Decimal  @default(0) @db.Decimal(8, 4)
  cpm         Decimal  @default(0) @db.Decimal(15, 4)
  cpc         Decimal  @default(0) @db.Decimal(15, 4)
  videoViews  Int      @default(0)
  thruPlays   Int      @default(0)

  date        DateTime @db.Date
  createdAt   DateTime @default(now())

  @@unique([adId, date])
  @@index([adId])
  @@index([adSetId])
  @@index([campaignId])
  @@index([creativeId])
  @@index([date])
  @@index([campaignId, date])
  @@index([creativeId, date])
}
```

- [x]**1.2** `Ad` 모델에 역관계 추가

기존 Ad 모델을 찾아서 `kpiSnapshots AdKPISnapshot[]` 필드를 추가한다:

```prisma
model Ad {
  // ... 기존 필드
  kpiSnapshots AdKPISnapshot[]   // 추가
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  // ... 기존 인덱스
}
```

- [x]**1.3** Prisma 마이그레이션 생성

```bash
npx prisma migrate dev --name add_ad_kpi_snapshot
```

- [x]**1.4** Prisma Client 재생성 확인

```bash
npx prisma generate
```

### 검증

```bash
npx tsc --noEmit
```

예상 출력: 에러 없음 (0 errors)

---

## Task 2: AdKPI 도메인 엔티티

**예상 시간:** 5분
**파일:**
- `tests/unit/domain/entities/AdKPI.test.ts` (신규)
- `src/domain/entities/AdKPI.ts` (신규)

**패턴 참조:** `src/domain/entities/KPI.ts` (create/restore, Money, private constructor, getter)

### Steps

- [x]**2.1** 실패 테스트 작성: `tests/unit/domain/entities/AdKPI.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { AdKPI } from '@domain/entities/AdKPI'
import { Money } from '@domain/value-objects/Money'

describe('AdKPI', () => {
  const validProps = {
    adId: 'ad-123',
    adSetId: 'adset-456',
    campaignId: 'campaign-789',
    creativeId: 'creative-101',
    impressions: 10000,
    clicks: 500,
    linkClicks: 300,
    conversions: 50,
    spend: Money.create(100000, 'KRW'),
    revenue: Money.create(500000, 'KRW'),
    reach: 8000,
    frequency: 1.25,
    cpm: 10000,    // number, Meta pre-calculated (A5)
    cpc: 200,      // number, Meta pre-calculated (A5)
    videoViews: 3000,
    thruPlays: 1500,
    date: new Date('2026-03-15'),
  }

  describe('create', () => {
    it('should create AdKPI with valid metrics', () => {
      const kpi = AdKPI.create(validProps)

      expect(kpi.adId).toBe('ad-123')
      expect(kpi.adSetId).toBe('adset-456')
      expect(kpi.campaignId).toBe('campaign-789')
      expect(kpi.creativeId).toBe('creative-101')
      expect(kpi.impressions).toBe(10000)
      expect(kpi.clicks).toBe(500)
      expect(kpi.reach).toBe(8000)
      expect(kpi.frequency).toBe(1.25)
      expect(kpi.cpm).toBe(10000)
      expect(kpi.cpc).toBe(200)
      expect(kpi.videoViews).toBe(3000)
      expect(kpi.thruPlays).toBe(1500)
      expect(kpi.id).toBeDefined()
    })

    it('should throw error for negative impressions', () => {
      expect(() =>
        AdKPI.create({ ...validProps, impressions: -100 })
      ).toThrow('Impressions cannot be negative')
    })

    it('should throw error for negative clicks', () => {
      expect(() =>
        AdKPI.create({ ...validProps, clicks: -1 })
      ).toThrow('Clicks cannot be negative')
    })

    it('should throw error for negative conversions', () => {
      expect(() =>
        AdKPI.create({ ...validProps, conversions: -1 })
      ).toThrow('Conversions cannot be negative')
    })
  })

  describe('restore', () => {
    it('should restore AdKPI from persisted data', () => {
      const kpi = AdKPI.restore({
        ...validProps,
        id: 'existing-id-123',
        createdAt: new Date('2026-03-15T10:00:00Z'),
      })

      expect(kpi.id).toBe('existing-id-123')
      expect(kpi.adId).toBe('ad-123')
    })
  })

  describe('calculated metrics', () => {
    it('should calculate CTR correctly', () => {
      const kpi = AdKPI.create(validProps)
      expect(kpi.ctr).toBe(5) // (500 / 10000) * 100
    })

    it('should return 0 CTR for zero impressions', () => {
      const kpi = AdKPI.create({ ...validProps, impressions: 0, clicks: 0 })
      expect(kpi.ctr).toBe(0)
    })

    it('should calculate CVR correctly', () => {
      const kpi = AdKPI.create(validProps)
      expect(kpi.cvr).toBe(10) // (50 / 500) * 100
    })

    it('should return 0 CVR for zero clicks', () => {
      const kpi = AdKPI.create({ ...validProps, clicks: 0 })
      expect(kpi.cvr).toBe(0)
    })

    it('should calculate ROAS correctly', () => {
      const kpi = AdKPI.create(validProps)
      expect(kpi.roas).toBe(5) // 500000 / 100000
    })

    it('should return 0 ROAS for zero spend', () => {
      const kpi = AdKPI.create({
        ...validProps,
        spend: Money.create(0, 'KRW'),
      })
      expect(kpi.roas).toBe(0)
    })

    it('should calculate thruPlayRate correctly', () => {
      const kpi = AdKPI.create(validProps)
      expect(kpi.thruPlayRate).toBe(15) // (1500 / 10000) * 100
    })

    it('should return 0 thruPlayRate for zero impressions', () => {
      const kpi = AdKPI.create({ ...validProps, impressions: 0 })
      expect(kpi.thruPlayRate).toBe(0)
    })
  })

  describe('toJSON', () => {
    it('should serialize AdKPI to JSON', () => {
      const kpi = AdKPI.create(validProps)
      const json = kpi.toJSON()

      expect(json.id).toBe(kpi.id)
      expect(json.adId).toBe('ad-123')
      expect(json.adSetId).toBe('adset-456')
      expect(json.campaignId).toBe('campaign-789')
      expect(json.creativeId).toBe('creative-101')
      expect(json.impressions).toBe(10000)
      expect(json.frequency).toBe(1.25)
      expect(json.cpm).toBe(10000)
      expect(json.cpc).toBe(200)
      expect(json.videoViews).toBe(3000)
      expect(json.thruPlays).toBe(1500)
    })
  })
})
```

- [x]**2.2** 실패 확인

```bash
npx vitest run tests/unit/domain/entities/AdKPI.test.ts --pool forks
```

예상: 모든 테스트 FAIL (모듈 없음)

- [x]**2.3** 최소 구현: `src/domain/entities/AdKPI.ts`

```typescript
import { Money } from '../value-objects/Money'

export interface CreateAdKPIProps {
  adId: string
  adSetId: string
  campaignId: string
  creativeId: string
  impressions: number
  clicks: number
  linkClicks: number
  conversions: number
  spend: Money
  revenue: Money
  reach: number
  frequency: number
  cpm: number       // Meta pre-calculated (A5: number, Money 아님)
  cpc: number       // Meta pre-calculated (A5: number, Money 아님)
  videoViews: number
  thruPlays: number
  date: Date
}

export interface AdKPIProps extends CreateAdKPIProps {
  id: string
  createdAt: Date
}

export class AdKPI {
  private constructor(
    private readonly _id: string,
    private readonly _adId: string,
    private readonly _adSetId: string,
    private readonly _campaignId: string,
    private readonly _creativeId: string,
    private readonly _impressions: number,
    private readonly _clicks: number,
    private readonly _linkClicks: number,
    private readonly _conversions: number,
    private readonly _spend: Money,
    private readonly _revenue: Money,
    private readonly _reach: number,
    private readonly _frequency: number,
    private readonly _cpm: number,
    private readonly _cpc: number,
    private readonly _videoViews: number,
    private readonly _thruPlays: number,
    private readonly _date: Date,
    private readonly _createdAt: Date
  ) {}

  static create(props: CreateAdKPIProps): AdKPI {
    AdKPI.validate(props)
    return new AdKPI(
      crypto.randomUUID(),
      props.adId,
      props.adSetId,
      props.campaignId,
      props.creativeId,
      props.impressions,
      props.clicks,
      props.linkClicks,
      props.conversions,
      props.spend,
      props.revenue,
      props.reach,
      props.frequency,
      props.cpm,
      props.cpc,
      props.videoViews,
      props.thruPlays,
      props.date,
      new Date()
    )
  }

  static restore(props: AdKPIProps): AdKPI {
    return new AdKPI(
      props.id,
      props.adId,
      props.adSetId,
      props.campaignId,
      props.creativeId,
      props.impressions,
      props.clicks,
      props.linkClicks,
      props.conversions,
      props.spend,
      props.revenue,
      props.reach,
      props.frequency,
      props.cpm,
      props.cpc,
      props.videoViews,
      props.thruPlays,
      props.date,
      props.createdAt
    )
  }

  private static validate(props: CreateAdKPIProps): void {
    if (props.impressions < 0) throw new Error('Impressions cannot be negative')
    if (props.clicks < 0) throw new Error('Clicks cannot be negative')
    if (props.linkClicks < 0) throw new Error('Link clicks cannot be negative')
    if (props.conversions < 0) throw new Error('Conversions cannot be negative')
  }

  // --- Getters ---
  get id(): string { return this._id }
  get adId(): string { return this._adId }
  get adSetId(): string { return this._adSetId }
  get campaignId(): string { return this._campaignId }
  get creativeId(): string { return this._creativeId }
  get impressions(): number { return this._impressions }
  get clicks(): number { return this._clicks }
  get linkClicks(): number { return this._linkClicks }
  get conversions(): number { return this._conversions }
  get spend(): Money { return this._spend }
  get revenue(): Money { return this._revenue }
  get reach(): number { return this._reach }
  get frequency(): number { return this._frequency }
  get cpm(): number { return this._cpm }
  get cpc(): number { return this._cpc }
  get videoViews(): number { return this._videoViews }
  get thruPlays(): number { return this._thruPlays }
  get date(): Date { return new Date(this._date) }
  get createdAt(): Date { return new Date(this._createdAt) }

  // --- Calculated metrics (getter) ---
  get ctr(): number {
    if (this._impressions === 0) return 0
    return (this._clicks / this._impressions) * 100
  }

  get cvr(): number {
    if (this._clicks === 0) return 0
    return (this._conversions / this._clicks) * 100
  }

  get roas(): number {
    if (this._spend.isZero()) return 0
    return this._revenue.amount / this._spend.amount
  }

  get thruPlayRate(): number {
    if (this._impressions === 0) return 0
    return (this._thruPlays / this._impressions) * 100
  }

  toJSON(): AdKPIProps {
    return {
      id: this._id,
      adId: this._adId,
      adSetId: this._adSetId,
      campaignId: this._campaignId,
      creativeId: this._creativeId,
      impressions: this._impressions,
      clicks: this._clicks,
      linkClicks: this._linkClicks,
      conversions: this._conversions,
      spend: this._spend,
      revenue: this._revenue,
      reach: this._reach,
      frequency: this._frequency,
      cpm: this._cpm,
      cpc: this._cpc,
      videoViews: this._videoViews,
      thruPlays: this._thruPlays,
      date: this._date,
      createdAt: this._createdAt,
    }
  }
}
```

- [x]**2.4** 통과 확인

```bash
npx vitest run tests/unit/domain/entities/AdKPI.test.ts --pool forks
```

예상: 모든 테스트 PASS

- [x]**2.5** 타입 체크

```bash
npx tsc --noEmit
```

---

## Task 3: IAdKPIRepository 인터페이스

**예상 시간:** 3분
**파일:**
- `src/domain/repositories/IAdKPIRepository.ts` (신규)

**패턴 참조:** `src/domain/repositories/IKPIRepository.ts`

### Steps

- [x]**3.1** Repository 인터페이스 생성: `src/domain/repositories/IAdKPIRepository.ts`

```typescript
import { AdKPI } from '../entities/AdKPI'

export interface AdKPIAggregate {
  totalImpressions: number
  totalClicks: number
  totalLinkClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
  totalReach: number
  avgFrequency: number
  avgCpm: number
  avgCpc: number
  totalVideoViews: number
  totalThruPlays: number
}

export interface DailyAdKPIAggregate {
  date: Date
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
}

export interface FormatAggregate {
  format: string          // CreativeFormat
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
}

export interface CreativeAggregate {
  creativeId: string
  name: string
  format: string
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
  avgFrequency: number
}

export interface IAdKPIRepository {
  save(kpi: AdKPI): Promise<AdKPI>
  saveMany(kpis: AdKPI[]): Promise<AdKPI[]>
  upsertMany(kpis: AdKPI[]): Promise<number>

  findByAdId(adId: string, startDate: Date, endDate: Date): Promise<AdKPI[]>
  findByCampaignId(campaignId: string, startDate: Date, endDate: Date): Promise<AdKPI[]>
  findByCreativeId(creativeId: string, startDate: Date, endDate: Date): Promise<AdKPI[]>

  aggregateByCampaignId(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdKPIAggregate>

  aggregateByCreativeId(
    creativeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdKPIAggregate>

  aggregateByFormat(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<FormatAggregate[]>

  getDailyAggregatesByCampaignIds(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyAdKPIAggregate[]>

  getTopCreatives(
    campaignIds: string[],
    startDate: Date,
    endDate: Date,
    limit: number,
    sortBy: 'roas' | 'conversions' | 'spend'
  ): Promise<CreativeAggregate[]>
}
```

- [x]**3.2** 타입 체크

```bash
npx tsc --noEmit
```

---

## Task 4: PrismaAdKPIRepository 구현체

**예상 시간:** 5분
**파일:**
- `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts` (신규)
- `src/infrastructure/database/mappers/AdKPIMapper.ts` (신규)

**패턴 참조:**
- `src/infrastructure/database/repositories/PrismaKPIRepository.ts` (upsert, aggregate, groupBy 패턴)
- `src/infrastructure/database/mappers/KPIMapper.ts` (toDomain, toCreateInput 패턴)

### Steps

- [x]**4.1** AdKPIMapper 생성: `src/infrastructure/database/mappers/AdKPIMapper.ts`

```typescript
import { AdKPISnapshot as PrismaAdKPI, Prisma } from '@/generated/prisma'
import { AdKPI } from '@domain/entities/AdKPI'
import { Money, Currency } from '@domain/value-objects/Money'

const { Decimal } = Prisma

export class AdKPIMapper {
  static toDomain(prisma: PrismaAdKPI): AdKPI {
    return AdKPI.restore({
      id: prisma.id,
      adId: prisma.adId,
      adSetId: prisma.adSetId,
      campaignId: prisma.campaignId,
      creativeId: prisma.creativeId,
      impressions: prisma.impressions,
      clicks: prisma.clicks,
      linkClicks: prisma.linkClicks,
      conversions: prisma.conversions,
      spend: Money.create(Number(prisma.spend), prisma.currency as Currency),
      revenue: Money.create(Number(prisma.revenue), prisma.currency as Currency),
      reach: prisma.reach,
      frequency: Number(prisma.frequency),
      cpm: Number(prisma.cpm),
      cpc: Number(prisma.cpc),
      videoViews: prisma.videoViews,
      thruPlays: prisma.thruPlays,
      date: prisma.date,
      createdAt: prisma.createdAt,
    })
  }

  static toCreateInput(domain: AdKPI) {
    const json = domain.toJSON()
    return {
      id: json.id,
      adId: json.adId,
      adSetId: json.adSetId,
      campaignId: json.campaignId,
      creativeId: json.creativeId,
      impressions: json.impressions,
      clicks: json.clicks,
      linkClicks: json.linkClicks,
      conversions: json.conversions,
      spend: new Decimal(json.spend.amount),
      currency: json.spend.currency,
      revenue: new Decimal(json.revenue.amount),
      reach: json.reach,
      frequency: new Decimal(json.frequency),
      cpm: new Decimal(json.cpm),
      cpc: new Decimal(json.cpc),
      videoViews: json.videoViews,
      thruPlays: json.thruPlays,
      date: json.date,
      createdAt: json.createdAt,
    }
  }
}
```

- [x]**4.2** PrismaAdKPIRepository 생성: `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts`

```typescript
import { PrismaClient } from '@/generated/prisma'
import {
  IAdKPIRepository,
  AdKPIAggregate,
  DailyAdKPIAggregate,
  FormatAggregate,
  CreativeAggregate,
} from '@domain/repositories/IAdKPIRepository'
import { AdKPI } from '@domain/entities/AdKPI'
import { AdKPIMapper } from '../mappers/AdKPIMapper'

export class PrismaAdKPIRepository implements IAdKPIRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(kpi: AdKPI): Promise<AdKPI> {
    const data = AdKPIMapper.toCreateInput(kpi)
    const saved = await this.prisma.adKPISnapshot.upsert({
      where: {
        adId_date: {
          adId: data.adId,
          date: data.date,
        },
      },
      update: {
        adSetId: data.adSetId,
        campaignId: data.campaignId,
        creativeId: data.creativeId,
        impressions: data.impressions,
        clicks: data.clicks,
        linkClicks: data.linkClicks,
        conversions: data.conversions,
        spend: data.spend,
        currency: data.currency,
        revenue: data.revenue,
        reach: data.reach,
        frequency: data.frequency,
        cpm: data.cpm,
        cpc: data.cpc,
        videoViews: data.videoViews,
        thruPlays: data.thruPlays,
      },
      create: {
        id: data.id,
        adSetId: data.adSetId,
        campaignId: data.campaignId,
        creativeId: data.creativeId,
        impressions: data.impressions,
        clicks: data.clicks,
        linkClicks: data.linkClicks,
        conversions: data.conversions,
        spend: data.spend,
        currency: data.currency,
        revenue: data.revenue,
        reach: data.reach,
        frequency: data.frequency,
        cpm: data.cpm,
        cpc: data.cpc,
        videoViews: data.videoViews,
        thruPlays: data.thruPlays,
        date: data.date,
        createdAt: data.createdAt,
        ad: { connect: { id: data.adId } },
      },
    })
    return AdKPIMapper.toDomain(saved)
  }

  async saveMany(kpis: AdKPI[]): Promise<AdKPI[]> {
    if (kpis.length === 0) return []
    const operations = kpis.map((kpi) => {
      const data = AdKPIMapper.toCreateInput(kpi)
      return this.prisma.adKPISnapshot.upsert({
        where: { adId_date: { adId: data.adId, date: data.date } },
        update: {
          adSetId: data.adSetId, campaignId: data.campaignId,
          creativeId: data.creativeId, impressions: data.impressions,
          clicks: data.clicks, linkClicks: data.linkClicks,
          conversions: data.conversions, spend: data.spend,
          currency: data.currency, revenue: data.revenue,
          reach: data.reach, frequency: data.frequency,
          cpm: data.cpm, cpc: data.cpc,
          videoViews: data.videoViews, thruPlays: data.thruPlays,
        },
        create: {
          id: data.id, adSetId: data.adSetId,
          campaignId: data.campaignId, creativeId: data.creativeId,
          impressions: data.impressions, clicks: data.clicks,
          linkClicks: data.linkClicks, conversions: data.conversions,
          spend: data.spend, currency: data.currency,
          revenue: data.revenue, reach: data.reach,
          frequency: data.frequency, cpm: data.cpm, cpc: data.cpc,
          videoViews: data.videoViews, thruPlays: data.thruPlays,
          date: data.date, createdAt: data.createdAt,
          ad: { connect: { id: data.adId } },
        },
      })
    })
    const results = await this.prisma.$transaction(operations)
    return results.map(AdKPIMapper.toDomain)
  }

  async upsertMany(kpis: AdKPI[]): Promise<number> {
    const results = await this.saveMany(kpis)
    return results.length
  }

  // ... findByAdId, findByCampaignId, findByCreativeId,
  //     aggregateByCampaignId, aggregateByCreativeId,
  //     aggregateByFormat, getDailyAggregatesByCampaignIds,
  //     getTopCreatives 구현 (PrismaKPIRepository 패턴 참조)
}
```

> 전체 메서드 구현은 `PrismaKPIRepository`의 `findByCampaignIdAndDateRange`, `aggregateByCampaignId`, `getDailyAggregates` 패턴을 동일하게 따른다. `findBy*`는 `findMany` + `where` + `orderBy`, `aggregate*`는 `aggregate` + `_sum`/_avg`, `getTopCreatives`는 `groupBy` + raw SQL로 ROAS 정렬.

- [x]**4.3** 타입 체크

```bash
npx tsc --noEmit
```

---

## Task 5: MetaInsightsData 확장 + getAccountInsights fields 확장

**예상 시간:** 5분
**파일:**
- `tests/unit/infrastructure/meta-ads/MetaAdsClient.test.ts` (기존 수정)
- `src/application/ports/IMetaAdsService.ts` (기존 수정)
- `src/infrastructure/external/meta-ads/MetaAdsClient.ts` (기존 수정)

**어드바이저리 적용:** A1 (video_views 추출), A2 (timeIncrement -> Map 키 변경), A3 (페이지네이션), A5 (cpm/cpc는 number)

### Steps

- [x]**5.1** `MetaInsightsData` 인터페이스 확장: `src/application/ports/IMetaAdsService.ts`

기존 `MetaInsightsData`에 optional 필드 추가:

```typescript
export interface MetaInsightsData {
  campaignId: string
  impressions: number
  reach: number
  clicks: number
  linkClicks: number
  spend: number
  conversions: number
  revenue: number
  dateStart: string
  dateStop: string
  // Phase 1: Ad-level 확장 필드
  frequency?: number
  cpm?: number
  cpc?: number
  videoViews?: number
  thruPlays?: number
  adSetId?: string
  adId?: string
}
```

- [x]**5.2** `getAccountInsights` options에 `timeIncrement` + `timeRange` 추가: `src/application/ports/IMetaAdsService.ts`

`IMetaAdsService.getAccountInsights` 시그니처 변경:

```typescript
getAccountInsights(
  accessToken: string,
  adAccountId: string,
  options: {
    level: 'campaign' | 'adset' | 'ad'
    datePreset?: string
    timeRange?: { since: string; until: string }
    timeIncrement?: '1'          // 일별 분할 (A2)
    campaignIds?: string[]
  }
): Promise<Map<string, MetaInsightsData>>
```

**주의 (A2):** `timeIncrement='1'` 사용 시, 같은 Ad가 날짜별로 여러 행을 반환하므로 Map 키를 `${entityId}_${dateStart}`로 변경해야 한다.

**시그니처 변경 영향 분석:** `datePreset`이 기존에는 required였으나, `timeRange` 대안 추가로 optional로 변경된다. 최소 하나(`datePreset` 또는 `timeRange`)가 반드시 전달되어야 하므로, `MetaAdsClient.getAccountInsights` 구현체 첫 줄에 런타임 검증을 추가한다:

```typescript
if (!options.datePreset && !options.timeRange) {
  throw new Error('Either datePreset or timeRange must be provided')
}
```

- [x]**5.2a** 기존 `getAccountInsights` 호출자 감사(audit) 및 업데이트

기존 호출자가 `datePreset`을 required로 전달하고 있으므로 시그니처 변경 후에도 컴파일이 유지되는지 확인한다:

```bash
grep -rn "getAccountInsights" src/ --include="*.ts"
```

확인 대상 호출자:
- `SyncAllInsightsUseCase` -- 현재 `getAccountInsights`를 직접 호출하지 않음 (getCampaignDailyInsights 사용). 영향 없음.
- `MetaAdsClient.ts` -- 구현체 자체. 시그니처 변경에 맞춰 수정됨.
- 기타 호출자가 있으면: `datePreset`을 이미 전달하고 있으면 optional 변경에 의해 깨지지 않음 (superset 호환). `timeRange` 없이 `datePreset`만 전달하는 기존 코드는 그대로 동작.

**검증:** `npx tsc --noEmit` 으로 모든 호출자가 컴파일되는지 확인 (Task 5.6에서 수행).

- [x]**5.3** `MetaAdsClient.getAccountInsights` 구현 수정: `src/infrastructure/external/meta-ads/MetaAdsClient.ts`

변경점:
1. `fields` 문자열에 `frequency,cpm,cpc` 추가
2. `timeIncrement` 옵션 처리 (`time_increment` 파라미터 추가)
3. `timeRange` 옵션 처리 (`time_range` 또는 `since`/`until` 파라미터)
4. 응답 매핑에서 `frequency`, `cpm`, `cpc`, `adSetId`, `adId` 추가
5. `video_views` 추출: `actions` 배열에서 `action_type === 'video_view'` 검색 (A1)
6. `thruPlays`: `video_thru_play_watched_actions` 또는 `actions`에서 `action_type === 'video_thru_play'` 검색
7. **페이지네이션 (A3):** `paging.next` URL이 있으면 반복 호출하여 모든 결과 수집
8. **Map 키 (A2):** `timeIncrement` 사용 시 키를 `${entityId}_${dateStart}`로 생성

핵심 변경 스니펫 (fields):

```typescript
const fields =
  'campaign_id,adset_id,ad_id,impressions,reach,clicks,spend,' +
  'actions,action_values,frequency,cpm,cpc,' +
  'video_3s_views,' +           // A1: 직접 필드 우선 요청
  'date_start,date_stop'
```

핵심 변경 스니펫 (timeIncrement + timeRange):

```typescript
if (options.timeIncrement) {
  params.append('time_increment', options.timeIncrement)
}
if (options.timeRange) {
  params.append('time_range', JSON.stringify({
    since: options.timeRange.since,
    until: options.timeRange.until,
  }))
}
// datePreset은 timeRange가 없을 때만 사용
if (options.datePreset && !options.timeRange) {
  params.append('date_preset', options.datePreset)
}
```

핵심 변경 스니펫 (응답 매핑 확장):

```typescript
// video_views 추출 (A1 전략: 직접 필드 우선 -> actions 배열 fallback)
// fields에 'video_3s_views'를 포함하여 요청하고, 값이 없으면 actions 배열에서 추출
const videoViewsDirect = item.video_3s_views || '0'
const videoViewsFallback = item.actions?.find(
  (a: { action_type: string; value: string }) => a.action_type === 'video_view'
)?.value || '0'
const videoViews = parseInt(videoViewsDirect, 10) > 0
  ? videoViewsDirect
  : videoViewsFallback

const thruPlays = item.actions?.find(
  (a: { action_type: string; value: string }) => a.action_type === 'video_thru_play'  // or 'thru_play'
)?.value || '0'

// Map 키 결정 (A2)
const mapKey = options.timeIncrement
  ? `${entityId}_${item.date_start}`
  : entityId

result.set(mapKey, {
  campaignId: item.campaign_id,
  impressions: parseInt(item.impressions || '0', 10),
  reach: parseInt(item.reach || '0', 10),
  clicks: parseInt(item.clicks || '0', 10),
  linkClicks: parseInt(linkClicks, 10),
  spend: parseFloat(item.spend || '0'),
  conversions: parseInt(conversions, 10),
  revenue: parseFloat(revenue),
  dateStart: item.date_start,
  dateStop: item.date_stop,
  // Phase 1 확장 필드
  frequency: parseFloat(item.frequency || '0'),
  cpm: parseFloat(item.cpm || '0'),
  cpc: parseFloat(item.cpc || '0'),
  videoViews: parseInt(videoViews, 10),
  thruPlays: parseInt(thruPlays, 10),
  adSetId: itemAny.adset_id as string | undefined,
  adId: itemAny.ad_id as string | undefined,
})
```

핵심 변경 스니펫 (페이지네이션 A3):

```typescript
// 첫 페이지 호출
let response = await this.requestWithRetry<MetaApiInsightsResponse>(
  accessToken,
  `/${adAccountId}/insights?${params.toString()}`,
  { method: 'GET' }
)

const allData = [...(response.data || [])]

// 페이지네이션: paging.next가 있으면 계속 가져옴
while (response.paging?.next) {
  response = await this.requestWithRetry<MetaApiInsightsResponse>(
    accessToken,
    response.paging.next,  // 전체 URL 직접 사용
    { method: 'GET' }
  )
  if (response.data) {
    allData.push(...response.data)
  }
}
```

- [x]**5.4** 기존 테스트 업데이트 + 새 테스트 추가

`tests/unit/infrastructure/meta-ads/MetaAdsClient.test.ts` 또는 `MetaAdsClient.bulk.test.ts`에 추가:

```typescript
describe('getAccountInsights - extended fields', () => {
  it('should include frequency/cpm/cpc in response', async () => {
    // Mock response with frequency, cpm, cpc fields
    // Verify MetaInsightsData includes extended fields
  })

  it('should extract videoViews from actions array (A1)', async () => {
    // Mock actions array with { action_type: 'video_view', value: '5000' }
    // Verify videoViews === 5000
  })

  it('should use entityId_date as map key when timeIncrement is set (A2)', async () => {
    // Mock response with timeIncrement='1', multiple dates for same ad
    // Verify Map keys are 'adId_2026-03-15', 'adId_2026-03-16'
  })

  it('should handle pagination for 500+ ads (A3)', async () => {
    // Mock first response with paging.next
    // Mock second response with remaining data
    // Verify all items collected
  })
})
```

- [x]**5.5** 테스트 실행

```bash
npx vitest run tests/unit/infrastructure/meta-ads/ --pool forks
```

- [x]**5.6** 타입 체크

```bash
npx tsc --noEmit
```

---

## Task 6: SyncAdInsightsUseCase

**예상 시간:** 5분
**파일:**
- `tests/unit/application/kpi/SyncAdInsightsUseCase.test.ts` (신규)
- `src/application/use-cases/kpi/SyncAdInsightsUseCase.ts` (신규)

**패턴 참조:** `src/application/use-cases/kpi/SyncAllInsightsUseCase.ts`

### Steps

- [x]**6.1** 실패 테스트 작성: `tests/unit/application/kpi/SyncAdInsightsUseCase.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncAdInsightsUseCase } from '@application/use-cases/kpi/SyncAdInsightsUseCase'
import { Money } from '@domain/value-objects/Money'

describe('SyncAdInsightsUseCase', () => {
  let useCase: SyncAdInsightsUseCase
  let mockAdKPIRepository: {
    upsertMany: ReturnType<typeof vi.fn>
    save: ReturnType<typeof vi.fn>
    saveMany: ReturnType<typeof vi.fn>
  }
  let mockAdRepository: {
    findById: ReturnType<typeof vi.fn>
    findByAdSetId: ReturnType<typeof vi.fn>
  }
  let mockMetaAdsService: {
    getAccountInsights: ReturnType<typeof vi.fn>
    listAllAds: ReturnType<typeof vi.fn>
  }
  let mockMetaAdAccountRepository: {
    findByUserId: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockAdKPIRepository = {
      upsertMany: vi.fn().mockResolvedValue(2),
      save: vi.fn(),
      saveMany: vi.fn(),
    }
    mockAdRepository = {
      findById: vi.fn(),
      findByAdSetId: vi.fn(),
    }
    mockMetaAdsService = {
      getAccountInsights: vi.fn(),
      listAllAds: vi.fn(),
    }
    mockMetaAdAccountRepository = {
      findByUserId: vi.fn(),
    }

    useCase = new SyncAdInsightsUseCase(
      mockAdKPIRepository as never,
      mockAdRepository as never,
      mockMetaAdsService as never,
      mockMetaAdAccountRepository as never
    )
  })

  it('should return early if no meta account', async () => {
    mockMetaAdAccountRepository.findByUserId.mockResolvedValue(null)

    const result = await useCase.execute({
      userId: 'user-1',
      datePreset: 'last_7d',
    })

    expect(result.syncedCount).toBe(0)
    expect(result.errors).toContain('No Meta account found')
  })

  it('should sync ad insights from Meta API', async () => {
    mockMetaAdAccountRepository.findByUserId.mockResolvedValue({
      metaAccountId: 'act_123',
      accessToken: 'encrypted-token',
    })

    const insightsMap = new Map([
      ['meta_ad_1_2026-03-15', {
        campaignId: 'meta_campaign_1',
        impressions: 5000,
        reach: 4000,
        clicks: 200,
        linkClicks: 150,
        spend: 50000,
        conversions: 20,
        revenue: 200000,
        dateStart: '2026-03-15',
        dateStop: '2026-03-15',
        frequency: 1.25,
        cpm: 10000,
        cpc: 250,
        videoViews: 1000,
        thruPlays: 500,
        adSetId: 'meta_adset_1',
        adId: 'meta_ad_1',
      }],
    ])

    mockMetaAdsService.getAccountInsights.mockResolvedValue(insightsMap)

    // Ad 레코드에서 creativeId를 조회하기 위한 DB 조회
    mockAdRepository.findById.mockResolvedValue({
      id: 'local_ad_1',
      metaAdId: 'meta_ad_1',
      creativeId: 'creative_1',
      adSetId: 'local_adset_1',
    })

    const result = await useCase.execute({
      userId: 'user-1',
      datePreset: 'last_7d',
    })

    expect(result.syncedCount).toBeGreaterThan(0)
    expect(mockAdKPIRepository.upsertMany).toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    mockMetaAdAccountRepository.findByUserId.mockResolvedValue({
      metaAccountId: 'act_123',
      accessToken: 'encrypted-token',
    })
    mockMetaAdsService.getAccountInsights.mockRejectedValue(
      new Error('API rate limit')
    )

    const result = await useCase.execute({
      userId: 'user-1',
      datePreset: 'last_7d',
    })

    expect(result.failedCount).toBeGreaterThan(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
```

- [x]**6.2** 실패 확인

```bash
npx vitest run tests/unit/application/kpi/SyncAdInsightsUseCase.test.ts --pool forks
```

- [x]**6.3** 최소 구현: `src/application/use-cases/kpi/SyncAdInsightsUseCase.ts`

```typescript
import { AdKPI } from '@domain/entities/AdKPI'
import { Money } from '@domain/value-objects/Money'
import { IAdKPIRepository } from '@domain/repositories/IAdKPIRepository'
import { IMetaAdsService, MetaInsightsData } from '@application/ports/IMetaAdsService'
import { IMetaAdAccountRepository } from '@application/ports/IMetaAdAccountRepository'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

export interface SyncAdInsightsInput {
  userId: string
  campaignIds?: string[]
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d'
}

export interface SyncAdInsightsResult {
  syncedCount: number
  failedCount: number
  errors: string[]
}

export class SyncAdInsightsUseCase {
  constructor(
    private readonly adKPIRepository: IAdKPIRepository,
    private readonly adRepository: IAdRepository,     // Ad 엔티티에서 creativeId 조회
    private readonly metaAdsService: IMetaAdsService,
    private readonly metaAdAccountRepository: IMetaAdAccountRepository
  ) {}

  async execute(input: SyncAdInsightsInput): Promise<SyncAdInsightsResult> {
    const result: SyncAdInsightsResult = {
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    }

    // 1. Meta 계정 조회
    const metaAccount = await this.metaAdAccountRepository.findByUserId(input.userId)
    if (!metaAccount?.accessToken) {
      result.errors.push('No Meta account found')
      return result
    }

    try {
      // 2. 벌크 호출: Ad 레벨 인사이트 (A3: 내부에서 pagination 처리)
      const insightsMap = await this.metaAdsService.getAccountInsights(
        safeDecryptToken(metaAccount.accessToken),
        metaAccount.metaAccountId,
        {
          level: 'ad',
          datePreset: input.datePreset || 'last_7d',
          timeIncrement: '1',           // 일별 분할 (A2)
          campaignIds: input.campaignIds,
        }
      )

      if (insightsMap.size === 0) {
        return result
      }

      // 3. Ad metaAdId -> local Ad 매핑 (creativeId 조회)
      //    이미 DB에 저장된 Ad 레코드를 통해 creativeId를 알아냄
      //    캐싱: 같은 adId에 대해 반복 조회 방지
      const adCache = new Map<string, { id: string; creativeId: string; adSetId: string }>()

      const kpisToSave: AdKPI[] = []

      for (const [_mapKey, insight] of insightsMap) {
        try {
          const metaAdId = insight.adId
          if (!metaAdId) continue

          // Ad 캐시 조회
          let adInfo = adCache.get(metaAdId)
          if (!adInfo) {
            const ad = await this.adRepository.findByMetaAdId(metaAdId)
            if (!ad) continue  // DB에 없는 Ad는 스킵
            adInfo = {
              id: ad.id,
              creativeId: ad.creativeId,
              adSetId: ad.adSetId,
            }
            adCache.set(metaAdId, adInfo)
          }

          const kpi = AdKPI.create({
            adId: adInfo.id,
            adSetId: adInfo.adSetId,
            campaignId: insight.campaignId,
            creativeId: adInfo.creativeId,
            impressions: insight.impressions,
            clicks: insight.clicks,
            linkClicks: insight.linkClicks,
            conversions: insight.conversions,
            spend: Money.create(Math.round(insight.spend), 'KRW'),
            revenue: Money.create(Math.round(insight.revenue), 'KRW'),
            reach: insight.reach,
            frequency: insight.frequency ?? 0,
            cpm: insight.cpm ?? 0,        // number, not Money (A5)
            cpc: insight.cpc ?? 0,        // number, not Money (A5)
            videoViews: insight.videoViews ?? 0,
            thruPlays: insight.thruPlays ?? 0,
            date: new Date(insight.dateStart + 'T00:00:00.000Z'),
          })

          kpisToSave.push(kpi)
        } catch (error) {
          result.failedCount++
          result.errors.push(
            `Ad ${insight.adId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      // 4. 벌크 저장
      if (kpisToSave.length > 0) {
        const savedCount = await this.adKPIRepository.upsertMany(kpisToSave)
        result.syncedCount = savedCount
      }
    } catch (error) {
      result.failedCount++
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }
}
```

**참고:** `IAdRepository`에 `findByMetaAdId(metaAdId: string)` 메서드가 없을 수 있음. 기존 `IAdRepository` 인터페이스를 확인하여 해당 메서드가 없으면 추가해야 한다. 대안으로 `prisma.ad.findFirst({ where: { metaAdId } })`를 직접 사용하는 것은 Clean Architecture 위반이므로, Repository 인터페이스에 메서드를 추가하는 것이 올바르다.

- [x]**6.4** IAdRepository에 `findByMetaAdId` 메서드 추가 (필수 -- 현재 존재하지 않음)

**현황:** `IAdRepository.ts`에는 `save`, `findById`, `findByAdSetId`, `update`, `delete`만 존재. `findByMetaAdId`는 없음.
**참고:** Prisma Ad 모델의 `metaAdId`는 `String?` (nullable). 따라서 반환 타입은 `Ad | null`.

**6.4a** `src/domain/repositories/IAdRepository.ts`에 메서드 추가:

```typescript
import { Ad } from '../entities/Ad'

export interface IAdRepository {
  save(ad: Ad): Promise<Ad>
  findById(id: string): Promise<Ad | null>
  findByAdSetId(adSetId: string): Promise<Ad[]>
  findByMetaAdId(metaAdId: string): Promise<Ad | null>  // Phase 1 추가
  update(ad: Ad): Promise<Ad>
  delete(id: string): Promise<void>
}
```

**6.4b** `src/infrastructure/database/repositories/PrismaAdRepository.ts`에 구현 추가:

```typescript
async findByMetaAdId(metaAdId: string): Promise<Ad | null> {
  const ad = await this.prisma.ad.findFirst({
    where: { metaAdId },
  })
  if (!ad) return null
  return AdMapper.toDomain(ad)
}
```

**참고:** `metaAdId`는 unique가 아니므로 `findFirst` 사용. Ad 모델에 `@@unique([metaAdId])`가 추가되면 `findUnique`로 전환 가능.

**6.4c** 기존 IAdRepository 호출자에 영향 확인:

인터페이스에 메서드를 추가하면 `IAdRepository`를 `implements`하는 모든 클래스에서 컴파일 에러가 발생한다. 현재 구현체:
- `PrismaAdRepository` -- 6.4b에서 구현 추가.
- 테스트 mock -- mock 객체는 부분 타입(`as never`)으로 캐스팅하므로 영향 없음.

`npx tsc --noEmit`으로 확인 (Task 6.6에서 수행).

- [x]**6.5** 테스트 통과 확인

```bash
npx vitest run tests/unit/application/kpi/SyncAdInsightsUseCase.test.ts --pool forks
```

- [x]**6.6** 타입 체크

```bash
npx tsc --noEmit
```

---

## Task 7: Cron 라우트 -- /api/cron/sync-ad-insights

**예상 시간:** 3분
**파일:**
- `src/app/api/cron/sync-ad-insights/route.ts` (신규)

**패턴 참조:** `src/app/api/cron/sync/route.ts` (validateCronAuth, container.resolve, NextResponse, maxDuration)

### Steps

- [x]**7.1** 라우트 생성: `src/app/api/cron/sync-ad-insights/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth } from '@/lib/middleware/cronAuth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { SyncAdInsightsUseCase } from '@application/use-cases/kpi/SyncAdInsightsUseCase'
import { prisma } from '@/lib/prisma'
import { isTokenExpired } from '@application/utils/metaTokenUtils'

/**
 * GET /api/cron/sync-ad-insights
 *
 * Vercel Cron Job - Ad 레벨 KPI 동기화
 *
 * 기존 /api/cron/sync (06:00) 이후 30분 뒤 실행하여 Rate Limit 충돌 방지.
 *
 * Configuration in vercel.json:
 * - path: /api/cron/sync-ad-insights
 * - schedule: "30 6 * * *" (매일 06:30 KST)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response!
    }

    console.log('[SyncAdInsights Cron] Ad 레벨 KPI 동기화 시작...')

    const metaAccounts = await prisma.metaAdAccount.findMany({
      select: {
        userId: true,
        metaAccountId: true,
        tokenExpiry: true,
      },
    })

    if (metaAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Meta accounts found',
        processed: 0,
      })
    }

    const syncUseCase = container.resolve<SyncAdInsightsUseCase>(
      DI_TOKENS.SyncAdInsightsUseCase
    )

    const results = {
      processed: 0,
      skipped: 0,
      totalSynced: 0,
      errors: [] as string[],
    }

    for (const account of metaAccounts) {
      if (isTokenExpired(account.tokenExpiry)) {
        console.log(`[SyncAdInsights Cron] 사용자 ${account.userId} 토큰 만료 - 스킵`)
        results.skipped++
        continue
      }

      try {
        const syncResult = await syncUseCase.execute({
          userId: account.userId,
          datePreset: 'last_7d',
        })

        results.processed++
        results.totalSynced += syncResult.syncedCount

        console.log(
          `[SyncAdInsights Cron] 사용자 ${account.userId} 완료: ${syncResult.syncedCount}개 동기화`
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[SyncAdInsights Cron] 사용자 ${account.userId} 실패:`, message)
        results.errors.push(`User ${account.userId}: ${message}`)
      }
    }

    console.log('[SyncAdInsights Cron] 완료:', results)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('[SyncAdInsights Cron] 치명적 오류:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 300
```

- [x]**7.2** `vercel.json`에 cron 스케줄 엔트리 추가

기존 `vercel.json`의 `crons` 배열에 동일한 형식으로 추가한다. 기존 `/api/cron/sync`(06:00) 이후 30분 간격으로 설정하여 Rate Limit 충돌을 방지한다:

```json
{
  "path": "/api/cron/sync-ad-insights",
  "schedule": "30 6 * * *"
}
```

기존 cron 패턴 참조 (vercel.json):
```json
{
  "path": "/api/cron/sync",
  "schedule": "0 6 * * *"
}
```

위 엔트리 바로 뒤에 추가하여 관련 cron job이 인접하게 배치되도록 한다.

- [x]**7.3** 타입 체크

```bash
npx tsc --noEmit
```

---

## Task 8: DI 토큰 + 모듈 등록

**예상 시간:** 3분
**파일:**
- `src/lib/di/types.ts` (기존 수정)
- `src/lib/di/modules/kpi.module.ts` (기존 수정)

**패턴 참조:** 기존 `DI_TOKENS` 구조, `registerKPIModule` 패턴

> **DI 등록 위치 노트:** 스펙 문서(섹션 8.3)는 `report.module.ts`를 DI 등록 위치로 지정하지만, Phase 1 범위는 KPI 인프라(AdKPIRepository + SyncAdInsightsUseCase)이므로 `kpi.module.ts`에 등록한다. Phase 2에서 보고서 관련 서비스(ReportAggregationService, CreativeFatigueAnalyzer 등)는 `report.module.ts`에 등록한다.

### Steps

- [x]**8.1** DI 토큰 추가: `src/lib/di/types.ts`

기존 `DI_TOKENS` 객체 내 적절한 위치에 추가:

```typescript
// Ad KPI (Phase 1: Report Enhancement)
AdKPIRepository: Symbol.for('AdKPIRepository'),
SyncAdInsightsUseCase: Symbol.for('SyncAdInsightsUseCase'),
```

위치: `// Ad` 섹션 (line ~118) 근처, 또는 `KPIRepository` 토큰 근처.

- [x]**8.2** KPI 모듈에 등록 추가: `src/lib/di/modules/kpi.module.ts`

기존 `registerKPIModule` 함수에 추가:

```typescript
import type { IAdKPIRepository } from '@domain/repositories/IAdKPIRepository'
import { PrismaAdKPIRepository } from '@infrastructure/database/repositories/PrismaAdKPIRepository'
import { SyncAdInsightsUseCase } from '@application/use-cases/kpi/SyncAdInsightsUseCase'

// registerKPIModule 함수 내부에 추가:

// --- Ad KPI (Phase 1) ---
container.registerSingleton<IAdKPIRepository>(
  DI_TOKENS.AdKPIRepository,
  () => new PrismaAdKPIRepository(prisma)
)

container.register(
  DI_TOKENS.SyncAdInsightsUseCase,
  () => new SyncAdInsightsUseCase(
    container.resolve(DI_TOKENS.AdKPIRepository),
    container.resolve(DI_TOKENS.AdRepository),
    container.resolve(DI_TOKENS.MetaAdsService),
    container.resolve(DI_TOKENS.MetaAdAccountRepository)
  )
)
```

- [x]**8.3** 타입 체크

```bash
npx tsc --noEmit
```

---

## Task 9: 테스트 보완 (Repository + UseCase 통합)

**예상 시간:** 5분
**파일:**
- `tests/unit/infrastructure/database/PrismaAdKPIRepository.test.ts` (신규)

### Steps

- [x]**9.1** Repository 단위 테스트 (Prisma mock 사용)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaAdKPIRepository } from '@infrastructure/database/repositories/PrismaAdKPIRepository'
import { AdKPI } from '@domain/entities/AdKPI'
import { Money } from '@domain/value-objects/Money'

describe('PrismaAdKPIRepository', () => {
  let repository: PrismaAdKPIRepository
  let mockPrisma: {
    adKPISnapshot: {
      upsert: ReturnType<typeof vi.fn>
      findMany: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
      $transaction: ReturnType<typeof vi.fn>
    }
    $transaction: ReturnType<typeof vi.fn>
  }

  const createTestKPI = () =>
    AdKPI.create({
      adId: 'ad-1',
      adSetId: 'adset-1',
      campaignId: 'campaign-1',
      creativeId: 'creative-1',
      impressions: 5000,
      clicks: 200,
      linkClicks: 150,
      conversions: 20,
      spend: Money.create(50000, 'KRW'),
      revenue: Money.create(200000, 'KRW'),
      reach: 4000,
      frequency: 1.25,
      cpm: 10000,
      cpc: 250,
      videoViews: 1000,
      thruPlays: 500,
      date: new Date('2026-03-15'),
    })

  beforeEach(() => {
    mockPrisma = {
      adKPISnapshot: {
        upsert: vi.fn(),
        findMany: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
        $transaction: vi.fn(),
      },
      $transaction: vi.fn(),
    }
    repository = new PrismaAdKPIRepository(mockPrisma as never)
  })

  describe('save', () => {
    it('should upsert AdKPI record', async () => {
      const kpi = createTestKPI()
      mockPrisma.adKPISnapshot.upsert.mockResolvedValue({
        id: kpi.id,
        adId: 'ad-1',
        adSetId: 'adset-1',
        campaignId: 'campaign-1',
        creativeId: 'creative-1',
        impressions: 5000,
        clicks: 200,
        linkClicks: 150,
        conversions: 20,
        spend: { toNumber: () => 50000 },
        currency: 'KRW',
        revenue: { toNumber: () => 200000 },
        reach: 4000,
        frequency: { toNumber: () => 1.25 },
        cpm: { toNumber: () => 10000 },
        cpc: { toNumber: () => 250 },
        videoViews: 1000,
        thruPlays: 500,
        date: new Date('2026-03-15'),
        createdAt: new Date(),
      })

      const saved = await repository.save(kpi)
      expect(saved.adId).toBe('ad-1')
      expect(mockPrisma.adKPISnapshot.upsert).toHaveBeenCalledOnce()
    })
  })

  describe('findByCampaignId', () => {
    it('should return AdKPIs for campaign within date range', async () => {
      mockPrisma.adKPISnapshot.findMany.mockResolvedValue([])

      const results = await repository.findByCampaignId(
        'campaign-1',
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(results).toEqual([])
      expect(mockPrisma.adKPISnapshot.findMany).toHaveBeenCalledWith({
        where: {
          campaignId: 'campaign-1',
          date: {
            gte: new Date('2026-03-01'),
            lte: new Date('2026-03-31'),
          },
        },
        orderBy: { date: 'asc' },
      })
    })
  })
})
```

- [x]**9.2** 테스트 실행

```bash
npx vitest run tests/unit/infrastructure/database/PrismaAdKPIRepository.test.ts --pool forks
```

---

## Task 10: 최종 검증

**예상 시간:** 3분

### Steps

- [x]**10.1** 타입 체크

```bash
npx tsc --noEmit
```

예상: 0 errors

- [x]**10.2** 전체 단위 테스트

```bash
npx vitest run --pool forks
```

예상: 기존 테스트 + 신규 테스트 모두 PASS

- [x]**10.3** 린트

```bash
npm run lint
```

- [x]**10.4** 디버그 코드 확인

```bash
grep -rn "console\.log\|debugger\|TODO\|HACK" \
  src/domain/entities/AdKPI.ts \
  src/domain/repositories/IAdKPIRepository.ts \
  src/infrastructure/database/repositories/PrismaAdKPIRepository.ts \
  src/infrastructure/database/mappers/AdKPIMapper.ts \
  src/application/use-cases/kpi/SyncAdInsightsUseCase.ts
```

예상: 일치 없음 (cron route의 console.log는 기존 패턴이므로 허용)

- [x]**10.5** 커밋

```bash
git add -A
git commit -m "feat: add Ad-level KPI infrastructure (Phase 1)

- AdKPISnapshot Prisma model + migration
- AdKPI domain entity (create/restore pattern)
- IAdKPIRepository interface + PrismaAdKPIRepository
- MetaInsightsData extended (frequency, cpm, cpc, videoViews, thruPlays)
- getAccountInsights: timeIncrement, pagination, extended fields
- SyncAdInsightsUseCase (bulk ad-level insight sync)
- /api/cron/sync-ad-insights route (daily 06:30)
- DI tokens + module registration
- Unit tests for entity, repository, use case"
```

---

## 파일 변경 요약

### 신규 파일 (8개)

| 레이어 | 파일 | 역할 |
|--------|------|------|
| domain | `src/domain/entities/AdKPI.ts` | AdKPI 도메인 엔티티 |
| domain | `src/domain/repositories/IAdKPIRepository.ts` | Repository 포트 인터페이스 |
| infrastructure | `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts` | Prisma 구현체 |
| infrastructure | `src/infrastructure/database/mappers/AdKPIMapper.ts` | Prisma <-> Domain 매퍼 |
| application | `src/application/use-cases/kpi/SyncAdInsightsUseCase.ts` | Ad 인사이트 동기화 UseCase |
| presentation | `src/app/api/cron/sync-ad-insights/route.ts` | Cron API 라우트 |
| test | `tests/unit/domain/entities/AdKPI.test.ts` | 엔티티 단위 테스트 |
| test | `tests/unit/application/kpi/SyncAdInsightsUseCase.test.ts` | UseCase 단위 테스트 |
| test | `tests/unit/infrastructure/database/PrismaAdKPIRepository.test.ts` | Repository 단위 테스트 |

### 수정 파일 (7개)

| 파일 | 변경 내용 |
|------|----------|
| `prisma/schema.prisma` | AdKPISnapshot 모델 추가, Ad 모델에 역관계 추가 |
| `src/application/ports/IMetaAdsService.ts` | MetaInsightsData 확장, getAccountInsights options 확장 (datePreset optional + timeRange 추가) |
| `src/infrastructure/external/meta-ads/MetaAdsClient.ts` | fields 확장 (video_3s_views 포함), timeIncrement, pagination, 응답 매핑 확장 |
| `src/domain/repositories/IAdRepository.ts` | `findByMetaAdId(metaAdId: string): Promise<Ad \| null>` 메서드 추가 (Task 6.4a) |
| `src/infrastructure/database/repositories/PrismaAdRepository.ts` | `findByMetaAdId()` 구현 추가 (Task 6.4b) |
| `src/lib/di/types.ts` | AdKPIRepository, SyncAdInsightsUseCase 토큰 추가 |
| `src/lib/di/modules/kpi.module.ts` | PrismaAdKPIRepository, SyncAdInsightsUseCase 등록 |
| `vercel.json` | `/api/cron/sync-ad-insights` cron 스케줄 추가 (`30 6 * * *`) (Task 7.2) |

### 잠재적 추가 수정 (구현 시 확인)

| 파일 | 변경 | 조건 |
|------|------|------|
| `tests/unit/infrastructure/meta-ads/MetaAdsClient.bulk.test.ts` | 확장 필드 테스트 추가 | Task 5 |

---

## 의존성 순서

```
Task 1 (Prisma 스키마)
  └─> Task 2 (AdKPI 엔티티)
       └─> Task 3 (IAdKPIRepository)
            └─> Task 4 (PrismaAdKPIRepository + Mapper)
Task 5 (MetaInsightsData + getAccountInsights 확장)  -- 독립 실행 가능
  └─> Task 6 (SyncAdInsightsUseCase)  -- Task 3, 4, 5에 의존
       └─> Task 7 (Cron 라우트)
            └─> Task 8 (DI 등록)
                 └─> Task 9 (테스트 보완)
                      └─> Task 10 (최종 검증)
```

Task 5는 Task 1~4와 병렬 진행 가능.
