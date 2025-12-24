# Implementation Plan: 바투 AI 마케팅 솔루션 MVP

**Status**: ⏳ Pending
**Started**: 2025-12-23
**Last Updated**: 2025-12-23
**Estimated Completion**: 2025-12-26 (3일)

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 Overview

### Feature Description
**바투**는 커머스 사업자를 위한 올인원 AI 마케팅 대행 솔루션입니다.

마케팅 지식이 없어도 AI가 광고 캠페인 세팅부터 성과 분석까지 전 과정을 지원하여, 누구나 쉽게 온라인 광고(메타)를 직접 운영할 수 있습니다.

**MVP 범위**:
- 메타 광고 캠페인 세팅
- 기본 KPI 대시보드
- 주간 보고서 자동화

### Success Criteria
- [ ] 사용자가 Meta Ads 계정을 연결할 수 있다
- [ ] AI 가이드로 캠페인을 생성하고 Meta에 발행할 수 있다
- [ ] 실시간 KPI 대시보드에서 ROAS, CPA, CTR을 확인할 수 있다
- [ ] 주간 보고서가 자동 생성되고 AI 인사이트가 포함된다
- [ ] 모든 핵심 기능에 대한 테스트 커버리지 80% 이상

### User Impact
- **진입 장벽 제거**: 마케팅 지식 없이도 AI 가이드로 바로 시작
- **비용 절감**: 대행사 수수료 없이 직접 운영
- **시간 절약**: 보고서 자동화, 인사이트 자동 도출
- **투명한 성과 관리**: 내 광고비가 어디에 쓰이는지 직접 확인

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **클린 아키텍처 4계층** | 관심사 분리, 테스트 용이성, 유지보수성 | 초기 설정 복잡도 증가 |
| **Next.js 15 App Router** | Server Components, 풀스택 지원, Vercel 최적화 | 새로운 패턴 학습 필요 |
| **Prisma ORM** | 타입 안전성, 자동 마이그레이션, 직관적 API | Raw SQL 대비 성능 오버헤드 |
| **NextAuth.js v5** | Next.js 네이티브 통합, 다양한 프로바이더 | 커스터마이징 제한 |
| **Zustand + TanStack Query** | 경량 상태관리, 서버 상태 캐싱 최적화 | Redux 대비 미들웨어 제한 |
| **Vitest** | Jest 호환, 빠른 실행, ESM 네이티브 지원 | Jest 대비 생태계 작음 |

### 클린 아키텍처 구조

```
src/
├── domain/                    # Domain Layer (핵심 비즈니스 로직)
│   ├── entities/              # Campaign, Report, KPI, User
│   ├── value-objects/         # Money, DateRange, Percentage
│   ├── repositories/          # 리포지토리 인터페이스 (포트)
│   ├── services/              # 도메인 서비스
│   └── errors/                # 도메인 에러
│
├── application/               # Application Layer (유스케이스)
│   ├── use-cases/             # CreateCampaign, GenerateReport, GetKPI
│   ├── dto/                   # Data Transfer Objects
│   └── ports/                 # 외부 서비스 인터페이스
│
├── infrastructure/            # Infrastructure Layer (어댑터)
│   ├── database/              # Prisma 리포지토리 구현체
│   ├── external/              # Meta Ads, OpenAI 어댑터
│   └── auth/                  # NextAuth 설정
│
├── presentation/              # Presentation Layer (UI)
│   ├── components/            # React 컴포넌트
│   ├── hooks/                 # 커스텀 훅
│   └── stores/                # Zustand 스토어
│
├── app/                       # Next.js App Router
│   ├── (auth)/                # 인증 라우트
│   ├── (dashboard)/           # 메인 앱 라우트
│   ├── api/                   # API Routes
│   └── actions/               # Server Actions
│
└── lib/                       # 유틸리티, DI 컨테이너
```

---

## 📦 Dependencies

### Required Before Starting
- [ ] Node.js 20+ 설치
- [ ] PostgreSQL 15+ 설치 (또는 Docker)
- [ ] Meta Developer 계정 및 앱 생성
- [ ] OpenAI API 키 발급

### External Dependencies

**Core Framework**
- `next`: 15.x
- `react`: 19.x
- `typescript`: 5.x

**Database & ORM**
- `prisma`: 6.x
- `@prisma/client`: 6.x

**Authentication**
- `next-auth`: 5.x (beta)
- `@auth/prisma-adapter`: 2.x

**UI Components**
- `tailwindcss`: 3.x
- `@radix-ui/*`: latest (shadcn/ui)
- `lucide-react`: latest
- `recharts`: 2.x

**State Management**
- `zustand`: 5.x
- `@tanstack/react-query`: 5.x

**External APIs**
- `openai`: 4.x
- Meta Marketing API v18.0

**Testing**
- `vitest`: 2.x
- `@testing-library/react`: 16.x
- `@playwright/test`: 1.x
- `msw`: 2.x

**Development**
- `eslint`: 9.x
- `prettier`: 3.x

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥90% | Domain 엔티티, Value Objects, 유스케이스 |
| **Integration Tests** | ≥80% | Repository 구현체, API 연동 |
| **E2E Tests** | 100% 주요 시나리오 | 인증, 캠페인 생성, 대시보드 |

### Test File Organization
```
tests/
├── unit/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Campaign.test.ts
│   │   │   ├── Report.test.ts
│   │   │   └── KPI.test.ts
│   │   └── value-objects/
│   │       ├── Money.test.ts
│   │       └── DateRange.test.ts
│   ├── application/
│   │   ├── campaign/
│   │   │   └── CreateCampaignUseCase.test.ts
│   │   ├── report/
│   │   │   └── GenerateWeeklyReportUseCase.test.ts
│   │   └── kpi/
│   │       └── GetDashboardKPIUseCase.test.ts
│   └── infrastructure/
│       ├── meta-ads/
│       │   └── MetaAdsClient.test.ts
│       └── openai/
│           └── AIService.test.ts
├── integration/
│   ├── repositories/
│   │   ├── PrismaCampaignRepository.test.ts
│   │   └── PrismaReportRepository.test.ts
│   └── api/
│       ├── campaigns.test.ts
│       └── reports.test.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── campaign-flow.spec.ts
│   └── dashboard.spec.ts
├── fixtures/
│   ├── campaigns.ts
│   └── reports.ts
├── mocks/
│   ├── repositories/
│   ├── services/
│   └── handlers/          # MSW 핸들러
└── setup.ts
```

### Coverage Requirements by Phase
- **Phase 1 (Foundation)**: 프로젝트 설정, 테스트 환경 구축
- **Phase 2 (Domain)**: Domain 엔티티 단위 테스트 (≥95%)
- **Phase 3 (Infrastructure-DB)**: Repository 통합 테스트 (≥90%)
- **Phase 4 (Infrastructure-API)**: 외부 API Mock 테스트 (≥85%)
- **Phase 5 (Application)**: 유스케이스 단위 테스트 (≥90%)
- **Phase 6 (Presentation)**: 컴포넌트 테스트 (≥80%)
- **Phase 7 (Integration)**: E2E 테스트 (100% 주요 시나리오)

### Test Naming Convention
```typescript
// Vitest/Jest 스타일
describe('Campaign', () => {
  describe('create', () => {
    it('should create a campaign with valid data', () => {
      // Arrange → Act → Assert
    })

    it('should throw InvalidCampaignError for negative budget', () => {
      // Arrange → Act → Assert
    })
  })
})
```

---

## 🚀 Implementation Phases

### Phase 1: 프로젝트 기반 설정
**Goal**: 클린 아키텍처 기반 Next.js 15 프로젝트 골격 구축
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 1.1**: 테스트 환경 검증 테스트 작성
  - File(s): `tests/setup.test.ts`
  - Expected: 테스트 실행 환경이 올바르게 구성되었는지 확인
  - Details:
    - Vitest 실행 확인
    - TypeScript 경로 별칭 동작 확인
    - 테스트 유틸리티 함수 동작 확인

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.2**: Next.js 15 프로젝트 생성
  - Command: `npx create-next-app@latest batwo --typescript --tailwind --eslint --app --src-dir`
  - Goal: 기본 Next.js 프로젝트 생성

- [ ] **Task 1.3**: 클린 아키텍처 디렉토리 구조 생성
  - File(s): `src/domain/`, `src/application/`, `src/infrastructure/`, `src/presentation/`
  - Details:
    ```
    mkdir -p src/domain/{entities,value-objects,repositories,services,errors}
    mkdir -p src/application/{use-cases,dto,ports}
    mkdir -p src/infrastructure/{database,external,auth}
    mkdir -p src/presentation/{components,hooks,stores}
    mkdir -p tests/{unit,integration,e2e,fixtures,mocks}
    ```

- [ ] **Task 1.4**: TypeScript Path Alias 설정
  - File(s): `tsconfig.json`
  - Details:
    ```json
    {
      "compilerOptions": {
        "paths": {
          "@domain/*": ["./src/domain/*"],
          "@application/*": ["./src/application/*"],
          "@infrastructure/*": ["./src/infrastructure/*"],
          "@presentation/*": ["./src/presentation/*"],
          "@lib/*": ["./src/lib/*"],
          "@tests/*": ["./tests/*"]
        }
      }
    }
    ```

- [ ] **Task 1.5**: ESLint/Prettier 설정
  - File(s): `.eslintrc.json`, `.prettierrc`
  - Details: import 정렬, 코드 스타일 통일

- [ ] **Task 1.6**: Prisma 초기화
  - Command: `npx prisma init`
  - File(s): `prisma/schema.prisma`, `.env`

- [ ] **Task 1.7**: shadcn/ui 설치
  - Command: `npx shadcn@latest init`
  - Components: Button, Card, Input, Dialog, Form, Table

- [ ] **Task 1.8**: 상태 관리 라이브러리 설치
  - Command: `npm install zustand @tanstack/react-query`

- [ ] **Task 1.9**: 테스트 환경 설정
  - Command: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom msw @playwright/test`
  - File(s): `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`

- [ ] **Task 1.10**: Docker Compose 설정
  - File(s): `docker/docker-compose.yml`
  - Details: 개발용 PostgreSQL, 테스트용 PostgreSQL

- [ ] **Task 1.11**: 환경 변수 템플릿 생성
  - File(s): `.env.example`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 1.12**: 프로젝트 구조 검증 및 정리
  - Files: 전체 프로젝트 구조 리뷰
  - Checklist:
    - [ ] 불필요한 기본 파일 정리
    - [ ] README.md 업데이트
    - [ ] .gitignore 최적화

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 2 until ALL checks pass**

**Build & Tests**:
- [ ] `npm run build` 성공
- [ ] `npm run lint` 에러 없음
- [ ] `npm run type-check` 성공
- [ ] `npm test` 실행 가능

**Code Quality**:
- [ ] ESLint 에러 없음
- [ ] Prettier 포맷 적용됨
- [ ] TypeScript 타입 에러 없음

**Environment**:
- [ ] Docker PostgreSQL 실행 확인
- [ ] Prisma DB 연결 확인 (`npx prisma db push`)
- [ ] 환경 변수 설정 완료

**Validation Commands**:
```bash
# Build
npm run build

# Lint & Type Check
npm run lint
npx tsc --noEmit

# Test Environment
npm test

# Database
docker-compose -f docker/docker-compose.yml up -d
npx prisma db push
```

**Manual Test Checklist**:
- [ ] `npm run dev` 실행 후 localhost:3000 접속 확인
- [ ] 디렉토리 구조가 클린 아키텍처 패턴과 일치

---

### Phase 2: Domain Layer 구현
**Goal**: 핵심 비즈니스 로직과 엔티티 TDD로 구현
**Estimated Time**: 3시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 2.1**: Campaign 엔티티 테스트 작성
  - File(s): `tests/unit/domain/entities/Campaign.test.ts`
  - Expected: Tests FAIL - Campaign 클래스가 존재하지 않음
  - Details:
    ```typescript
    describe('Campaign', () => {
      it('should create a campaign with valid data', () => {})
      it('should throw InvalidCampaignError for negative budget', () => {})
      it('should throw InvalidCampaignError for past start date', () => {})
      it('should change status correctly', () => {})
      it('should calculate remaining budget', () => {})
      it('should be immutable after creation', () => {})
    })
    ```

- [ ] **Test 2.2**: Value Objects 테스트 작성
  - File(s): `tests/unit/domain/value-objects/Money.test.ts`, `DateRange.test.ts`
  - Expected: Tests FAIL
  - Details:
    ```typescript
    // Money.test.ts
    describe('Money', () => {
      it('should create money with valid amount', () => {})
      it('should add two money values with same currency', () => {})
      it('should throw for different currencies', () => {})
      it('should be immutable', () => {})
      it('should format to locale string', () => {})
    })

    // DateRange.test.ts
    describe('DateRange', () => {
      it('should create valid date range', () => {})
      it('should throw for end before start', () => {})
      it('should calculate duration in days', () => {})
      it('should check if date is within range', () => {})
    })
    ```

- [ ] **Test 2.3**: KPI 엔티티 테스트 작성
  - File(s): `tests/unit/domain/entities/KPI.test.ts`
  - Expected: Tests FAIL
  - Details:
    ```typescript
    describe('KPI', () => {
      it('should calculate ROAS correctly', () => {})
      it('should calculate CPA correctly', () => {})
      it('should calculate CTR correctly', () => {})
      it('should handle zero impressions for CTR', () => {})
      it('should handle zero conversions for CPA', () => {})
      it('should aggregate multiple snapshots', () => {})
    })
    ```

- [ ] **Test 2.4**: Report 엔티티 테스트 작성
  - File(s): `tests/unit/domain/entities/Report.test.ts`
  - Expected: Tests FAIL
  - Details:
    ```typescript
    describe('Report', () => {
      it('should create weekly report', () => {})
      it('should add sections', () => {})
      it('should add AI insights', () => {})
      it('should calculate summary metrics', () => {})
    })
    ```

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 2.5**: Value Objects 구현
  - File(s):
    - `src/domain/value-objects/Money.ts`
    - `src/domain/value-objects/DateRange.ts`
    - `src/domain/value-objects/Percentage.ts`
    - `src/domain/value-objects/CampaignStatus.ts`
  - Goal: Test 2.2 통과

- [ ] **Task 2.6**: Domain 에러 클래스 구현
  - File(s):
    - `src/domain/errors/DomainError.ts`
    - `src/domain/errors/InvalidCampaignError.ts`
    - `src/domain/errors/BudgetExceededError.ts`

- [ ] **Task 2.7**: Campaign 엔티티 구현
  - File(s): `src/domain/entities/Campaign.ts`
  - Goal: Test 2.1 통과
  - Details:
    ```typescript
    interface CampaignProps {
      id: string
      userId: string
      name: string
      objective: CampaignObjective
      status: CampaignStatus
      dailyBudget: Money
      startDate: Date
      endDate?: Date
      targetAudience?: TargetAudience
      metaCampaignId?: string
    }

    class Campaign {
      static create(props: CreateCampaignProps): Campaign
      changeStatus(newStatus: CampaignStatus): Campaign
      updateBudget(newBudget: Money): Campaign
      setMetaCampaignId(id: string): Campaign
    }
    ```

- [ ] **Task 2.8**: KPI 엔티티 구현
  - File(s): `src/domain/entities/KPI.ts`
  - Goal: Test 2.3 통과

- [ ] **Task 2.9**: Report 엔티티 구현
  - File(s): `src/domain/entities/Report.ts`
  - Goal: Test 2.4 통과

- [ ] **Task 2.10**: Repository 인터페이스 정의
  - File(s):
    - `src/domain/repositories/ICampaignRepository.ts`
    - `src/domain/repositories/IReportRepository.ts`
    - `src/domain/repositories/IKPIRepository.ts`
    - `src/domain/repositories/IUserRepository.ts`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 2.11**: Domain Layer 리팩토링
  - Files: `src/domain/**/*`
  - Checklist:
    - [ ] 중복 코드 제거
    - [ ] 네이밍 일관성 검증
    - [ ] JSDoc 주석 추가
    - [ ] 타입 export 정리 (`src/domain/index.ts`)

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 3 until ALL checks pass**

**TDD Compliance**:
- [ ] 모든 테스트가 먼저 작성되고 실패했음을 확인
- [ ] 구현 후 모든 테스트 통과
- [ ] 리팩토링 후에도 테스트 통과

**Build & Tests**:
- [ ] `npm test -- --coverage` Domain Layer ≥95%
- [ ] 모든 단위 테스트 통과
- [ ] 테스트 실행 시간 < 10초

**Code Quality**:
- [ ] ESLint 에러 없음
- [ ] TypeScript 에러 없음
- [ ] 순환 의존성 없음 (Domain Layer는 외부 의존성 없음)

**Validation Commands**:
```bash
# Run Domain tests only
npm test -- tests/unit/domain

# Coverage check
npm test -- --coverage --coverageReporters=text

# Check for circular dependencies
npx madge --circular src/domain
```

**Manual Test Checklist**:
- [ ] Domain 엔티티가 외부 라이브러리 의존성 없음 확인
- [ ] 모든 Value Object가 불변성 유지

---

### Phase 3: Infrastructure Layer - 데이터베이스
**Goal**: Prisma 기반 데이터 영속성 계층 구현
**Estimated Time**: 3시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 3.1**: PrismaCampaignRepository 통합 테스트 작성
  - File(s): `tests/integration/repositories/PrismaCampaignRepository.test.ts`
  - Expected: Tests FAIL - Repository가 존재하지 않음
  - Details:
    ```typescript
    describe('PrismaCampaignRepository', () => {
      it('should save and retrieve campaign', async () => {})
      it('should find campaigns by user id', async () => {})
      it('should update campaign', async () => {})
      it('should delete campaign', async () => {})
      it('should return null for non-existent campaign', async () => {})
    })
    ```

- [ ] **Test 3.2**: PrismaReportRepository 통합 테스트 작성
  - File(s): `tests/integration/repositories/PrismaReportRepository.test.ts`
  - Expected: Tests FAIL

- [ ] **Test 3.3**: PrismaKPIRepository 통합 테스트 작성
  - File(s): `tests/integration/repositories/PrismaKPIRepository.test.ts`
  - Expected: Tests FAIL

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 3.4**: Prisma 스키마 설계
  - File(s): `prisma/schema.prisma`
  - Details:
    ```prisma
    model User {
      id            String    @id @default(cuid())
      email         String    @unique
      name          String?
      campaigns     Campaign[]
      metaAccount   MetaAdAccount?
      createdAt     DateTime  @default(now())
      updatedAt     DateTime  @updatedAt
    }

    model Campaign {
      id             String           @id @default(cuid())
      userId         String
      user           User             @relation(fields: [userId], references: [id])
      metaCampaignId String?
      name           String
      objective      CampaignObjective
      status         CampaignStatus
      dailyBudget    Decimal          @db.Decimal(10, 2)
      currency       String           @default("KRW")
      startDate      DateTime
      endDate        DateTime?
      targetAudience Json?
      kpiSnapshots   KPISnapshot[]
      reports        Report[]
      createdAt      DateTime         @default(now())
      updatedAt      DateTime         @updatedAt
    }

    // ... (KPISnapshot, Report, MetaAdAccount 등)
    ```

- [ ] **Task 3.5**: 마이그레이션 실행
  - Command: `npx prisma migrate dev --name init`

- [ ] **Task 3.6**: Entity ↔ Model Mapper 구현
  - File(s):
    - `src/infrastructure/database/mappers/CampaignMapper.ts`
    - `src/infrastructure/database/mappers/ReportMapper.ts`
    - `src/infrastructure/database/mappers/KPIMapper.ts`

- [ ] **Task 3.7**: PrismaCampaignRepository 구현
  - File(s): `src/infrastructure/database/repositories/PrismaCampaignRepository.ts`
  - Goal: Test 3.1 통과

- [ ] **Task 3.8**: PrismaReportRepository 구현
  - File(s): `src/infrastructure/database/repositories/PrismaReportRepository.ts`
  - Goal: Test 3.2 통과

- [ ] **Task 3.9**: PrismaKPIRepository 구현
  - File(s): `src/infrastructure/database/repositories/PrismaKPIRepository.ts`
  - Goal: Test 3.3 통과

- [ ] **Task 3.10**: 테스트 데이터베이스 설정
  - File(s): `docker/docker-compose.yml`, `tests/integration/setup.ts`
  - Details: 테스트 격리 (트랜잭션 롤백)

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 3.11**: Repository 코드 리팩토링
  - Checklist:
    - [ ] 공통 로직 추출 (BaseRepository)
    - [ ] 에러 핸들링 일관성
    - [ ] 쿼리 최적화 (N+1 방지)

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 4 until ALL checks pass**

**TDD Compliance**:
- [ ] 통합 테스트가 먼저 작성됨
- [ ] 모든 Repository 테스트 통과
- [ ] 테스트 격리 확인 (병렬 실행 가능)

**Build & Tests**:
- [ ] 마이그레이션 성공
- [ ] 모든 통합 테스트 통과
- [ ] 테스트 커버리지 ≥90%

**Code Quality**:
- [ ] N+1 쿼리 없음
- [ ] 트랜잭션 처리 올바름
- [ ] Mapper 변환 정확성

**Validation Commands**:
```bash
# Database setup
docker-compose -f docker/docker-compose.yml up -d postgres-test
npx prisma migrate dev

# Run integration tests
npm test -- tests/integration/repositories

# Check for N+1 queries (manual review)
npx prisma studio
```

**Manual Test Checklist**:
- [ ] Prisma Studio에서 모델 관계 확인
- [ ] CRUD 작업 수동 테스트

---

### Phase 4: Infrastructure Layer - 외부 API
**Goal**: Meta Ads API 및 OpenAI API 어댑터 구현
**Estimated Time**: 4시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 4.1**: MetaAdsClient 테스트 작성
  - File(s): `tests/unit/infrastructure/meta-ads/MetaAdsClient.test.ts`
  - Expected: Tests FAIL
  - Details:
    ```typescript
    describe('MetaAdsClient', () => {
      it('should create campaign on Meta Ads', async () => {})
      it('should get campaign by id', async () => {})
      it('should get campaign insights', async () => {})
      it('should handle rate limit error', async () => {})
      it('should handle auth error', async () => {})
      it('should retry on transient errors', async () => {})
    })
    ```

- [ ] **Test 4.2**: AIService 테스트 작성
  - File(s): `tests/unit/infrastructure/openai/AIService.test.ts`
  - Expected: Tests FAIL
  - Details:
    ```typescript
    describe('AIService', () => {
      it('should generate campaign optimization suggestions', async () => {})
      it('should generate report insights', async () => {})
      it('should generate ad copy variants', async () => {})
      it('should handle API error gracefully', async () => {})
      it('should respect token limits', async () => {})
    })
    ```

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 4.3**: MSW 핸들러 설정
  - File(s): `tests/mocks/handlers/meta-ads.ts`, `tests/mocks/handlers/openai.ts`
  - Details: Meta API, OpenAI API Mock 응답

- [ ] **Task 4.4**: MetaAdsClient 구현
  - File(s): `src/infrastructure/external/meta-ads/MetaAdsClient.ts`
  - Goal: Test 4.1 통과

- [ ] **Task 4.5**: MetaAdsService 구현 (IMetaAdsService)
  - File(s): `src/infrastructure/external/meta-ads/MetaAdsService.ts`
  - Details: Port 인터페이스 구현

- [ ] **Task 4.6**: AIService 구현 (IAIService)
  - File(s): `src/infrastructure/external/openai/AIService.ts`
  - Goal: Test 4.2 통과

- [ ] **Task 4.7**: 프롬프트 템플릿 작성
  - File(s):
    - `src/infrastructure/external/openai/prompts/campaignOptimization.ts`
    - `src/infrastructure/external/openai/prompts/reportInsight.ts`
    - `src/infrastructure/external/openai/prompts/adCopyGeneration.ts`

- [ ] **Task 4.8**: 에러 핸들링 및 재시도 로직
  - File(s):
    - `src/infrastructure/external/errors/ExternalServiceError.ts`
    - `src/lib/utils/retry.ts`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 4.9**: 외부 API 코드 리팩토링
  - Checklist:
    - [ ] 공통 HTTP 클라이언트 추출
    - [ ] 에러 타입 세분화
    - [ ] 로깅 추가

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 5 until ALL checks pass**

**TDD Compliance**:
- [ ] MSW Mock 기반 테스트 먼저 작성
- [ ] 모든 테스트 통과
- [ ] 에러 시나리오 테스트 포함

**Build & Tests**:
- [ ] 테스트 커버리지 ≥85%
- [ ] Mock 테스트 전체 통과
- [ ] 타입 안전성 검증

**Code Quality**:
- [ ] 재시도 로직 구현 완료
- [ ] 에러 핸들링 완전성
- [ ] 타입 정의 완료

**Validation Commands**:
```bash
# Run external API tests
npm test -- tests/unit/infrastructure

# Type check
npx tsc --noEmit
```

**Manual Test Checklist**:
- [ ] Meta API 샌드박스 연결 테스트 (선택적)
- [ ] OpenAI API 연결 테스트 (선택적)

---

### Phase 5: Application Layer - 유스케이스
**Goal**: 비즈니스 로직 유스케이스 TDD 구현
**Estimated Time**: 4시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 5.1**: CreateCampaignUseCase 테스트 작성
  - File(s): `tests/unit/application/campaign/CreateCampaignUseCase.test.ts`
  - Expected: Tests FAIL
  - Details:
    ```typescript
    describe('CreateCampaignUseCase', () => {
      it('should create campaign and sync to Meta Ads', async () => {})
      it('should throw error for invalid budget', async () => {})
      it('should throw error for past start date', async () => {})
      it('should save campaign to repository', async () => {})
    })
    ```

- [ ] **Test 5.2**: GenerateWeeklyReportUseCase 테스트 작성
  - File(s): `tests/unit/application/report/GenerateWeeklyReportUseCase.test.ts`
  - Expected: Tests FAIL

- [ ] **Test 5.3**: GetDashboardKPIUseCase 테스트 작성
  - File(s): `tests/unit/application/kpi/GetDashboardKPIUseCase.test.ts`
  - Expected: Tests FAIL

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 5.4**: DTO 정의
  - File(s):
    - `src/application/dto/campaign/CreateCampaignDTO.ts`
    - `src/application/dto/campaign/CampaignDTO.ts`
    - `src/application/dto/report/ReportDTO.ts`
    - `src/application/dto/kpi/DashboardKPIDTO.ts`

- [ ] **Task 5.5**: Port 인터페이스 정의
  - File(s):
    - `src/application/ports/IMetaAdsService.ts`
    - `src/application/ports/IAIService.ts`

- [ ] **Task 5.6**: CreateCampaignUseCase 구현
  - File(s): `src/application/use-cases/campaign/CreateCampaignUseCase.ts`
  - Goal: Test 5.1 통과

- [ ] **Task 5.7**: GetCampaignUseCase, ListCampaignsUseCase 구현
  - File(s):
    - `src/application/use-cases/campaign/GetCampaignUseCase.ts`
    - `src/application/use-cases/campaign/ListCampaignsUseCase.ts`

- [ ] **Task 5.8**: GenerateWeeklyReportUseCase 구현
  - File(s): `src/application/use-cases/report/GenerateWeeklyReportUseCase.ts`
  - Goal: Test 5.2 통과

- [ ] **Task 5.9**: GetDashboardKPIUseCase 구현
  - File(s): `src/application/use-cases/kpi/GetDashboardKPIUseCase.ts`
  - Goal: Test 5.3 통과

- [ ] **Task 5.10**: SyncMetaInsightsUseCase 구현
  - File(s): `src/application/use-cases/kpi/SyncMetaInsightsUseCase.ts`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 5.11**: 유스케이스 리팩토링
  - Checklist:
    - [ ] 공통 검증 로직 추출
    - [ ] 에러 메시지 일관성
    - [ ] DTO 변환 로직 최적화

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 6 until ALL checks pass**

**TDD Compliance**:
- [ ] Mock Repository/Service 기반 테스트
- [ ] 모든 유스케이스 테스트 통과
- [ ] 비즈니스 규칙 검증 완료

**Build & Tests**:
- [ ] 테스트 커버리지 ≥90%
- [ ] 모든 단위 테스트 통과

**Code Quality**:
- [ ] DTO 변환 정확성
- [ ] 에러 전파 올바름
- [ ] 의존성 주입 패턴 준수

**Validation Commands**:
```bash
# Run application layer tests
npm test -- tests/unit/application

# Coverage check
npm test -- --coverage
```

---

### Phase 6: Presentation Layer - UI
**Goal**: shadcn/ui 기반 사용자 인터페이스 구현
**Estimated Time**: 4시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 6.1**: KPICard 컴포넌트 테스트 작성
  - File(s): `tests/unit/presentation/components/dashboard/KPICard.test.tsx`
  - Expected: Tests FAIL

- [ ] **Test 6.2**: CampaignCreateForm 컴포넌트 테스트 작성
  - File(s): `tests/unit/presentation/components/campaign/CampaignCreateForm.test.tsx`
  - Expected: Tests FAIL

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 6.3**: 공통 레이아웃 컴포넌트
  - File(s):
    - `src/presentation/components/common/Layout/MainLayout.tsx`
    - `src/presentation/components/common/Layout/Sidebar.tsx`
    - `src/presentation/components/common/Layout/Header.tsx`

- [ ] **Task 6.4**: 대시보드 컴포넌트
  - File(s):
    - `src/presentation/components/dashboard/KPICard.tsx`
    - `src/presentation/components/dashboard/KPIChart.tsx`
    - `src/presentation/components/dashboard/CampaignSummaryTable.tsx`

- [ ] **Task 6.5**: 캠페인 컴포넌트
  - File(s):
    - `src/presentation/components/campaign/CampaignList.tsx`
    - `src/presentation/components/campaign/CampaignCard.tsx`
    - `src/presentation/components/campaign/CampaignCreateForm/index.tsx`
    - `src/presentation/components/campaign/CampaignCreateForm/Step1BusinessInfo.tsx`
    - `src/presentation/components/campaign/CampaignCreateForm/Step2TargetAudience.tsx`
    - `src/presentation/components/campaign/CampaignCreateForm/Step3Budget.tsx`
    - `src/presentation/components/campaign/CampaignCreateForm/Step4Review.tsx`

- [ ] **Task 6.6**: 보고서 컴포넌트
  - File(s):
    - `src/presentation/components/report/ReportList.tsx`
    - `src/presentation/components/report/ReportDetail.tsx`

- [ ] **Task 6.7**: React Query 훅
  - File(s):
    - `src/presentation/hooks/useCampaigns.ts`
    - `src/presentation/hooks/useDashboardKPI.ts`
    - `src/presentation/hooks/useReports.ts`

- [ ] **Task 6.8**: Zustand 스토어
  - File(s):
    - `src/presentation/stores/campaignStore.ts`
    - `src/presentation/stores/uiStore.ts`

- [ ] **Task 6.9**: Next.js 페이지 구현
  - File(s):
    - `src/app/(dashboard)/page.tsx`
    - `src/app/(dashboard)/campaigns/page.tsx`
    - `src/app/(dashboard)/campaigns/new/page.tsx`
    - `src/app/(dashboard)/reports/page.tsx`

- [ ] **Task 6.10**: API Routes 구현
  - File(s):
    - `src/app/api/campaigns/route.ts`
    - `src/app/api/campaigns/[id]/route.ts`
    - `src/app/api/reports/route.ts`
    - `src/app/api/kpi/dashboard/route.ts`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 6.11**: UI 코드 리팩토링
  - Checklist:
    - [ ] 컴포넌트 분리 최적화
    - [ ] 접근성 개선
    - [ ] 반응형 디자인 검증

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 7 until ALL checks pass**

**TDD Compliance**:
- [ ] 컴포넌트 테스트 작성 완료
- [ ] 모든 테스트 통과

**Build & Tests**:
- [ ] 테스트 커버리지 ≥80%
- [ ] 컴포넌트 테스트 통과
- [ ] 스냅샷 테스트 통과

**Code Quality**:
- [ ] 접근성 검사 통과 (axe-core)
- [ ] 반응형 디자인 확인
- [ ] 성능 최적화 (React.memo, useMemo)

**Validation Commands**:
```bash
# Run presentation layer tests
npm test -- tests/unit/presentation

# Accessibility check
npm run test:a11y

# Build check
npm run build
```

**Manual Test Checklist**:
- [ ] 대시보드 페이지 UI 확인
- [ ] 캠페인 생성 폼 동작 확인
- [ ] 반응형 레이아웃 확인 (모바일/태블릿/데스크톱)

---

### Phase 7: 인증 및 통합
**Goal**: NextAuth.js v5 인증 및 전체 시스템 통합
**Estimated Time**: 3시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 7.1**: E2E 인증 테스트 작성
  - File(s): `tests/e2e/auth.spec.ts`
  - Expected: Tests FAIL
  - Details:
    ```typescript
    test.describe('Authentication', () => {
      test('should redirect to login when not authenticated', async ({ page }) => {})
      test('should login with credentials', async ({ page }) => {})
      test('should logout successfully', async ({ page }) => {})
    })
    ```

- [ ] **Test 7.2**: E2E 캠페인 플로우 테스트 작성
  - File(s): `tests/e2e/campaign-flow.spec.ts`
  - Expected: Tests FAIL

- [ ] **Test 7.3**: E2E 대시보드 테스트 작성
  - File(s): `tests/e2e/dashboard.spec.ts`
  - Expected: Tests FAIL

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 7.4**: NextAuth.js v5 설정
  - File(s):
    - `src/infrastructure/auth/auth.config.ts`
    - `src/infrastructure/auth/auth.ts`
  - Details: Google, Kakao, Credentials 프로바이더

- [ ] **Task 7.5**: 인증 페이지 구현
  - File(s):
    - `src/app/(auth)/login/page.tsx`
    - `src/app/(auth)/register/page.tsx`
    - `src/app/(auth)/layout.tsx`

- [ ] **Task 7.6**: 미들웨어 설정
  - File(s): `src/middleware.ts`
  - Details: 보호된 라우트 설정

- [ ] **Task 7.7**: Meta Ads OAuth 연동
  - File(s):
    - `src/app/api/meta/callback/route.ts`
    - `src/app/(dashboard)/settings/meta-connect/page.tsx`

- [ ] **Task 7.8**: API Route 인증 적용
  - File(s): 모든 API Routes에 인증 체크 추가

- [ ] **Task 7.9**: 의존성 주입 컨테이너 설정
  - File(s):
    - `src/lib/di/container.ts`
    - `src/lib/di/types.ts`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 7.10**: 전체 시스템 통합 검증
  - Checklist:
    - [ ] 모든 API 엔드포인트 동작 확인
    - [ ] 데이터 흐름 검증
    - [ ] 에러 핸들링 일관성
    - [ ] 로깅 및 모니터링

#### Quality Gate ✋

**⚠️ STOP: This is the FINAL phase - all checks must pass**

**TDD Compliance**:
- [ ] E2E 테스트 먼저 작성
- [ ] 모든 E2E 테스트 통과

**Build & Tests**:
- [ ] 전체 테스트 스위트 통과
- [ ] E2E 테스트 100% 주요 시나리오
- [ ] 빌드 성공

**Security**:
- [ ] 인증 보안 검증
- [ ] CSRF 보호 확인
- [ ] 세션 관리 올바름

**Performance**:
- [ ] Lighthouse 점수 확인
- [ ] LCP < 2.5s
- [ ] FID < 100ms

**Validation Commands**:
```bash
# Run all tests
npm test

# Run E2E tests
npx playwright test

# Build and analyze
npm run build
npx @next/bundle-analyzer

# Lighthouse audit
npx lighthouse http://localhost:3000 --output=html
```

**Manual Test Checklist**:
- [ ] 전체 사용자 플로우 테스트 (회원가입 → 로그인 → Meta 연결 → 캠페인 생성 → 대시보드 확인)
- [ ] 에러 상황 테스트 (잘못된 입력, 네트워크 오류)
- [ ] 모바일 환경 테스트

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Meta API 변경 | Medium | High | 어댑터 패턴으로 격리, API 버전 고정 (v18.0) |
| OpenAI 응답 품질 | Medium | Medium | 프롬프트 버전 관리, 폴백 로직, 응답 검증 |
| 인증 보안 이슈 | Low | High | NextAuth.js 사용, OWASP 가이드라인 준수 |
| 성능 저하 | Medium | Medium | 캐싱 전략, 페이지네이션, React.memo |
| DB 마이그레이션 실패 | Low | High | 마이그레이션 테스트, 롤백 스크립트 준비 |

---

## 🔄 Rollback Strategy

### If Phase 1 Fails
**Steps to revert**:
- 프로젝트 폴더 삭제 후 재생성
- `.env` 파일 백업 확인

### If Phase 2 Fails
**Steps to revert**:
- Git: `git checkout HEAD~1 -- src/domain`
- 테스트 파일도 함께 롤백

### If Phase 3 Fails
**Steps to revert**:
- Prisma: `npx prisma migrate reset`
- Git: `git checkout HEAD~1 -- src/infrastructure/database`

### If Phase 4 Fails
**Steps to revert**:
- Git: `git checkout HEAD~1 -- src/infrastructure/external`
- 환경 변수 API 키 확인

### If Phase 5 Fails
**Steps to revert**:
- Git: `git checkout HEAD~1 -- src/application`

### If Phase 6 Fails
**Steps to revert**:
- Git: `git checkout HEAD~1 -- src/presentation src/app`

### If Phase 7 Fails
**Steps to revert**:
- Git: `git checkout HEAD~1`
- NextAuth 설정 초기화

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ⏳ 0%
- **Phase 2**: ⏳ 0%
- **Phase 3**: ⏳ 0%
- **Phase 4**: ⏳ 0%
- **Phase 5**: ⏳ 0%
- **Phase 6**: ⏳ 0%
- **Phase 7**: ⏳ 0%

**Overall Progress**: 0% complete

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1 | 2 hours | - | - |
| Phase 2 | 3 hours | - | - |
| Phase 3 | 3 hours | - | - |
| Phase 4 | 4 hours | - | - |
| Phase 5 | 4 hours | - | - |
| Phase 6 | 4 hours | - | - |
| Phase 7 | 3 hours | - | - |
| **Total** | 23 hours | - | - |

---

## 📝 Notes & Learnings

### Implementation Notes
- (구현 중 발견한 인사이트 기록)

### Blockers Encountered
- (발생한 블로커와 해결 방법 기록)

### Improvements for Future Plans
- (다음에 개선할 점 기록)

---

## 📚 References

### Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js v5 Docs](https://authjs.dev/)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Related Issues
- PRD.md: 제품 요구사항 문서

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All phases completed with quality gates passed
- [ ] Full integration testing performed
- [ ] Documentation updated (README.md)
- [ ] Performance benchmarks meet targets (LCP < 2.5s)
- [ ] Security review completed
- [ ] Accessibility requirements met
- [ ] All stakeholders notified
- [ ] Plan document archived for future reference

---

**Plan Status**: ⏳ Pending
**Next Action**: Phase 1 시작 - 프로젝트 기반 설정
**Blocked By**: None
