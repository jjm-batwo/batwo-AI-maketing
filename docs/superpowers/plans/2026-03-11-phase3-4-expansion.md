# Phase 3-4: 확장 및 멀티채널 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플랫폼 확장 (커스텀 경험 → 외부 알림 → AI 소재 생성 → 멀티채널)

**Architecture:** 기존 클린 아키텍처 레이어를 따르며, 도메인 → 유스케이스 → API → UI 순서로 구현. 포트/어댑터 패턴으로 외부 서비스 연동.

**Tech Stack:** Next.js 15, TypeScript, Prisma, vitest, react-grid-layout, Slack API, Solapi (카카오 알림톡), DALL-E 3, Google Ads API

---

## Feature 8: 커스텀 대시보드

### Task 1: DashboardLayout Prisma 모델 + 도메인

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/domain/entities/DashboardLayout.ts`
- Create: `src/domain/value-objects/DashboardWidget.ts`
- Test: `tests/unit/domain/entities/DashboardLayout.test.ts`

- [ ] **Step 1: Prisma 스키마**

```prisma
model DashboardLayout {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  widgets   Json     // DashboardWidget[]
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

- [ ] **Step 2: DashboardWidget 밸류 오브젝트**

```typescript
// src/domain/value-objects/DashboardWidget.ts
export type WidgetType =
  | 'kpi_card'        // 단일 KPI 메트릭
  | 'kpi_chart'       // 시계열 차트
  | 'funnel'          // 전환 퍼널
  | 'benchmark'       // 벤치마크 카드
  | 'ai_insights'     // AI 인사이트
  | 'campaign_table'  // 캠페인 요약 테이블
  | 'donut_chart'     // 상태 분포
  | 'savings'         // 절감액
  | 'anomaly_alert';  // 이상 탐지

export interface WidgetPosition {
  x: number;  // grid column (0-based)
  y: number;  // grid row (0-based)
  w: number;  // width in grid units (1-12)
  h: number;  // height in grid units
}

export interface WidgetConfig {
  metric?: string;        // kpi_card: 'roas', 'ctr', etc.
  period?: string;        // '7d', '30d', '90d'
  campaignId?: string;    // 특정 캠페인 필터
  chartType?: string;     // 'line', 'area', 'bar'
  title?: string;         // 커스텀 타이틀
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  config: WidgetConfig;
}

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w1', type: 'kpi_card', position: { x: 0, y: 0, w: 3, h: 2 }, config: { metric: 'roas' } },
  { id: 'w2', type: 'kpi_card', position: { x: 3, y: 0, w: 3, h: 2 }, config: { metric: 'ctr' } },
  { id: 'w3', type: 'kpi_card', position: { x: 6, y: 0, w: 3, h: 2 }, config: { metric: 'cpa' } },
  { id: 'w4', type: 'kpi_card', position: { x: 9, y: 0, w: 3, h: 2 }, config: { metric: 'spend' } },
  { id: 'w5', type: 'kpi_chart', position: { x: 0, y: 2, w: 8, h: 4 }, config: { period: '30d' } },
  { id: 'w6', type: 'ai_insights', position: { x: 8, y: 2, w: 4, h: 4 }, config: {} },
  { id: 'w7', type: 'campaign_table', position: { x: 0, y: 6, w: 12, h: 4 }, config: {} },
];
```

- [ ] **Step 3: DashboardLayout 엔티티**

```typescript
export class DashboardLayout {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private _name: string,
    private _widgets: DashboardWidget[],
    private _isDefault: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: { userId: string; name: string; widgets?: DashboardWidget[] }): DashboardLayout {
    return new DashboardLayout(
      crypto.randomUUID(), props.userId, props.name,
      props.widgets ?? DEFAULT_WIDGETS, true, new Date(), new Date(),
    );
  }

  static restore(props: DashboardLayoutProps): DashboardLayout { /* ... */ }

  updateWidgets(widgets: DashboardWidget[]): DashboardLayout {
    if (widgets.length > 20) throw new Error('위젯은 최대 20개까지 추가 가능합니다');
    return new DashboardLayout(
      this._id, this._userId, this._name, widgets,
      this._isDefault, this._createdAt, new Date(),
    );
  }

  addWidget(widget: DashboardWidget): DashboardLayout {
    return this.updateWidgets([...this._widgets, widget]);
  }

  removeWidget(widgetId: string): DashboardLayout {
    return this.updateWidgets(this._widgets.filter(w => w.id !== widgetId));
  }

  rename(name: string): DashboardLayout { /* ... */ }

  get id() { return this._id; }
  get userId() { return this._userId; }
  get name() { return this._name; }
  get widgets() { return [...this._widgets]; }
  get isDefault() { return this._isDefault; }
}
```

- [ ] **Step 4: 테스트 작성 및 통과**

- [ ] **Step 5: 마이그레이션 + Commit**

```bash
git commit -m "feat(dashboard): add DashboardLayout entity with widget management"
```

---

### Task 2: 대시보드 레이아웃 API

**Files:**
- Create: `src/app/api/dashboard/layouts/route.ts`
- Create: `src/app/api/dashboard/layouts/[id]/route.ts`

- [ ] **Step 1: CRUD API 구현**

```typescript
// GET: 사용자 레이아웃 목록
// POST: 새 레이아웃 생성
// PUT [id]: 위젯 위치/설정 업데이트
// DELETE [id]: 레이아웃 삭제
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(api): add dashboard layout CRUD endpoints"
```

---

### Task 3: react-grid-layout 기반 드래그앤드롭 대시보드

**Files:**
- Create: `src/presentation/components/dashboard/CustomizableDashboard.tsx`
- Create: `src/presentation/components/dashboard/WidgetRenderer.tsx`
- Create: `src/presentation/hooks/useDashboardLayout.ts`

- [ ] **Step 1: 패키지 설치**

Run: `npm install react-grid-layout @types/react-grid-layout`

- [ ] **Step 2: useDashboardLayout 훅**

```typescript
export function useDashboardLayout() {
  const { data: layouts } = useQuery({
    queryKey: ['dashboard-layouts'],
    queryFn: () => fetch('/api/dashboard/layouts').then(r => r.json()),
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; widgets: DashboardWidget[] }) =>
      fetch(`/api/dashboard/layouts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: params.widgets }),
      }),
  });

  return { layouts, updateLayout: updateMutation.mutate };
}
```

- [ ] **Step 3: WidgetRenderer (위젯 타입별 렌더링)**

```tsx
export function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  switch (widget.type) {
    case 'kpi_card': return <KPICard metric={widget.config.metric!} />;
    case 'kpi_chart': return <KPIChart period={widget.config.period} />;
    case 'funnel': return <FunnelChart />;
    case 'benchmark': return <BenchmarkCard />;
    case 'ai_insights': return <AIInsights />;
    case 'campaign_table': return <CampaignSummaryTable />;
    case 'donut_chart': return <DonutChart />;
    case 'savings': return <SavingsWidget />;
    case 'anomaly_alert': return <AnomalyAlert />;
    default: return <div>알 수 없는 위젯</div>;
  }
}
```

- [ ] **Step 4: CustomizableDashboard 구현**

```tsx
'use client';

import { memo, useCallback, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { WidgetRenderer } from './WidgetRenderer';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const CustomizableDashboard = memo(function CustomizableDashboard({
  layout, onLayoutChange,
}: {
  layout: DashboardLayout;
  onLayoutChange: (widgets: DashboardWidget[]) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const gridLayout = layout.widgets.map(w => ({
    i: w.id,
    x: w.position.x,
    y: w.position.y,
    w: w.position.w,
    h: w.position.h,
  }));

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    if (!isEditing) return;
    const updatedWidgets = layout.widgets.map(widget => {
      const item = newLayout.find(l => l.i === widget.id);
      if (!item) return widget;
      return { ...widget, position: { x: item.x, y: item.y, w: item.w, h: item.h } };
    });
    onLayoutChange(updatedWidgets);
  }, [isEditing, layout.widgets, onLayoutChange]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isEditing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {isEditing ? '편집 완료' : '대시보드 편집'}
        </button>
      </div>

      <ResponsiveGridLayout
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={80}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
      >
        {layout.widgets.map(widget => (
          <div key={widget.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <WidgetRenderer widget={widget} />
            {isEditing && (
              <button
                onClick={() => onRemoveWidget(widget.id)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full text-xs"
              >
                x
              </button>
            )}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
});
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ui): add customizable dashboard with drag-and-drop widgets"
```

---

### Task 4: WidgetPicker 모달

**Files:**
- Create: `src/presentation/components/dashboard/WidgetPicker.tsx`

- [ ] **Step 1: 위젯 추가 모달**

사용 가능한 위젯 타입 목록 표시, 클릭 시 대시보드에 추가.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(ui): add WidgetPicker modal for dashboard customization"
```

---

### Task 5: 레이아웃 프리셋 관리

**Files:**
- Create: `src/presentation/components/dashboard/LayoutSelector.tsx`

- [ ] **Step 1: 레이아웃 저장/로드/전환 UI**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(ui): add dashboard layout preset management"
```

---

### Task 6: Feature 8 통합 확인

- [ ] **Step 1: 전체 테스트**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: complete customizable dashboard feature"
```

---

## Feature 9: 슬랙/카카오톡 알림 통합

### Task 1: NotificationChannel Prisma 모델 + 도메인

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/domain/entities/NotificationChannel.ts`
- Create: `src/domain/value-objects/NotificationPreference.ts`
- Test: `tests/unit/domain/entities/NotificationChannel.test.ts`

- [ ] **Step 1: Prisma 스키마**

```prisma
enum NotificationChannelType {
  SLACK
  KAKAO
  EMAIL
}

model NotificationChannel {
  id        String                  @id @default(cuid())
  userId    String
  user      User                    @relation(fields: [userId], references: [id])
  type      NotificationChannelType
  config    Json                    // { webhookUrl } | { phoneNumber } | { email }
  isActive  Boolean                 @default(true)
  createdAt DateTime                @default(now())
  updatedAt DateTime                @updatedAt

  @@unique([userId, type])
  @@index([userId])
}

model NotificationPreference {
  id           String                  @id @default(cuid())
  userId       String
  user         User                    @relation(fields: [userId], references: [id])
  alertType    String                  // 'anomaly' | 'budget' | 'milestone' | 'recommendation'
  channels     NotificationChannelType[]
  minSeverity  String                  @default("WARNING") // INFO | WARNING | CRITICAL
  isActive     Boolean                 @default(true)
  createdAt    DateTime                @default(now())
  updatedAt    DateTime                @updatedAt

  @@unique([userId, alertType])
}
```

- [ ] **Step 2: 도메인 엔티티**

```typescript
export class NotificationChannel {
  static create(props: {
    userId: string;
    type: 'SLACK' | 'KAKAO' | 'EMAIL';
    config: SlackConfig | KakaoConfig | EmailConfig;
  }): NotificationChannel { /* ... */ }

  static restore(props: NotificationChannelProps): NotificationChannel { /* ... */ }

  deactivate(): NotificationChannel { /* ... */ }
  updateConfig(config: unknown): NotificationChannel { /* ... */ }
}

interface SlackConfig { webhookUrl: string; channelName?: string; }
interface KakaoConfig { phoneNumber: string; }
interface EmailConfig { email: string; }
```

- [ ] **Step 3: 테스트 작성 및 통과**

- [ ] **Step 4: 마이그레이션 + Commit**

```bash
git commit -m "feat(notification): add NotificationChannel and Preference models"
```

---

### Task 2: NotificationDispatcher 서비스 (포트/어댑터)

**Files:**
- Create: `src/application/ports/INotificationSender.ts`
- Create: `src/infrastructure/notification/SlackNotificationSender.ts`
- Create: `src/infrastructure/notification/KakaoNotificationSender.ts`
- Create: `src/application/services/NotificationDispatcherService.ts`
- Test: `tests/unit/application/services/NotificationDispatcherService.test.ts`

- [ ] **Step 1: INotificationSender 포트**

```typescript
export interface INotificationSender {
  send(params: {
    config: unknown;
    title: string;
    message: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    actionUrl?: string;
  }): Promise<{ success: boolean; error?: string }>;
}
```

- [ ] **Step 2: Slack 어댑터**

```typescript
export class SlackNotificationSender implements INotificationSender {
  async send(params: {
    config: SlackConfig;
    title: string;
    message: string;
    severity: string;
    actionUrl?: string;
  }) {
    const emoji = params.severity === 'CRITICAL' ? ':rotating_light:'
      : params.severity === 'WARNING' ? ':warning:' : ':information_source:';

    const response = await fetch(params.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `${emoji} ${params.title}` },
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: params.message },
          },
          ...(params.actionUrl ? [{
            type: 'actions',
            elements: [{
              type: 'button',
              text: { type: 'plain_text', text: '바투에서 확인' },
              url: params.actionUrl,
            }],
          }] : []),
        ],
      }),
    });

    return { success: response.ok };
  }
}
```

- [ ] **Step 3: 카카오 알림톡 어댑터 (Solapi)**

```typescript
export class KakaoNotificationSender implements INotificationSender {
  async send(params: { config: KakaoConfig; title: string; message: string; }) {
    // Solapi 알림톡 API 호출
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SOLAPI_API_KEY}`,
      },
      body: JSON.stringify({
        message: {
          to: params.config.phoneNumber,
          from: process.env.SOLAPI_SENDER_NUMBER,
          kakaoOptions: {
            pfId: process.env.KAKAO_PF_ID,
            templateId: process.env.KAKAO_ALERT_TEMPLATE_ID,
            variables: { title: params.title, message: params.message },
          },
        },
      }),
    });

    return { success: response.ok };
  }
}
```

- [ ] **Step 4: NotificationDispatcherService**

```typescript
export class NotificationDispatcherService {
  private senders: Map<string, INotificationSender>;

  constructor(
    private readonly channelRepository: INotificationChannelRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
    slackSender: INotificationSender,
    kakaoSender: INotificationSender,
  ) {
    this.senders = new Map([
      ['SLACK', slackSender],
      ['KAKAO', kakaoSender],
    ]);
  }

  async dispatch(params: {
    userId: string;
    alertType: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
    actionUrl?: string;
  }): Promise<{ sent: number; failed: number }> {
    // 1. 사용자 선호도 조회
    const preference = await this.preferenceRepository.findByUserAndType(
      params.userId, params.alertType
    );
    if (!preference?.isActive) return { sent: 0, failed: 0 };

    // 2. 최소 심각도 필터
    if (!this.meetsMinSeverity(params.severity, preference.minSeverity)) {
      return { sent: 0, failed: 0 };
    }

    // 3. 설정된 채널로 발송
    let sent = 0, failed = 0;
    for (const channelType of preference.channels) {
      const channel = await this.channelRepository.findByUserAndType(
        params.userId, channelType
      );
      if (!channel?.isActive) continue;

      const sender = this.senders.get(channelType);
      if (!sender) continue;

      const result = await sender.send({
        config: channel.config,
        title: params.title,
        message: params.message,
        severity: params.severity,
        actionUrl: params.actionUrl,
      });

      result.success ? sent++ : failed++;
    }

    return { sent, failed };
  }
}
```

- [ ] **Step 5: 테스트 통과 확인 후 Commit**

```bash
git commit -m "feat(notification): add dispatcher with Slack and Kakao adapters"
```

---

### Task 3: 기존 Alert 생성 플로우에 알림 훅인

**Files:**
- Modify: `src/application/services/` (Alert 관련 서비스)

- [ ] **Step 1: Alert 생성 시 NotificationDispatcher 호출**

기존 Alert save 로직 이후에 `notificationDispatcher.dispatch()` 추가.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(notification): hook dispatcher into alert creation flow"
```

---

### Task 4: 알림 채널/선호도 API

**Files:**
- Create: `src/app/api/notifications/channels/route.ts`
- Create: `src/app/api/notifications/preferences/route.ts`

- [ ] **Step 1: 채널 CRUD + 선호도 CRUD API**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(api): add notification channel and preference CRUD endpoints"
```

---

### Task 5: 알림 설정 UI 페이지

**Files:**
- Create: `src/app/(dashboard)/settings/notifications/page.tsx`
- Create: `src/presentation/components/settings/NotificationChannelCard.tsx`
- Create: `src/presentation/components/settings/NotificationPreferenceForm.tsx`

- [ ] **Step 1: 채널 연결 카드 (Slack webhook URL 입력, 카카오 전화번호 입력)**

- [ ] **Step 2: 알림 유형별 선호도 설정 (어떤 알림을 어떤 채널로, 최소 심각도)**

- [ ] **Step 3: 테스트 알림 발송 버튼**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(ui): add notification settings page"
```

---

### Task 6: Feature 9 통합 확인

- [ ] **Step 1: 전체 테스트**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: complete Slack and KakaoTalk notification integration"
```

---

## Feature 10: 크리에이티브 AI 이미지 생성 (작업 범위로 인한 임시 보류)

> **[Notice]**
> 해당 기능은 연결해야 할 포트와 테스트 시나리오, 외부 리소스 보장이 과다하여 **현재 우선순위에서 제외(보류)**되었습니다.
> 당분간은 Feature 8(대시보드), 9(알림)만 먼저 진행하시기 바랍니다.

### Task 1: IImageGenerationService 포트 + DALL-E 어댑터

**Files:**
- Create: `src/application/ports/IImageGenerationService.ts`
- Create: `src/infrastructure/ai/DallEImageGenerationService.ts`
- Test: `tests/unit/infrastructure/ai/DallEImageGenerationService.test.ts`

- [ ] **Step 1: 포트 정의**

```typescript
export type ImageStyle = 'photorealistic' | 'illustration' | 'flat_design' | 'minimal' | '3d_render' | 'watercolor';

export interface GenerateImageParams {
  prompt: string;
  style: ImageStyle;
  size: '1024x1024' | '1024x1792' | '1792x1024'; // 1:1, 9:16, 16:9
  quality: 'standard' | 'hd';
}

export interface GeneratedImage {
  url: string;           // 임시 URL (1시간 유효)
  revisedPrompt: string; // DALL-E가 수정한 프롬프트
  size: string;
}

export interface IImageGenerationService {
  generate(params: GenerateImageParams): Promise<GeneratedImage>;
}
```

- [ ] **Step 2: DALL-E 3 어댑터**

```typescript
export class DallEImageGenerationService implements IImageGenerationService {
  private readonly STYLE_PROMPTS: Record<ImageStyle, string> = {
    photorealistic: 'Photorealistic, high quality photography, natural lighting',
    illustration: 'Digital illustration, vibrant colors, clean lines',
    flat_design: 'Flat design, minimal shadows, bold colors, vector style',
    minimal: 'Minimalist, clean, lots of whitespace, simple shapes',
    '3d_render': '3D rendered, soft lighting, realistic materials',
    watercolor: 'Watercolor painting style, soft edges, artistic',
  };

  async generate(params: GenerateImageParams): Promise<GeneratedImage> {
    const enhancedPrompt = `${params.prompt}. Style: ${this.STYLE_PROMPTS[params.style]}. For a digital advertisement.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: params.size,
        quality: params.quality,
      }),
    });

    const data = await response.json();
    return {
      url: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt,
      size: params.size,
    };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(ai): add DALL-E 3 image generation adapter"
```

---

### Task 2: GenerateCreativeImageUseCase

**Files:**
- Create: `src/application/use-cases/creative/GenerateCreativeImageUseCase.ts`
- Test: `tests/unit/application/creative/GenerateCreativeImageUseCase.test.ts`

- [ ] **Step 1: UseCase 구현**

```typescript
export class GenerateCreativeImageUseCase {
  constructor(
    private readonly imageService: IImageGenerationService,
    private readonly creativeAssetRepository: ICreativeAssetRepository,
    private readonly quotaService: QuotaService,
  ) {}

  async execute(dto: {
    userId: string;
    prompt: string;
    style: ImageStyle;
    size: string;
    quality: string;
  }): Promise<{ assetId: string; url: string; revisedPrompt: string }> {
    // 쿼터 확인
    await this.quotaService.checkAndConsume(dto.userId, 'AI_IMAGE_GEN');

    // 이미지 생성
    const generated = await this.imageService.generate({
      prompt: dto.prompt,
      style: dto.style,
      size: dto.size as GenerateImageParams['size'],
      quality: dto.quality as GenerateImageParams['quality'],
    });

    // Blob 스토리지에 영구 저장 (임시 URL → 영구 URL)
    const permanentUrl = await this.downloadAndStore(generated.url, dto.userId);

    // CreativeAsset 저장
    const asset = await this.creativeAssetRepository.save({
      userId: dto.userId,
      url: permanentUrl,
      type: 'IMAGE',
      mimeType: 'image/png',
      metadata: {
        prompt: dto.prompt,
        style: dto.style,
        revisedPrompt: generated.revisedPrompt,
        aiGenerated: true,
      },
    });

    return { assetId: asset.id, url: permanentUrl, revisedPrompt: generated.revisedPrompt };
  }
}
```

- [ ] **Step 2: 테스트 통과 확인 후 Commit**

```bash
git commit -m "feat(creative): add GenerateCreativeImageUseCase with quota control"
```

---

### Task 3: 이미지 생성 API + UI

**Files:**
- Create: `src/app/api/ai/creative/generate-image/route.ts`
- Create: `src/presentation/components/creative/ImageGeneratorPanel.tsx`

- [ ] **Step 1: API 라우트**

```typescript
// POST /api/ai/creative/generate-image
// Body: { prompt, style, size, quality }
```

- [ ] **Step 2: ImageGeneratorPanel 컴포넌트**

프롬프트 입력, 스타일 6종 선택 그리드, 사이즈 선택, 생성 버튼, 결과 프리뷰.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(ui): add AI image generator panel with style presets"
```

---

### Task 4: 크리에이티브 라이브러리 페이지

**Files:**
- Create: `src/app/(dashboard)/creative-library/page.tsx`
- Create: `src/presentation/components/creative/AssetGrid.tsx`

- [ ] **Step 1: 라이브러리 페이지**

업로드된/생성된 소재를 그리드로 표시. 필터(AI 생성/업로드), 검색, 삭제.
캠페인 생성 시 라이브러리에서 소재 선택 가능.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(ui): add creative library page with asset grid"
```

---

### Task 5: Feature 10 통합 확인

- [ ] **Step 1: 전체 테스트**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: complete AI creative image generation feature"
```

---

## Feature 11: Google Ads 연동 (Phase 4)

### Task 1: GoogleAdsAccount Prisma 모델 + 도메인

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/domain/entities/GoogleAdsAccount.ts`
- Test: `tests/unit/domain/entities/GoogleAdsAccount.test.ts`

- [ ] **Step 1: Prisma 스키마**

```prisma
model GoogleAdsAccount {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  customerId    String   // Google Ads Customer ID
  refreshToken  String   // Encrypted
  accessToken   String?  // Encrypted, short-lived
  tokenExpiresAt DateTime?
  managerAccountId String? // MCC account if applicable
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

- [ ] **Step 2: 도메인 엔티티 (MetaAdAccount 패턴 따름)**

- [ ] **Step 3: 마이그레이션 + Commit**

```bash
git commit -m "feat(google): add GoogleAdsAccount model"
```

---

### Task 2: IGoogleAdsService 포트 + 어댑터

**Files:**
- Create: `src/application/ports/IGoogleAdsService.ts`
- Create: `src/infrastructure/google-ads/GoogleAdsClient.ts`

- [ ] **Step 1: 포트 정의 (IMetaAdsService 패턴)**

```typescript
export interface IGoogleAdsService {
  // OAuth
  getAuthUrl(userId: string): string;
  exchangeCode(code: string): Promise<{ refreshToken: string; customerId: string }>;

  // Campaigns
  getCampaigns(customerId: string, accessToken: string): Promise<GoogleCampaign[]>;
  getCampaignMetrics(customerId: string, campaignId: string, dateRange: DateRange): Promise<GoogleMetrics>;

  // Reporting
  getAccountPerformance(customerId: string, dateRange: DateRange): Promise<GoogleAccountPerformance>;
}
```

- [ ] **Step 2: Google Ads API 어댑터 (GAQL 기반)**

```typescript
export class GoogleAdsClient implements IGoogleAdsService {
  private readonly baseUrl = 'https://googleads.googleapis.com/v18';

  async getCampaigns(customerId: string, accessToken: string) {
    const query = `
      SELECT
        campaign.id, campaign.name, campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.name
    `;

    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    // ... parse and return
  }
}
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(google): add IGoogleAdsService port and GoogleAdsClient adapter"
```

---

### Task 3: Google OAuth 플로우

**Files:**
- Create: `src/app/api/google-ads/auth/route.ts`
- Create: `src/app/api/google-ads/auth/callback/route.ts`

- [ ] **Step 1: OAuth 시작 + 콜백 구현 (기존 Meta OAuth 패턴 따름)**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(google): add Google Ads OAuth flow"
```

---

### Task 4: Google Ads 캠페인 API

**Files:**
- Create: `src/app/api/google-ads/campaigns/route.ts`
- Create: `src/app/api/google-ads/performance/route.ts`

- [ ] **Step 1: 캠페인 목록 + 성과 데이터 API**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(api): add Google Ads campaign and performance endpoints"
```

---

### Task 5: CrossChannelAnalyticsService

**Files:**
- Create: `src/application/services/CrossChannelAnalyticsService.ts`
- Test: `tests/unit/application/services/CrossChannelAnalyticsService.test.ts`

- [ ] **Step 1: 크로스 채널 분석 서비스**

```typescript
export class CrossChannelAnalyticsService {
  constructor(
    private readonly metaAdsService: IMetaAdsService,
    private readonly googleAdsService: IGoogleAdsService,
    private readonly metaAccountRepo: IMetaAdAccountRepository,
    private readonly googleAccountRepo: IGoogleAdsAccountRepository,
  ) {}

  async getUnifiedPerformance(userId: string, dateRange: DateRange): Promise<UnifiedPerformance> {
    const [metaAccount, googleAccount] = await Promise.all([
      this.metaAccountRepo.findByUserId(userId),
      this.googleAccountRepo.findByUserId(userId),
    ]);

    const results = await Promise.allSettled([
      metaAccount ? this.getMetaPerformance(metaAccount, dateRange) : null,
      googleAccount ? this.getGooglePerformance(googleAccount, dateRange) : null,
    ]);

    return {
      channels: [
        { name: 'Meta', ...extractResult(results[0]) },
        { name: 'Google', ...extractResult(results[1]) },
      ],
      totalSpend: /* sum */,
      totalRevenue: /* sum */,
      overallROAS: /* calculate */,
      budgetAllocation: this.calculateOptimalAllocation(results),
    };
  }
}
```

- [ ] **Step 2: 테스트 통과 확인 후 Commit**

```bash
git commit -m "feat(analytics): add CrossChannelAnalyticsService"
```

---

### Task 6: 크로스 채널 예산 최적화

**Files:**
- Create: `src/application/services/CrossChannelBudgetOptimizer.ts`

- [ ] **Step 1: ROAS 기반 예산 배분 최적화**

```typescript
export class CrossChannelBudgetOptimizer {
  optimizeAllocation(params: {
    totalBudget: number;
    channels: { name: string; currentSpend: number; roas: number; marginalRoas: number }[];
  }): OptimalAllocation {
    // marginal ROAS가 높은 채널에 더 많은 예산 배분
    // 채널별 최소/최대 비율 제약 적용
    const sorted = [...params.channels].sort((a, b) => b.marginalRoas - a.marginalRoas);

    // 그리디 알고리즘으로 최적 배분 계산
    // ...
  }
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(analytics): add cross-channel budget optimizer"
```

---

### Task 7: 크로스 채널 대시보드 UI

**Files:**
- Create: `src/app/(dashboard)/cross-channel/page.tsx`
- Create: `src/presentation/components/analytics/CrossChannelOverview.tsx`
- Create: `src/presentation/components/analytics/ChannelComparisonChart.tsx`

- [ ] **Step 1: 크로스 채널 개요 페이지**

Meta vs Google 나란히 비교, 채널별 ROAS/지출/매출, 최적 예산 배분 추천.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(ui): add cross-channel dashboard page"
```

---

### Task 8: Feature 11 통합 확인

- [ ] **Step 1: 전체 테스트**

Run: `npx tsc --noEmit && npx vitest run && npx next build`

- [ ] **Step 2: Final Commit**

```bash
git commit -m "feat: complete Phase 3-4 - custom dashboard, notifications, creative AI, Google Ads"
```
