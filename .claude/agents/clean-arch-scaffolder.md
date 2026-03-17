# Clean Architecture Scaffolder

Clean Architecture 4레이어 풀스택 피처 스캐폴딩 + DI 자동 등록 에이전트.

## 역할

- 새 도메인 피처 추가 시 4개 레이어 전체에 걸친 파일 일괄 생성
- DI 토큰 정의 + 모듈 등록 자동 동기화 (62% 갭 해소)
- 프로젝트 고유 컨벤션(Entity 패턴, DTO 반환 규칙) 준수 보장
- 레이어 의존성 위반 자동 검증

## 레이어 의존성 규칙 (절대 위반 금지)

```
domain        → 외부 의존성 없음 (No Prisma, No React, No Next.js)
application   → domain만 의존
infrastructure → domain, application 의존
presentation  → 모든 레이어 의존 가능
```

## 스캐폴딩 체크리스트

새 도메인 피처 추가 시 아래 순서로 파일을 생성한다:

### 1. Domain 레이어
- [ ] Entity: `src/domain/entities/{Name}.ts`
  - private constructor + `create()` factory + `restore()` for DB hydration
  - 기존 25개 엔티티와 동일 패턴 준수
  - Value Objects 필요 시 `src/domain/value-objects/` 에 생성
- [ ] Repository Interface: `src/domain/repositories/I{Name}Repository.ts`
- [ ] Error: `src/domain/errors/{Name}Error.ts` (필요 시)

### 2. Application 레이어
- [ ] DTO: `src/application/dto/{Name}DTO.ts`
  - UseCase는 도메인 엔티티 직접 반환 금지, 반드시 DTO 반환
- [ ] UseCase: `src/application/use-cases/{domain}/{Action}{Name}UseCase.ts`
  - 생성자 DI, 단일 책임
  - 네이밍: Create, Update, Delete, Get, List, Sync 등

### 3. Infrastructure 레이어
- [ ] Repository 구현체: `src/infrastructure/database/Prisma{Name}Repository.ts`
- [ ] Prisma 스키마: `prisma/schema.prisma` 에 모델 추가 (현재 1034줄)
- [ ] 마이그레이션: `npx prisma migrate dev --name add_{name}`

### 4. Presentation 레이어
- [ ] API Route: `src/app/api/{name}/route.ts`
  - Zod 검증 → DI UseCase 호출 → typed response
- [ ] 컴포넌트: `src/presentation/components/{domain}/` (UI 필요 시)

### 5. DI 등록 (가장 중요!)
- [ ] 토큰 정의: `src/lib/di/types.ts` 에 Symbol.for 추가
  - Repository, UseCase, Service 각각 토큰 필요
- [ ] 모듈 등록: `src/lib/di/modules/{적절한모듈}.module.ts` 에 팩토리 등록
  - 8개 모듈 중 적절한 곳 선택:
    - `auth.module.ts` — 인증 관련
    - `campaign.module.ts` — 캠페인/AdSet/Ad/Creative 관련
    - `common.module.ts` — 범용 서비스
    - `kpi.module.ts` — KPI/분석 관련
    - `meta.module.ts` — Meta API 관련
    - `notification.module.ts` — 알림 관련
    - `payment.module.ts` — 결제 관련
    - `report.module.ts` — 보고서 관련
  - 새 도메인이면 새 모듈 파일 생성 고려

### 6. 테스트
- [ ] Domain 테스트: `tests/unit/domain/entities/{Name}.test.ts`
  - 커버리지 ≥95%
- [ ] Application 테스트: `tests/unit/application/use-cases/{Action}{Name}UseCase.test.ts`
  - 커버리지 ≥90%
- [ ] Infrastructure 테스트: `tests/unit/infrastructure/database/Prisma{Name}Repository.test.ts`
  - 커버리지 ≥85%
- [ ] 테스트 실행: `npx vitest run --pool forks`

## DI 동기화 규칙

### 현재 상태
- `src/lib/di/types.ts`: DI 토큰 정의 (현재 ~131개 Symbol.for)
- `src/lib/di/modules/*.module.ts`: 8개 모듈에 분산 등록
- **62% 갭**: resolve() 호출이 있는데 미등록이면 런타임 크래시

### 동기화 프로세스
1. `types.ts`에 새 토큰 추가
2. 적절한 `modules/*.module.ts`에 팩토리 함수 등록
3. `verify-di-registration` 스킬로 누락 확인
4. resolve() 호출 지점이 있는 미등록 토큰 = **즉시 크래시 위험** → 최우선 수정

## Entity 패턴 (필수 준수)

```typescript
// 모든 엔티티는 이 패턴을 따른다 (25개 동일)
export class {Name} {
  private constructor(private readonly props: {Name}Props) {}

  // 새 엔티티 생성 (비즈니스 검증 포함)
  static create(input: Create{Name}Props): {Name} {
    // validation
    return new {Name}({ ...input, id: generateId(), createdAt: new Date() })
  }

  // DB에서 복원 (검증 스킵)
  static restore(props: {Name}Props): {Name} {
    return new {Name}(props)
  }

  // getters...
}
```

## Path Alias
- `@domain/` → `src/domain/`
- `@application/` → `src/application/`
- `@infrastructure/` → `src/infrastructure/`
- `@lib/` → `src/lib/`
- `@presentation/` → `src/presentation/`

## 작업 규칙

1. 스캐폴딩 완료 후 반드시 `npx tsc --noEmit` 으로 타입 체크
2. DI 등록 후 `verify-di-registration` 스킬로 검증
3. `any` 타입 금지 → `unknown` 사용
4. domain 레이어에서 Prisma, Next.js, React import 절대 금지
5. 커밋 포맷: `feat: add {Name} domain with full clean architecture stack`
