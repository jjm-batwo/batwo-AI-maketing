# Phase 1: 성장 엔진 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 획득 퍼널의 핵심 병목 해소 (트라이얼 → 진단 → 원클릭 최적화)

**Architecture:** 기존 클린 아키텍처 레이어를 따르며, 도메인 엔티티/서비스 → 유스케이스 → API 라우트 → UI 순서로 구현. 기존 SubscriptionStatus.TRIALING, PendingAction 워크플로, AI 분석 API들을 최대한 활용.

**Tech Stack:** Next.js 15, TypeScript, Prisma, vitest, Toss Payments, Meta Graph API

---

## Feature 1: 14일 Pro 트라이얼

### Task 1: Prisma 스키마에 trialEndDate 추가

**Files:**
- Modify: `prisma/schema.prisma` (Subscription 모델)

- [x] **Step 1: Prisma 스키마 수정**

```prisma
model Subscription {
  // 기존 필드들...
  trialEndDate    DateTime?
  trialStartedAt  DateTime?
}
```

- [x] **Step 2: 마이그레이션 생성**

Run: `npx prisma migrate dev --name add_trial_dates`

- [x] **Step 3: Prisma Client 재생성 확인**

Run: `npx prisma generate`

- [x] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat(subscription): add trialEndDate and trialStartedAt to Subscription model"
```

---

### Task 2: Subscription 엔티티에 트라이얼 로직 추가

**Files:**
- Test: `tests/unit/domain/entities/Subscription.test.ts`
- Modify: `src/domain/entities/Subscription.ts`

- [x] **Step 1: 트라이얼 시작 테스트 작성**

```typescript
describe('Subscription - Trial', () => {
  it('should start a 14-day trial with PRO plan', () => {
    const subscription = Subscription.startTrial({
      userId: 'user-123',
    });

    expect(subscription.plan).toBe(SubscriptionPlan.PRO);
    expect(subscription.status).toBe(SubscriptionStatus.TRIALING);
    expect(subscription.trialEndDate).toBeDefined();
    expect(subscription.isTrialing()).toBe(true);
    expect(subscription.hasAccess()).toBe(true);
  });

  it('should calculate remaining trial days correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T00:00:00Z'));

    const subscription = Subscription.startTrial({ userId: 'user-123' });
    expect(subscription.trialDaysRemaining()).toBe(14);

    vi.setSystemTime(new Date('2026-03-21T00:00:00Z'));
    expect(subscription.trialDaysRemaining()).toBe(4);

    vi.useRealTimers();
  });

  it('should detect expired trial', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T00:00:00Z'));

    const subscription = Subscription.startTrial({ userId: 'user-123' });

    vi.setSystemTime(new Date('2026-03-26T00:00:00Z'));
    expect(subscription.isTrialExpired()).toBe(true);

    vi.useRealTimers();
  });

  it('should not allow trial if user already had one', () => {
    const existing = Subscription.restore({
      id: 'sub-1',
      userId: 'user-123',
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.EXPIRED,
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-01-15'),
      trialStartedAt: new Date('2026-01-01'),
      trialEndDate: new Date('2026-01-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(existing.hasUsedTrial()).toBe(true);
  });
});
```

- [x] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/domain/entities/Subscription.test.ts`
Expected: FAIL — `startTrial`, `trialDaysRemaining`, `isTrialExpired`, `hasUsedTrial` 미정의

- [x] **Step 3: Subscription 엔티티에 트라이얼 메서드 구현**

`src/domain/entities/Subscription.ts`에 추가:

```typescript
// Props에 추가
interface SubscriptionProps {
  // 기존 필드들...
  trialEndDate?: Date | null;
  trialStartedAt?: Date | null;
}

// static factory
static startTrial(params: { userId: string }): Subscription {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 14);

  return new Subscription({
    id: crypto.randomUUID(),
    userId: params.userId,
    plan: SubscriptionPlan.PRO,
    status: SubscriptionStatus.TRIALING,
    currentPeriodStart: now,
    currentPeriodEnd: trialEnd,
    trialStartedAt: now,
    trialEndDate: trialEnd,
    createdAt: now,
    updatedAt: now,
  });
}

// 인스턴스 메서드
trialDaysRemaining(): number {
  if (!this._trialEndDate) return 0;
  const now = new Date();
  const diff = this._trialEndDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

isTrialExpired(): boolean {
  if (!this._trialEndDate) return false;
  return new Date() > this._trialEndDate;
}

hasUsedTrial(): boolean {
  return this._trialStartedAt !== null && this._trialStartedAt !== undefined;
}

get trialEndDate(): Date | null { return this._trialEndDate ?? null; }
get trialStartedAt(): Date | null { return this._trialStartedAt ?? null; }
```

- [x] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/unit/domain/entities/Subscription.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/domain/entities/Subscription.ts tests/unit/domain/entities/Subscription.test.ts
git commit -m "feat(subscription): add trial start/expiry logic to Subscription entity"
```

---

### Task 3: StartTrialUseCase 생성

**Files:**
- Create: `src/application/use-cases/payment/StartTrialUseCase.ts`
- Test: `tests/unit/application/payment/StartTrialUseCase.test.ts`
- Modify: `src/lib/di/types.ts` (DI 토큰 추가)
- Modify: `src/lib/di/container.ts` (바인딩 추가)

- [x] **Step 1: 유스케이스 테스트 작성**

```typescript
// tests/unit/application/payment/StartTrialUseCase.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { StartTrialUseCase } from '@/application/use-cases/payment/StartTrialUseCase';
import { SubscriptionPlan } from '@/domain/value-objects/SubscriptionPlan';
import { SubscriptionStatus } from '@/domain/value-objects/SubscriptionStatus';

describe('StartTrialUseCase', () => {
  let useCase: StartTrialUseCase;
  let subscriptionRepository: MockSubscriptionRepository;

  beforeEach(() => {
    subscriptionRepository = new MockSubscriptionRepository();
    useCase = new StartTrialUseCase(subscriptionRepository);
  });

  it('should create a 14-day PRO trial for new user', async () => {
    const result = await useCase.execute({ userId: 'user-123' });

    expect(result.plan).toBe(SubscriptionPlan.PRO);
    expect(result.status).toBe(SubscriptionStatus.TRIALING);
    expect(result.trialEndDate).toBeDefined();
  });

  it('should reject if user already has active subscription', async () => {
    subscriptionRepository.setExisting({
      userId: 'user-123',
      status: SubscriptionStatus.ACTIVE,
    });

    await expect(useCase.execute({ userId: 'user-123' }))
      .rejects.toThrow('이미 활성 구독이 있습니다');
  });

  it('should reject if user already used trial', async () => {
    subscriptionRepository.setExisting({
      userId: 'user-123',
      status: SubscriptionStatus.EXPIRED,
      trialStartedAt: new Date('2026-01-01'),
    });

    await expect(useCase.execute({ userId: 'user-123' }))
      .rejects.toThrow('이미 무료 체험을 사용했습니다');
  });
});
```

- [x] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/unit/application/payment/StartTrialUseCase.test.ts`

- [x] **Step 3: UseCase 구현**

```typescript
// src/application/use-cases/payment/StartTrialUseCase.ts
import { ISubscriptionRepository } from '@/domain/repositories/ISubscriptionRepository';
import { Subscription } from '@/domain/entities/Subscription';
import { InvalidSubscriptionError } from '@/domain/errors/InvalidSubscriptionError';

interface StartTrialDTO {
  userId: string;
}

interface StartTrialResult {
  subscriptionId: string;
  plan: string;
  status: string;
  trialEndDate: Date;
}

export class StartTrialUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(dto: StartTrialDTO): Promise<StartTrialResult> {
    const existing = await this.subscriptionRepository.findByUserId(dto.userId);

    if (existing && existing.hasAccess()) {
      throw new InvalidSubscriptionError('이미 활성 구독이 있습니다');
    }

    if (existing && existing.hasUsedTrial()) {
      throw new InvalidSubscriptionError('이미 무료 체험을 사용했습니다');
    }

    const subscription = Subscription.startTrial({ userId: dto.userId });
    await this.subscriptionRepository.save(subscription);

    return {
      subscriptionId: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      trialEndDate: subscription.trialEndDate!,
    };
  }
}
```

- [x] **Step 4: DI 토큰 및 바인딩 추가**

`src/lib/di/types.ts`에 추가:
```typescript
StartTrialUseCase: Symbol.for('StartTrialUseCase'),
ExpireTrialsUseCase: Symbol.for('ExpireTrialsUseCase'),
```

`src/lib/di/container.ts`에 바인딩 추가.

- [x] **Step 5: 테스트 통과 확인**

Run: `npx vitest run tests/unit/application/payment/StartTrialUseCase.test.ts`

- [x] **Step 6: Commit**

```bash
git add src/application/use-cases/payment/StartTrialUseCase.ts tests/unit/application/payment/StartTrialUseCase.test.ts src/lib/di/types.ts src/lib/di/container.ts
git commit -m "feat(subscription): add StartTrialUseCase with validation"
```

---

### Task 4: 트라이얼 API 라우트

**Files:**
- Create: `src/app/api/payments/trial/start/route.ts`

- [x] **Step 1: API 라우트 구현**

```typescript
// src/app/api/payments/trial/start/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getContainer } from '@/lib/di';
import { DI_TOKENS } from '@/lib/di/types';
import { StartTrialUseCase } from '@/application/use-cases/payment/StartTrialUseCase';

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  try {
    const container = getContainer();
    const useCase = container.get<StartTrialUseCase>(DI_TOKENS.StartTrialUseCase);
    const result = await useCase.execute({ userId: user.id });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '트라이얼 시작에 실패했습니다' }, { status: 500 });
  }
}
```

- [x] **Step 2: Commit**

```bash
git add src/app/api/payments/trial/start/route.ts
git commit -m "feat(api): add POST /api/payments/trial/start endpoint"
```

---

### Task 5: 트라이얼 만료 Cron Job

**Files:**
- Create: `src/app/api/cron/expire-trials/route.ts`
- Create: `src/application/use-cases/payment/ExpireTrialsUseCase.ts`
- Test: `tests/unit/application/payment/ExpireTrialsUseCase.test.ts`

- [x] **Step 1: ExpireTrialsUseCase 테스트 작성**

```typescript
describe('ExpireTrialsUseCase', () => {
  it('should expire trials past their end date', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-26T00:00:00Z'));

    subscriptionRepository.setTrialing([
      { userId: 'user-1', trialEndDate: new Date('2026-03-25') },
      { userId: 'user-2', trialEndDate: new Date('2026-03-27') },
    ]);

    const result = await useCase.execute();

    expect(result.expiredCount).toBe(1);
    const updated = await subscriptionRepository.findByUserId('user-1');
    expect(updated?.status).toBe(SubscriptionStatus.EXPIRED);
    expect(updated?.plan).toBe(SubscriptionPlan.FREE);

    vi.useRealTimers();
  });
});
```

- [x] **Step 2: UseCase 구현**

```typescript
export class ExpireTrialsUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  async execute(): Promise<{ expiredCount: number }> {
    const trialingSubscriptions = await this.subscriptionRepository.findByFilters(
      { status: SubscriptionStatus.TRIALING },
    );

    let expiredCount = 0;
    const now = new Date();

    for (const sub of trialingSubscriptions.data) {
      if (sub.trialEndDate && sub.trialEndDate < now) {
        const expired = sub.changePlan(SubscriptionPlan.FREE);
        const finalSub = expired.markExpired ? expired.markExpired() : expired;
        await this.subscriptionRepository.update(finalSub);
        expiredCount++;
      }
    }

    return { expiredCount };
  }
}
```

- [x] **Step 3: Cron 라우트 구현**

```typescript
// src/app/api/cron/expire-trials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/di';
import { DI_TOKENS } from '@/lib/di/types';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const container = getContainer();
  const useCase = container.get(DI_TOKENS.ExpireTrialsUseCase);
  const result = await useCase.execute();

  return NextResponse.json({
    success: true,
    expiredCount: result.expiredCount,
    timestamp: new Date().toISOString(),
  });
}
```

- [x] **Step 4: vercel.json에 cron 스케줄 추가**

```json
{ "path": "/api/cron/expire-trials", "schedule": "0 0 * * *" }
```

- [x] **Step 5: 테스트 통과 확인 후 Commit**

```bash
git add src/application/use-cases/payment/ExpireTrialsUseCase.ts src/app/api/cron/expire-trials/route.ts tests/unit/application/payment/ExpireTrialsUseCase.test.ts
git commit -m "feat(subscription): add trial expiry cron job"
```

---

### Task 6: TrialBanner UI 컴포넌트

**Files:**
- Create: `src/presentation/components/subscription/TrialBanner.tsx`
- Create: `src/presentation/hooks/useTrialStatus.ts`

- [x] **Step 1: useTrialStatus 훅 구현**

```typescript
// src/presentation/hooks/useTrialStatus.ts
import { useQuery } from '@tanstack/react-query';

interface TrialStatus {
  isTrialing: boolean;
  daysRemaining: number;
  trialEndDate: string | null;
}

export function useTrialStatus() {
  return useQuery<TrialStatus>({
    queryKey: ['trial-status'],
    queryFn: async () => {
      const res = await fetch('/api/payments/subscription/status');
      if (!res.ok) return { isTrialing: false, daysRemaining: 0, trialEndDate: null };
      const data = await res.json();
      return {
        isTrialing: data.status === 'TRIALING',
        daysRemaining: data.trialDaysRemaining ?? 0,
        trialEndDate: data.trialEndDate ?? null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

- [x] **Step 2: TrialBanner 컴포넌트 구현**

```tsx
// src/presentation/components/subscription/TrialBanner.tsx
'use client';

import { memo } from 'react';
import { useTrialStatus } from '@/presentation/hooks/useTrialStatus';
import Link from 'next/link';

export const TrialBanner = memo(function TrialBanner() {
  const { data } = useTrialStatus();

  if (!data?.isTrialing) return null;

  const urgency = data.daysRemaining <= 3 ? 'bg-red-50 border-red-200 text-red-800'
    : data.daysRemaining <= 7 ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
    : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className={`border rounded-lg px-4 py-3 flex items-center justify-between ${urgency}`}>
      <p className="text-sm font-medium">
        Pro 무료 체험 <strong>{data.daysRemaining}일</strong> 남았습니다
      </p>
      <Link
        href="/pricing"
        className="text-sm font-semibold underline hover:no-underline"
      >
        지금 구독하기
      </Link>
    </div>
  );
});
```

- [x] **Step 3: 대시보드 레이아웃에 TrialBanner 삽입**

대시보드 layout 또는 page에 `<TrialBanner />` 추가.

- [x] **Step 4: Commit**

```bash
git add src/presentation/components/subscription/TrialBanner.tsx src/presentation/hooks/useTrialStatus.ts
git commit -m "feat(ui): add TrialBanner component with urgency colors"
```

---

### Task 7: 트라이얼 시작 버튼 (프라이싱 페이지 연동)

**Files:**
- Modify: 프라이싱 관련 컴포넌트

- [x] **Step 1: 프라이싱 페이지에 "14일 무료 체험" 버튼 추가**

기존 프라이싱 컴포넌트의 무료 플랜 CTA를 "14일 Pro 무료 체험 시작" 버튼으로 변경.
`POST /api/payments/trial/start` 호출 후 대시보드로 리다이렉트.

- [x] **Step 2: 전체 테스트 확인**

Run: `npx tsc --noEmit && npx vitest run`

- [x] **Step 3: Commit**

```bash
git commit -m "feat(ui): add trial start button to pricing page"
```

---

## Feature 2: 무료 광고 계정 진단

### Task 1: AdAccountAuditService 도메인 서비스

**Files:**
- Create: `src/application/services/AdAccountAuditService.ts`
- Create: `src/domain/value-objects/AuditReport.ts`
- Test: `tests/unit/application/services/AdAccountAuditService.test.ts`

- [ ] **Step 1: AuditReport 밸류 오브젝트 작성**

```typescript
// src/domain/value-objects/AuditReport.ts
export type AuditCategory = 'inefficient_campaigns' | 'target_overlap' | 'creative_fatigue' | 'bid_strategy' | 'budget_allocation';
export type AuditGrade = 'excellent' | 'good' | 'average' | 'poor' | 'critical';

export interface AuditCategoryResult {
  category: AuditCategory;
  score: number;          // 0-100
  grade: AuditGrade;
  wasteEstimate: number;  // KRW
  findings: string[];
  recommendations: string[];
}

export interface AuditReport {
  userId: string;
  overallScore: number;
  overallGrade: AuditGrade;
  totalWasteEstimate: number;
  categories: AuditCategoryResult[];
  analyzedCampaigns: number;
  analyzedPeriodDays: number;
  generatedAt: Date;
}

export function calculateOverallGrade(score: number): AuditGrade {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  if (score >= 30) return 'poor';
  return 'critical';
}
```

- [ ] **Step 2: AdAccountAuditService 테스트 작성**

```typescript
describe('AdAccountAuditService', () => {
  it('should generate audit report combining anomaly + portfolio + science data', async () => {
    anomalyService.setMockAnomalies([
      { type: 'spend_spike', severity: 'warning', metric: 'spend' },
    ]);
    portfolioService.setMockPortfolio({
      totalBudget: 1000000,
      campaigns: [{ roas: 0.5, currentBudget: 500000 }],
    });

    const report = await service.generateAudit('user-123');

    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.categories).toHaveLength(5);
    expect(report.totalWasteEstimate).toBeGreaterThanOrEqual(0);
  });

  it('should return empty report if no campaigns', async () => {
    const report = await service.generateAudit('user-no-campaigns');
    expect(report.analyzedCampaigns).toBe(0);
    expect(report.overallGrade).toBe('average');
  });
});
```

- [ ] **Step 3: AdAccountAuditService 구현**

```typescript
// src/application/services/AdAccountAuditService.ts
export class AdAccountAuditService {
  constructor(
    private readonly anomalyService: AnomalyDetectionService,
    private readonly portfolioService: PortfolioOptimizationService,
    private readonly kpiRepository: IKPIRepository,
    private readonly campaignRepository: ICampaignRepository,
  ) {}

  async generateAudit(userId: string): Promise<AuditReport> {
    const campaigns = await this.campaignRepository.findByUserId(userId);
    if (campaigns.length === 0) {
      return this.emptyReport(userId);
    }

    const [anomalies, portfolio, kpiData] = await Promise.all([
      this.anomalyService.detectAnomalies(userId).catch(() => ({ anomalies: [] })),
      this.portfolioService.analyzePortfolio(userId).catch(() => null),
      this.kpiRepository.findByUserId(userId, { days: 30 }),
    ]);

    const categories: AuditCategoryResult[] = [
      this.analyzeInefficientCampaigns(campaigns, kpiData),
      this.analyzeTargetOverlap(campaigns),
      this.analyzeCreativeFatigue(kpiData),
      this.analyzeBidStrategy(campaigns, kpiData),
      this.analyzeBudgetAllocation(portfolio, campaigns),
    ];

    const overallScore = Math.round(
      categories.reduce((sum, c) => sum + c.score, 0) / categories.length
    );
    const totalWaste = categories.reduce((sum, c) => sum + c.wasteEstimate, 0);

    return {
      userId,
      overallScore,
      overallGrade: calculateOverallGrade(overallScore),
      totalWasteEstimate: totalWaste,
      categories,
      analyzedCampaigns: campaigns.length,
      analyzedPeriodDays: 30,
      generatedAt: new Date(),
    };
  }

  // 각 카테고리 분석 private 메서드들...
}
```

- [ ] **Step 4: DI 토큰 및 바인딩 추가**

- [ ] **Step 5: 테스트 통과 확인 후 Commit**

```bash
git commit -m "feat(audit): add AdAccountAuditService with 5-category diagnosis"
```

---

### Task 2: 광고 계정 진단 API 라우트

**Files:**
- Create: `src/app/api/audit/account/route.ts`

- [ ] **Step 1: API 라우트 구현**

```typescript
// src/app/api/audit/account/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getContainer } from '@/lib/di';
import { DI_TOKENS } from '@/lib/di/types';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const container = getContainer();
  const auditService = container.get(DI_TOKENS.AdAccountAuditService);
  const report = await auditService.generateAudit(user.id);

  return NextResponse.json({ success: true, data: report });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/audit/account/route.ts
git commit -m "feat(api): add GET /api/audit/account endpoint"
```

---

### Task 3: 광고 계정 진단 결과 페이지 UI

**Files:**
- Create: `src/app/(dashboard)/audit/page.tsx`
- Create: `src/presentation/components/audit/AuditScoreCard.tsx`
- Create: `src/presentation/components/audit/AuditCategoryBreakdown.tsx`
- Create: `src/presentation/components/audit/AuditUpgradeCTA.tsx`
- Create: `src/presentation/hooks/useAccountAudit.ts`

- [ ] **Step 1: useAccountAudit 훅 작성**

```typescript
// src/presentation/hooks/useAccountAudit.ts
import { useQuery } from '@tanstack/react-query';
import type { AuditReport } from '@/domain/value-objects/AuditReport';

export function useAccountAudit() {
  return useQuery<AuditReport>({
    queryKey: ['account-audit'],
    queryFn: async () => {
      const res = await fetch('/api/audit/account');
      if (!res.ok) throw new Error('진단 실패');
      const json = await res.json();
      return json.data;
    },
    staleTime: 30 * 60 * 1000, // 30분 캐시
  });
}
```

- [ ] **Step 2: AuditScoreCard 컴포넌트**

```tsx
// src/presentation/components/audit/AuditScoreCard.tsx
'use client';

import { memo } from 'react';
import type { AuditReport } from '@/domain/value-objects/AuditReport';

const GRADE_COLORS = {
  excellent: 'text-green-600',
  good: 'text-blue-600',
  average: 'text-yellow-600',
  poor: 'text-orange-600',
  critical: 'text-red-600',
};

export const AuditScoreCard = memo(function AuditScoreCard({ report }: { report: AuditReport }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <h2 className="text-lg font-medium text-gray-500 mb-2">광고 계정 건강도</h2>
      <div className={`text-6xl font-bold ${GRADE_COLORS[report.overallGrade]}`}>
        {report.overallScore}
      </div>
      <p className="text-sm text-gray-500 mt-2">
        지난 {report.analyzedPeriodDays}일간 {report.analyzedCampaigns}개 캠페인 분석
      </p>
      {report.totalWasteEstimate > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <p className="text-red-800 font-semibold text-xl">
            약 {report.totalWasteEstimate.toLocaleString()}원의 예산이 낭비되고 있습니다
          </p>
          <p className="text-red-600 text-sm mt-1">
            AI 최적화로 이 금액을 절약하세요
          </p>
        </div>
      )}
    </div>
  );
});
```

- [ ] **Step 3: AuditCategoryBreakdown 컴포넌트**

5가지 진단 카테고리를 카드로 표시. 각 카테고리별 score, findings, recommendations 표시.

- [ ] **Step 4: AuditUpgradeCTA 컴포넌트**

무료 사용자에게 "Pro 플랜으로 AI 최적화 시작" CTA 표시.

- [ ] **Step 5: audit/page.tsx 페이지 조합**

```tsx
// src/app/(dashboard)/audit/page.tsx
'use client';

import { useAccountAudit } from '@/presentation/hooks/useAccountAudit';
import { AuditScoreCard } from '@/presentation/components/audit/AuditScoreCard';
import { AuditCategoryBreakdown } from '@/presentation/components/audit/AuditCategoryBreakdown';
import { AuditUpgradeCTA } from '@/presentation/components/audit/AuditUpgradeCTA';

export default function AuditPage() {
  const { data: report, isLoading, error } = useAccountAudit();

  if (isLoading) return <div>광고 계정을 진단하고 있습니다...</div>;
  if (error || !report) return <div>진단에 실패했습니다</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold">광고 계정 무료 진단</h1>
      <AuditScoreCard report={report} />
      <AuditCategoryBreakdown categories={report.categories} />
      <AuditUpgradeCTA wasteEstimate={report.totalWasteEstimate} />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(ui): add ad account audit result page with score, breakdown, CTA"
```

---

### Task 4: 온보딩 후 자동 진단 트리거

**Files:**
- Modify: 온보딩 완료 시 `/audit` 페이지로 리다이렉트

- [ ] **Step 1: Meta 계정 연결 완료 후 진단 페이지로 이동**

온보딩 위자드 완료 콜백에서 `router.push('/audit')` 추가.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(onboarding): redirect to audit page after Meta account connection"
```

---

### Task 5: 사이드바에 진단 메뉴 추가

**Files:**
- Modify: 사이드바/네비게이션 컴포넌트

- [ ] **Step 1: 사이드바에 "광고 진단" 메뉴 아이템 추가**

- [ ] **Step 2: 전체 테스트 확인**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(ui): add audit menu to sidebar navigation"
```

---

## Feature 3: AI 원클릭 최적화 실행

### Task 1: ApplyAction 타입 정의 및 KPIInsight 확장

**Files:**
- Create: `src/domain/value-objects/ApplyAction.ts`
- Test: `tests/unit/domain/value-objects/ApplyAction.test.ts`

- [ ] **Step 1: ApplyAction 밸류 오브젝트 작성**

```typescript
// src/domain/value-objects/ApplyAction.ts
export type ActionType = 'budget_change' | 'status_change' | 'bid_strategy_change' | 'targeting_change';

export interface ApplyAction {
  type: ActionType;
  campaignId: string;
  description: string;        // "예산 20% 증액"
  currentValue: unknown;
  suggestedValue: unknown;
  expectedImpact: string;     // "ROAS +15% 예상"
  confidence: number;         // 0-1
}

export function isHighConfidenceAction(action: ApplyAction): boolean {
  return action.confidence >= 0.7;
}
```

- [ ] **Step 2: 테스트 작성 및 통과 확인**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(domain): add ApplyAction value object for one-click optimization"
```

---

### Task 2: ApplyOptimizationUseCase 구현

**Files:**
- Create: `src/application/use-cases/ai/ApplyOptimizationUseCase.ts`
- Test: `tests/unit/application/ai/ApplyOptimizationUseCase.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
describe('ApplyOptimizationUseCase', () => {
  it('should create PendingAction and return confirmation data', async () => {
    const result = await useCase.execute({
      userId: 'user-123',
      action: {
        type: 'budget_change',
        campaignId: 'camp-1',
        description: '일일 예산 50,000원 → 60,000원',
        currentValue: 50000,
        suggestedValue: 60000,
        expectedImpact: 'ROAS +12% 예상',
        confidence: 0.8,
      },
    });

    expect(result.pendingActionId).toBeDefined();
    expect(result.requiresConfirmation).toBe(true);
    expect(result.details).toContainEqual(
      expect.objectContaining({ label: '일일 예산', changed: true })
    );
  });

  it('should execute budget change after confirmation', async () => {
    const pendingAction = await createPendingBudgetChange();
    const result = await confirmationService.confirmAndExecute(pendingAction.id);

    expect(result.success).toBe(true);
    const campaign = await campaignRepository.findById('camp-1');
    expect(campaign?.dailyBudget.amount).toBe(60000);
  });
});
```

- [ ] **Step 2: UseCase 구현**

```typescript
export class ApplyOptimizationUseCase {
  constructor(
    private readonly pendingActionRepository: IPendingActionRepository,
    private readonly campaignRepository: ICampaignRepository,
    private readonly conversationRepository: IConversationRepository,
  ) {}

  async execute(dto: ApplyOptimizationDTO): Promise<ApplyOptimizationResult> {
    // 캠페인 존재 및 소유권 확인
    const campaign = await this.campaignRepository.findById(dto.action.campaignId);
    if (!campaign || campaign.userId !== dto.userId) {
      throw new Error('캠페인을 찾을 수 없습니다');
    }

    // PendingAction 생성 (기존 워크플로 활용)
    const pendingAction = PendingAction.create({
      conversationId: dto.conversationId ?? 'optimization-direct',
      toolName: `apply_${dto.action.type}`,
      toolArgs: {
        campaignId: dto.action.campaignId,
        currentValue: dto.action.currentValue,
        newValue: dto.action.suggestedValue,
      },
      displaySummary: dto.action.description,
      details: this.buildDetails(dto.action, campaign),
      warnings: this.buildWarnings(dto.action),
    });

    await this.pendingActionRepository.save(pendingAction);

    return {
      pendingActionId: pendingAction.id,
      requiresConfirmation: true,
      details: pendingAction.details,
      warnings: pendingAction.warnings,
      expiresAt: pendingAction.expiresAt,
    };
  }
}
```

- [ ] **Step 3: DI 토큰 및 바인딩 추가**

- [ ] **Step 4: 테스트 통과 확인 후 Commit**

```bash
git commit -m "feat(ai): add ApplyOptimizationUseCase with PendingAction workflow"
```

---

### Task 3: 최적화 적용 API 라우트

**Files:**
- Create: `src/app/api/ai/optimization/apply/route.ts`

- [ ] **Step 1: API 라우트 구현**

```typescript
// src/app/api/ai/optimization/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getContainer } from '@/lib/di';
import { DI_TOKENS } from '@/lib/di/types';
import { z } from 'zod';

const applySchema = z.object({
  type: z.enum(['budget_change', 'status_change', 'bid_strategy_change', 'targeting_change']),
  campaignId: z.string(),
  description: z.string(),
  currentValue: z.unknown(),
  suggestedValue: z.unknown(),
  expectedImpact: z.string(),
  confidence: z.number().min(0).max(1),
  conversationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const container = getContainer();
  const useCase = container.get(DI_TOKENS.ApplyOptimizationUseCase);
  const result = await useCase.execute({
    userId: user.id,
    action: parsed.data,
    conversationId: parsed.data.conversationId,
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ai/optimization/apply/route.ts
git commit -m "feat(api): add POST /api/ai/optimization/apply endpoint"
```

---

### Task 4: AIInsights 컴포넌트에 "적용하기" 버튼 추가

**Files:**
- Modify: `src/presentation/components/dashboard/AIInsights.tsx`
- Create: `src/presentation/components/dashboard/ApplyOptimizationButton.tsx`
- Create: `src/presentation/components/dashboard/OptimizationConfirmDialog.tsx`

- [ ] **Step 1: ApplyOptimizationButton 컴포넌트**

```tsx
// src/presentation/components/dashboard/ApplyOptimizationButton.tsx
'use client';

import { memo, useState } from 'react';
import { OptimizationConfirmDialog } from './OptimizationConfirmDialog';
import type { ApplyAction } from '@/domain/value-objects/ApplyAction';

interface Props {
  action: ApplyAction;
  onApplied?: () => void;
}

export const ApplyOptimizationButton = memo(function ApplyOptimizationButton({ action, onApplied }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        적용하기
      </button>
      {showConfirm && (
        <OptimizationConfirmDialog
          action={action}
          onConfirm={async () => {
            const res = await fetch('/api/ai/optimization/apply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action),
            });
            if (res.ok) {
              const data = await res.json();
              // PendingAction 확인 API 호출
              await fetch(`/api/agent/actions/${data.pendingActionId}/confirm`, {
                method: 'POST',
              });
              onApplied?.();
            }
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
});
```

- [ ] **Step 2: OptimizationConfirmDialog 컴포넌트**

변경 전/후 비교 표시, 경고 사항, 확인/취소 버튼.

- [ ] **Step 3: AIInsights 컴포넌트에 버튼 통합**

각 인사이트 카드에 `action` 필드가 있으면 `<ApplyOptimizationButton>` 렌더.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(ui): add one-click optimization button to AI insights"
```

---

### Task 5: OptimizationTracker (적용 후 성과 추적)

**Files:**
- Create: `src/application/services/OptimizationTrackerService.ts`
- Create: `src/app/api/ai/optimization/track/[actionId]/route.ts`
- Create: `src/presentation/components/dashboard/OptimizationResultCard.tsx`

- [ ] **Step 1: OptimizationTrackerService 구현**

```typescript
export class OptimizationTrackerService {
  constructor(
    private readonly kpiRepository: IKPIRepository,
    private readonly pendingActionRepository: IPendingActionRepository,
  ) {}

  async getOptimizationResult(actionId: string): Promise<OptimizationResult | null> {
    const action = await this.pendingActionRepository.findById(actionId);
    if (!action || action.status !== 'COMPLETED') return null;

    const campaignId = action.toolArgs.campaignId as string;
    const executedAt = action.executedAt!;

    // 적용 전 7일 vs 적용 후 7일 KPI 비교
    const beforeKPI = await this.kpiRepository.getAverageMetrics(
      campaignId,
      new Date(executedAt.getTime() - 7 * 24 * 60 * 60 * 1000),
      executedAt,
    );
    const afterKPI = await this.kpiRepository.getAverageMetrics(
      campaignId,
      executedAt,
      new Date(executedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    );

    return {
      actionId,
      campaignId,
      appliedAt: executedAt,
      before: beforeKPI,
      after: afterKPI,
      improvement: {
        roas: afterKPI.roas - beforeKPI.roas,
        cpa: beforeKPI.cpa - afterKPI.cpa,
        ctr: afterKPI.ctr - beforeKPI.ctr,
      },
      daysTracked: Math.min(7, this.daysSince(executedAt)),
    };
  }
}
```

- [ ] **Step 2: API 라우트 및 UI 컴포넌트 구현**

- [ ] **Step 3: 전체 테스트 확인**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(ai): add optimization result tracking (7-day before/after comparison)"
```

---

### Task 6: Feature 3 최종 통합 테스트

- [ ] **Step 1: E2E 시나리오 확인**

1. 대시보드에서 AI 인사이트 로드
2. "적용하기" 버튼 클릭
3. 확인 다이얼로그에서 변경 내용 확인
4. 확인 후 PendingAction 실행
5. 7일 후 성과 추적 카드 표시

- [ ] **Step 2: 전체 빌드 확인**

Run: `npx tsc --noEmit && npx vitest run && npx next build`

- [ ] **Step 3: Final Commit**

```bash
git commit -m "feat: complete Phase 1 - trial + audit + one-click optimization"
```
