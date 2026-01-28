# Domain Events 사용 예제

## 기본 사용법

### 1. Campaign 생성 시 이벤트 발행

```typescript
import { Campaign, CampaignCreatedEvent } from '@/domain/entities'
import { InMemoryEventDispatcher } from '@/infrastructure/events'
import { Money } from '@/domain/value-objects/Money'

// 이벤트 디스패처 설정
const eventDispatcher = new InMemoryEventDispatcher()

// 핸들러 등록
eventDispatcher.register(
  CampaignCreatedEvent.EVENT_TYPE,
  async (event: CampaignCreatedEvent) => {
    console.log('New campaign created!')
    console.log('Campaign ID:', event.aggregateId)
    console.log('User ID:', event.userId)
    console.log('Name:', event.name)
    console.log('Budget:', event.dailyBudget.amount, event.dailyBudget.currency)

    // 실제 비즈니스 로직
    // await sendWelcomeEmail(event.userId)
    // await setupAnalyticsTracking(event.aggregateId)
  }
)

// Campaign 생성
const campaign = Campaign.create({
  userId: 'user-123',
  name: '봄 시즌 프로모션',
  objective: 'CONVERSIONS',
  dailyBudget: Money.fromKRW(50000),
  startDate: new Date('2025-03-01'),
  endDate: new Date('2025-03-31'),
})

// 이벤트 디스패치
if (campaign.hasDomainEvents()) {
  await eventDispatcher.dispatchAll(campaign.domainEvents)
  campaign.clearDomainEvents()
}

// 출력:
// New campaign created!
// Campaign ID: abc-123-def-456
// User ID: user-123
// Name: 봄 시즌 프로모션
// Budget: 50000 KRW
```

### 2. Campaign 상태 변경 시 이벤트 발행

```typescript
import { CampaignStatusChangedEvent, CampaignStatus } from '@/domain/entities'

// 핸들러 등록
eventDispatcher.register(
  CampaignStatusChangedEvent.EVENT_TYPE,
  async (event: CampaignStatusChangedEvent) => {
    console.log(`Campaign ${event.aggregateId} status changed`)
    console.log(`From: ${event.previousStatus}`)
    console.log(`To: ${event.newStatus}`)

    // 실제 비즈니스 로직
    if (event.newStatus === CampaignStatus.ACTIVE) {
      // await metaAdsClient.activateCampaign(event.metaCampaignId)
      // await sendNotification(event.userId, 'Campaign is now active!')
    }

    if (event.newStatus === CampaignStatus.PAUSED) {
      // await metaAdsClient.pauseCampaign(event.metaCampaignId)
    }
  }
)

// 상태 변경
const activeCampaign = campaign.changeStatus(CampaignStatus.ACTIVE)

// 이벤트 디스패치
if (activeCampaign.hasDomainEvents()) {
  await eventDispatcher.dispatchAll(activeCampaign.domainEvents)
  activeCampaign.clearDomainEvents()
}
```

### 3. Campaign 예산 변경 시 이벤트 발행

```typescript
import { CampaignBudgetUpdatedEvent } from '@/domain/entities'

// 핸들러 등록
eventDispatcher.register(
  CampaignBudgetUpdatedEvent.EVENT_TYPE,
  async (event: CampaignBudgetUpdatedEvent) => {
    console.log('Budget updated!')
    console.log('Previous:', event.previousBudget.amount, event.previousBudget.currency)
    console.log('New:', event.newBudget.amount, event.newBudget.currency)

    const change = event.newBudget.amount - event.previousBudget.amount
    const percentChange = (change / event.previousBudget.amount) * 100

    console.log(`Change: ${change} (${percentChange.toFixed(1)}%)`)

    // 실제 비즈니스 로직
    if (event.metaCampaignId) {
      // await metaAdsClient.updateBudget(event.metaCampaignId, event.newBudget)
    }

    if (Math.abs(percentChange) > 20) {
      // await sendBudgetAlertEmail(event.userId, event.aggregateId, percentChange)
    }
  }
)

// 예산 변경
const updatedCampaign = campaign.updateBudget(Money.fromKRW(75000))

// 이벤트 디스패치
if (updatedCampaign.hasDomainEvents()) {
  await eventDispatcher.dispatchAll(updatedCampaign.domainEvents)
  updatedCampaign.clearDomainEvents()
}
```

### 4. Report 생성 및 이메일 발송

```typescript
import { Report, ReportType, ReportGeneratedEvent, ReportEmailSentEvent } from '@/domain/entities'
import { DateRange } from '@/domain/value-objects/DateRange'

// Report 생성 완료 핸들러
eventDispatcher.register(
  ReportGeneratedEvent.EVENT_TYPE,
  async (event: ReportGeneratedEvent) => {
    console.log('Report generated!')
    console.log('Report ID:', event.aggregateId)
    console.log('Type:', event.reportType)
    console.log('Sections:', event.sectionCount)
    console.log('Insights:', event.insightCount)

    // 실제 비즈니스 로직
    // 1. PDF 생성
    // await generatePdfReport(event.aggregateId)

    // 2. 사용자에게 이메일 발송
    // const user = await userRepository.findById(event.userId)
    // await emailService.sendReportEmail(user.email, event.aggregateId)
  }
)

// Report 이메일 발송 핸들러
eventDispatcher.register(
  ReportEmailSentEvent.EVENT_TYPE,
  async (event: ReportEmailSentEvent) => {
    console.log('Report email sent!')
    console.log('Report ID:', event.aggregateId)
    console.log('Recipient:', event.recipientEmail)
    console.log('Provider:', event.emailProvider)

    // 실제 비즈니스 로직
    // await analytics.track('report_email_sent', {
    //   reportId: event.aggregateId,
    //   reportType: event.reportType,
    // })
  }
)

// Report 생성
const report = Report.createWeekly({
  userId: 'user-123',
  campaignIds: ['campaign-1', 'campaign-2'],
  dateRange: DateRange.lastWeek(),
})

// 섹션 추가 (보고서 데이터 채우기)
let updatedReport = report.addSection({
  title: '주간 성과 요약',
  content: '이번 주는 전주 대비 ROAS가 15% 개선되었습니다.',
  metrics: {
    impressions: 100000,
    clicks: 5000,
    conversions: 250,
    spend: 500000,
    revenue: 2500000,
  },
})

// 보고서 완료 표시
updatedReport = updatedReport.markAsGenerated()

// 이벤트 디스패치
if (updatedReport.hasDomainEvents()) {
  await eventDispatcher.dispatchAll(updatedReport.domainEvents)
  updatedReport.clearDomainEvents()
}

// 이메일 발송
const sentReport = updatedReport.markAsSent('user@example.com', 'SendGrid')

// 이벤트 디스패치
if (sentReport.hasDomainEvents()) {
  await eventDispatcher.dispatchAll(sentReport.domainEvents)
  sentReport.clearDomainEvents()
}
```

## Application Layer 통합 예제

```typescript
// src/application/use-cases/campaign/CreateCampaignUseCase.ts
import { IEventDispatcher } from '@/domain/events'
import { ICampaignRepository } from '@/domain/repositories/ICampaignRepository'

export class CreateCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  async execute(input: CreateCampaignInput): Promise<CreateCampaignOutput> {
    // 1. Campaign 생성 (도메인 이벤트 포함)
    const campaign = Campaign.create({
      userId: input.userId,
      name: input.name,
      objective: input.objective,
      dailyBudget: Money.fromKRW(input.dailyBudgetKRW),
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      targetAudience: input.targetAudience,
    })

    // 2. 저장
    await this.campaignRepository.save(campaign)

    // 3. 도메인 이벤트 디스패치
    if (campaign.hasDomainEvents()) {
      await this.eventDispatcher.dispatchAll(campaign.domainEvents)
      campaign.clearDomainEvents()
    }

    return {
      campaignId: campaign.id,
      status: campaign.status,
    }
  }
}
```

## 여러 핸들러 등록

```typescript
// 같은 이벤트에 여러 핸들러 등록 가능
eventDispatcher.register(
  CampaignCreatedEvent.EVENT_TYPE,
  async (event) => {
    // 핸들러 1: 환영 이메일 발송
    await sendWelcomeEmail(event.userId, event.name)
  }
)

eventDispatcher.register(
  CampaignCreatedEvent.EVENT_TYPE,
  async (event) => {
    // 핸들러 2: Analytics 추적
    await analytics.track('campaign_created', {
      campaignId: event.aggregateId,
      objective: event.objective,
    })
  }
)

eventDispatcher.register(
  CampaignCreatedEvent.EVENT_TYPE,
  async (event) => {
    // 핸들러 3: Slack 알림
    await slack.sendMessage(
      `새 캠페인이 생성되었습니다: ${event.name}`
    )
  }
)

// 모든 핸들러가 병렬로 실행됨
```

## 핸들러 등록 해제

```typescript
// 핸들러 함수 저장
const myHandler = async (event: CampaignCreatedEvent) => {
  console.log('Campaign created:', event.aggregateId)
}

// 등록
eventDispatcher.register(CampaignCreatedEvent.EVENT_TYPE, myHandler)

// 등록 해제
eventDispatcher.unregister(CampaignCreatedEvent.EVENT_TYPE, myHandler)
```

## 테스트 예제

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InMemoryEventDispatcher } from '@/infrastructure/events'
import { Campaign, CampaignCreatedEvent } from '@/domain/entities'

describe('Domain Events', () => {
  let eventDispatcher: InMemoryEventDispatcher

  beforeEach(() => {
    eventDispatcher = new InMemoryEventDispatcher()
  })

  it('should dispatch CampaignCreatedEvent when campaign is created', async () => {
    // Arrange
    const handler = vi.fn()
    eventDispatcher.register(CampaignCreatedEvent.EVENT_TYPE, handler)

    // Act
    const campaign = Campaign.create({
      userId: 'user-123',
      name: 'Test Campaign',
      objective: 'CONVERSIONS',
      dailyBudget: Money.fromKRW(50000),
      startDate: new Date('2025-03-01'),
    })

    await eventDispatcher.dispatchAll(campaign.domainEvents)

    // Assert
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'campaign.created',
        aggregateId: campaign.id,
        userId: 'user-123',
        name: 'Test Campaign',
      })
    )
  })

  it('should dispatch multiple events sequentially', async () => {
    // Arrange
    const handler = vi.fn()
    eventDispatcher.register(CampaignCreatedEvent.EVENT_TYPE, handler)

    // Act
    const campaign1 = Campaign.create({
      userId: 'user-1',
      name: 'Campaign 1',
      objective: 'CONVERSIONS',
      dailyBudget: Money.fromKRW(50000),
      startDate: new Date('2025-03-01'),
    })

    const campaign2 = Campaign.create({
      userId: 'user-2',
      name: 'Campaign 2',
      objective: 'TRAFFIC',
      dailyBudget: Money.fromKRW(30000),
      startDate: new Date('2025-03-01'),
    })

    await eventDispatcher.dispatchAll([
      ...campaign1.domainEvents,
      ...campaign2.domainEvents,
    ])

    // Assert
    expect(handler).toHaveBeenCalledTimes(2)
  })
})
```

## 프로덕션 사용 예제

```typescript
// src/infrastructure/events/setupEventHandlers.ts
import { IEventDispatcher } from '@/domain/events'
import {
  CampaignCreatedEvent,
  CampaignStatusChangedEvent,
  CampaignBudgetUpdatedEvent,
  ReportGeneratedEvent,
  ReportEmailSentEvent,
} from '@/domain/entities'

export function setupEventHandlers(
  eventDispatcher: IEventDispatcher,
  dependencies: {
    emailService: IEmailService
    metaAdsClient: MetaAdsClient
    analytics: Analytics
    logger: Logger
  }
) {
  const { emailService, metaAdsClient, analytics, logger } = dependencies

  // Campaign Created
  eventDispatcher.register(
    CampaignCreatedEvent.EVENT_TYPE,
    async (event: CampaignCreatedEvent) => {
      try {
        await Promise.all([
          emailService.sendCampaignCreatedEmail(event.userId, event.name),
          analytics.track('campaign_created', {
            campaignId: event.aggregateId,
            objective: event.objective,
          }),
        ])
      } catch (error) {
        logger.error('Error handling CampaignCreatedEvent', { error, event })
      }
    }
  )

  // Campaign Status Changed
  eventDispatcher.register(
    CampaignStatusChangedEvent.EVENT_TYPE,
    async (event: CampaignStatusChangedEvent) => {
      try {
        if (event.metaCampaignId) {
          if (event.newStatus === 'ACTIVE') {
            await metaAdsClient.activateCampaign(event.metaCampaignId)
          } else if (event.newStatus === 'PAUSED') {
            await metaAdsClient.pauseCampaign(event.metaCampaignId)
          }
        }

        await emailService.sendStatusChangeEmail(
          event.userId,
          event.aggregateId,
          event.newStatus
        )
      } catch (error) {
        logger.error('Error handling CampaignStatusChangedEvent', { error, event })
      }
    }
  )

  // Report Generated
  eventDispatcher.register(
    ReportGeneratedEvent.EVENT_TYPE,
    async (event: ReportGeneratedEvent) => {
      try {
        // PDF 생성 및 이메일 발송은 별도 UseCase에서 처리
        logger.info('Report generated', {
          reportId: event.aggregateId,
          type: event.reportType,
        })
      } catch (error) {
        logger.error('Error handling ReportGeneratedEvent', { error, event })
      }
    }
  )
}
```
