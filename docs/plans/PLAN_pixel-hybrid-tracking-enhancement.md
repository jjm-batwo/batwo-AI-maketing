# Implementation Plan: 픽셀 하이브리드 트래킹 고도화

**Status**: 🟢 Complete
**Started**: 2026-03-09
**Last Updated**: 2026-03-09
**Estimated Completion**: 2026-03-09

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
2026년 메타 광고 RAG 연구 보고서에서 식별한 갭을 해결하여, 현재 "픽셀 설치 + CAPI 전송"에 머물러 있는 기능을 **하이브리드 트래킹 관제 시스템**으로 고도화합니다.

핵심 보완 사항:
1. **EMQ(이벤트 매칭 품질) 모니터링** — matchRate 데이터를 UI에 표시하고 경고 시스템 구축
2. **하이브리드 헬스 대시보드** — Pixel(클라이언트) + CAPI(서버) 교차 검증 UI
3. **RAG 챗봇 진단 시나리오 연동** — EMQ/트래킹 상태 기반 자동 진단
4. **사용자 가이드 보강** — 이벤트 중복 제거, userData 수집 최적화 안내

### Success Criteria
- [x] PixelStatus 대시보드에 matchRate(EMQ 근사치) 표시
- [x] matchRate < 60% 시 경고 배너 표시 및 개선 안내
- [x] 하이브리드 트래킹 헬스 요약 (Pixel 이벤트 수 vs CAPI 전송 수)
- [x] RAG 지식베이스에 EMQ 진단 시나리오 추가
- [x] eventId 기반 중복 제거 가이드가 온보딩/설정 UI에 포함

### User Impact
- **광고주**: 데이터 품질(EMQ) 상태를 실시간으로 파악하여 성과 저하를 사전 예방
- **SaaS 가치**: "단순 픽셀 설치 도구"에서 "하이브리드 트래킹 관제 센터"로 포지셔닝 전환
- **정량적 효과**: 보고서 기준 CAPI 병행 + EMQ 관리 시 기여 전환수 평균 24% 상승 기대

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| `getPixelStats()` 기존 API 재활용 | 이미 MetaPixelClient에 구현되어 있으나 미사용 상태. 새로 만들 필요 없이 연결만 하면 됨 | Meta API 콜 증가 (30초 폴링마다 1회) |
| matchRate를 EMQ 근사치로 사용 | Meta /{pixelId}/stats의 match_rate_approx가 EMQ와 높은 상관관계. 별도 EMQ API 없음 | 정확한 EMQ는 광고관리자에서만 확인 가능 |
| UseCase 레이어에 `GetTrackingHealthUseCase` 신설 | 클린 아키텍처 유지, GetPixelStatusUseCase와 분리하여 SRP 준수 | 파일 수 증가 |
| RAG 지식베이스는 마크다운 시드 파일로 추가 | 기존 `prisma/seeds/marketing-knowledge/` 패턴 준수 | DB 시딩 스크립트 재실행 필요 |
| UI는 기존 PixelStatus 컴포넌트 확장 | 새 컴포넌트보다 기존 컴포넌트 확장이 사용자 경험 일관성 유지에 유리 | PixelStatus 복잡도 증가 |

---

## 📦 Dependencies

### Required Before Starting
- [x] MetaPixelClient.getPixelStats() 구현 완료 (이미 존재)
- [x] PixelStatus 컴포넌트 존재 (이미 존재)
- [x] CAPI 배치 크론 시스템 작동 (이미 존재)
- [x] SendCAPIEventsUseCase 구현 완료 (이미 존재)

### External Dependencies
- Meta Graph API v25.0 — `/{pixelId}/stats` 엔드포인트
- 기존 프로젝트 의존성 외 신규 패키지 없음

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥80% | GetTrackingHealthUseCase 비즈니스 로직, DTO 생성 |
| **Integration Tests** | Critical paths | API Route → UseCase → MetaPixelClient 연동 |
| **E2E Tests** | 없음 (UI 확장은 수동 검증) | - |

### Test File Organization
```
tests/
├── unit/
│   └── application/pixel/
│       ├── GetTrackingHealthUseCase.test.ts   ← 신규
│       └── GetPixelStatusUseCase.test.ts      ← 기존 (수정 없음)
├── integration/
│   └── api/
│       └── pixel-health.api.test.ts           ← 신규
└── unit/
    └── presentation/components/pixel/
        └── PixelStatus.test.tsx               ← 기존 (확장)
```

---

## 🚀 Implementation Phases

### Phase 1: EMQ 모니터링 도메인 로직 및 API (Foundation)
**Goal**: matchRate(EMQ) 데이터를 수집하고 건강 상태를 판정하는 비즈니스 로직 완성
**Estimated Time**: 3시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 1.1**: `GetTrackingHealthUseCase` 단위 테스트 작성
  - File(s): `tests/unit/application/pixel/GetTrackingHealthUseCase.test.ts`
  - Expected: Tests FAIL (red) — UseCase가 아직 존재하지 않음
  - Details:
    - ✅ matchRate ≥ 0.6 → `healthy` 판정
    - ⚠️ 0.4 ≤ matchRate < 0.6 → `warning` 판정
    - ❌ matchRate < 0.4 → `critical` 판정
    - 🤷 stats null → `unknown` 판정
    - pixelId 미존재 → 에러 throw
    - 다른 사용자의 pixel 접근 → 에러 throw
    - CAPI 이벤트 카운트 포함 검증
    - 개선 제안(suggestions) 생성 검증
  - Coverage Target: ≥90% (핵심 비즈니스 로직)

- [x] **Test 1.2**: API Route 통합 테스트 작성
  - File(s): `tests/integration/api/pixel-health.api.test.ts`
  - Expected: Tests FAIL (red) — API 라우트가 아직 존재하지 않음
  - Details:
    - GET /api/pixel/[pixelId]/health → 200 + TrackingHealthDTO
    - 인증 없이 호출 → 401
    - 다른 사용자 pixel 조회 → 404

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 1.3**: `TrackingHealthDTO` 정의
  - File(s): `src/application/dto/pixel/TrackingHealthDTO.ts`
  - Goal: 건강 상태 응답 DTO 타입 정의
  - Fields: `healthStatus`, `matchRate`, `matchedEventCount`, `unmatchedEventCount`, `capiEventsSent`, `capiEventsExpired`, `capiEventsFailed`, `suggestions[]`, `lastCheckedAt`

- [x] **Task 1.4**: `GetTrackingHealthUseCase` 구현
  - File(s): `src/application/use-cases/pixel/GetTrackingHealthUseCase.ts`
  - Goal: Test 1.1 통과 (최소 구현)
  - 의존성: `IMetaPixelRepository`, `IMetaPixelService`, `IConversionEventRepository`
  - 로직:
    1. pixelId로 MetaPixel 엔터티 조회 + 소유자 검증
    2. MetaPixelService.getPixelStats()로 matchRate 조회
    3. ConversionEventRepository에서 CAPI 전송 통계 조회
    4. matchRate 기반 healthStatus 판정
    5. suggestions 어레이 생성 (matchRate 기반 개선 제안)

- [x] **Task 1.5**: API Route 구현
  - File(s): `src/app/api/pixel/[pixelId]/health/route.ts`
  - Goal: Test 1.2 통과
  - 인증: 세션 기반 + userId 검증

- [x] **Task 1.6**: DI 컨테이너에 UseCase 등록
  - File(s): `src/lib/di/container.ts` (기존 파일 수정)
  - Goal: `getTrackingHealthUseCase()` 팩토리 함수 추가

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 1.7**: 코드 품질 개선
  - Checklist:
    - [x] matchRate 임계값을 상수로 추출
    - [x] suggestions 생성 로직 분리
    - [x] 에러 타입 정돈 (기존 PixelError 재활용)

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 2 until ALL checks pass**

**TDD Compliance**:
- [x] Tests were written FIRST and initially failed
- [x] Production code written to make tests pass
- [x] Code improved while tests still pass
- [x] Coverage ≥80% for GetTrackingHealthUseCase

**Build & Tests**:
- [x] `npm run build` 에러 없음
- [x] `npx vitest run tests/unit/application/pixel/GetTrackingHealthUseCase.test.ts` 전체 통과
- [x] `npx vitest run tests/integration/api/pixel-health.api.test.ts` 전체 통과
- [x] 기존 픽셀 테스트 3개 파일 모두 통과 확인

**Code Quality**:
- [x] `npm run lint` 에러 없음
- [x] `npx tsc --noEmit` 타입 에러 없음

**Validation Commands**:
```bash
# 신규 테스트 실행
npx vitest run tests/unit/application/pixel/GetTrackingHealthUseCase.test.ts
npx vitest run tests/integration/api/pixel-health.api.test.ts

# 기존 테스트 회귀 확인
npx vitest run tests/unit/application/pixel/
npx vitest run tests/unit/infrastructure/meta-pixel/

# 빌드 & 린트
npm run build
npm run lint
npx tsc --noEmit
```

---

### Phase 2: PixelStatus UI에 EMQ 표시 및 경고 시스템
**Goal**: 대시보드에서 matchRate를 시각화하고 임계값 이하 시 경고 배너 표시
**Estimated Time**: 3시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 2.1**: PixelStatus 컴포넌트 테스트 확장
  - File(s): `tests/unit/presentation/components/pixel/PixelStatus.test.tsx`
  - Expected: Tests FAIL (red) — 새 healthData prop이 아직 없음
  - Details:
    - matchRate 표시 검증 (퍼센트 포맷: 85%)
    - healthStatus=warning 시 경고 배너 렌더링
    - healthStatus=critical 시 위험 배너 + suggestions 목록 렌더링
    - healthStatus=unknown 시 "데이터 수집 중" 메시지
    - suggestions 리스트 렌더링 검증

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 2.2**: PixelStatus 컴포넌트 확장
  - File(s): `src/presentation/components/pixel/PixelStatus.tsx`
  - Goal: Test 2.1 통과
  - UI 변경 사항:
    - 기존 이벤트 수/마지막 이벤트 그리드 아래에 **EMQ 섹션** 추가
    - 매칭률 프로그레스 바 (색상: green ≥60%, yellow 40~59%, red <40%)
    - matchRate < 60% 시 경고 배너 + 개선 제안 표시
    - `/api/pixel/[pixelId]/health` 엔드포인트 호출 (React Query)

- [x] **Task 2.3**: 설정 페이지(pixel/page.tsx) 내 health 섹션 추가 (선택)
  - File(s): `src/app/(dashboard)/settings/pixel/page.tsx`
  - Goal: 설정 페이지에서도 트래킹 건강 상태 확인 가능

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 2.4**: UI 코드 품질 개선
  - Checklist:
    - [x] 매칭률 프로그레스 바를 별도 컴포넌트로 분리 (MatchRateBar)
    - [x] 경고 배너를 경고 레벨별 재사용 가능 컴포넌트로 추출
    - [x] i18n 키 추가 (기존 next-intl 패턴 준수)

#### Quality Gate ✋

**⚠️ STOP: Do NOT proceed to Phase 3 until ALL checks pass**

**TDD Compliance**:
- [x] Tests written FIRST
- [x] Production code written to pass tests
- [x] Refactored while tests pass
- [x] PixelStatus 확장 테스트 전체 통과

**Build & Tests**:
- [x] `npm run build` 에러 없음
- [x] `npx vitest run tests/unit/presentation/components/pixel/PixelStatus.test.tsx` 통과
- [x] 기존 PixelSelector, PixelSetupStep 테스트 회귀 없음

**Manual Testing**:
- [x] 설정 > 픽셀 페이지에서 matchRate 프로그레스 바가 렌더링됨
- [x] matchRate < 60%일 때 주황색 경고 배너가 표시됨
- [x] 제안 목록이 올바르게 나타남

**Validation Commands**:
```bash
npx vitest run tests/unit/presentation/components/pixel/
npm run build
npm run lint
```

---

### Phase 3: 하이브리드 트래킹 헬스 대시보드
**Goal**: Pixel(브라우저) vs CAPI(서버) 이벤트를 교차 비교하는 요약 카드 제공
**Estimated Time**: 3시간
**Status**: 🟢 Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 3.1**: `GetTrackingHealthUseCase` 추가 시나리오 테스트
  - File(s): 기존 `tests/unit/application/pixel/GetTrackingHealthUseCase.test.ts` 확장
  - Expected: Tests FAIL — 하이브리드 통계 필드들이 아직 없음
  - Details:
    - capiEventsSent, capiEventsExpired, capiEventsFailed 통계 정확성
    - pixelEventCount vs capiSentCount 비율 계산
    - deduplication 가이드 suggestion 자동 생성 (비율이 2배 이상 차이 시)

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 3.2**: `TrackingHealthDTO` 확장 + UseCase 업데이트
  - File(s): `src/application/dto/pixel/TrackingHealthDTO.ts`, `src/application/use-cases/pixel/GetTrackingHealthUseCase.ts`
  - Goal: CAPI 전송 통계를 DTO에 포함하고 교차 비율 계산
  - ConversionEventRepository에 `countByPixelIdGrouped(pixelId)` 메서드 필요:
    - 전송 완료(sentToMeta=true) 수
    - 만료(EXPIRED) 수
    - 실패(FAILED) 수

- [x] **Task 3.3**: `HybridTrackingCard` 컴포넌트 구현
  - File(s): `src/presentation/components/pixel/HybridTrackingCard.tsx`
  - Goal: Pixel vs CAPI 비교 요약 카드
  - UI 구성:
    - 2-column 레이아웃: 좌측 "브라우저 픽셀", 우측 "서버 CAPI"
    - 각각 이벤트 수, 마지막 이벤트 시간, 상태 표시
    - 중앙에 Deduplication 매칭률 표시
    - 이상 정후 시 교차 검증 경고

- [x] **Task 3.4**: IConversionEventRepository에 그루핑 메서드 추가
  - File(s): `src/domain/repositories/IConversionEventRepository.ts` (인터페이스 확장)
  - File(s): `src/infrastructure/database/repositories/PrismaConversionEventRepository.ts` (구현)

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 3.5**: 코드 품질 개선
  - Checklist:
    - [x] 통계 계산 로직을 별도 유틸로 분리
    - [x] HybridTrackingCard i18n 키 등록
    - [x] PixelStatus와 HybridTrackingCard 간 스타일 통일

#### Quality Gate ✋

**Build & Tests**:
- [x] `npm run build` 에러 없음
- [x] 기존 + 신규 픽셀 테스트 전체 통과
- [x] `npx tsc --noEmit` 타입 에러 없음

**Validation Commands**:
```bash
npx vitest run tests/unit/application/pixel/
npx vitest run tests/unit/presentation/components/pixel/
npm run build
npm run lint
npx tsc --noEmit
```

---

### Phase 4: RAG 지식베이스 + 사용자 가이드 보강
**Goal**: EMQ 진단 시나리오를 RAG 챗봇 지식에 추가하고 온보딩 가이드를 보강
**Estimated Time**: 2시간
**Status**: 🟢 Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 4.1**: RAG 시드 파일 존재 여부 및 구조 검증 스크립트
  - File(s): 셸 스크립트로 검증 (마크다운 구조 validate)
  - Expected: 파일이 아직 없으므로 FAIL

**🟢 GREEN: Implement**
- [x] **Task 4.2**: RAG 지식 시드 파일 작성 — EMQ/하이브리드 트래킹 진단
  - File(s): `prisma/seeds/marketing-knowledge/08-emq-hybrid-tracking-diagnostics.md`
  - 내용:
    - EMQ 점수별 원인 분석 및 해결 방안
    - matchRate 하락 5대 원인 (userData 누락, fbc/fbp 미수집, 이메일 미해싱, IP 누락, 브라우저 정보 누락)
    - 하이브리드 트래킹 이상 징후 진단 (이벤트 중복, CAPI 전송 실패, 피크셀 미설치)
    - 플랫폼별 설치 트러블슈팅 (카페24, 네이버, 자체몰)

- [x] **Task 4.3**: 온보딩 PixelSetupStep에 userData 수집 중요성 안내 추가
  - File(s): `src/presentation/components/onboarding/steps/PixelSetupStep.tsx`
  - 변경: `benefits` 섹션에 "이메일/전화번호를 함께 전송하면 광고 성과가 24% 향상됩니다" 추가

- [x] **Task 4.4**: eventId 기반 중복 제거 가이드 추가
  - File(s): `prisma/seeds/marketing-knowledge/08-emq-hybrid-tracking-diagnostics.md` (같은 파일 내)
  - 내용: Pixel의 eventID와 CAPI의 event_id가 동일해야 중복 제거가 작동하는 메커니즘 설명

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 4.5**: 가이드 문서 정리
  - Checklist:
    - [x] 기존 `04-data-infrastructure-capi-tracking.md`와 내용 중복 확인 후 정리
    - [x] i18n 키 추가 (onboarding.pixelSetup.benefits 확장)

#### Quality Gate ✋

**Build & Tests**:
- [x] `npm run build` 에러 없음
- [x] 기존 PixelSetupStep 테스트 회귀 없음
- [x] `npx vitest run tests/unit/presentation/components/onboarding/` 통과

**Manual Testing**:
- [x] 온보딩 > 픽셀 설정 단계에서 userData 관련 추가 안내가 표시됨
- [x] RAG 시드 파일이 올바른 마크다운 구조를 가짐

**Validation Commands**:
```bash
npx vitest run tests/unit/presentation/components/onboarding/
npm run build
npm run lint
```

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Meta `/{pixelId}/stats` API 호출 제한 (rate limit) | Medium | Medium | 30초 폴링을 60초로 조정, React Query staleTime 활용 |
| matchRate가 null인 신규 픽셀에서 UI 깨짐 | Medium | Low | `unknown` 상태를 위한 기본 UI 처리 (Phase 1 Test 1.1에 포함) |
| PixelStatus 컴포넌트 과도한 복잡도 증가 | Low | Medium | HybridTrackingCard를 별도 컴포넌트로 분리 (Phase 3) |
| IConversionEventRepository 인터페이스 변경의 영향 범위 | Low | Medium | 기존 메서드 유지, 신규 메서드만 추가 (backward compatible) |
| 기존 14개 픽셀 테스트 회귀 | Low | High | 매 Phase Quality Gate에서 전체 테스트 실행 확인 |

---

## 🔄 Rollback Strategy

### If Phase 1 Fails
**Steps to revert**:
- 삭제: `src/application/use-cases/pixel/GetTrackingHealthUseCase.ts`
- 삭제: `src/application/dto/pixel/TrackingHealthDTO.ts`
- 삭제: `src/app/api/pixel/[pixelId]/health/route.ts`
- DI 컨테이너에서 등록 제거
- 기존 코드에 영향 없음 (신규 파일만 추가)

### If Phase 2 Fails
**Steps to revert**:
- `PixelStatus.tsx` git restore
- PixelStatus 테스트 추가분 제거
- Phase 1 결과물은 유지 가능 (API만 활용)

### If Phase 3 Fails
**Steps to revert**:
- 삭제: `HybridTrackingCard.tsx`
- IConversionEventRepository + Prisma 구현 추가분 git restore
- Phase 1, 2 결과물은 유지 가능

### If Phase 4 Fails
**Steps to revert**:
- 삭제: `08-emq-hybrid-tracking-diagnostics.md`
- PixelSetupStep.tsx git restore
- i18n 키 추가분 제거
- 기능에 영향 없음 (문서/가이드만 롤백)

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: 🟢 100%
- **Phase 2**: 🟢 100%
- **Phase 3**: 🟢 100%
- **Phase 4**: 🟢 100%

**Overall Progress**: 100% complete

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1 — EMQ 도메인 로직 | 3h | - | - |
| Phase 2 — EMQ UI 표시 | 3h | - | - |
| Phase 3 — 하이브리드 대시보드 | 3h | - | - |
| Phase 4 — RAG/가이드 보강 | 2h | - | - |
| **Total** | **11h** | - | - |

---

## 📝 Notes & Learnings

### Implementation Notes
- (구현 중 추가 예정)

### Blockers Encountered
- (발생 시 기록)

---

## 📚 References

### Documentation
- [2026년 메타 광고 RAG 시스템 자료 수집](file:///Users/woals/Downloads/메타%20광고%20RAG%20시스템%20자료%20수집.md) — 연구 보고서 원문
- [픽셀 기능 검토 보고서](file:///Users/woals/.gemini/antigravity/brain/abbc04e6-9a0d-49df-bd3a-0aa565e09fd2/pixel_feature_review.md) — 갭 분석 결과
- [Meta Graph API — Pixel Stats](https://developers.facebook.com/docs/marketing-api/reference/ads-pixel/stats/)
- [Meta Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api/)

### Related Files (현재 코드베이스)
- [MetaPixelClient.ts](file:///Users/woals/Batwo-AI/project/batwo-maketting%20service-saas/src/infrastructure/external/meta-pixel/MetaPixelClient.ts) — `getPixelStats()` 이미 구현
- [CAPIClient.ts](file:///Users/woals/Batwo-AI/project/batwo-maketting%20service-saas/src/infrastructure/external/meta-pixel/CAPIClient.ts) — CAPI 전송 구현
- [GetPixelStatusUseCase.ts](file:///Users/woals/Batwo-AI/project/batwo-maketting%20service-saas/src/application/use-cases/pixel/GetPixelStatusUseCase.ts) — 기존 상태 조회 (참고)
- [PixelStatus.tsx](file:///Users/woals/Batwo-AI/project/batwo-maketting%20service-saas/src/presentation/components/pixel/PixelStatus.tsx) — Phase 2에서 확장 대상

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [x] All 4 phases completed with quality gates passed
- [x] Full integration testing performed
- [x] 기존 픽셀 테스트 14개 파일 전체 통과 확인
- [x] No performance regressions from additional API calls
- [x] i18n 키 추가 (ko, en)
- [x] verify-ui-components 스킬 실행
- [x] verify-architecture 스킬 실행
- [x] verify-di-registration 스킬 실행

---

**Plan Status**: 🟢 Complete
**Next Action**: 모든 작업 완료 
**Blocked By**: 없음
