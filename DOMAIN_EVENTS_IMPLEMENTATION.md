# Domain Events Pattern 구현 완료

## 요약

Domain 계층에 Domain Events 패턴을 성공적으로 도입했습니다. 이를 통해 도메인 엔티티가 발생시킨 중요한 이벤트를 느슨하게 결합된 방식으로 처리할 수 있습니다.

## 구현된 파일

### 1. Domain Events 인프라 (src/domain/events/)

```
src/domain/events/
├── DomainEvent.ts              # 베이스 이벤트 인터페이스 및 클래스
├── EventDispatcher.ts          # 이벤트 디스패처 인터페이스
├── AggregateRoot.ts            # Aggregate Root 베이스 클래스
├── campaign/
│   ├── CampaignCreatedEvent.ts
│   ├── CampaignStatusChangedEvent.ts
│   ├── CampaignBudgetUpdatedEvent.ts
│   └── index.ts
├── report/
│   ├── ReportGeneratedEvent.ts
│   ├── ReportEmailSentEvent.ts
│   └── index.ts
├── index.ts                    # 통합 exports
├── README.md                   # 구현 가이드
└── EXAMPLE.md                  # 사용 예제
```

### 2. Infrastructure 구현 (src/infrastructure/events/)

```
src/infrastructure/events/
├── InMemoryEventDispatcher.ts  # In-memory 이벤트 디스패처 구현
└── index.ts
```

### 3. 업데이트된 Entities

- **src/domain/entities/Campaign.ts**
  - `AggregateRoot` 확장
  - `CampaignCreatedEvent` 발행 (create 메서드)
  - `CampaignStatusChangedEvent` 발행 (changeStatus 메서드)
  - `CampaignBudgetUpdatedEvent` 발행 (updateBudget 메서드)

- **src/domain/entities/Report.ts**
  - `AggregateRoot` 확장
  - `ReportGeneratedEvent` 발행 (markAsGenerated 메서드)
  - `ReportEmailSentEvent` 발행 (markAsSent 메서드)

## 주요 클래스 및 인터페이스

### DomainEvent Interface

```typescript
interface DomainEvent {
  readonly id: string              // 이벤트 고유 ID
  readonly eventType: string        // 이벤트 타입 (식별자)
  readonly occurredAt: Date         // 발생 시간
  readonly aggregateId: string      // 이벤트 발생 Aggregate ID
}
```

### AggregateRoot Class

```typescript
abstract class AggregateRoot {
  get domainEvents(): ReadonlyArray<DomainEvent>
  protected addDomainEvent(event: DomainEvent): void
  public clearDomainEvents(): void
  public hasDomainEvents(): boolean
}
```

### IEventDispatcher Interface

```typescript
interface IEventDispatcher {
  register<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void
  unregister<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void
  dispatch(event: DomainEvent): Promise<void>
  dispatchAll(events: DomainEvent[]): Promise<void>
  clearAll(): void
}
```

## 구현된 이벤트

### Campaign 이벤트

| 이벤트 클래스 | 이벤트 타입 | 발생 시점 | 포함 데이터 |
|--------------|------------|----------|-----------|
| `CampaignCreatedEvent` | `campaign.created` | Campaign.create() | userId, name, objective, dailyBudget, startDate, endDate, targetAudience |
| `CampaignStatusChangedEvent` | `campaign.status_changed` | Campaign.changeStatus() | userId, previousStatus, newStatus, metaCampaignId |
| `CampaignBudgetUpdatedEvent` | `campaign.budget_updated` | Campaign.updateBudget() | userId, previousBudget, newBudget, metaCampaignId |

### Report 이벤트

| 이벤트 클래스 | 이벤트 타입 | 발생 시점 | 포함 데이터 |
|--------------|------------|----------|-----------|
| `ReportGeneratedEvent` | `report.generated` | Report.markAsGenerated() | userId, reportType, campaignIds, dateRange, sectionCount, insightCount |
| `ReportEmailSentEvent` | `report.email_sent` | Report.markAsSent() | userId, reportType, recipientEmail, emailProvider |

## 사용 예제

### 1. Campaign 생성 및 이벤트 처리

```typescript
import { Campaign } from '@/domain/entities'
import { InMemoryEventDispatcher } from '@/infrastructure/events'
import { CampaignCreatedEvent } from '@/domain/events'

// 이벤트 디스패처 설정
const eventDispatcher = new InMemoryEventDispatcher()

// 핸들러 등록
eventDispatcher.register(
  CampaignCreatedEvent.EVENT_TYPE,
  async (event: CampaignCreatedEvent) => {
    console.log('Campaign created:', event.name)
    // 비즈니스 로직: 이메일 발송, 외부 시스템 동기화 등
  }
)

// Campaign 생성
const campaign = Campaign.create({
  userId: 'user-123',
  name: '봄 시즌 프로모션',
  objective: 'CONVERSIONS',
  dailyBudget: Money.fromKRW(50000),
  startDate: new Date('2025-03-01'),
})

// 이벤트 디스패치
if (campaign.hasDomainEvents()) {
  await eventDispatcher.dispatchAll(campaign.domainEvents)
  campaign.clearDomainEvents()
}
```

### 2. Use Case에서 통합

```typescript
export class CreateCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  async execute(input: CreateCampaignInput): Promise<CreateCampaignOutput> {
    // 1. Campaign 생성 (도메인 이벤트 발생)
    const campaign = Campaign.create(input)

    // 2. 저장
    await this.campaignRepository.save(campaign)

    // 3. 도메인 이벤트 디스패치
    if (campaign.hasDomainEvents()) {
      await this.eventDispatcher.dispatchAll(campaign.domainEvents)
      campaign.clearDomainEvents()
    }

    return { campaignId: campaign.id }
  }
}
```

## 설계 원칙

### 1. 불변성 (Immutability)
모든 도메인 이벤트는 `readonly` 프로퍼티를 사용하여 불변성을 보장합니다.

### 2. 도메인 중심 (Domain-Centric)
이벤트 타입은 비즈니스 언어를 사용합니다 (예: `campaign.created`, `report.generated`).

### 3. 풍부한 정보 (Rich Information)
이벤트는 핸들러가 작업을 수행하는 데 필요한 모든 정보를 포함합니다.

### 4. 느슨한 결합 (Loose Coupling)
도메인 계층은 이벤트 핸들러를 알지 못합니다. 단지 이벤트를 발행할 뿐입니다.

### 5. 단일 책임 (Single Responsibility)
각 이벤트는 하나의 도메인 사건을 표현합니다.

## 타입 안정성

TypeScript의 strict mode를 사용하여 타입 안정성을 보장합니다:

```bash
# 타입 체크 성공
npx tsc --noEmit src/domain/events/**/*.ts
npx tsc --noEmit src/infrastructure/events/**/*.ts
npx tsc --noEmit src/domain/entities/Campaign.ts
npx tsc --noEmit src/domain/entities/Report.ts
```

## 코드 스타일

- TypeScript strict mode 준수
- 불변성 유지 (readonly, Object.freeze)
- 명확한 명명 규칙 (이벤트 클래스 이름에 `Event` 접미사)
- JSDoc 주석으로 문서화
- 기존 코드베이스 패턴 따름

## 다음 단계

### 1. 프로덕션 준비사항

현재 구현은 MVP를 위한 간단한 in-memory 구현입니다. 프로덕션 환경에서는 다음을 고려해야 합니다:

- **Event Sourcing**: 이벤트를 영구 저장하여 시스템 상태 재구성
- **Outbox Pattern**: 트랜잭션 내에서 이벤트를 DB에 저장 후 비동기로 발행
- **Message Broker**: RabbitMQ, AWS SQS, Google Pub/Sub 등 사용
- **재시도 로직**: 실패한 이벤트 처리를 위한 재시도 메커니즘
- **DLQ (Dead Letter Queue)**: 영구 실패 이벤트 처리
- **모니터링**: 이벤트 발행/처리 메트릭 수집

### 2. 추가 이벤트 구현

필요에 따라 다음 이벤트들을 추가할 수 있습니다:

- `CampaignUpdatedEvent`
- `CampaignDeletedEvent`
- `BudgetAlertTriggeredEvent`
- `ReportScheduledEvent`
- `UserSubscribedEvent`
- `PaymentProcessedEvent`

### 3. 이벤트 핸들러 구현

각 이벤트에 대한 실제 비즈니스 로직 핸들러를 구현해야 합니다:

- 이메일 발송
- 외부 플랫폼 동기화 (Meta Ads)
- Analytics 추적
- 알림 전송
- 감사 로깅

## 참고 문서

- [Domain Events Pattern - Martin Fowler](https://martinfowler.com/eaaDev/DomainEvent.html)
- [src/domain/events/README.md](src/domain/events/README.md) - 구현 가이드
- [src/domain/events/EXAMPLE.md](src/domain/events/EXAMPLE.md) - 사용 예제

## 검증 완료

- ✅ TypeScript 타입 체크 통과
- ✅ Campaign 엔티티에 3개 이벤트 구현
- ✅ Report 엔티티에 2개 이벤트 구현
- ✅ AggregateRoot 베이스 클래스 구현
- ✅ InMemoryEventDispatcher 구현
- ✅ 기존 코드 패턴 준수
- ✅ 불변성 보장
- ✅ 문서화 완료

## 구현 일자

2025-01-25

---

**구현 완료**. Domain Events 패턴이 성공적으로 도입되었으며, Campaign과 Report 엔티티가 중요한 도메인 이벤트를 발행합니다.
