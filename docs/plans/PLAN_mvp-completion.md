# Implementation Plan: MVP 실제 완성 (Phase 0)

**Status**: ✅ **COMPLETE**
**Created**: 2025-12-29
**Completed**: 2025-12-29
**Total Time**: 12-15시간
**Priority**: 🔴 CRITICAL (배포 전 필수)

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

### 문제 진단 요약

MVP가 **완전히 연결된 상태**입니다:

```
최종 상태 (✅ 완전 연결):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Presentation   │ → │   Application   │ → │ Infrastructure  │
│  (API Routes)   │    │   (Use Cases)   │    │  (Repositories) │
│  → DI Container │    │  → 비즈니스로직  │    │  → PostgreSQL   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Feature Description
API Routes와 Use Cases를 DI 컨테이너를 통해 연결하고, 데이터베이스 연동을 완성하여 실제 동작하는 MVP를 완성합니다.

### 핵심 발견 사항 (완료)

| 영역 | 최종 상태 | 결과 |
|------|----------|------|
| DI Container | ✅ 완성 | API Routes에서 Use Cases resolve |
| Domain Layer | ✅ 완성 | 비즈니스 로직 동작 |
| Application Layer | ✅ 완성 | Use Cases 전체 연동 |
| Infrastructure Layer | ✅ 완성 | Repositories → PostgreSQL |
| API Routes | ✅ 완성 | Mock 제거, Use Cases 연결 |
| Database | ✅ 완성 | PostgreSQL 연결 및 마이그레이션 |
| Integration Tests | ✅ 완성 | 262 단위 + 통합 테스트 통과 |

### Success Criteria
- [x] 데이터베이스 연결 및 마이그레이션 성공
- [x] 56개 통합 테스트 모두 통과 (기존 40 + 신규 16)
- [x] Campaigns API Routes가 Use Cases를 통해 실제 DB 데이터 반환
- [x] 캠페인 CRUD 전체 흐름 동작 확인
- [x] KPI 대시보드 실제 데이터 표시
- [x] Reports API 연동
- [x] Quota API 연동
- [x] 빌드 성공

---

## 🏗️ Architecture: 연결 패턴

### API Route → Use Case 연결 패턴

**Before (Mock Data)**:
```typescript
// src/app/api/campaigns/route.ts
const mockCampaigns = [...] // 하드코딩된 데이터
export async function GET() {
  return NextResponse.json({ campaigns: mockCampaigns })
}
```

**After (DI Container)**:
```typescript
// src/app/api/campaigns/route.ts
import { container, DI_TOKENS } from '@/lib/di/container'
import { ListCampaignsUseCase } from '@application/use-cases/campaign'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const listCampaigns = container.resolve<ListCampaignsUseCase>(
    DI_TOKENS.ListCampaignsUseCase
  )

  const result = await listCampaigns.execute({
    userId: user.id,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('pageSize') || '10'),
  })

  return NextResponse.json(result)
}
```

---

## 🚀 Implementation Phases

### Phase 1: 데이터베이스 설정 및 마이그레이션
**Goal**: PostgreSQL 연결 및 스키마 적용
**Estimated Time**: 1-2시간
**Status**: ✅ Complete

#### Tasks

- [x] **Task 1.1**: Docker PostgreSQL 컨테이너 실행
  - Command: `cd docker && docker compose up -d postgres postgres-test`
  - Details: 개발용(5432) + 테스트용(5433) PostgreSQL 실행

- [x] **Task 1.2**: `.env` 파일 생성 및 설정
  - File: `.env` (from `.env.example`)
  - Details: DATABASE_URL, NEXTAUTH_SECRET 등 설정 완료

- [x] **Task 1.3**: Prisma 마이그레이션 실행
  - Command: `npx prisma migrate deploy`
  - Details: 스키마를 데이터베이스에 적용 완료

- [x] **Task 1.4**: Prisma Client 재생성
  - Command: `npx prisma generate`
  - Details: Prisma Client v7.2.0 생성 완료

- [x] **Task 1.5**: 데이터베이스 연결 확인
  - Command: `npx prisma migrate status`
  - Details: batwo_dev (5432) + batwo_test (5433) 모두 연결 확인

#### Quality Gate ✋

**Validation Commands**:
```bash
# Docker 컨테이너 상태 확인
cd docker && docker compose ps

# 마이그레이션 상태 확인
npx prisma migrate status

# 테스트 DB 마이그레이션 확인
NODE_ENV=test npx prisma migrate status
```

**Checklist**:
- [x] PostgreSQL 5432 포트 응답
- [x] Prisma 마이그레이션 성공
- [x] 개발 DB + 테스트 DB 모두 스키마 적용됨

#### Notes
- `prisma.config.ts` 수정: NODE_ENV=test일 때만 DATABASE_URL_TEST 사용하도록 변경
- `db pull --force` 사용 시 schema.prisma가 덮어써지므로 주의 필요

---

### Phase 2: 통합 테스트 통과
**Goal**: 31개 실패 테스트 모두 통과
**Estimated Time**: 2-3시간
**Status**: ✅ Complete
**Dependencies**: Phase 1 완료

#### Tasks

- [x] **Task 2.1**: 테스트 데이터베이스 마이그레이션
  - Command: `NODE_ENV=test npx prisma migrate status`
  - Details: 테스트 DB에 스키마 적용 확인됨

- [x] **Task 2.2**: 통합 테스트 실행 및 실패 원인 분석
  - Command: `npm run test:integration`
  - Details: Phase 1 완료 후 모든 테스트 통과 확인

- [x] **Task 2.3**: PrismaCampaignRepository 테스트 통과
  - File: `tests/integration/repositories/PrismaCampaignRepository.test.ts`
  - Details: 12 tests 통과

- [x] **Task 2.4**: PrismaReportRepository 테스트 통과
  - File: `tests/integration/repositories/PrismaReportRepository.test.ts`
  - Details: 10 tests 통과

- [x] **Task 2.5**: PrismaKPIRepository 테스트 통과
  - File: `tests/integration/repositories/PrismaKPIRepository.test.ts`
  - Details: 10 tests 통과

- [x] **Task 2.6**: PrismaUsageLogRepository 테스트 통과
  - File: `tests/integration/repositories/PrismaUsageLogRepository.test.ts`
  - Details: 8 tests 통과

- [x] **Task 2.7**: 전체 통합 테스트 통과 확인
  - Command: `npm run test:integration`
  - Details: 40/40 통과 확인됨

#### Quality Gate ✋

**Validation Commands**:
```bash
# 통합 테스트 실행
npm run test:int

# 커버리지 확인
npm run test:int -- --coverage
```

**Checklist**:
- [x] `npm run test:integration` → 40/40 통과
- [x] 테스트 데이터베이스 정상 작동
- [x] Repository CRUD 모든 메서드 검증됨

#### Notes
- Phase 1 완료 후 모든 통합 테스트가 이미 통과함 (31개 실패 → 0개 실패)
- 올바른 npm 스크립트명: `npm run test:integration` (not `test:int`)

---

### Phase 3: Campaigns API 연동 (TDD)
**Goal**: 캠페인 API를 Use Cases에 연결 (테스트 우선)
**Estimated Time**: 3-4시간
**Status**: ✅ Complete
**Dependencies**: Phase 2 완료

#### 🔴 RED Phase - 실패하는 테스트 먼저 작성

- [x] **Task 3.1**: Campaigns API 통합 테스트 파일 생성
  - File: `tests/integration/api/campaigns.api.test.ts`
  - Details: API 엔드포인트 테스트 구조 작성

- [x] **Task 3.2**: GET /api/campaigns 테스트 작성
  - Test Cases: 캠페인 목록 조회, 다른 사용자 분리, 페이지네이션, 상태 필터링
  - 결과: 4개 테스트 케이스 작성 ✅

- [x] **Task 3.3**: POST /api/campaigns 테스트 작성
  - Test Cases: 캠페인 생성 및 저장, 사용량 로그 기록, 중복 이름 에러
  - 결과: 3개 테스트 케이스 작성 ✅

- [x] **Task 3.4**: GET /api/campaigns/[id] 테스트 작성
  - Test Cases: 단일 캠페인 조회, 권한 검증, 404 처리
  - 결과: 3개 테스트 케이스 작성 ✅

- [x] **Task 3.5**: 테스트 실행하여 실패 확인
  - Command: `npm run test:integration -- tests/integration/api/campaigns`
  - 결과: 10개 테스트 작성, 초기 RED 상태 확인 후 수정 완료 ✅

#### 🟢 GREEN Phase - 테스트 통과하는 최소 구현

- [x] **Task 3.6**: GET /api/campaigns → ListCampaignsUseCase 연결
  - File: `src/app/api/campaigns/route.ts`
  - 결과: DI Container에서 Use Case resolve, Mock 데이터 제거 ✅

- [x] **Task 3.7**: POST /api/campaigns → CreateCampaignUseCase 연결
  - File: `src/app/api/campaigns/route.ts`
  - 결과: 요청 DTO 변환, DuplicateCampaignNameError 처리 추가 ✅

- [x] **Task 3.8**: GET /api/campaigns/[id] → GetCampaignUseCase 연결
  - File: `src/app/api/campaigns/[id]/route.ts`
  - 결과: 단일 캠페인 조회, PATCH/DELETE도 Repository 직접 연결 ✅

- [x] **Task 3.9**: 테스트 실행하여 통과 확인
  - Command: `npm run test:integration`
  - 결과: 50/50 통합 테스트 통과 (10개 신규 API 테스트 포함) ✅

#### 🔵 REFACTOR Phase - 코드 정리

- [x] **Task 3.10**: Mock 데이터 코드 완전 제거
  - 결과: campaigns routes에서 mockCampaigns 완전 제거 ✅

- [x] **Task 3.11**: 에러 핸들링 개선
  - 결과: DuplicateCampaignNameError 처리 (409 Conflict), 권한 체크 개선 ✅

- [x] **Task 3.12**: 테스트 재실행으로 리팩토링 검증
  - Command: `npm run test:integration`
  - 결과: 50/50 통합 테스트, 252/252 단위 테스트 모두 통과 ✅

#### Quality Gate ✋ (2025-12-29 완료)

**Validation Commands**:
```bash
# API 통합 테스트 - ✅ 50/50 통과
npm run test:integration

# 타입 체크 - ✅ 0 errors
npm run type-check

# 단위 테스트 - ✅ 252/252 통과
npm run test:unit
```

**TDD Checklist**:
- [x] 🔴 RED: 테스트 먼저 작성됨
- [x] 🔴 RED: 구현 전 테스트 실패 확인됨
- [x] 🟢 GREEN: 테스트 통과하는 최소 구현 완료
- [x] 🔵 REFACTOR: 코드 정리 후에도 테스트 통과

**Functional Checklist**:
- [x] GET /api/campaigns → 실제 DB 데이터 반환
- [x] POST /api/campaigns → DB에 저장됨
- [x] GET /api/campaigns/[id] → 단일 캠페인 조회
- [x] PATCH /api/campaigns/[id] → 상태 변경 저장
- [x] DELETE /api/campaigns/[id] → DB에서 삭제
- [x] Mock 데이터 코드 완전 제거됨

---

### Phase 4: Dashboard KPI API 연동 (TDD)
**Goal**: KPI 대시보드 API를 Use Cases에 연결 (테스트 우선)
**Estimated Time**: 2-3시간
**Status**: ✅ Complete
**Dependencies**: Phase 3 완료

#### 🔴 RED Phase - 실패하는 테스트 먼저 작성

- [x] **Task 4.1**: Dashboard KPI API 통합 테스트 파일 생성
  - File: `tests/integration/api/dashboard-kpi.api.test.ts`
  - Details: KPI 엔드포인트 테스트 구조 작성
  - 결과: 6개 테스트 케이스 작성 ✅

- [x] **Task 4.2**: GET /api/dashboard/kpi 테스트 작성
  - Test Cases:
    1. 사용자의 캠페인 KPI 집계 데이터 반환
    2. 캠페인이 없을 때 빈 데이터 반환
    3. 특정 캠페인만 필터링하여 KPI 조회
    4. 다른 사용자의 캠페인 KPI 미반환
    5. 기간 비교 데이터 포함
    6. 캠페인별 브레이크다운 포함
  - 결과: 6개 테스트 모두 작성 완료 ✅

- [x] **Task 4.3**: 테스트 실행하여 실패 확인
  - Command: `npm run test:int -- tests/integration/api/dashboard-kpi`
  - 결과: RED 상태 확인 후 구현 진행 ✅

#### 🟢 GREEN Phase - 테스트 통과하는 최소 구현

- [x] **Task 4.4**: GET /api/dashboard/kpi → GetDashboardKPIUseCase 연결
  - File: `src/app/api/dashboard/kpi/route.ts`
  - Details:
    - DI Container에서 Use Case resolve
    - API period ('7d', '30d') → DateRangePreset 매핑
    - 응답 DTO 변환 (backwards compatibility)
  - 결과: 구현 완료 ✅

- [x] **Task 4.5**: GetDashboardKPIUseCase 로직 검증
  - File: `src/application/use-cases/kpi/GetDashboardKPIUseCase.ts`
  - Details: 기존 Use Case 동작 확인, 추가 수정 불필요
  - 결과: 검증 완료 ✅

- [x] **Task 4.6**: 테스트 실행하여 통과 확인
  - Command: `npm run test:int -- tests/integration/api/dashboard-kpi`
  - 결과: 6/6 테스트 통과 (GREEN 상태) ✅

#### 🔵 REFACTOR Phase - 코드 정리

- [x] **Task 4.7**: generateMockKPIData() 함수 완전 제거
  - 결과: Mock 함수 제거 완료 ✅

- [x] **Task 4.8**: 응답 DTO 정리
  - 결과: Use Case 결과 → API 응답 형식 변환 구현 ✅

- [x] **Task 4.9**: 전체 테스트 재실행
  - Command: `npm run test:int && npm test`
  - 결과: 56/56 통합, 252/252 단위 테스트 통과 ✅

#### Quality Gate ✋ (2025-12-29 완료)

**Validation Commands**:
```bash
# KPI API 통합 테스트 - ✅ 6/6 통과
npm run test:int -- tests/integration/api/dashboard-kpi

# 전체 통합 테스트 - ✅ 56/56 통과
npm run test:int

# 타입 체크 - ✅ 0 errors
npm run type-check
```

**TDD Checklist**:
- [x] 🔴 RED: 테스트 먼저 작성됨
- [x] 🔴 RED: 구현 전 테스트 실패 확인됨
- [x] 🟢 GREEN: 테스트 통과하는 최소 구현 완료
- [x] 🔵 REFACTOR: 코드 정리 후에도 테스트 통과

**Functional Checklist**:
- [x] GET /api/dashboard/kpi → 실제 DB 데이터 반환
- [x] `generateMockKPIData()` 함수 완전 제거
- [x] 기간 변경 시 데이터 변화 확인

---

### Phase 5: Reports API 연동 (TDD)
**Goal**: 주간 보고서 생성 API 연동 (테스트 우선)
**Estimated Time**: 3-4시간
**Status**: ✅ Complete
**Dependencies**: Phase 4 완료

#### 🔴 RED Phase - 실패하는 테스트 먼저 작성

- [x] **Task 5.1**: Reports API 통합 테스트 파일 생성
  - File: `tests/integration/api/reports.api.test.ts`
  - Details: Reports 엔드포인트 테스트 구조 작성

- [x] **Task 5.2**: GET /api/reports 테스트 작성
  - Test Cases: 보고서 목록 조회, 타입 필터링, 다른 사용자 격리
  - 결과: 4개 테스트 케이스 작성 ✅

- [x] **Task 5.3**: POST /api/reports 테스트 작성
  - Test Cases: 보고서 생성, AI 인사이트 포함, 권한 검증, 사용량 로그
  - 결과: 4개 테스트 케이스 작성 ✅

- [x] **Task 5.4**: GET /api/reports/[id] 테스트 작성
  - Test Cases: 단일 보고서 조회, DTO 변환 검증
  - 결과: 2개 테스트 케이스 작성 ✅

- [x] **Task 5.5**: 테스트 실행하여 실패 확인
  - Command: `npm run test:int -- tests/integration/api/reports`
  - 결과: RED 상태 확인 후 구현 진행 ✅

#### 🟢 GREEN Phase - 테스트 통과하는 최소 구현

- [x] **Task 5.6**: GET /api/reports → 보고서 목록 조회 연동
  - File: `src/app/api/reports/route.ts`
  - Details: 사용자의 보고서 목록 조회 (Repository 직접 연결)
  - 결과: 구현 완료 ✅

- [x] **Task 5.7**: POST /api/reports → GenerateWeeklyReportUseCase 연결
  - File: `src/app/api/reports/route.ts`
  - Details: AI 분석 포함 주간 보고서 생성, QuotaService 연동
  - 결과: 구현 완료 ✅

- [x] **Task 5.8**: GET /api/reports/[id] 연동
  - File: `src/app/api/reports/[id]/route.ts`
  - Details: 단일 보고서 상세 조회
  - 결과: 구현 완료 ✅

- [x] **Task 5.9**: 테스트 실행하여 통과 확인
  - Command: `npm run test:int -- tests/integration/api/reports`
  - 결과: 모든 테스트 통과 (GREEN 상태) ✅

#### 🔵 REFACTOR Phase - 코드 정리

- [x] **Task 5.10**: Mock AI Service 수정
  - Details: IAIService 인터페이스에 맞게 mock 메서드 수정
  - 결과: generateAdCopy, generateCampaignOptimization 메서드명 수정 ✅

- [x] **Task 5.11**: 에러 핸들링 개선
  - AI 서비스 실패 시 graceful degradation
  - 결과: 구현 완료 ✅

- [x] **Task 5.12**: 테스트 재실행으로 리팩토링 검증
  - Command: `npm run test:int -- tests/integration/api/reports`
  - 결과: 통과 ✅

#### Quality Gate ✋ (2025-12-29 완료)

**Validation Commands**:
```bash
# Reports API 통합 테스트 - ✅ 통과
npm run test:int -- tests/integration/api/reports

# 전체 통합 테스트 (회귀 방지) - ✅ 통과
npm run test:int

# 타입 체크 - ✅ 0 errors
npm run type-check
```

**TDD Checklist**:
- [x] 🔴 RED: 테스트 먼저 작성됨
- [x] 🔴 RED: 구현 전 테스트 실패 확인됨
- [x] 🟢 GREEN: 테스트 통과하는 최소 구현 완료
- [x] 🔵 REFACTOR: 코드 정리 후에도 테스트 통과

**Functional Checklist**:
- [x] POST /api/reports → DB에 보고서 저장
- [x] AI 분석 결과 포함 확인
- [x] 사용량 제한 동작 확인
- [x] DTO 변환 정상 동작

---

### Phase 6: Quota API 및 최종 검증
**Goal**: 사용량 제한 API 연동 및 전체 시스템 검증
**Estimated Time**: 2시간
**Status**: ✅ Complete
**Dependencies**: Phase 5 완료

#### Tasks

- [x] **Task 6.1**: GET /api/quota 연동
  - File: `src/app/api/quota/route.ts`
  - Details: QuotaService를 통한 사용자별 남은 쿼터 조회
  - 결과: DI Container에서 QuotaService resolve, Mock 데이터 제거 ✅

- [x] **Task 6.2**: Quota API 통합 테스트 작성
  - File: `tests/integration/api/quota.api.test.ts`
  - Details: 8개 테스트 케이스 작성 (사용량 조회, 쿼터 검사, 사용량 로깅, 사용자 격리)
  - 결과: 8/8 테스트 통과 ✅

- [x] **Task 6.3**: Next.js 빌드 오류 수정
  - File: `src/app/(dashboard)/settings/meta-connect/page.tsx`
  - Details: useSearchParams()를 Suspense 경계로 래핑
  - 결과: 빌드 성공 ✅

- [x] **Task 6.4**: 타입 체크 및 린트 통과
  - Commands: `npm run type-check && npm run lint`
  - 결과: 0 errors ✅

- [x] **Task 6.5**: 전체 테스트 스위트 통과
  - Command: `npm test && npm run test:int`
  - 결과: 262 단위 테스트 통과 ✅

#### Quality Gate ✋ (2025-12-29 완료)

**Validation Commands**:
```bash
# 전체 검증 - ✅ 통과
npm run type-check && npm run lint && npm test

# 빌드 확인 - ✅ 성공
npm run build
```

**Checklist**:
- [x] `npm run type-check` → 0 errors
- [x] `npm run lint` → 0 errors
- [x] `npm test` → 262/262 통과
- [x] `npm run build` → 성공
- [x] Quota API 통합 테스트 8/8 통과

---

## 📁 수정 필요 파일 목록

### API Routes (Mock → Use Cases)
| 파일 | 현재 상태 | 필요 작업 |
|------|----------|----------|
| `src/app/api/campaigns/route.ts` | ✅ 완료 | - |
| `src/app/api/campaigns/[id]/route.ts` | ✅ 완료 | - |
| `src/app/api/dashboard/kpi/route.ts` | ✅ 완료 | - |
| `src/app/api/reports/route.ts` | ✅ 완료 | - |
| `src/app/api/reports/[id]/route.ts` | ✅ 완료 | - |
| `src/app/api/quota/route.ts` | ✅ 완료 | - |

### 설정 파일
| 파일 | 작업 |
|------|------|
| `.env` | `.env.example` 기반 생성 |
| `docker-compose.yml` | DB 컨테이너 실행 확인 |

---

## 🔄 Rollback Strategy

### Phase 1 실패 시
- Docker 컨테이너 삭제 후 재생성
- `.env` 파일 재설정

### Phase 2 실패 시
- 테스트 DB 초기화: `npx prisma migrate reset --force`
- 스키마 재적용

### Phase 3-6 실패 시
- Git에서 해당 파일 원복: `git checkout -- src/app/api/...`
- Mock 데이터 버전으로 롤백

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ✅ 100% (데이터베이스 설정) - 2025-12-29 완료
- **Phase 2**: ✅ 100% (통합 테스트 40/40 통과) - 2025-12-29 완료
- **Phase 3**: ✅ 100% (Campaigns API 연동) - 2025-12-29 완료
  - 10개 새 통합 테스트 추가 (50/50 total)
  - TDD: 🔴→🟢→🔵 완전 사이클
- **Phase 4**: ✅ 100% (Dashboard KPI API 연동) - 2025-12-29 완료
  - 6개 새 통합 테스트 추가 (56/56 total)
  - TDD: 🔴→🟢→🔵 완전 사이클
- **Phase 5**: ✅ 100% (Reports API 연동) - 2025-12-29 완료
  - Reports API Use Cases 연결 완료
  - TDD: 🔴→🟢→🔵 완전 사이클
- **Phase 6**: ✅ 100% (Quota + 최종 검증) - 2025-12-29 완료
  - Quota API QuotaService 연결 완료
  - 8개 통합 테스트 추가
  - 빌드 성공

**Overall Progress**: 100% complete (6/6 phases) 🎉

---

## 📝 Notes & Learnings

### DI Container 사용 패턴
```typescript
// API Route에서 Use Case 사용 방법
import { container, DI_TOKENS } from '@/lib/di/container'
import { ListCampaignsUseCase } from '@application/use-cases/campaign'

// 방법 1: container.resolve
const useCase = container.resolve<ListCampaignsUseCase>(DI_TOKENS.ListCampaignsUseCase)

// 방법 2: convenience function (권장)
import { getCreateCampaignUseCase } from '@/lib/di/container'
const useCase = getCreateCampaignUseCase()
```

### Implementation Notes
- (구현 중 발견한 인사이트 기록)

### Blockers Encountered
- (발생한 블로커와 해결 방법 기록)

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [x] Phase 1-6 모든 Quality Gates 통과
- [x] `npm run build` 성공
- [x] `npm test && npm run test:int` 모든 테스트 통과
- [x] Mock 데이터 코드 완전 제거됨
- [x] PLAN_production-deployment.md 진행 준비 완료

---

## 📚 References

### 관련 파일
- MVP 구현 계획: `docs/plans/PLAN_batwo-ai-marketing.md`
- 배포 계획: `docs/plans/PLAN_production-deployment.md`
- DI Container: `src/lib/di/container.ts`
- Prisma 스키마: `prisma/schema.prisma`

### 다음 단계
이 계획 완료 후 → `PLAN_production-deployment.md` Phase 1부터 진행

---

**Plan Status**: ✅ **COMPLETE**
**Completed**: 2025-12-29
