# Implementation Plan: Meta API N+1 최적화 (Account-Level 벌크 조회)

**Status**: ⏳ Pending
**Started**: —
**Last Updated**: 2026-03-13
**Estimated Completion**: 2026-03-14 (4~6시간)

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
현재 Meta API 호출이 N+1 폭포 패턴으로 최대 71~101회 발생. 계정 레벨 벌크 조회(`act_xxx/insights?level=ad`, `act_xxx/adsets`, `act_xxx/ads`)를 활용하여 4회 이내로 감소시킵니다.

### Success Criteria
- [ ] `all-ads-with-insights` API 호출: 71회 → 4회
- [ ] `all-adsets-with-insights` API 호출: 41회 → 3회
- [ ] `AuditAdAccountUseCase` API 호출: 101회 → 2회
- [ ] 기존 3,301개 테스트 모두 통과
- [ ] 기존 개별 조회 메서드 삭제 없음 (하위 호환)
- [ ] `tsc --noEmit` 타입 에러 없음

### User Impact
- 대시보드/광고 테이블 로딩 속도 3~5× 개선
- Meta API Rate Limit 오류 대폭 감소
- 무료 감사 기능 응답 시간 단축

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Account-Level Insights 사용 | 개별 insights N회 → 1회 통합, Meta 공식 지원 | 계정 내 모든 데이터 반환 (대형 계정에서 응답 크기 증가 가능) |
| 계정 레벨 adsets/ads 조회 | N개 캠페인별 개별 조회 → 1회 통합 | filtering 지원 여부 확인 필요 |
| 기존 메서드 유지 | 캠페인 상세 등 단일 조회 용도 계속 사용 | 코드 중복 존재 (수용 가능) |
| Partial failure 제거 | 벌크 조회 시 전체 성공/실패 | 소규모 타겟(1~5캠페인)에 영향 미미 |

---

## 📦 Dependencies

### Required Before Starting
- [x] 디자인 문서 사용자 승인 완료
- [x] 현재 API 호출 패턴 분석 완료
- [ ] Git worktree 생성 (`meta-batch-api`)

### External Dependencies
- Meta Graph API v25.0 (Account-Level Insights, filtering 지원)

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: 신규 MetaAdsClient 메서드 → RED 먼저, 기존 라우트 테스트 → Mock 교체

### Test Pyramid
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥90% | MetaAdsClient 신규 메서드 검증 |
| **Unit Tests** | 기존 유지 | API 라우트 Mock 교체 후 동일 시나리오 |
| **Integration** | 1개 | 실제 Meta API 연결 확인 (선택) |

---

## 🚀 Implementation Phases

### Phase 1: MetaAdsClient 신규 메서드 (인프라 레이어)
**Goal**: 3개 벌크 조회 메서드 추가 + IMetaAdsService 포트 확장
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 1.1**: `getAccountInsights()` 단위 테스트
  - File: `tests/unit/infrastructure/meta-ads/MetaAdsClient.accountInsights.test.ts`
  - 시나리오:
    - level=campaign 정상 응답 → Map<campaignId, InsightsData>
    - level=adset 정상 응답 → Map<adSetId, InsightsData>
    - level=ad 정상 응답 → Map<adId, InsightsData>
    - 빈 결과 → 빈 Map
    - Auth 에러 → MetaAdsApiError throw
    - Rate limit → MetaAdsApiError throw

- [ ] **Test 1.2**: `listAllAdSets()` 단위 테스트
  - File: `tests/unit/infrastructure/meta-ads/MetaAdsClient.listAllAdSets.test.ts`
  - 시나리오:
    - campaignIds 필터링 → 해당 캠페인의 광고세트만 반환
    - 필터 없이 → 계정 전체 광고세트 반환
    - 빈 결과 → 빈 배열

- [ ] **Test 1.3**: `listAllAds()` 단위 테스트
  - File: `tests/unit/infrastructure/meta-ads/MetaAdsClient.listAllAds.test.ts`
  - 시나리오: listAllAdSets와 동일 패턴

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.4**: `IMetaAdsService` 인터페이스에 3개 메서드 시그니처 추가
  - File: `src/application/ports/IMetaAdsService.ts`

- [ ] **Task 1.5**: `MetaAdsClient`에 `getAccountInsights()` 구현
  - File: `src/infrastructure/external/meta-ads/MetaAdsClient.ts`
  - API: `GET /act_{id}/insights?fields=...&level={level}&date_preset={preset}`
  - 응답 파싱 → `Map<entityId, InsightsData>`

- [ ] **Task 1.6**: `MetaAdsClient`에 `listAllAdSets()` 구현
  - File: `src/infrastructure/external/meta-ads/MetaAdsClient.ts`
  - API: `GET /act_{id}/adsets?fields=...&filtering=[{campaign.id IN [...]}]`

- [ ] **Task 1.7**: `MetaAdsClient`에 `listAllAds()` 구현
  - File: `src/infrastructure/external/meta-ads/MetaAdsClient.ts`
  - API: `GET /act_{id}/ads?fields=...`

**🔵 REFACTOR**
- [ ] **Task 1.8**: 3개 메서드 공통 로직 추출 (URL 빌더, filtering 유틸)

#### Quality Gate ✋

**TDD Compliance**:
- [ ] Tests written FIRST and initially failed
- [ ] Production code written to make tests pass
- [ ] Refactored while tests still pass

**Validation Commands**:
```bash
npx vitest run tests/unit/infrastructure/meta-ads/
npx tsc --noEmit 2>&1 | grep -c "error"  # 0이어야 함
```

---

### Phase 2: API 라우트 리팩터링
**Goal**: all-ads, all-adsets 라우트를 벌크 조회로 전환
**Estimated Time**: 2시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: 기존 테스트 Mock 교체**
- [ ] **Test 2.1**: `all-ads-with-insights.test.ts` Mock 변경
  - File: `tests/unit/api/meta/all-ads-with-insights.test.ts`
  - 변경: `listAdSets`/`listAds`/`getAdInsights` Mock → `listAllAdSets`/`listAllAds`/`getAccountInsights`
  - 기존 19개 시나리오 유지 (auth, rate limit, 빈 결과, 정상)

- [ ] **Test 2.2**: `all-adsets-with-insights.test.ts` Mock 변경
  - File: `tests/unit/api/meta/all-adsets-with-insights.test.ts`
  - 기존 17개 시나리오 유지

**🟢 GREEN: 라우트 구현 변경**
- [ ] **Task 2.3**: `all-ads-with-insights/route.ts` 리팩터링
  - `mapWithConcurrency` 루프 → `listAllAdSets` + `listAllAds` + `getAccountInsights`
  - ID 매핑 로직 추가 (`Map.get(adId)`)

- [ ] **Task 2.4**: `all-adsets-with-insights/route.ts` 리팩터링
  - 동일 패턴 적용

**🔵 REFACTOR**
- [ ] **Task 2.5**: 두 라우트의 공통 패턴 추출 (인증, 에러 핸들링)

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/unit/api/meta/
npx vitest run   # 전체 3,301개 테스트
npx tsc --noEmit 2>&1 | grep -c "error"
```

---

### Phase 3: AuditUseCase + 최종 검증
**Goal**: Audit 유스케이스 최적화 + 전체 빌드 검증
**Estimated Time**: 1시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED**
- [ ] **Test 3.1**: `AuditAdAccountUseCase` 테스트 → `getAccountInsights` Mock 교체
  - File: 기존 Audit 테스트 파일

**🟢 GREEN**
- [ ] **Task 3.2**: `AuditAdAccountUseCase.ts` 리팩터링
  - `batchSettled(campaigns, getCampaignInsights)` → `getAccountInsights(level='campaign')`

**🔵 REFACTOR + 최종 검증**
- [ ] **Task 3.3**: 전체 테스트 + 빌드 + 타입체크
- [ ] **Task 3.4**: Worktree 커밋 + main 머지

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run                    # 전체 테스트
npx tsc --noEmit                  # 타입 체크
npx next build                    # 프로덕션 빌드
```

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| `level=ad` 응답 형식 예상과 다름 | Low | High | Mock 모드에서 먼저 구현, integration test로 별도 검증 |
| `act_xxx/adsets` filtering 미지원 | Low | Medium | 필터 없이 전체 조회 + 클라이언트 필터링 fallback |
| 대형 계정 응답 크기 초과 | Low | Medium | `limit` + 페이지네이션 파라미터 추가 |
| 기존 테스트 Mock 교체 시 깨짐 | Medium | Low | 기존 메서드 삭제 안 함, Mock 구조만 변경 |

---

## 🔄 Rollback Strategy

**모든 Phase 공통**: 기존 `listAdSets`, `listAds`, `getAdInsights` 등 개별 메서드를 삭제하지 않으므로, 라우트 코드만 이전 버전으로 되돌리면 즉시 복구 가능.

---

## 📊 Progress Tracking

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| Phase 1: MetaAdsClient 확장 | 2h | — | ⏳ |
| Phase 2: 라우트 리팩터링 | 2h | — | ⏳ |
| Phase 3: Audit + 최종 검증 | 1h | — | ⏳ |
| **Total** | **5h** | — | — |

---

## 📚 References

- [디자인 문서](../superpowers/specs/2026-03-13-meta-batch-api-design.md)
- [Meta Graph API Insights](https://developers.facebook.com/docs/marketing-api/insights/)
- [MetaAdsClient.ts](../../src/infrastructure/external/meta-ads/MetaAdsClient.ts) (1,499줄)
- [IMetaAdsService.ts](../../src/application/ports/IMetaAdsService.ts)

---

**Plan Status**: ⏳ Pending
**Next Action**: Phase 1 시작 (worktree 생성 → TDD RED)
**Blocked By**: None
