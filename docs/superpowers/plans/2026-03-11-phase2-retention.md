# Phase 2: 리텐션 강화 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 사용자 리텐션 강화 (보고서 습관화 → 퍼널 가시성 → 파워유저 도구 → 맥락 제공)

**Architecture:** 기존 클린 아키텍처 레이어를 따르며, 도메인 → 유스케이스 → API → UI 순서로 구현. Feature 4~7은 상호 독립적이므로 병렬 구현 가능.

**Tech Stack:** Next.js 15, TypeScript, Prisma, vitest, Resend (이메일), Recharts

---

## Feature 4: 보고서 자동 발송 + 외부 공유

### Task 1: ReportSchedule Prisma 모델 + 도메인 엔티티

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/domain/entities/ReportSchedule.ts`
- Test: `tests/unit/domain/entities/ReportSchedule.test.ts`

- [x] **Step 1: Prisma 스키마에 ReportSchedule 모델 추가**

```prisma
model ReportSchedule {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  frequency   String   // DAILY | WEEKLY | MONTHLY
  recipients  String[] // 이메일 주소 배열
  nextSendAt  DateTime
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([nextSendAt, isActive])
  @@index([userId])
}
```

Report 모델에 공유 필드 추가:
```prisma
model Report {
  // 기존 필드들...
  shareToken     String?  @unique
  shareExpiresAt DateTime?
}
```

- [x] **Step 2: 마이그레이션 실행**

Run: `npx prisma migrate dev --name add_report_schedule_and_share`

- [x] **Step 3: ReportSchedule 도메인 엔티티 작성**

```typescript
// src/domain/entities/ReportSchedule.ts
export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface CreateReportScheduleProps {
  userId: string;
  frequency: ScheduleFrequency;
  recipients: string[];
}

export class ReportSchedule {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private _frequency: ScheduleFrequency,
    private _recipients: string[],
    private _nextSendAt: Date,
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: CreateReportScheduleProps): ReportSchedule {
    if (props.recipients.length === 0) {
      throw new Error('최소 1개의 수신자 이메일이 필요합니다');
    }
    if (props.recipients.length > 10) {
      throw new Error('수신자는 최대 10명까지 가능합니다');
    }

    const now = new Date();
    return new ReportSchedule(
      crypto.randomUUID(),
      props.userId,
      props.frequency,
      props.recipients,
      ReportSchedule.calculateNextSendAt(props.frequency, now),
      true,
      now,
      now,
    );
  }

  static restore(props: ReportScheduleProps): ReportSchedule {
    return new ReportSchedule(
      props.id, props.userId, props.frequency as ScheduleFrequency,
      props.recipients, props.nextSendAt, props.isActive,
      props.createdAt, props.updatedAt,
    );
  }

  static calculateNextSendAt(frequency: ScheduleFrequency, from: Date): Date {
    const next = new Date(from);
    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0); // 오전 9시 KST
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + (7 - next.getDay() + 1) % 7 || 7); // 다음 월요일
        next.setHours(9, 0, 0, 0);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1, 1); // 다음 달 1일
        next.setHours(9, 0, 0, 0);
        break;
    }
    return next;
  }

  advanceSchedule(): ReportSchedule {
    return new ReportSchedule(
      this._id, this._userId, this._frequency, this._recipients,
      ReportSchedule.calculateNextSendAt(this._frequency, this._nextSendAt),
      this._isActive, this._createdAt, new Date(),
    );
  }

  deactivate(): ReportSchedule {
    return new ReportSchedule(
      this._id, this._userId, this._frequency, this._recipients,
      this._nextSendAt, false, this._createdAt, new Date(),
    );
  }

  get id() { return this._id; }
  get userId() { return this._userId; }
  get frequency() { return this._frequency; }
  get recipients() { return [...this._recipients]; }
  get nextSendAt() { return this._nextSendAt; }
  get isActive() { return this._isActive; }
}
```

- [x] **Step 4: 테스트 작성**

```typescript
describe('ReportSchedule', () => {
  it('should create a weekly schedule with next Monday 9AM', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T10:00:00+09:00')); // 수요일

    const schedule = ReportSchedule.create({
      userId: 'user-123',
      frequency: 'WEEKLY',
      recipients: ['boss@company.com'],
    });

    expect(schedule.frequency).toBe('WEEKLY');
    expect(schedule.recipients).toEqual(['boss@company.com']);
    expect(schedule.nextSendAt.getHours()).toBe(9);
    expect(schedule.isActive).toBe(true);

    vi.useRealTimers();
  });

  it('should reject empty recipients', () => {
    expect(() => ReportSchedule.create({
      userId: 'user-123', frequency: 'WEEKLY', recipients: [],
    })).toThrow('최소 1개의 수신자');
  });

  it('should advance schedule after sending', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T09:00:00+09:00')); // 월요일

    const schedule = ReportSchedule.create({
      userId: 'user-123', frequency: 'WEEKLY', recipients: ['a@b.com'],
    });
    const advanced = schedule.advanceSchedule();
    expect(advanced.nextSendAt.getTime()).toBeGreaterThan(schedule.nextSendAt.getTime());

    vi.useRealTimers();
  });
});
```

- [x] **Step 5: 테스트 통과 확인 후 Commit**

```bash
git commit -m "feat(report): add ReportSchedule entity with frequency calculation"
```

---

### Task 2: Report 엔티티에 공유 토큰 기능 추가

**Files:**
- Modify: `src/domain/entities/Report.ts`
- Test: `tests/unit/domain/entities/Report.test.ts`

- [x] **Step 1: Report에 공유 메서드 추가**

```typescript
// src/domain/entities/Report.ts에 추가

generateShareToken(expiryDays: number = 30): Report {
  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // 새 인스턴스 반환 (immutable)
  return Report.restore({
    ...this.toJSON(),
    shareToken: token,
    shareExpiresAt: expiresAt,
  });
}

revokeShareToken(): Report {
  return Report.restore({
    ...this.toJSON(),
    shareToken: null,
    shareExpiresAt: null,
  });
}

isShareValid(): boolean {
  if (!this._shareToken || !this._shareExpiresAt) return false;
  return new Date() < this._shareExpiresAt;
}

get shareToken(): string | null { return this._shareToken ?? null; }
get shareExpiresAt(): Date | null { return this._shareExpiresAt ?? null; }
```

- [x] **Step 2: 테스트 작성 및 통과**

```typescript
it('should generate a share token with 30-day expiry', () => {
  const report = createTestReport();
  const shared = report.generateShareToken();

  expect(shared.shareToken).toHaveLength(32);
  expect(shared.isShareValid()).toBe(true);
});

it('should revoke share token', () => {
  const report = createTestReport();
  const shared = report.generateShareToken();
  const revoked = shared.revokeShareToken();

  expect(revoked.shareToken).toBeNull();
  expect(revoked.isShareValid()).toBe(false);
});
```

- [x] **Step 3: Commit**

```bash
git commit -m "feat(report): add share token generation and revocation"
```

---

### Task 3: 이메일 발송 서비스 구현

**Files:**
- Create: `src/infrastructure/email/ResendEmailService.ts`
- Modify: `src/application/ports/IEmailService.ts` (포트 정의/수정)

- [x] **Step 1: IEmailService 포트 확인/수정**

```typescript
// src/application/ports/IEmailService.ts
export interface IEmailService {
  sendReportEmail(params: {
    to: string[];
    subject: string;
    reportId: string;
    reportSummary: ReportSummary;
    shareUrl?: string;
  }): Promise<{ success: boolean; messageId?: string }>;
}
```

- [x] **Step 2: Resend 어댑터 구현**

```typescript
// src/infrastructure/email/ResendEmailService.ts
import { Resend } from 'resend';
import type { IEmailService } from '@/application/ports/IEmailService';

export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendReportEmail(params: {
    to: string[];
    subject: string;
    reportId: string;
    reportSummary: ReportSummary;
    shareUrl?: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    const { data, error } = await this.resend.emails.send({
      from: '바투 AI <reports@batwo.ai>',
      to: params.to,
      subject: params.subject,
      html: this.buildReportEmailHtml(params.reportSummary, params.shareUrl),
    });

    if (error) {
      return { success: false };
    }

    return { success: true, messageId: data?.id };
  }

  private buildReportEmailHtml(summary: ReportSummary, shareUrl?: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1f2937;">바투 AI 광고 성과 보고서</h1>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <p><strong>총 지출:</strong> ${summary.totalSpend.toLocaleString()}원</p>
          <p><strong>총 매출:</strong> ${summary.totalRevenue.toLocaleString()}원</p>
          <p><strong>ROAS:</strong> ${summary.averageRoas.toFixed(2)}x</p>
          <p><strong>전환수:</strong> ${summary.totalConversions.toLocaleString()}</p>
        </div>
        ${shareUrl ? `<a href="${shareUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">상세 보고서 보기</a>` : ''}
      </div>
    `;
  }
}
```

- [x] **Step 3: DI 바인딩 업데이트**

- [x] **Step 4: Commit**

```bash
git commit -m "feat(email): add ResendEmailService for report delivery"
```

---

### Task 4: 보고서 자동 발송 Cron Job

**Files:**
- Create: `src/application/use-cases/report/SendScheduledReportsUseCase.ts`
- Create: `src/app/api/cron/send-scheduled-reports/route.ts`

- [x] **Step 1: SendScheduledReportsUseCase 구현**

```typescript
export class SendScheduledReportsUseCase {
  constructor(
    private readonly scheduleRepository: IReportScheduleRepository,
    private readonly reportRepository: IReportRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(): Promise<{ sentCount: number; failedCount: number }> {
    const now = new Date();
    const dueSchedules = await this.scheduleRepository.findDue(now);

    let sentCount = 0;
    let failedCount = 0;

    for (const schedule of dueSchedules) {
      try {
        // 최신 보고서 조회
        const latestReport = await this.reportRepository.findLatestByUserId(
          schedule.userId, schedule.frequency
        );

        if (!latestReport) continue;

        // 공유 토큰 생성
        const sharedReport = latestReport.generateShareToken(7);
        await this.reportRepository.update(sharedReport);

        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reports/share/${sharedReport.shareToken}`;

        // 이메일 발송
        const result = await this.emailService.sendReportEmail({
          to: schedule.recipients,
          subject: `[바투 AI] ${this.getSubjectByFrequency(schedule.frequency)} 광고 성과 보고서`,
          reportId: latestReport.id,
          reportSummary: latestReport.getSummaryMetrics(),
          shareUrl,
        });

        if (result.success) {
          sentCount++;
          const advanced = schedule.advanceSchedule();
          await this.scheduleRepository.update(advanced);
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    return { sentCount, failedCount };
  }
}
```

- [x] **Step 2: Cron 라우트 구현**

```typescript
// src/app/api/cron/send-scheduled-reports/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const container = getContainer();
  const useCase = container.get(DI_TOKENS.SendScheduledReportsUseCase);
  const result = await useCase.execute();

  return NextResponse.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
```

- [x] **Step 3: vercel.json cron 추가**

```json
{ "path": "/api/cron/send-scheduled-reports", "schedule": "0 0 * * *" }
```

- [x] **Step 4: Commit**

```bash
git commit -m "feat(report): add scheduled report sending cron job"
```

---

### Task 5: 공유 보고서 퍼블릭 API

**Files:**
- Create: `src/app/api/reports/share/[token]/route.ts`

- [x] **Step 1: 퍼블릭 공유 라우트 (인증 불필요)**

```typescript
// src/app/api/reports/share/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/di';
import { DI_TOKENS } from '@/lib/di/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const container = getContainer();
  const reportRepository = container.get(DI_TOKENS.ReportRepository);

  const report = await reportRepository.findByShareToken(token);
  if (!report || !report.isShareValid()) {
    return NextResponse.json({ error: '보고서를 찾을 수 없거나 만료되었습니다' }, { status: 404 });
  }

  // 민감 정보 제외한 보고서 데이터 반환
  return NextResponse.json({
    success: true,
    data: {
      type: report.type,
      dateRange: report.dateRange,
      sections: report.sections,
      summary: report.getSummaryMetrics(),
      aiInsights: report.aiInsights,
      generatedAt: report.generatedAt,
    },
  });
}
```

- [x] **Step 2: Commit**

```bash
git commit -m "feat(api): add public report share endpoint"
```

---

### Task 6: 보고서 스케줄 설정 API

**Files:**
- Create: `src/app/api/reports/schedule/route.ts`

- [x] **Step 1: CRUD API 구현**

```typescript
// GET: 사용자의 보고서 스케줄 조회
// POST: 새 스케줄 생성
// PUT: 스케줄 수정
// DELETE: 스케줄 비활성화
```

- [x] **Step 2: Commit**

```bash
git commit -m "feat(api): add report schedule CRUD endpoints"
```

---

### Task 7: 보고서 공유/스케줄 UI

**Files:**
- Create: `src/presentation/components/report/ShareReportButton.tsx`
- Create: `src/presentation/components/report/ReportScheduleForm.tsx`

- [x] **Step 1: ShareReportButton 구현**

```tsx
'use client';

import { memo, useState } from 'react';

export const ShareReportButton = memo(function ShareReportButton({ reportId }: { reportId: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const handleShare = async () => {
    const res = await fetch(`/api/reports/${reportId}/share`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setShareUrl(data.shareUrl);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      {!shareUrl ? (
        <button onClick={handleShare} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
          공유 링크 생성
        </button>
      ) : (
        <>
          <input readOnly value={shareUrl} className="text-sm bg-gray-50 border rounded px-2 py-1 w-64" />
          <button onClick={handleCopy} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg">
            {copying ? '복사됨!' : '복사'}
          </button>
        </>
      )}
    </div>
  );
});
```

- [x] **Step 2: ReportScheduleForm 구현**

빈도 선택(일간/주간/월간), 수신자 이메일 입력, 활성/비활성 토글.

- [x] **Step 3: 보고서 리스트에 공유/스케줄 버튼 통합**

- [x] **Step 4: Commit**

```bash
git commit -m "feat(ui): add report sharing and schedule management UI"
```

---

### Task 8: Feature 4 통합 테스트

- [x] **Step 1: 전체 플로우 확인**

1. 보고서 스케줄 생성 (주간, boss@company.com)
2. Cron 실행 시 이메일 발송
3. 공유 링크 생성 및 접근
4. 스케줄 비활성화

- [x] **Step 2: 전체 테스트 통과 확인**

Run: `npx tsc --noEmit && npx vitest run`

- [x] **Step 3: Commit**

```bash
git commit -m "feat: complete report auto-send and sharing feature"
```

---

## Feature 5: 전환 퍼널 시각화

### Task 1: ConversionFunnelService 구현

**Files:**
- Create: `src/application/services/ConversionFunnelService.ts`
- Create: `src/domain/value-objects/FunnelStage.ts`
- Test: `tests/unit/application/services/ConversionFunnelService.test.ts`

- [x] **Step 1: FunnelStage 밸류 오브젝트**

```typescript
// src/domain/value-objects/FunnelStage.ts
export const FUNNEL_STAGES = [
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
] as const;

export type FunnelStageName = typeof FUNNEL_STAGES[number];

export interface FunnelStageData {
  stage: FunnelStageName;
  count: number;
  value: number;          // 금액 합계
  conversionRate: number; // 이전 단계 대비 전환율 (첫 단계는 100%)
  dropOffRate: number;    // 이탈률 (100 - conversionRate)
}

export interface FunnelData {
  pixelId: string;
  period: string;
  stages: FunnelStageData[];
  overallConversionRate: number; // PageView → Purchase
  totalValue: number;
}
```

- [x] **Step 2: ConversionFunnelService 테스트**

```typescript
describe('ConversionFunnelService', () => {
  it('should calculate funnel stages with conversion rates', async () => {
    conversionEventRepository.setMockCounts({
      'PageView': 10000,
      'ViewContent': 3000,
      'AddToCart': 1000,
      'InitiateCheckout': 500,
      'Purchase': 200,
    });

    const funnel = await service.getFunnel('pixel-1', '30d');

    expect(funnel.stages).toHaveLength(5);
    expect(funnel.stages[0].conversionRate).toBe(100);
    expect(funnel.stages[1].conversionRate).toBe(30); // 3000/10000
    expect(funnel.stages[4].conversionRate).toBe(40); // 200/500
    expect(funnel.overallConversionRate).toBe(2);     // 200/10000
  });

  it('should handle zero events gracefully', async () => {
    conversionEventRepository.setMockCounts({});

    const funnel = await service.getFunnel('pixel-1', '30d');
    expect(funnel.stages.every(s => s.count === 0)).toBe(true);
    expect(funnel.overallConversionRate).toBe(0);
  });
});
```

- [x] **Step 3: Service 구현**

```typescript
export class ConversionFunnelService {
  constructor(
    private readonly conversionEventRepository: IConversionEventRepository,
  ) {}

  async getFunnel(pixelId: string, period: string): Promise<FunnelData> {
    const startDate = this.periodToDate(period);

    const counts = await Promise.all(
      FUNNEL_STAGES.map(async (stage) => ({
        stage,
        ...(await this.conversionEventRepository.countByEventName(pixelId, stage, startDate)),
      }))
    );

    const stages: FunnelStageData[] = counts.map((c, i) => {
      const prevCount = i === 0 ? c.count : counts[i - 1].count;
      const conversionRate = prevCount > 0 ? (c.count / prevCount) * 100 : 0;
      return {
        stage: c.stage,
        count: c.count,
        value: c.value,
        conversionRate: Math.round(conversionRate * 10) / 10,
        dropOffRate: Math.round((100 - conversionRate) * 10) / 10,
      };
    });

    const firstCount = stages[0]?.count || 0;
    const lastCount = stages[stages.length - 1]?.count || 0;

    return {
      pixelId,
      period,
      stages,
      overallConversionRate: firstCount > 0 ? Math.round((lastCount / firstCount) * 1000) / 10 : 0,
      totalValue: stages.reduce((sum, s) => sum + s.value, 0),
    };
  }

  private periodToDate(period: string): Date {
    const now = new Date();
    const days = parseInt(period) || 30;
    now.setDate(now.getDate() - days);
    return now;
  }
}
```

- [x] **Step 4: 테스트 통과 확인 후 Commit**

```bash
git commit -m "feat(analytics): add ConversionFunnelService with stage calculations"
```

---

### Task 2: 퍼널 API 라우트

**Files:**
- Create: `src/app/api/analytics/funnel/route.ts`

- [x] **Step 1: API 구현**

```typescript
// GET /api/analytics/funnel?pixelId=xxx&period=30d
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pixelId = searchParams.get('pixelId');
  const period = searchParams.get('period') || '30d';

  if (!pixelId) {
    return NextResponse.json({ error: 'pixelId is required' }, { status: 400 });
  }

  const container = getContainer();
  const funnelService = container.get(DI_TOKENS.ConversionFunnelService);
  const funnel = await funnelService.getFunnel(pixelId, period);

  return NextResponse.json({ success: true, data: funnel });
}
```

- [x] **Step 2: Commit**

```bash
git commit -m "feat(api): add GET /api/analytics/funnel endpoint"
```

---

### Task 3: FunnelChart UI 컴포넌트

**Files:**
- Create: `src/presentation/components/analytics/FunnelChart.tsx`
- Create: `src/presentation/hooks/useConversionFunnel.ts`

- [x] **Step 1: useConversionFunnel 훅**

```typescript
export function useConversionFunnel(pixelId: string | null, period: string = '30d') {
  return useQuery<FunnelData>({
    queryKey: ['conversion-funnel', pixelId, period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/funnel?pixelId=${pixelId}&period=${period}`);
      if (!res.ok) throw new Error('퍼널 데이터 로드 실패');
      const json = await res.json();
      return json.data;
    },
    enabled: !!pixelId,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [x] **Step 2: FunnelChart 컴포넌트**

```tsx
'use client';

import { memo } from 'react';
import type { FunnelData, FunnelStageData } from '@/domain/value-objects/FunnelStage';

const STAGE_LABELS: Record<string, string> = {
  PageView: '페이지 조회',
  ViewContent: '콘텐츠 조회',
  AddToCart: '장바구니 추가',
  InitiateCheckout: '결제 시작',
  Purchase: '구매 완료',
};

const STAGE_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#22C55E'];

export const FunnelChart = memo(function FunnelChart({ data }: { data: FunnelData }) {
  const maxCount = Math.max(...data.stages.map(s => s.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">전환 퍼널</h3>
        <span className="text-sm text-gray-500">
          전체 전환율: <strong>{data.overallConversionRate}%</strong>
        </span>
      </div>

      <div className="space-y-3">
        {data.stages.map((stage, i) => (
          <FunnelStageBar
            key={stage.stage}
            stage={stage}
            label={STAGE_LABELS[stage.stage] || stage.stage}
            color={STAGE_COLORS[i]}
            widthPercent={(stage.count / maxCount) * 100}
            isFirst={i === 0}
          />
        ))}
      </div>
    </div>
  );
});

function FunnelStageBar({ stage, label, color, widthPercent, isFirst }: {
  stage: FunnelStageData;
  label: string;
  color: string;
  widthPercent: number;
  isFirst: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 text-sm text-gray-600 text-right">{label}</div>
      <div className="flex-1">
        <div
          className="h-10 rounded-md flex items-center px-3 text-white text-sm font-medium transition-all"
          style={{ width: `${Math.max(widthPercent, 5)}%`, backgroundColor: color }}
        >
          {stage.count.toLocaleString()}
        </div>
      </div>
      <div className="w-20 text-right">
        {!isFirst && (
          <span className={`text-sm font-medium ${stage.dropOffRate > 70 ? 'text-red-600' : 'text-gray-500'}`}>
            {stage.conversionRate}%
          </span>
        )}
      </div>
    </div>
  );
}
```

- [x] **Step 3: 대시보드에 FunnelChart 위젯 추가**

- [x] **Step 4: Commit**

```bash
git commit -m "feat(ui): add conversion funnel chart component"
```

---

### Task 4: 리포지토리 countByEventName 메서드 추가

**Files:**
- Modify: `src/domain/repositories/IConversionEventRepository.ts`
- Modify: `src/infrastructure/database/repositories/PrismaConversionEventRepository.ts`

- [x] **Step 1: 인터페이스에 메서드 추가**

```typescript
countByEventName(pixelId: string, eventName: string, since: Date): Promise<{ count: number; value: number }>;
```

- [x] **Step 2: Prisma 구현**

```typescript
async countByEventName(pixelId: string, eventName: string, since: Date) {
  const result = await this.prisma.conversionEvent.aggregate({
    where: { pixelId, eventName, eventTime: { gte: since } },
    _count: true,
    _sum: { value: true },
  });
  return { count: result._count, value: result._sum.value ?? 0 };
}
```

- [x] **Step 3: Commit**

```bash
git commit -m "feat(repo): add countByEventName to ConversionEventRepository"
```

---

### Task 5: Feature 5 통합 확인

- [x] **Step 1: 전체 테스트**

Run: `npx tsc --noEmit && npx vitest run`

- [x] **Step 2: Commit**

```bash
git commit -m "feat: complete conversion funnel visualization"
```

---

## Feature 6: 캠페인 벌크 작업

### Task 1: BulkUpdateCampaignsUseCase 구현

**Files:**
- Create: `src/application/use-cases/campaign/BulkUpdateCampaignsUseCase.ts`
- Test: `tests/unit/application/campaign/BulkUpdateCampaignsUseCase.test.ts`

- [x] **Step 1: 테스트 작성**

```typescript
describe('BulkUpdateCampaignsUseCase', () => {
  it('should pause multiple campaigns', async () => {
    campaignRepository.setExisting([
      { id: 'c1', userId: 'user-123', status: CampaignStatus.ACTIVE },
      { id: 'c2', userId: 'user-123', status: CampaignStatus.ACTIVE },
    ]);

    const result = await useCase.execute({
      userId: 'user-123',
      campaignIds: ['c1', 'c2'],
      action: { type: 'status_change', status: CampaignStatus.PAUSED },
    });

    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(0);
  });

  it('should handle partial failures gracefully', async () => {
    campaignRepository.setExisting([
      { id: 'c1', userId: 'user-123', status: CampaignStatus.ACTIVE },
      { id: 'c2', userId: 'user-other', status: CampaignStatus.ACTIVE }, // 다른 사용자
    ]);

    const result = await useCase.execute({
      userId: 'user-123',
      campaignIds: ['c1', 'c2'],
      action: { type: 'status_change', status: CampaignStatus.PAUSED },
    });

    expect(result.successCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.failures[0].campaignId).toBe('c2');
  });

  it('should reject more than 50 campaigns', async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `c${i}`);
    await expect(useCase.execute({
      userId: 'user-123', campaignIds: ids,
      action: { type: 'status_change', status: CampaignStatus.PAUSED },
    })).rejects.toThrow('최대 50개');
  });

  it('should change budget by percentage', async () => {
    campaignRepository.setExisting([
      { id: 'c1', userId: 'user-123', dailyBudget: Money.create(100000, 'KRW') },
    ]);

    const result = await useCase.execute({
      userId: 'user-123',
      campaignIds: ['c1'],
      action: { type: 'budget_change', mode: 'percentage', value: 20 }, // +20%
    });

    expect(result.successCount).toBe(1);
    const updated = await campaignRepository.findById('c1');
    expect(updated?.dailyBudget.amount).toBe(120000);
  });
});
```

- [x] **Step 2: UseCase 구현**

```typescript
export type BulkAction =
  | { type: 'status_change'; status: CampaignStatus }
  | { type: 'budget_change'; mode: 'absolute' | 'percentage'; value: number }
  | { type: 'delete' };

interface BulkUpdateDTO {
  userId: string;
  campaignIds: string[];
  action: BulkAction;
}

interface BulkUpdateResult {
  successCount: number;
  failedCount: number;
  failures: { campaignId: string; reason: string }[];
}

export class BulkUpdateCampaignsUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService,
  ) {}

  async execute(dto: BulkUpdateDTO): Promise<BulkUpdateResult> {
    if (dto.campaignIds.length > 50) {
      throw new Error('최대 50개의 캠페인만 동시 수정 가능합니다');
    }

    const results: BulkUpdateResult = { successCount: 0, failedCount: 0, failures: [] };

    for (const campaignId of dto.campaignIds) {
      try {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign || campaign.userId !== dto.userId) {
          throw new Error('캠페인을 찾을 수 없습니다');
        }

        let updated: Campaign;
        switch (dto.action.type) {
          case 'status_change':
            updated = campaign.changeStatus(dto.action.status);
            break;
          case 'budget_change':
            const newAmount = dto.action.mode === 'percentage'
              ? Math.round(campaign.dailyBudget.amount * (1 + dto.action.value / 100))
              : dto.action.value;
            updated = campaign.updateBudget(Money.create(newAmount, campaign.dailyBudget.currency));
            break;
          case 'delete':
            await this.campaignRepository.delete(campaignId);
            results.successCount++;
            continue;
        }

        await this.campaignRepository.update(updated);
        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.failures.push({
          campaignId,
          reason: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    return results;
  }
}
```

- [x] **Step 3: 테스트 통과 확인 후 Commit**

```bash
git commit -m "feat(campaign): add BulkUpdateCampaignsUseCase"
```

---

### Task 2: 벌크 작업 API 라우트

**Files:**
- Create: `src/app/api/campaigns/bulk-action/route.ts`

- [x] **Step 1: API 구현**

```typescript
// POST /api/campaigns/bulk-action
const bulkActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('status_change'), status: z.enum(['ACTIVE', 'PAUSED']) }),
  z.object({ type: z.literal('budget_change'), mode: z.enum(['absolute', 'percentage']), value: z.number() }),
  z.object({ type: z.literal('delete') }),
]);

const requestSchema = z.object({
  campaignIds: z.array(z.string()).min(1).max(50),
  action: bulkActionSchema,
});
```

- [x] **Step 2: Commit**

```bash
git commit -m "feat(api): add POST /api/campaigns/bulk-action endpoint"
```

---

### Task 3: BulkActionBar UI 컴포넌트

**Files:**
- Create: `src/presentation/components/campaign/BulkActionBar.tsx`
- Modify: `src/presentation/components/campaign/CampaignTable.tsx` (통합)

- [x] **Step 1: BulkActionBar 구현**

```tsx
'use client';

import { memo, useState } from 'react';
import { useCampaignStore } from '@/presentation/stores/useCampaignStore';

export const BulkActionBar = memo(function BulkActionBar() {
  const { selectedCampaignIds, clearSelection } = useCampaignStore();
  const [loading, setLoading] = useState(false);

  if (selectedCampaignIds.length === 0) return null;

  const executeBulkAction = async (action: BulkAction) => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignIds: selectedCampaignIds, action }),
      });
      const data = await res.json();
      if (data.failedCount > 0) {
        alert(`${data.successCount}개 성공, ${data.failedCount}개 실패`);
      }
      clearSelection();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl border rounded-xl px-6 py-3 flex items-center gap-4 z-50">
      <span className="text-sm font-medium text-gray-700">
        {selectedCampaignIds.length}개 선택됨
      </span>
      <div className="h-6 w-px bg-gray-200" />
      <button onClick={() => executeBulkAction({ type: 'status_change', status: 'PAUSED' })}
        disabled={loading} className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200">
        일시정지
      </button>
      <button onClick={() => executeBulkAction({ type: 'status_change', status: 'ACTIVE' })}
        disabled={loading} className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200">
        활성화
      </button>
      <button onClick={() => setShowBudgetModal(true)}
        disabled={loading} className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200">
        예산 변경
      </button>
      <button onClick={() => executeBulkAction({ type: 'delete' })}
        disabled={loading} className="px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200">
        삭제
      </button>
      <button onClick={clearSelection} className="text-sm text-gray-500 hover:text-gray-700">
        선택 해제
      </button>
    </div>
  );
});
```

- [x] **Step 2: CampaignTable에 BulkActionBar 통합**

- [x] **Step 3: Commit**

```bash
git commit -m "feat(ui): add BulkActionBar for multi-campaign operations"
```

---

### Task 4: 벌크 예산 변경 모달

**Files:**
- Create: `src/presentation/components/campaign/BulkBudgetModal.tsx`

- [x] **Step 1: 예산 변경 모달 (절대값/퍼센트 선택)**

- [x] **Step 2: Commit**

```bash
git commit -m "feat(ui): add bulk budget change modal"
```

---

### Task 5: Feature 6 통합 확인

- [x] **Step 1: 전체 테스트**

Run: `npx tsc --noEmit && npx vitest run`

- [x] **Step 2: Commit**

```bash
git commit -m "feat: complete campaign bulk operations"
```

---

## Feature 7: 캠페인 성과 벤치마크

### Task 1: PerformanceBenchmarkService 구현

**Files:**
- Create: `src/domain/value-objects/IndustryBenchmark.ts`
- Create: `src/application/services/PerformanceBenchmarkService.ts`
- Test: `tests/unit/application/services/PerformanceBenchmarkService.test.ts`

- [x] **Step 1: IndustryBenchmark 밸류 오브젝트**

```typescript
// src/domain/value-objects/IndustryBenchmark.ts
export type BenchmarkMetric = 'roas' | 'ctr' | 'cpa' | 'cvr' | 'cpc' | 'cpm';

export type PercentileGrade = 'top10' | 'top25' | 'above_average' | 'average' | 'below_average' | 'bottom25';

export interface MetricBenchmark {
  metric: BenchmarkMetric;
  userValue: number;
  industryAverage: number;
  percentile: number;       // 0-100 (상위 몇 %인지)
  grade: PercentileGrade;
  gap: number;              // userValue - industryAverage
  recommendation: string;
}

export interface IndustryBenchmarkData {
  industry: string;
  metrics: MetricBenchmark[];
  overallPercentile: number;
  overallGrade: PercentileGrade;
  sampleSize: number;       // 비교 대상 수
  periodDays: number;
}

export function calculatePercentileGrade(percentile: number): PercentileGrade {
  if (percentile >= 90) return 'top10';
  if (percentile >= 75) return 'top25';
  if (percentile >= 50) return 'above_average';
  if (percentile >= 40) return 'average';
  if (percentile >= 25) return 'below_average';
  return 'bottom25';
}
```

- [x] **Step 2: PerformanceBenchmarkService 테스트**

```typescript
describe('PerformanceBenchmarkService', () => {
  it('should calculate percentile position for user metrics', async () => {
    kpiRepository.setIndustryPercentiles('ECOMMERCE', {
      roas: { p25: 1.5, p50: 2.5, p75: 4.0, p90: 6.0 },
      ctr: { p25: 0.5, p50: 1.2, p75: 2.0, p90: 3.0 },
    });

    const result = await service.getBenchmark('user-123', 'ECOMMERCE', 30);

    const roasMetric = result.metrics.find(m => m.metric === 'roas')!;
    expect(roasMetric.percentile).toBeGreaterThanOrEqual(0);
    expect(roasMetric.percentile).toBeLessThanOrEqual(100);
    expect(roasMetric.grade).toBeDefined();
    expect(roasMetric.recommendation).toBeTruthy();
  });

  it('should handle CPA inversely (lower is better)', async () => {
    // CPA가 낮을수록 좋으므로 percentile 계산이 역순이어야 함
    kpiRepository.setIndustryPercentiles('ECOMMERCE', {
      cpa: { p25: 20000, p50: 15000, p75: 10000, p90: 5000 },
    });
    kpiRepository.setUserMetrics('user-123', { cpa: 8000 });

    const result = await service.getBenchmark('user-123', 'ECOMMERCE', 30);
    const cpaMetric = result.metrics.find(m => m.metric === 'cpa')!;
    expect(cpaMetric.percentile).toBeGreaterThan(75); // 8000 < 10000 (p75) → 상위
  });
});
```

- [x] **Step 3: Service 구현**

```typescript
export class PerformanceBenchmarkService {
  private readonly INVERSE_METRICS: BenchmarkMetric[] = ['cpa', 'cpc', 'cpm'];

  constructor(
    private readonly kpiRepository: IKPIRepository,
    private readonly campaignRepository: ICampaignRepository,
  ) {}

  async getBenchmark(userId: string, industry: string, periodDays: number): Promise<IndustryBenchmarkData> {
    const userMetrics = await this.getUserAverageMetrics(userId, periodDays);
    const percentiles = await this.kpiRepository.getIndustryPercentiles(industry, periodDays);

    const metrics: MetricBenchmark[] = Object.entries(userMetrics).map(([metric, value]) => {
      const p = percentiles[metric as BenchmarkMetric];
      if (!p) return null;

      const isInverse = this.INVERSE_METRICS.includes(metric as BenchmarkMetric);
      const percentile = this.interpolatePercentile(value, p, isInverse);
      const grade = calculatePercentileGrade(percentile);

      return {
        metric: metric as BenchmarkMetric,
        userValue: value,
        industryAverage: p.p50,
        percentile,
        grade,
        gap: value - p.p50,
        recommendation: this.generateRecommendation(metric as BenchmarkMetric, grade, value, p.p50),
      };
    }).filter(Boolean) as MetricBenchmark[];

    const overallPercentile = Math.round(
      metrics.reduce((sum, m) => sum + m.percentile, 0) / metrics.length
    );

    return {
      industry,
      metrics,
      overallPercentile,
      overallGrade: calculatePercentileGrade(overallPercentile),
      sampleSize: percentiles._sampleSize ?? 0,
      periodDays,
    };
  }

  private interpolatePercentile(
    value: number,
    p: { p25: number; p50: number; p75: number; p90: number },
    isInverse: boolean,
  ): number {
    const v = isInverse ? -value : value;
    const thresholds = isInverse
      ? { p25: -p.p25, p50: -p.p50, p75: -p.p75, p90: -p.p90 }
      : p;

    if (v >= thresholds.p90) return 95;
    if (v >= thresholds.p75) return 75 + 15 * (v - thresholds.p75) / (thresholds.p90 - thresholds.p75);
    if (v >= thresholds.p50) return 50 + 25 * (v - thresholds.p50) / (thresholds.p75 - thresholds.p50);
    if (v >= thresholds.p25) return 25 + 25 * (v - thresholds.p25) / (thresholds.p50 - thresholds.p25);
    return Math.max(5, 25 * v / thresholds.p25);
  }
}
```

- [x] **Step 4: 테스트 통과 확인 후 Commit**

```bash
git commit -m "feat(analytics): add PerformanceBenchmarkService with percentile calculation"
```

---

### Task 2: 벤치마크 API 라우트

**Files:**
- Create: `src/app/api/analytics/benchmark/route.ts`

- [x] **Step 1: API 구현**

```typescript
// GET /api/analytics/benchmark?industry=ECOMMERCE&period=30
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get('industry') || 'GENERAL';
  const period = parseInt(searchParams.get('period') || '30');

  const container = getContainer();
  const benchmarkService = container.get(DI_TOKENS.PerformanceBenchmarkService);
  const data = await benchmarkService.getBenchmark(user.id, industry, period);

  return NextResponse.json({ success: true, data });
}
```

- [x] **Step 2: Commit**

```bash
git commit -m "feat(api): add GET /api/analytics/benchmark endpoint"
```

---

### Task 3: BenchmarkCard UI 컴포넌트

**Files:**
- Create: `src/presentation/components/analytics/BenchmarkCard.tsx`
- Create: `src/presentation/hooks/useBenchmark.ts`

- [x] **Step 1: useBenchmark 훅**

```typescript
export function useBenchmark(industry: string, period: number = 30) {
  return useQuery<IndustryBenchmarkData>({
    queryKey: ['benchmark', industry, period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/benchmark?industry=${industry}&period=${period}`);
      if (!res.ok) throw new Error('벤치마크 로드 실패');
      const json = await res.json();
      return json.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}
```

- [x] **Step 2: BenchmarkCard 컴포넌트**

```tsx
'use client';

import { memo } from 'react';
import type { IndustryBenchmarkData, MetricBenchmark } from '@/domain/value-objects/IndustryBenchmark';

const GRADE_CONFIG = {
  top10: { label: '상위 10%', color: 'text-green-700 bg-green-100' },
  top25: { label: '상위 25%', color: 'text-blue-700 bg-blue-100' },
  above_average: { label: '평균 이상', color: 'text-blue-600 bg-blue-50' },
  average: { label: '평균', color: 'text-gray-600 bg-gray-100' },
  below_average: { label: '평균 이하', color: 'text-orange-600 bg-orange-100' },
  bottom25: { label: '하위 25%', color: 'text-red-600 bg-red-100' },
};

const METRIC_LABELS: Record<string, string> = {
  roas: 'ROAS', ctr: 'CTR', cpa: 'CPA', cvr: '전환율', cpc: 'CPC', cpm: 'CPM',
};

export const BenchmarkCard = memo(function BenchmarkCard({ data }: { data: IndustryBenchmarkData }) {
  const grade = GRADE_CONFIG[data.overallGrade];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">업종 벤치마크</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${grade.color}`}>
          {grade.label}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {data.industry} 업종 {data.sampleSize}개 계정 대비 | 최근 {data.periodDays}일
      </p>

      <div className="space-y-4">
        {data.metrics.map((metric) => (
          <MetricRow key={metric.metric} metric={metric} />
        ))}
      </div>
    </div>
  );
});

function MetricRow({ metric }: { metric: MetricBenchmark }) {
  const grade = GRADE_CONFIG[metric.grade];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{METRIC_LABELS[metric.metric]}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${grade.color}`}>
          상위 {100 - Math.round(metric.percentile)}%
        </span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full">
        <div
          className="absolute h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${metric.percentile}%` }}
        />
        {/* 업종 평균 마커 */}
        <div className="absolute h-4 w-0.5 bg-gray-400 -top-1" style={{ left: '50%' }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>내 값: {formatMetricValue(metric.metric, metric.userValue)}</span>
        <span>평균: {formatMetricValue(metric.metric, metric.industryAverage)}</span>
      </div>
      {metric.recommendation && (
        <p className="text-xs text-gray-500 mt-1">{metric.recommendation}</p>
      )}
    </div>
  );
}
```

- [x] **Step 3: 대시보드 및 캠페인 상세에 BenchmarkCard 추가**

- [x] **Step 4: Commit**

```bash
git commit -m "feat(ui): add BenchmarkCard with percentile gauge"
```

---

### Task 4: KPI 리포지토리에 업종 percentile 쿼리 추가

**Files:**
- Modify: `src/domain/repositories/IKPIRepository.ts`
- Modify: `src/infrastructure/database/repositories/PrismaKPIRepository.ts`

- [x] **Step 1: 인터페이스에 메서드 추가**

```typescript
getIndustryPercentiles(industry: string, periodDays: number): Promise<IndustryPercentiles>;
```

- [x] **Step 2: Prisma raw query로 PostgreSQL PERCENTILE_CONT 활용**

```typescript
async getIndustryPercentiles(industry: string, periodDays: number) {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const result = await this.prisma.$queryRaw`
    SELECT
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY roas) as roas_p25,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY roas) as roas_p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY roas) as roas_p75,
      PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY roas) as roas_p90,
      -- ... 다른 메트릭들
      COUNT(DISTINCT k."userId") as sample_size
    FROM "KPISnapshot" k
    JOIN "Campaign" c ON k."campaignId" = c.id
    JOIN "User" u ON c."userId" = u.id
    WHERE u.industry = ${industry}
    AND k.date >= ${since}
  `;

  return this.mapToPercentiles(result);
}
```

- [x] **Step 3: Commit**

```bash
git commit -m "feat(repo): add industry percentile query with PERCENTILE_CONT"
```

---

### Task 5: Feature 7 통합 확인

- [x] **Step 1: 전체 테스트**

Run: `npx tsc --noEmit && npx vitest run`

- [x] **Step 2: Final Commit**

```bash
git commit -m "feat: complete Phase 2 - reports, funnel, bulk ops, benchmarks"
```
