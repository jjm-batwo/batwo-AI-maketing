# Domain Events

이 디렉토리는 도메인 이벤트 패턴을 구현합니다. 도메인 이벤트는 도메인에서 발생한 중요한 일을 나타냅니다.

## 구조

```
events/
├── DomainEvent.ts              # 베이스 이벤트 인터페이스
├── EventDispatcher.ts          # 이벤트 디스패처 인터페이스
├── AggregateRoot.ts            # Aggregate Root 베이스 클래스
├── campaign/                   # Campaign 관련 이벤트
│   ├── CampaignCreatedEvent.ts
│   ├── CampaignStatusChangedEvent.ts
│   └── CampaignBudgetUpdatedEvent.ts
└── report/                     # Report 관련 이벤트
    ├── ReportGeneratedEvent.ts
    └── ReportEmailSentEvent.ts
```

## 사용 방법

### 1. Aggregate Root 확장

```typescript
import { AggregateRoot } from '@/domain/events'

export class Campaign extends AggregateRoot {
  // ... 엔티티 구현
}
```

### 2. 도메인 이벤트 발행

```typescript
static create(props: CreateCampaignProps): Campaign {
  const campaignId = crypto.randomUUID()
  const campaign = new Campaign(/* ... */)

  // 도메인 이벤트 추가
  campaign.addDomainEvent(
    new CampaignCreatedEvent(
      campaignId,
      props.userId,
      props.name,
      props.objective,
      props.dailyBudget,
      props.startDate,
      props.endDate,
      props.targetAudience
    )
  )

  return campaign
}
```

### 3. 이벤트 핸들러 등록

```typescript
import { InMemoryEventDispatcher } from '@/infrastructure/events'
import { CampaignCreatedEvent } from '@/domain/events'

const dispatcher = new InMemoryEventDispatcher()

// 핸들러 등록
dispatcher.register(
  CampaignCreatedEvent.EVENT_TYPE,
  async (event: CampaignCreatedEvent) => {
    console.log('Campaign created:', event.aggregateId)
    // 비즈니스 로직 실행
    // - 이메일 발송
    // - 외부 시스템 동기화
    // - 알림 전송
  }
)
```

### 4. 이벤트 디스패치 (Application/Infrastructure 계층)

```typescript
// Use Case에서
const campaign = Campaign.create(props)
await campaignRepository.save(campaign)

// 이벤트 디스패치
if (campaign.hasDomainEvents()) {
  await eventDispatcher.dispatchAll(campaign.domainEvents)
  campaign.clearDomainEvents()
}
```

## 구현된 이벤트

### Campaign 이벤트

| 이벤트 | 발생 시점 | 활용 |
|--------|----------|------|
| `CampaignCreatedEvent` | 캠페인 생성 시 | 환영 알림, 초기 추적 설정 |
| `CampaignStatusChangedEvent` | 캠페인 상태 변경 시 | 상태 변경 알림, 외부 플랫폼 동기화 |
| `CampaignBudgetUpdatedEvent` | 캠페인 예산 변경 시 | 예산 변경 알림, 외부 플랫폼 동기화 |

### Report 이벤트

| 이벤트 | 발생 시점 | 활용 |
|--------|----------|------|
| `ReportGeneratedEvent` | 보고서 생성 완료 시 | 이메일 발송, PDF 생성 |
| `ReportEmailSentEvent` | 보고서 이메일 발송 시 | 전송 확인, 감사 로깅 |

## 설계 원칙

### 1. 불변성 (Immutability)
모든 도메인 이벤트는 불변입니다. 한번 생성되면 수정할 수 없습니다.

### 2. 도메인 중심 (Domain-Centric)
이벤트는 도메인 언어로 명명됩니다. 기술적 세부사항이 아닌 비즈니스 의미를 전달합니다.

### 3. 풍부한 정보 (Rich Information)
이벤트는 핸들러가 작업을 수행하는 데 필요한 모든 정보를 포함합니다.

### 4. 느슨한 결합 (Loose Coupling)
도메인 계층은 이벤트 핸들러를 알지 못합니다. 단지 이벤트를 발행할 뿐입니다.

## 확장 가이드

### 새 이벤트 추가

1. **이벤트 클래스 생성**
```typescript
import { BaseDomainEvent } from '../DomainEvent'

export class MyNewEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'my_aggregate.action'

  constructor(
    aggregateId: string,
    public readonly someData: string
  ) {
    super(MyNewEvent.EVENT_TYPE, aggregateId)
  }
}
```

2. **Aggregate에서 발행**
```typescript
myMethod(): MyAggregate {
  const aggregate = new MyAggregate(/* ... */)

  aggregate.addDomainEvent(
    new MyNewEvent(this._id, 'some data')
  )

  return aggregate
}
```

3. **핸들러 등록**
```typescript
dispatcher.register(
  MyNewEvent.EVENT_TYPE,
  async (event: MyNewEvent) => {
    // 비즈니스 로직
  }
)
```

## 프로덕션 고려사항

현재 구현은 MVP를 위한 간단한 in-memory 구현입니다. 프로덕션 환경에서는 다음을 고려하세요:

### 1. 영속성 (Persistence)
- **Event Sourcing**: 이벤트를 영구 저장하여 시스템 상태를 재구성
- **Outbox Pattern**: 트랜잭션 내에서 이벤트를 DB에 저장 후 비동기로 발행

### 2. 메시지 브로커
- RabbitMQ, AWS SQS, Google Pub/Sub 등 사용
- 확장성과 내결함성 향상

### 3. 재시도 및 DLQ
- 실패한 이벤트 처리를 위한 재시도 로직
- Dead Letter Queue로 영구 실패 이벤트 처리

### 4. 이벤트 버전 관리
- 스키마 진화 전략
- 하위 호환성 유지

### 5. 모니터링
- 이벤트 발행/처리 메트릭
- 오류 추적 및 알림

## 참고 자료

- [Domain Events Pattern - Martin Fowler](https://martinfowler.com/eaaDev/DomainEvent.html)
- [Implementing Domain Events](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation)
- [Transaction Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
