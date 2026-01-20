# TCREI 프롬프트 템플릿

> 바투 AI 마케팅 솔루션 전용 구조화된 프롬프트 프레임워크

---

## 1. 도메인 엔티티 생성 (Entity)

### Role (역할)
당신은 DDD와 TypeScript 강타입에 정통한 **"도메인 모델러"**입니다.
불변성과 팩토리 패턴을 적용한 엔티티 설계에 능통합니다.

### Context (맥락)
- **기술 스택**: TypeScript 5.x, Vitest 4
- **아키텍처**: 클린 아키텍처 (domain 계층은 외부 의존성 없음)
- **의존성 규칙**: domain ← application ← infrastructure/presentation
- **기존 패턴**: `src/domain/entities/Campaign.ts` 참조

### Task (업무)
`[EntityName]` 엔티티를 생성해 주세요.

**요구사항**:
1. private constructor + static `create()` 팩토리 메서드
2. static `restore()` 메서드 (영속화 데이터 복원용)
3. 불변성 유지 (모든 상태 변경은 새 인스턴스 반환)
4. 도메인 검증 로직 포함
5. `toJSON()` 직렬화 메서드

### Examples (예시)
```typescript
// src/domain/entities/Campaign.ts
export interface CampaignProps {
  id: string
  name: string
  status: CampaignStatus
  budget: Money
  createdAt: Date
  updatedAt: Date
}

export class Campaign {
  private constructor(private readonly props: CampaignProps) {}

  static create(props: Omit<CampaignProps, 'id' | 'createdAt' | 'updatedAt'>): Campaign {
    if (!props.name || props.name.trim().length < 2) {
      throw new InvalidCampaignError('캠페인 이름은 2자 이상이어야 합니다.')
    }
    return new Campaign({
      ...props,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static restore(props: CampaignProps): Campaign {
    return new Campaign(props)
  }

  changeStatus(newStatus: CampaignStatus): Campaign {
    return new Campaign({
      ...this.props,
      status: newStatus,
      updatedAt: new Date(),
    })
  }

  get id(): string { return this.props.id }
  get name(): string { return this.props.name }
  get status(): CampaignStatus { return this.props.status }

  toJSON(): CampaignProps {
    return { ...this.props }
  }
}
```

### Input/Format (입출력)

**입력**:
- 엔티티명
- 속성 목록
- 비즈니스 규칙

**출력**:
1. `src/domain/entities/[EntityName].ts`
2. `src/domain/errors/Invalid[EntityName]Error.ts`
3. `tests/unit/domain/entities/[EntityName].test.ts`

**TDD 순서**:
```
🔴 RED    → 실패하는 테스트 먼저 작성
🟢 GREEN  → 테스트 통과하는 최소 구현
🔵 REFACTOR → 코드 정리 (테스트 유지)
```

---

## 2. API 엔드포인트 생성 (API)

### Role (역할)
당신은 Next.js 16 App Router와 클린 아키텍처에 정통한 **"API 설계자"**입니다.

### Context (맥락)
- **기술 스택**: Next.js 16.1, TypeScript 5.x
- **인증**: NextAuth.js v5 (`getAuthenticatedUser`)
- **DI**: tsyringe 기반 `container.resolve()`
- **기존 패턴**: `src/app/api/campaigns/route.ts` 참조

### Task (업무)
`[API경로]` `[HTTP메서드]` 엔드포인트를 생성해 주세요.

**요구사항**:
1. 인증 검사 (`getAuthenticatedUser`)
2. 요청 검증 (필수 필드)
3. UseCase 호출 (DI 컨테이너)
4. 에러 핸들링 (도메인 오류 → HTTP 상태)

### Examples (예시)
```typescript
// src/app/api/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/lib/di/container'
import { TYPES } from '@/lib/di/types'
import { getAuthenticatedUser } from '@/infrastructure/auth'
import { CreateCampaignUseCase } from '@/application/use-cases/campaign/CreateCampaignUseCase'
import { InvalidCampaignError } from '@/domain/errors'

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // 필수 필드 검증
    if (!body.name) {
      return NextResponse.json({ error: '캠페인 이름은 필수입니다.' }, { status: 400 })
    }

    const useCase = container.resolve<CreateCampaignUseCase>(TYPES.CreateCampaignUseCase)
    const result = await useCase.execute({
      userId: user.id,
      name: body.name,
      budget: body.budget,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof InvalidCampaignError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const useCase = container.resolve<ListCampaignsUseCase>(TYPES.ListCampaignsUseCase)
  const result = await useCase.execute({ userId: user.id })

  return NextResponse.json(result)
}
```

### Input/Format (입출력)

**입력**:
- API 경로 (예: `/api/campaigns`)
- HTTP 메서드 (GET, POST, PUT, DELETE)
- 요청/응답 스키마

**출력**:
1. `src/app/api/[경로]/route.ts`
2. `src/application/use-cases/[도메인]/[UseCaseName].ts`
3. `src/application/dto/[도메인]/[DTOName].ts`
4. `tests/unit/api/[경로].test.ts`

---

## 3. UI 컴포넌트 생성 (Component)

### Role (역할)
당신은 React 19와 shadcn/ui에 정통한 **"React UI 엔지니어"**입니다.

### Context (맥락)
- **기술 스택**: React 19.2, Next.js 16.1, Tailwind CSS 4
- **컴포넌트 라이브러리**: shadcn/ui
- **상태 관리**: Zustand 5, TanStack Query 5
- **기존 패턴**: `src/presentation/components/campaign/CampaignCard.tsx` 참조

### Task (업무)
`[ComponentName]` 컴포넌트를 생성해 주세요.

**요구사항**:
1. TypeScript Props 인터페이스
2. shadcn/ui 컴포넌트 활용
3. Tailwind CSS 스타일링
4. 접근성 고려 (`aria-*`, `role`)
5. 한국어 라벨/메시지

### Examples (예시)
```typescript
// src/presentation/components/campaign/CampaignCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CampaignCardProps {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  budget?: number
  className?: string
  onClick?: () => void
}

const statusLabels = {
  ACTIVE: '진행 중',
  PAUSED: '일시 중지',
  COMPLETED: '완료',
}

const statusVariants = {
  ACTIVE: 'default',
  PAUSED: 'secondary',
  COMPLETED: 'outline',
} as const

export function CampaignCard({
  id,
  name,
  status,
  budget,
  className,
  onClick,
}: CampaignCardProps) {
  return (
    <Card
      className={cn('cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={onClick}
      role="button"
      aria-label={`${name} 캠페인 상세 보기`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Badge variant={statusVariants[status]}>
          {statusLabels[status]}
        </Badge>
        {budget && (
          <span className="text-sm text-muted-foreground">
            {budget.toLocaleString('ko-KR')}원
          </span>
        )}
      </CardContent>
    </Card>
  )
}
```

### Input/Format (입출력)

**입력**:
- 컴포넌트명
- Props 정의
- 디자인 요구사항

**출력**:
1. `src/presentation/components/[도메인]/[ComponentName].tsx`
2. `tests/unit/presentation/components/[ComponentName].test.tsx`

---

## 4. 버그 수정 (Bugfix)

### Role (역할)
당신은 디버깅과 근본 원인 분석에 정통한 **"TDD 전문가"**입니다.

### Context (맥락)
- **테스트**: Vitest 4, Playwright 1.57
- **테스트 구조**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- **기존 테스트 패턴 참조**

### Task (업무)
`[파일경로]`의 `[문제설명]` 버그를 수정해 주세요.

**필수 순서**:
1. 🔴 버그를 재현하는 실패 테스트 작성
2. 🟢 버그 수정 (테스트 통과)
3. 🔵 회귀 방지 테스트 추가

### Examples (예시)
```typescript
// tests/unit/domain/entities/Campaign.test.ts
import { describe, it, expect } from 'vitest'
import { Campaign } from '@/domain/entities/Campaign'
import { InvalidCampaignError } from '@/domain/errors'

describe('[BUG-123] 캠페인 이름 빈 문자열 허용 버그', () => {
  it('빈 문자열 이름으로 캠페인 생성 시 InvalidCampaignError를 발생시켜야 함', () => {
    // Arrange
    const emptyName = ''

    // Act & Assert
    expect(() =>
      Campaign.create({ name: emptyName, status: 'DRAFT', budget: Money.create(10000) })
    ).toThrow(InvalidCampaignError)
  })

  it('공백만 있는 이름으로 캠페인 생성 시 InvalidCampaignError를 발생시켜야 함', () => {
    // Arrange
    const whitespaceOnlyName = '   '

    // Act & Assert
    expect(() =>
      Campaign.create({ name: whitespaceOnlyName, status: 'DRAFT', budget: Money.create(10000) })
    ).toThrow(InvalidCampaignError)
  })

  it('2자 미만 이름으로 캠페인 생성 시 InvalidCampaignError를 발생시켜야 함', () => {
    // Arrange
    const shortName = 'A'

    // Act & Assert
    expect(() =>
      Campaign.create({ name: shortName, status: 'DRAFT', budget: Money.create(10000) })
    ).toThrow(InvalidCampaignError)
  })

  it('유효한 이름으로 캠페인 생성 시 성공해야 함', () => {
    // Arrange
    const validName = '테스트 캠페인'

    // Act
    const campaign = Campaign.create({
      name: validName,
      status: 'DRAFT',
      budget: Money.create(10000),
    })

    // Assert
    expect(campaign.name).toBe(validName)
  })
})
```

### Input/Format (입출력)

**입력**:
- 버그 위치: `[파일경로:라인번호]`
- 현재 동작: `[잘못된 동작]`
- 기대 동작: `[올바른 동작]`

**출력**:
1. 버그 재현 테스트 (`tests/unit/[해당경로].test.ts`)
2. 수정된 코드
3. 회귀 방지 테스트

---

## 명령어 사용법

### `/tcrei entity` - 도메인 엔티티 생성

```bash
/tcrei entity Order

# 입력 정보:
# - 속성: id, userId, items, totalAmount, status, createdAt
# - 비즈니스 규칙: 주문 금액은 0보다 커야 함, items는 최소 1개 이상
```

### `/tcrei api` - API 엔드포인트 생성

```bash
/tcrei api /api/orders POST

# 입력 정보:
# - 요청 본문: { items: [{ productId, quantity }] }
# - 응답: { orderId, totalAmount, status }
# - 인증: 필수
```

### `/tcrei component` - UI 컴포넌트 생성

```bash
/tcrei component OrderSummaryCard

# 입력 정보:
# - Props: orderId, items, totalAmount, status
# - 디자인: shadcn Card, Badge로 상태 표시
# - 이벤트: onClick으로 상세 페이지 이동
```

### `/tcrei bugfix` - TDD 기반 버그 수정

```bash
/tcrei bugfix src/domain/entities/Order.ts:42 "음수 금액 허용 버그"

# 입력 정보:
# - 현재 동작: 음수 totalAmount로 Order 생성 가능
# - 기대 동작: InvalidOrderError 발생
```

---

## 자동 적용 워크플로우

### `/기능요청` 시 TCREI 자동 적용

1. **요청 분석** → 도메인/API/UI 중 해당 타입 판별
2. **템플릿 선택** → 해당 TCREI 템플릿 로드
3. **컨텍스트 주입** → 기존 코드 패턴 참조
4. **TDD 실행** → RED → GREEN → REFACTOR 순서 적용

### `/버그신고` 시 TCREI bugfix 자동 적용

1. **버그 위치 분석** → 파일 경로 및 라인 번호 파악
2. **실패 테스트 작성** → 버그 재현 케이스 생성
3. **버그 수정** → 테스트 통과하는 최소 수정
4. **회귀 테스트** → 엣지 케이스 추가

---

## 품질 체크리스트

### Entity 품질 기준
- [ ] private constructor 사용
- [ ] static `create()` 팩토리 메서드
- [ ] static `restore()` 복원 메서드
- [ ] 불변성 유지 (상태 변경 시 새 인스턴스)
- [ ] 도메인 검증 로직 포함
- [ ] 테스트 커버리지 ≥95%

### API 품질 기준
- [ ] 인증 검사 적용
- [ ] 요청 검증 로직
- [ ] UseCase 분리 (DI 컨테이너)
- [ ] 도메인 오류 → HTTP 상태 매핑
- [ ] 테스트 커버리지 ≥90%

### Component 품질 기준
- [ ] TypeScript Props 인터페이스
- [ ] shadcn/ui 컴포넌트 활용
- [ ] 접근성 속성 (`aria-*`, `role`)
- [ ] 한국어 라벨/메시지
- [ ] 반응형 디자인

### Bugfix 품질 기준
- [ ] 실패 테스트 먼저 작성
- [ ] 최소한의 코드 변경으로 수정
- [ ] 회귀 방지 테스트 추가
- [ ] 관련 테스트 모두 통과
