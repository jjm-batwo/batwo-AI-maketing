# 바투 AI 마케팅 SaaS - 개선 로드맵 설계서

> **Design Phase** | 작성일: 2026-02-05
> **기반 계획**: docs/01-plan/features/improvement-roadmap.plan.md

---

## 1. 아키텍처 개요

### 1.1 현재 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Components  │  │    Hooks     │  │       Stores         │   │
│  │   (100+)     │  │    (40+)     │  │     (Zustand)        │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Use Cases   │  │   Services   │  │        DTOs          │   │
│  │    (25+)     │  │    (15+)     │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Domain Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Entities   │  │Value Objects │  │    Repositories      │   │
│  │    (15)      │  │    (15)      │  │   (Interfaces)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Database   │  │   External   │  │        Auth          │   │
│  │   (Prisma)   │  │    APIs      │  │     (NextAuth)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 개선 후 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Components  │  │    Hooks     │──┤   RBAC Guard         │   │
│  │   (100+)     │  │(DI 경유만)   │  │   (신규)             │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Use Cases   │  │   Services   │  │  Permission Service  │   │
│  │    (25+)     │  │    (15+)     │  │      (신규)          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Domain Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Entities   │  │Value Objects │  │    Repositories      │   │
│  │ + TeamRole   │  │+ Permission  │  │ + ITeamRoleRepo      │   │
│  │ + ABTestStats│  │+ Significance│  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Database   │  │    Redis     │  │    PDF Templates     │   │
│  │   (Prisma)   │  │   (신규)     │  │      (확장)          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. P0-1: E2E 테스트 커버리지 설계

### 2.1 테스트 아키텍처

```
tests/e2e/
├── fixtures/                    # 테스트 데이터
│   ├── users.json
│   ├── campaigns.json
│   └── meta-accounts.json
│
├── helpers/                     # 유틸리티
│   ├── auth.helper.ts          # 인증 헬퍼
│   ├── api.helper.ts           # API 호출 헬퍼
│   └── mock.helper.ts          # Mock 데이터 헬퍼
│
├── auth/                        # 인증 테스트
│   ├── login.spec.ts           # 로그인 플로우
│   ├── signup.spec.ts          # 회원가입 플로우
│   └── oauth.spec.ts           # OAuth (Google, Kakao, Facebook)
│
├── onboarding/                  # 온보딩 테스트
│   ├── wizard.spec.ts          # 온보딩 위저드 전체 플로우
│   ├── meta-connect.spec.ts    # Meta 계정 연결
│   └── pixel-setup.spec.ts     # 픽셀 설정
│
├── campaigns/                   # 캠페인 테스트
│   ├── list.spec.ts            # 캠페인 목록
│   ├── create.spec.ts          # 캠페인 생성
│   ├── edit.spec.ts            # 캠페인 수정
│   ├── status-change.spec.ts   # 상태 변경 (일시정지/재개)
│   └── delete.spec.ts          # 캠페인 삭제
│
├── dashboard/                   # 대시보드 테스트
│   ├── kpi.spec.ts             # KPI 대시보드
│   ├── charts.spec.ts          # 차트 렌더링
│   └── insights.spec.ts        # AI 인사이트
│
├── ai/                          # AI 기능 테스트
│   ├── copy-generation.spec.ts # 카피 생성
│   └── analysis.spec.ts        # AI 분석
│
├── payment/                     # 결제 테스트
│   ├── subscription.spec.ts    # 구독 플로우
│   ├── billing.spec.ts         # 빌링 관리
│   └── refund.spec.ts          # 환불 플로우
│
└── admin/                       # 관리자 테스트
    ├── users.spec.ts           # 사용자 관리
    └── stats.spec.ts           # 통계 대시보드
```

### 2.2 테스트 시나리오 상세

#### 2.2.1 인증 테스트 (auth/)

```typescript
// login.spec.ts
describe('Login Flow', () => {
  test('이메일/비밀번호 로그인 성공')
  test('잘못된 비밀번호 에러 메시지')
  test('존재하지 않는 이메일 에러')
  test('로그인 후 대시보드 리다이렉트')
  test('세션 만료 후 재로그인')
})

// signup.spec.ts
describe('Signup Flow', () => {
  test('회원가입 폼 유효성 검사')
  test('중복 이메일 체크')
  test('회원가입 성공 후 온보딩 리다이렉트')
  test('약관 동의 필수 체크')
})

// oauth.spec.ts
describe('OAuth Flow', () => {
  test('Google 로그인')
  test('Kakao 로그인')
  test('Facebook 로그인')
})
```

#### 2.2.2 온보딩 테스트 (onboarding/)

```typescript
// wizard.spec.ts
describe('Onboarding Wizard', () => {
  test('Step 1: 환영 화면 표시')
  test('Step 2: Meta 계정 연결')
  test('Step 3: 픽셀 설정')
  test('Step 4: 완료 화면')
  test('스킵 가능한 단계 확인')
  test('진행률 표시 정확성')
})

// meta-connect.spec.ts
describe('Meta Connect', () => {
  test('Meta 로그인 버튼 클릭')
  test('권한 요청 화면 표시')
  test('광고 계정 선택')
  test('연결 성공 메시지')
  test('연결 실패 에러 처리')
})
```

#### 2.2.3 캠페인 테스트 (campaigns/)

```typescript
// create.spec.ts
describe('Campaign Create', () => {
  test('캠페인 생성 폼 표시')
  test('필수 필드 유효성 검사')
  test('예산 범위 검증')
  test('타겟팅 옵션 선택')
  test('AI 카피 생성 통합')
  test('캠페인 생성 성공')
  test('할당량 초과 시 에러')
})

// status-change.spec.ts
describe('Campaign Status', () => {
  test('캠페인 일시정지')
  test('캠페인 재개')
  test('상태 변경 확인 다이얼로그')
  test('Meta API 동기화 확인')
})
```

### 2.3 테스트 헬퍼 설계

```typescript
// helpers/auth.helper.ts
export class AuthHelper {
  // 테스트 사용자로 로그인
  async loginAsTestUser(page: Page): Promise<void>

  // 관리자로 로그인
  async loginAsAdmin(page: Page): Promise<void>

  // 로그아웃
  async logout(page: Page): Promise<void>

  // 세션 쿠키 설정 (빠른 인증)
  async setAuthCookies(page: Page, userId: string): Promise<void>
}

// helpers/api.helper.ts
export class ApiHelper {
  // 테스트 데이터 시딩
  async seedTestData(data: TestData): Promise<void>

  // 테스트 데이터 정리
  async cleanupTestData(): Promise<void>

  // Mock API 응답 설정
  async mockApiResponse(route: string, response: any): Promise<void>
}
```

### 2.4 CI/CD 통합

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: npx prisma migrate deploy

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 3. P0-2: 서비스 계층 아키텍처 검증 ✅ 완료

### 3.1 아키텍처 분석 결과

> **결론**: 현재 아키텍처가 Next.js App Router 패턴에 **올바르게** 구현되어 있음

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Presentation Hooks (useQuery/useMutation)          │    │
│  │  └─> fetch('/api/...')                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server (Node.js)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Routes (/app/api/...)                          │    │
│  │  └─> container.resolve(DI_TOKENS.UseCase)           │    │
│  │      └─> UseCase.execute()                          │    │
│  │          └─> Repository (Prisma)                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 올바른 패턴 (현재 구현)

```typescript
// ✅ 클라이언트 훅: fetch()로 API 호출 (올바름)
// src/presentation/hooks/useDashboardKPI.ts
export const useDashboardKPI = () => {
  return useQuery({
    queryKey: ['dashboard', 'kpi'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/kpi')
      return res.json()
    }
  })
}

// ✅ API 라우트: DI 컨테이너 사용 (올바름)
// src/app/api/dashboard/kpi/route.ts
export async function GET(req: NextRequest) {
  const useCase = container.resolve<GetDashboardKPIUseCase>(
    DI_TOKENS.GetDashboardKPIUseCase
  )
  const result = await useCase.execute(userId)
  return NextResponse.json(result)
}
```

### 3.3 왜 클라이언트에서 DI 컨테이너를 직접 사용하면 안 되는가?

| 이유 | 설명 |
|------|------|
| **서버 전용 모듈** | Prisma, Node.js API는 브라우저에서 실행 불가 |
| **빌드 실패** | `'use client'` 컴포넌트에서 서버 모듈 import 시 빌드 에러 |
| **인증 경계** | 세션/토큰 검증은 서버에서만 안전하게 처리 가능 |
| **보안** | DB 연결 정보 등 민감 정보가 클라이언트에 노출됨 |

### 3.4 훅 상태 검증 결과

| 훅 파일 | 패턴 | 상태 | API 라우트 DI |
|--------|:----:|:----:|:------------:|
| `useDashboardKPI.ts` | fetch() | ✅ 정상 | ✅ 사용 중 |
| `useCampaigns.ts` | fetch() | ✅ 정상 | ✅ 사용 중 |
| `useSync.ts` | fetch() | ✅ 정상 | ✅ 사용 중 |
| `useQuota.ts` | fetch() | ✅ 정상 | ✅ 사용 중 |
| `useMetaConnection.ts` | fetch() | ✅ 정상 | ✅ 사용 중 |

### 3.5 수행한 개선 작업

1. **useQuota.ts 타입 정의 수정**: API 응답과 일치하도록 타입 수정
   - `aiReports` → `aiCopyGen`, `aiAnalysis`
   - Trial 상태 지원 추가
   - 도메인 타입 import 정리

2. **quotaStore.ts 타입 동기화**: 훅과 일관된 타입 사용

### 3.6 결론

**P0-2 작업 완료**: 아키텍처 검토 결과, 현재 구현이 Next.js App Router의 올바른 패턴을 따르고 있음. 추가적인 리팩토링 불필요.

---

## 4. P0-3: 팀 협업 권한 시스템 설계

### 4.1 역할 및 권한 매트릭스

```
┌──────────────┬────────┬────────┬────────┬────────┐
│   권한/역할   │ Owner  │ Admin  │ Editor │ Viewer │
├──────────────┼────────┼────────┼────────┼────────┤
│ 팀 삭제       │   ✅   │   ❌   │   ❌   │   ❌   │
│ 멤버 초대     │   ✅   │   ✅   │   ❌   │   ❌   │
│ 멤버 제거     │   ✅   │   ✅   │   ❌   │   ❌   │
│ 역할 변경     │   ✅   │   ✅   │   ❌   │   ❌   │
│ 설정 변경     │   ✅   │   ✅   │   ❌   │   ❌   │
│ 캠페인 생성   │   ✅   │   ✅   │   ✅   │   ❌   │
│ 캠페인 수정   │   ✅   │   ✅   │   ✅   │   ❌   │
│ 캠페인 삭제   │   ✅   │   ✅   │   ✅   │   ❌   │
│ 보고서 생성   │   ✅   │   ✅   │   ✅   │   ❌   │
│ 대시보드 조회 │   ✅   │   ✅   │   ✅   │   ✅   │
│ 캠페인 조회   │   ✅   │   ✅   │   ✅   │   ✅   │
│ 보고서 조회   │   ✅   │   ✅   │   ✅   │   ✅   │
└──────────────┴────────┴────────┴────────┴────────┘
```

### 4.2 도메인 모델

#### 4.2.1 TeamRole 엔티티

```typescript
// src/domain/entities/TeamRole.ts
export class TeamRole {
  private constructor(
    private readonly _id: string,
    private readonly _name: TeamRoleName,
    private readonly _permissions: Permission[],
    private readonly _createdAt: Date
  ) {}

  static create(props: TeamRoleProps): TeamRole

  get id(): string
  get name(): TeamRoleName
  get permissions(): Permission[]

  hasPermission(permission: Permission): boolean
  canManageRole(targetRole: TeamRole): boolean
}

export type TeamRoleName = 'owner' | 'admin' | 'editor' | 'viewer'
```

#### 4.2.2 Permission 값 객체

```typescript
// src/domain/value-objects/Permission.ts
export class Permission {
  private constructor(
    private readonly _resource: Resource,
    private readonly _action: Action
  ) {}

  static create(resource: Resource, action: Action): Permission
  static fromString(str: string): Permission

  get resource(): Resource
  get action(): Action

  toString(): string
  equals(other: Permission): boolean
}

export type Resource =
  | 'team'
  | 'member'
  | 'campaign'
  | 'report'
  | 'settings'
  | 'dashboard'

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
```

### 4.3 데이터베이스 스키마

```prisma
// prisma/schema.prisma

enum TeamRoleName {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}

model TeamMember {
  id        String       @id @default(cuid())
  teamId    String
  userId    String
  role      TeamRoleName @default(VIEWER)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  team      Team         @relation(fields: [teamId], references: [id])
  user      User         @relation(fields: [userId], references: [id])

  @@unique([teamId, userId])
  @@index([teamId])
  @@index([userId])
}

model TeamInvitation {
  id        String       @id @default(cuid())
  teamId    String
  email     String
  role      TeamRoleName @default(VIEWER)
  token     String       @unique
  expiresAt DateTime
  createdAt DateTime     @default(now())

  team      Team         @relation(fields: [teamId], references: [id])

  @@index([teamId])
  @@index([email])
}
```

### 4.4 API 미들웨어

```typescript
// src/app/api/middleware/permission.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { container } from '@/lib/di/container'

export function withPermission(
  requiredPermission: string,
  handler: (req: NextRequest, context: PermissionContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionService = container.get<IPermissionService>(
      DI_TOKENS.PermissionService
    )

    const teamId = extractTeamId(req)
    const hasPermission = await permissionService.checkPermission(
      session.user.id,
      teamId,
      requiredPermission
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(req, { session, teamId })
  }
}
```

### 4.5 UI 권한 가드

```typescript
// src/presentation/components/common/PermissionGuard.tsx
interface PermissionGuardProps {
  permission: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermission(permission)

  if (isLoading) return <Skeleton />
  if (!hasPermission) return fallback

  return <>{children}</>
}

// 사용 예시
<PermissionGuard permission="campaign:create">
  <CreateCampaignButton />
</PermissionGuard>
```

---

## 5. P1-1: A/B 테스트 통계 분석 설계

### 5.1 통계 분석 모델

```typescript
// src/domain/value-objects/StatisticalSignificance.ts
export class StatisticalSignificance {
  private constructor(
    private readonly _pValue: number,
    private readonly _confidenceLevel: number,
    private readonly _isSignificant: boolean,
    private readonly _confidenceInterval: ConfidenceInterval
  ) {}

  static calculate(
    controlData: ABTestVariantData,
    treatmentData: ABTestVariantData,
    confidenceLevel: number = 0.95
  ): StatisticalSignificance

  get pValue(): number
  get confidenceLevel(): number
  get isSignificant(): boolean
  get confidenceInterval(): ConfidenceInterval

  // 필요한 샘플 크기 계산
  static requiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    power: number = 0.8,
    confidenceLevel: number = 0.95
  ): number
}

interface ConfidenceInterval {
  lower: number
  upper: number
}

interface ABTestVariantData {
  sampleSize: number
  conversions: number
  conversionRate: number
}
```

### 5.2 분석 서비스

```typescript
// src/application/services/ABTestAnalysisService.ts
export class ABTestAnalysisService implements IABTestAnalysisService {
  analyzeTest(testId: string): Promise<ABTestAnalysisResult>

  getWinner(testId: string): Promise<ABTestWinner | null>

  getRequiredSampleSize(
    baselineRate: number,
    mde: number
  ): number

  shouldStopTest(testId: string): Promise<StopTestRecommendation>
}

interface ABTestAnalysisResult {
  controlVariant: VariantResult
  treatmentVariant: VariantResult
  significance: StatisticalSignificance
  recommendation: string
  estimatedTimeToSignificance: number | null
}

interface ABTestWinner {
  variantId: string
  confidenceLevel: number
  uplift: number
}
```

---

## 6. P1-2: PDF 보고서 템플릿 설계

### 6.1 템플릿 구조

```
src/infrastructure/pdf/templates/
├── base/
│   ├── header.tsx              # 공통 헤더
│   ├── footer.tsx              # 공통 푸터
│   └── styles.ts               # 공통 스타일
│
├── daily/
│   └── DailyReportTemplate.tsx # 일간 보고서
│
├── weekly/
│   └── WeeklyReportTemplate.tsx # 주간 보고서
│
├── monthly/
│   └── MonthlyReportTemplate.tsx # 월간 보고서
│
├── campaign/
│   └── CampaignReportTemplate.tsx # 캠페인별 보고서
│
└── executive/
    └── ExecutiveSummaryTemplate.tsx # 경영진 요약
```

### 6.2 템플릿 인터페이스

```typescript
// src/infrastructure/pdf/types.ts
export interface ReportTemplate<T extends ReportData> {
  render(data: T): React.ReactNode
  getStyles(): StyleSheet
  getMetadata(): PDFMetadata
}

export interface PDFMetadata {
  title: string
  author: string
  subject: string
  keywords: string[]
}

// src/infrastructure/pdf/ReportGenerator.ts
export class ReportGenerator {
  async generate<T extends ReportData>(
    template: ReportTemplate<T>,
    data: T
  ): Promise<Buffer>

  async generateAndSave<T extends ReportData>(
    template: ReportTemplate<T>,
    data: T,
    path: string
  ): Promise<string>
}
```

---

## 7. P1-3: Redis 캐싱 레이어 설계

### 7.1 캐싱 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Service   │────▶│    Cache    │
│  (Hooks)    │     │   Layer     │     │   (Redis)   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          │ cache miss         │
                          ▼                    │
                    ┌─────────────┐            │
                    │  Database   │────────────┘
                    │  (Prisma)   │   cache set
                    └─────────────┘
```

### 7.2 캐시 서비스 설계

```typescript
// src/infrastructure/cache/RedisCacheService.ts
export class RedisCacheService implements ICacheService {
  private client: Redis

  constructor(config: RedisConfig) {
    this.client = new Redis(config)
  }

  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async delete(key: string): Promise<void>
  async deletePattern(pattern: string): Promise<void>

  // 캐시-어사이드 패턴
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T>
}

// src/infrastructure/cache/CacheKeys.ts
export const CacheKeys = {
  // KPI 대시보드
  dashboardKPI: (userId: string, date: string) =>
    `kpi:dashboard:${userId}:${date}`,

  // 캠페인 목록
  campaignList: (userId: string) =>
    `campaigns:list:${userId}`,

  // 사용자 할당량
  userQuota: (userId: string) =>
    `quota:${userId}`,

  // AI 인사이트
  aiInsights: (userId: string) =>
    `insights:${userId}`,
} as const

export const CacheTTL = {
  dashboardKPI: 5 * 60,    // 5분
  campaignList: 60,        // 1분
  userQuota: 30,           // 30초
  aiInsights: 10 * 60,     // 10분
} as const
```

### 7.3 캐시 무효화 전략

```typescript
// src/infrastructure/cache/CacheInvalidator.ts
export class CacheInvalidator {
  constructor(private cache: ICacheService) {}

  // 캠페인 변경 시
  async onCampaignChange(userId: string): Promise<void> {
    await Promise.all([
      this.cache.delete(CacheKeys.campaignList(userId)),
      this.cache.deletePattern(`kpi:dashboard:${userId}:*`),
    ])
  }

  // 할당량 변경 시
  async onQuotaChange(userId: string): Promise<void> {
    await this.cache.delete(CacheKeys.userQuota(userId))
  }

  // 데이터 동기화 시
  async onSync(userId: string): Promise<void> {
    await Promise.all([
      this.cache.deletePattern(`kpi:*:${userId}:*`),
      this.cache.deletePattern(`campaigns:*:${userId}`),
      this.cache.deletePattern(`insights:${userId}`),
    ])
  }
}
```

---

## 8. 구현 순서 및 의존성

```
┌─────────────────────────────────────────────────────────────┐
│                     Phase 1 (Week 1-2)                       │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ P0-2: 훅 수정    │    │ P0-1: E2E 테스트 (인증, 온보딩) │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Phase 2 (Week 3-4)                       │
│  ┌───────────────────────────┐  ┌─────────────────────────┐ │
│  │ P0-1: E2E (캠페인, 대시보드)│  │ P0-3: 권한 시스템 설계  │ │
│  └───────────────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Phase 3 (Week 5-6)                       │
│  ┌───────────────────────────┐  ┌─────────────────────────┐ │
│  │ P0-3: 권한 시스템 구현     │  │ P0-1: E2E (AI, 결제)    │ │
│  └───────────────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Phase 4 (Week 7-8)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ P1-1: A/B   │  │ P1-2: PDF   │  │ P1-3: Redis 캐싱    │  │
│  │ 테스트 통계  │  │ 템플릿 확장  │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Phase 5 (Week 9-10)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ P2-1: 컴포넌트   │  │ P2-2: API 문서화 │  │ 최종 검증   │  │
│  │ 테스트          │  │ (OpenAPI)       │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 검증 기준

### 9.1 단계별 완료 조건

| Phase | 완료 조건 |
|-------|----------|
| Phase 1 | 모든 훅 DI 경유, 인증/온보딩 E2E 통과 |
| Phase 2 | 캠페인/대시보드 E2E 통과, 권한 스키마 완료 |
| Phase 3 | 권한 시스템 동작, AI/결제 E2E 통과 |
| Phase 4 | 통계 분석 정확성 검증, 캐시 히트율 80%+ |
| Phase 5 | 전체 테스트 통과, API 문서 완성 |

### 9.2 최종 성공 지표

| 지표 | 목표 | 측정 방법 |
|------|:----:|----------|
| Match Rate | 95% | `/pdca analyze` |
| E2E 커버리지 | 100% | 핵심 플로우 기준 |
| 빌드 성공률 | 100% | CI/CD |
| 캐시 히트율 | 80%+ | Redis 모니터링 |
| API 응답시간 | < 200ms | p95 기준 |

---

## 10. 다음 단계

설계 문서가 완료되었습니다. 구현을 시작하려면:

```bash
# 구현 가이드 확인
/pdca do improvement-roadmap

# 또는 개별 기능 구현
/pdca do e2e-test-coverage
/pdca do service-layer-hooks
/pdca do team-permission-system
```

---

*이 설계는 Plan 문서(improvement-roadmap.plan.md)를 기반으로 작성되었습니다.*
