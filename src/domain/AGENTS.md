<!-- Parent: ../AGENTS.md -->

# Domain Layer - AI Agents Guide

## Purpose

The domain layer encapsulates **core business logic** with **zero external dependencies**. This layer contains:

- **Entities**: Rich domain objects with encapsulated state and business rules
- **Value Objects**: Immutable objects representing domain concepts (Money, DateRange, etc.)
- **Domain Errors**: Custom exception hierarchy for domain-specific failures
- **Repositories (Ports)**: Interface contracts for data persistence
- **Domain Services**: Pure business logic orchestrators (when entities alone are insufficient)

**Principle**: Domain layer is agnostic to infrastructure, frameworks, and external services. It contains only pure business logic that can be tested without side effects.

## Directory Structure

```
src/domain/
├── entities/                    # Rich domain objects
│   ├── Campaign.ts             # Marketing campaign aggregate
│   ├── Report.ts               # Weekly/daily/monthly reports
│   ├── KPI.ts                  # Key performance indicators
│   ├── MetaPixel.ts            # Meta Pixel tracking setup
│   ├── PlatformIntegration.ts  # E-commerce platform connections
│   ├── ConversionEvent.ts      # Conversion tracking events
│   ├── ABTest.ts               # A/B test configurations
│   ├── Team.ts                 # Team/org management
│   ├── Subscription.ts         # Subscription billing model
│   ├── Invoice.ts              # Invoice records
│   └── BudgetAlert.ts          # Budget threshold alerts
│
├── value-objects/              # Immutable domain concepts
│   ├── Money.ts                # Currency & amount (KRW, USD, EUR, JPY)
│   ├── DateRange.ts            # Date range with duration calculations
│   ├── Percentage.ts           # Percentage values (0-100)
│   ├── CampaignStatus.ts       # Campaign state machine (enum + transitions)
│   ├── CampaignObjective.ts    # Campaign marketing objectives
│   ├── CampaignTemplate.ts     # Pre-configured campaign templates
│   ├── CopyVariation.ts        # AI-generated ad copy variants
│   ├── BudgetRecommendation.ts # AI budget optimization suggestions
│   ├── KoreanMarketCalendar.ts # Korean market events & holidays
│   ├── SubscriptionPlan.ts     # Subscription tier definitions
│   ├── SubscriptionStatus.ts   # Subscription state machine
│   ├── GlobalRole.ts           # User permission roles
│   └── InvoiceStatus.ts        # Invoice state machine
│
├── errors/                     # Domain exception hierarchy
│   ├── DomainError.ts          # Base error class
│   ├── InvalidCampaignError.ts # Campaign validation failures
│   ├── InvalidReportError.ts   # Report validation failures
│   ├── InvalidPixelError.ts    # Pixel configuration failures
│   ├── InvalidPlatformIntegrationError.ts
│   ├── InvalidConversionEventError.ts
│   ├── InvalidSubscriptionError.ts
│   ├── InvalidInvoiceError.ts
│   └── BudgetExceededError.ts  # Budget constraint violations
│
├── repositories/               # Data persistence contracts (ports)
│   ├── ICampaignRepository.ts
│   ├── IReportRepository.ts
│   ├── IKPIRepository.ts
│   ├── IMetaPixelRepository.ts
│   ├── IABTestRepository.ts
│   ├── ITeamRepository.ts
│   ├── ISubscriptionRepository.ts
│   ├── IUserRepository.ts
│   ├── IInvoiceRepository.ts
│   ├── IBudgetAlertRepository.ts
│   └── IUsageLogRepository.ts
│
├── services/                   # Domain-level orchestrators
│   └── ai-team-command-types.ts # Type definitions for AI team
│
├── index.ts                    # Barrel exports
└── AGENTS.md                   # This file
```

## Key Files Reference

| File | Purpose | Key Exports | Notes |
|------|---------|------------|-------|
| **Campaign.ts** | Marketing campaign aggregate root | `Campaign`, `CampaignProps`, `TargetAudience` | State machine with validation; immutable commands |
| **Report.ts** | Analytics report generation | `Report`, `ReportType`, `AIInsight` | Supports daily/weekly/monthly; AI insights |
| **MetaPixel.ts** | Meta Pixel tracking setup | `MetaPixel`, `PixelSetupMethod` | Validates pixel ID format (15-16 digits) |
| **Subscription.ts** | Billing & subscription management | `Subscription`, `SubscriptionStatus` | Status transitions: TRIALING → ACTIVE → CANCELLED/EXPIRED |
| **Money.ts** | Currency-aware monetary value | `Money`, `Currency` type | Multi-currency support; prevents mixed operations |
| **DateRange.ts** | Date range with duration | `DateRange` | Duration calculation in days/hours |
| **CampaignStatus.ts** | Campaign state machine | `CampaignStatus`, `canTransition`, helpers | Transition rules: DRAFT → PENDING_REVIEW → ACTIVE → PAUSED/COMPLETED |
| **DomainError.ts** | Base error class | `DomainError` | All domain errors extend this |

## Subdirectories Detail

### entities/
Rich domain objects with encapsulated state, invariant enforcement, and business logic.

**Patterns**:
- Private constructor + static factory methods (`create()`, `restore()`)
- Immutable: all commands return new instances
- Validation in static methods or constructor
- Getters with defensive copying for mutable properties
- State checks: `isActive()`, `isEditable()`, etc.
- Commands: `changeStatus()`, `updateBudget()`, etc.
- `toJSON()` for serialization

**Examples**:
- `Campaign`: Status transitions with validation; budget calculations
- `Report`: Type-specific factories (weekly, daily); metrics aggregation
- `Subscription`: Complex state machine; renewal logic
- `MetaPixel`: Pixel ID format validation; activation/deactivation

### value-objects/
Immutable objects representing domain concepts without identity.

**Patterns**:
- Private constructor + static factory (`create()`)
- No public setters; all mutations return new instances
- Rich behavior (formatting, calculations, comparisons)
- Currency awareness (Money) or range calculations (DateRange)
- `toJSON()` for serialization

**Examples**:
- `Money`: Handles KRW rounding vs decimal currencies; prevents cross-currency operations
- `DateRange`: Duration in days; supports open-ended ranges
- `CampaignStatus`: State machine transitions + helper functions
- `SubscriptionStatus`: State transition rules

### errors/
Custom exception hierarchy for domain-specific failures.

**Patterns**:
- All extend `DomainError` base class
- Unique error code per class (e.g., `INVALID_CAMPAIGN`)
- Static factory methods for common scenarios
- Include contextual information in messages

**Usage**:
```typescript
throw InvalidCampaignError.nameTooLong(255)
throw InvalidPixelError.invalidMetaPixelIdFormat()
```

### repositories/
Interface contracts (ports) for data persistence - implementation in infrastructure layer.

**Patterns**:
- Interface only - no implementation
- Methods return domain entities, not DTOs
- Pagination support via `PaginationOptions` & `PaginatedResult<T>`
- Filtering via domain value objects
- No pagination for simple lookups

**Example Interface**:
```typescript
interface ICampaignRepository {
  save(campaign: Campaign): Promise<Campaign>
  findById(id: string): Promise<Campaign | null>
  findByFilters(filters: CampaignFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Campaign>>
  update(campaign: Campaign): Promise<Campaign>
  delete(id: string): Promise<void>
  existsByNameAndUserId(name: string, userId: string, excludeId?: string): Promise<boolean>
}
```

## AI Agent Instructions

### TDD-First Development

**MANDATORY process for ALL domain code**:

```typescript
// 1. RED: Write failing test first
describe('Campaign', () => {
  it('should throw InvalidCampaignError when name is empty', () => {
    expect(() => Campaign.create({
      userId: 'user-1',
      name: '',  // Invalid
      objective: CampaignObjective.SALES,
      dailyBudget: Money.create(10000),
      startDate: new Date('2024-02-01')
    })).toThrow(InvalidCampaignError)
  })
})

// 2. GREEN: Minimal implementation to pass test
private static validateName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw InvalidCampaignError.emptyName()
  }
}

// 3. REFACTOR: Improve code while tests pass
// No changes needed - validation is clean
```

### Entity Development Rules

1. **Private Constructor + Static Factories**
   ```typescript
   private constructor(...properties) {}
   static create(props: CreateProps): Entity { ... }
   static restore(props: Props): Entity { ... }
   ```

2. **Immutability**
   - All properties `readonly`
   - Commands return new instances (never mutate internal state)
   - Getters use defensive copying for mutable types

3. **Validation**
   - Validate in static `create()` method before construction
   - Throw specific domain errors from validation helpers
   - Document validation rules in comments

4. **State Machines**
   - Define status enum with transition rules
   - Use helper functions (`canTransition()`, `isEditableStatus()`)
   - Always check transitions before state changes

5. **No External Dependencies**
   - Never import from `infrastructure/`, `application/`, or `presentation/`
   - Only import other domain entities, value objects, errors, and repositories
   - Avoid side effects; use pure functions

### Value Object Development Rules

1. **Immutability First**
   - Private constructor, all properties `readonly`
   - Mutations return new instances

2. **Factory Method Pattern**
   ```typescript
   static create(amount: number, currency: Currency = 'KRW'): Money {
     // Validation
     // Factory creation
   }
   ```

3. **Rich Behavior**
   - Implement domain operations: `add()`, `subtract()`, `multiply()`
   - Implement comparisons: `equals()`, `isGreaterThan()`, `isLessThan()`
   - Implement formatting: `format(locale)` for display

4. **Type Safety**
   - Use branded types or enums for distinct concepts
   - Prevent invalid state combinations (e.g., negative Money)
   - Use discriminated unions for flexible value objects

### Error Development Rules

1. **Extend DomainError**
   ```typescript
   export class InvalidCampaignError extends DomainError {
     readonly code = 'INVALID_CAMPAIGN'
   }
   ```

2. **Static Factory Methods**
   ```typescript
   static nameTooLong(max: number): InvalidCampaignError {
     return new InvalidCampaignError(`Name cannot exceed ${max} characters`)
   }
   ```

3. **Meaningful Error Codes**
   - Use SCREAMING_SNAKE_CASE: `INVALID_CAMPAIGN`, `BUDGET_EXCEEDED`
   - Include context in messages: "Start date cannot be before {actual_date}"

### Repository Interface Rules

1. **Interface-Only** - Never implement repositories in domain layer
2. **Return Entities** - Methods return domain entities, not DTOs
3. **Use Domain Concepts** - Filters use value objects (CampaignStatus, DateRange)
4. **Pagination Optional** - Only add pagination for list operations
5. **No Framework-Specific Types** - Keep interfaces framework-agnostic

### Testing Requirements

**Coverage Targets**:
- Entities: ≥95%
- Value Objects: ≥95%
- Errors: ≥85%
- Total Domain: ≥95%

**Test Organization**:
```
tests/unit/domain/
├── entities/
│   ├── Campaign.test.ts
│   ├── Report.test.ts
│   └── ...
├── value-objects/
│   ├── Money.test.ts
│   ├── DateRange.test.ts
│   └── ...
└── errors/
    ├── InvalidCampaignError.test.ts
    └── ...
```

**Test Structure - TDD with Vitest**:
```typescript
import { describe, it, expect } from 'vitest'
import { Campaign } from '@/domain/entities/Campaign'
import { Money } from '@/domain/value-objects/Money'
import { InvalidCampaignError } from '@/domain/errors/InvalidCampaignError'

describe('Campaign', () => {
  describe('create()', () => {
    it('should create campaign with valid props', () => {
      const campaign = Campaign.create({
        userId: 'user-1',
        name: 'Q1 Sales Campaign',
        objective: CampaignObjective.SALES,
        dailyBudget: Money.create(10000),
        startDate: new Date('2024-02-01')
      })

      expect(campaign.name).toBe('Q1 Sales Campaign')
      expect(campaign.status).toBe(CampaignStatus.DRAFT)
      expect(campaign.isEditable()).toBe(true)
    })

    it('should throw InvalidCampaignError when name is empty', () => {
      expect(() => Campaign.create({
        userId: 'user-1',
        name: '',
        objective: CampaignObjective.SALES,
        dailyBudget: Money.create(10000),
        startDate: new Date('2024-02-01')
      })).toThrow(InvalidCampaignError)
    })

    it('should throw InvalidCampaignError when budget is zero', () => {
      expect(() => Campaign.create({
        userId: 'user-1',
        name: 'Campaign',
        objective: CampaignObjective.SALES,
        dailyBudget: Money.create(0),
        startDate: new Date('2024-02-01')
      })).toThrow(InvalidCampaignError)
    })
  })

  describe('changeStatus()', () => {
    it('should transition from DRAFT to PENDING_REVIEW', () => {
      const campaign = Campaign.create({...props})
      const updated = campaign.changeStatus(CampaignStatus.PENDING_REVIEW)

      expect(updated.status).toBe(CampaignStatus.PENDING_REVIEW)
      expect(updated.id).toBe(campaign.id)
      expect(updated.updatedAt.getTime()).toBeGreaterThan(campaign.updatedAt.getTime())
    })

    it('should throw error for invalid transitions', () => {
      const campaign = Campaign.create({...props})
      const active = campaign.changeStatus(CampaignStatus.ACTIVE)

      expect(() => active.changeStatus(CampaignStatus.DRAFT))
        .toThrow(InvalidCampaignError)
    })
  })
})
```

## Dependencies

### Internal (Domain Layer Only)

```typescript
// ALLOWED imports within domain/
import { Money } from '../value-objects/Money'
import { CampaignStatus } from '../value-objects/CampaignStatus'
import { InvalidCampaignError } from '../errors/InvalidCampaignError'
import { type ICampaignRepository } from '../repositories/ICampaignRepository'
```

### External (Prohibited)

```typescript
// FORBIDDEN - creates external dependencies
import { prisma } from '@/infrastructure/database'  // ❌ Infrastructure
import { OpenAI } from 'openai'                      // ❌ External service
import { NextRequest } from 'next/server'            // ❌ Framework
import { useSelector } from 'react-redux'            // ❌ UI library
```

## Common Patterns

### Status Machine Pattern
```typescript
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export const TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  [CampaignStatus.DRAFT]: [CampaignStatus.PENDING_REVIEW],
  [CampaignStatus.PENDING_REVIEW]: [CampaignStatus.ACTIVE, CampaignStatus.REJECTED],
  // ...
}

export function canTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

// Usage in entity:
changeStatus(newStatus: CampaignStatus): Campaign {
  if (!canTransition(this._status, newStatus)) {
    throw InvalidCampaignError.invalidStatusTransition(this._status, newStatus)
  }
  return new Campaign(..., newStatus, new Date())
}
```

### Value Object Arithmetic
```typescript
class Money {
  add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error('Cannot add different currencies')
    }
    return new Money(this._amount + other._amount, this._currency)
  }

  multiply(factor: number): Money {
    const result = this._amount * factor
    const rounded = this._currency === 'KRW' ? Math.round(result) : result
    return new Money(rounded, this._currency)
  }
}

// Usage:
const dailyBudget = Money.create(10000, 'KRW')
const weeklyBudget = dailyBudget.multiply(7)  // 70000 KRW
const totalBudget = dailyBudget.add(dailyBudget)  // 20000 KRW
```

### Defensive Copying
```typescript
class Campaign {
  get targetAudience(): TargetAudience | undefined {
    // Return shallow copy to prevent external mutations
    return this._targetAudience ? { ...this._targetAudience } : undefined
  }

  get campaignIds(): string[] {
    // Always return new array instance
    return [...this._campaignIds]
  }
}
```

## Extending the Domain

### Adding a New Entity

1. **Create entity file** in `entities/`
2. **Define interfaces**: `CreateProps`, full `Props`
3. **Implement class**:
   - Private constructor
   - Static `create()` with validation
   - Static `restore()` for deserialization
   - Getters with defensive copying
   - State checks as needed
   - Commands (immutable)
   - `toJSON()` serialization
4. **Create errors** in `errors/` if needed
5. **Create repository interface** in `repositories/`
6. **Write tests** covering ≥95% paths
7. **Export from** `index.ts`

### Adding a New Value Object

1. **Create file** in `value-objects/`
2. **Implement**:
   - Private constructor
   - Static `create()` factory with validation
   - Getters for properties
   - Operations (arithmetic, comparison, formatting)
   - `toJSON()` serialization
3. **Write comprehensive tests** (≥95% coverage)
4. **Export from** `index.ts`

### Adding Domain Errors

1. **Create file** in `errors/`
2. **Extend DomainError**:
   ```typescript
   export class MyError extends DomainError {
     readonly code = 'MY_ERROR_CODE'
     constructor(message: string) { super(message) }
     static scenario(): MyError {
       return new MyError('Description of scenario')
     }
   }
   ```
3. **Export from** `errors/index.ts`

## References

- **Project Structure**: See `/CLAUDE.md` - Clean Architecture rules
- **Testing**: See `/CLAUDE.md` - TDD requirements and coverage targets
- **State Machines**: Study `CampaignStatus.ts`, `SubscriptionStatus.ts`
- **Money Pattern**: Review `Money.ts` for multi-currency implementation
- **Report Aggregation**: Review `Report.ts` for metrics calculation patterns
