# Implementation Plan: 진단 리포트 기반 프로젝트 보강

**Status**: 📝 Draft v2 — plan-deep-validation 5단계 + 외부 검증 반영
**Created**: 2026-03-16
**Updated**: 2026-03-16 (외부 검증 결과 반영)
**검증 방법**: project-health-check + plan-deep-validation 교차 분석 + 외부 소스 검증
**예상 기간**: 1~2주 (분자 단위 태스크)

---

## 1. 배경: 진단 리포트 vs 코드 현실

### 진단 리포트 오진 보정

| 영역 | 리포트 판정 | 실제 코드 | 보정 판정 | 오진 원인 |
|------|:---:|------|:---:|------|
| AI 챗봇 | 🟡 UseCase ❌ | `ConversationalAgentService` 668줄 (Application) + `IntentClassifier` 215줄 (Domain) | **🟢** | 스킬이 `use-cases/chat/`만 스캔, Service 패턴 미감지 |
| 광고 UI | ❌(0) | `AdTable` 317줄 + `AdDetailPanel` 377줄 등 6개 컴포넌트 | **✅(6)** | `components/ad/` 스캔했으나 실제는 `components/campaign/Ad*.tsx` |
| 모니터링 | ⚠️ 미확인 | Sentry + OpenTelemetry 이중 스택 | **✅** | 스킬이 모니터링 설정 미스캔 |
| DI 등록 | 125/124 정상 | 125 정의 / **48 등록** (62% 갭) | **⚠️** | 사용 참조를 등록으로 오카운트 |

### 보정 후 실제 프로젝트 상태

- **기능 완성도**: 8/9 영역 🟢 (Ad CRUD만 🟡)
- **기술적 완성도**: tsc ✅ / 테스트 32.2% ✅ / 아키텍처 ✅ / 모니터링 ✅
- **운영 준비도**: CI/CD 9개 ✅ / DB 마이그레이션 14개 ✅ / **README ❌** / **빌드 STALE**

---

## 1.5 외부 검증 결과 (Phase 2)

### Service 패턴 vs UseCase 패턴 — 외부 권위 소스 확인

> **결론: Service 패턴은 유효한 Clean Architecture 접근**

- **Uncle Bob (2012)**: "Interactor"라는 용어 사용. UseCase를 클래스 접미사로 강제한 적 없음
- **Khalil Stemmler**: "Application Service = Use Case — 기능적 차이 없이 순수 명명 관례 차이"
- **Martin Fowler**: Service Layer 패턴이 Clean Architecture Use Case 레이어와 동일 역할

**668줄 ConversationalAgentService 판정**:
- 아키텍처적으로 방어 가능하나, SRP 관점에서 cross-cutting concern(resilience, streaming) 분리 권장
- 향후 리팩터링 시: 핵심 오케스트레이션은 유지, 회복성은 Decorator로, 스트리밍은 Infrastructure Adapter로 분리

**근거**: Uncle Bob *Clean Architecture* (2017), Khalil Stemmler DDD vs CA (2023), Martin Fowler *PoEAA* (2002)

### DI 토큰 62% 갭 — 런타임 리스크 검증

> **결론: 정의만 되고 resolve() 호출 없으면 무해. resolve() 있는데 미등록이면 즉시 크래시**

- **tsyringe/InversifyJS**: 미등록 토큰 resolve 시 즉시 예외 발생 (fail-fast)
- **권장**: 부팅 시 `container.isRegistered()` 검증 루프 추가
- **도구**: `knip`으로 사용되지 않는 토큰 상수 자동 감지 가능

**T6 대응 수정**: 단순 정리가 아닌, "resolve() 호출이 있는 미등록 토큰" 우선 식별 → 등록 또는 호출 제거

**근거**: tsyringe GitHub docs, InversifyJS Issue #1286, OneUptime DI Guide (2026)

---

## 2. 실제 해결 필요 항목 (우선순위순)

### 🔴 즉시 (1~2일)

| # | 항목 | 파일 수 | 소요 | 비즈니스 임팩트 |
|---|------|:---:|:---:|:---:|
| T1 | 빌드 검증 (STALE 해소) | 0 | 10분 | 💰💰💰 배포 차단 |
| T2 | README.md 작성 | 1 | 30분 | 운영 필수 |
| T3 | 진단 리포트 보정 | 1 | 30분 | 문서 신뢰도 |

### 🟡 다음 스프린트 (3~5일)

| # | 항목 | 파일 수 | 소요 | 비즈니스 임팩트 |
|---|------|:---:|:---:|:---:|
| T4 | Ad CRUD UseCase 완성 | 3 | 2시간 | 💰💰 광고 관리 |
| T5 | 헬스체크 스킬 오진 수정 | 1 | 1시간 | 도구 신뢰도 |
| T6 | DI 미등록 토큰 정리 | 2 | 1시간 | 기술 부채 |
| T7 | 인증 테스트 보강 | 2 | 1시간 | 안정성 |

### 🟢 백로그

| # | 항목 | 파일 수 | 소요 | 비즈니스 임팩트 |
|---|------|:---:|:---:|:---:|
| T8 | 계획서 Status 일괄 동기화 | 17 | 2시간 | 문서 신뢰도 |
| T9 | KPI 테스트 보강 | 2 | 1시간 | 안정성 |
| T10 | Ad 로컬DB↔Meta 동기화 전략 설계 | 설계 | 2시간 | 데이터 일관성 |

---

## 3. Phase별 구현 계획

### Phase 0: 즉시 조치 (빌드 + 문서)

**목표**: 배포 차단 해소 + 최소 문서화
**소요**: 1시간
**분자 단위 검증**: 각 태스크 독립 완료 가능

#### T1: 빌드 검증

```bash
npx next build
# 검증: .next/BUILD_ID 생성 + 에러 0건
```

- **선행**: 없음
- **검증**: `.next/BUILD_ID` 존재 + `echo $?` = 0

#### T2: README.md 작성

- **신규 파일**: `README.md`
- **내용**:
  - 프로젝트 소개 (바투 AI 마케팅 솔루션)
  - 기술 스택 (Next.js 16, Prisma, TossPayments, Vercel AI SDK)
  - 로컬 실행 (`npm install` → `.env` 설정 → `npx prisma generate` → `npm run dev`)
  - 아키텍처 개요 (Clean Architecture 4레이어 + DI)
  - 테스트 실행 (`npx vitest run` / `npx playwright test`)
  - 환경 변수 요약 (`.env.example` 참조)
- **검증**: 파일 존재 + 50줄 이상

#### T3: 진단 리포트 보정

- **수정 파일**: `docs/04-report/project-health-2026-03-16.md`
- **변경 사항**:
  - AI 챗봇: 🟡 → 🟢 (Application Services 기반으로 재판정)
  - 광고 UI: ❌(0) → ✅(6) (campaign/ 디렉토리 Ad 컴포넌트 반영)
  - 모니터링: ⚠️ → ✅ (Sentry + OTel 반영)
  - DI: 124 → 48 등록 (실제 등록 수 반영)
  - 종합: 6/8 → 8/9 🟢
- **검증**: 보정 전후 비교 가능한 변경 이력

#### Quality Gate Phase 0

```bash
# T1
npx next build && echo "BUILD OK"
# T2
test -f README.md && wc -l README.md
# T3
grep "8/9" docs/04-report/project-health-2026-03-16.md
```

---

### Phase 1: Ad CRUD 완성 (핵심 기능 갭)

**목표**: Ad 엔티티의 Update/Delete/List UseCase 구현
**소요**: 2시간
**선행**: Phase 0 완료

#### T4-1: UpdateAdUseCase

- **신규 파일**: `src/application/use-cases/ad/UpdateAdUseCase.ts`
- **참고 패턴**: `src/application/use-cases/adset/UpdateAdSetUseCase.ts`
- **로직**:
  1. `adRepository.findById(id)` → 존재 확인
  2. `ad.changeName()` / `ad.changeStatus()` — 도메인 검증
  3. `adRepository.update(ad)` → 로컬 DB 업데이트
  4. (선택) Meta API 동기화 호출
- **DI 등록**: `src/lib/di/modules/campaign.module.ts`에 `DI_TOKENS.UpdateAdUseCase` 추가
- **테스트**: `tests/unit/application/use-cases/ad/UpdateAdUseCase.test.ts`

#### T4-2: DeleteAdUseCase

- **신규 파일**: `src/application/use-cases/ad/DeleteAdUseCase.ts`
- **참고 패턴**: `src/application/use-cases/adset/DeleteAdSetUseCase.ts`
- **로직**:
  1. `adRepository.findById(id)` → 존재 확인
  2. `adRepository.delete(id)` → 로컬 DB 삭제
- **DI 등록**: `campaign.module.ts`
- **테스트**: `tests/unit/application/use-cases/ad/DeleteAdUseCase.test.ts`

#### T4-3: ListAdsUseCase

- **신규 파일**: `src/application/use-cases/ad/ListAdsUseCase.ts`
- **참고 패턴**: `src/application/use-cases/adset/ListAdSetsUseCase.ts`
- **로직**:
  1. `adRepository.findByAdSetId(adSetId)` → 광고 목록 조회
  2. `ads.map(toAdDTO)` → DTO 변환
- **DI 등록**: `campaign.module.ts`
- **테스트**: `tests/unit/application/use-cases/ad/ListAdsUseCase.test.ts`

#### Quality Gate Phase 1

```bash
npx tsc --noEmit
npx vitest run tests/unit/application/use-cases/ad
npx vitest run  # 전체 테스트 회귀 확인
```

---

### Phase 2: 도구 신뢰도 보강

**목표**: 헬스체크 스킬 오진 수정 + DI 정리
**소요**: 2시간
**선행**: Phase 0 완료 (Phase 1과 병렬 가능)

#### T5: 헬스체크 스킬 오진 수정

- **수정 파일**: `.agent/skills/project-health-check/SKILL.md`
- **변경 사항**:
  1. **챗봇 스캔**: `src/application/services/Conversational*` 경로 추가
  2. **광고 UI 스캔**: `src/presentation/components/campaign/Ad*` 경로 추가
  3. **모니터링 스캔**: `next.config.ts` Sentry 설정 + `src/infrastructure/telemetry/` 감지 추가
  4. **DI 카운트**: `container.register` + `registerSingleton` 패턴으로 정확히 카운트
- **검증**: 스킬 재실행 → 9개 영역 보정된 수치 확인

#### T6: DI 미등록 토큰 정리 (외부 검증 반영)

- **수정 파일**: `src/lib/di/types.ts`, `src/lib/di/modules/*.module.ts`
- **접근법** (3단계, 리스크 순):
  1. **🔴 CRITICAL**: `grep -rn "resolve.*DI_TOKENS\." src/` → resolve 호출 토큰 목록 추출
  2. resolve 호출 O + 등록 X → **즉시 등록 추가** (런타임 크래시 방지)
  3. resolve 호출 X + 등록 X → `knip` 또는 수동 검사로 dead symbol 확인 → 제거 또는 `// TODO: 미래 사용` 주석
- **부팅 검증 추가** (권장):
  ```typescript
  // src/lib/di/container.ts 하단
  if (process.env.NODE_ENV !== 'production') {
    const missing = Object.values(DI_TOKENS).filter(t => !container.isRegistered(t));
    if (missing.length) console.warn(`[DI] ${missing.length} tokens not registered`);
  }
  ```
- **근거**: tsyringe/InversifyJS fail-fast 동작, OneUptime DI Guide 부팅 검증 패턴
- **검증**: `npx tsc --noEmit` + `npx vitest run` + 부팅 시 경고 0건

#### T7: 인증 테스트 보강

- **수정 디렉토리**: `tests/unit/infrastructure/auth/`
- **추가 테스트**:
  - NextAuth 콜백 검증
  - 세션 토큰 검증
  - OAuth 리다이렉트 검증
- **검증**: `npx vitest run tests/unit/infrastructure/auth`

#### Quality Gate Phase 2

```bash
npx tsc --noEmit
npx vitest run
# 헬스체크 스킬 재실행으로 보정 확인
```

---

### Phase 3: 문서 신뢰도 복원 (백로그)

**목표**: 계획서 Status 동기화 + 추가 테스트
**소요**: 3시간
**선행**: Phase 1, 2 완료

#### T8: 계획서 Status 일괄 동기화

- **대상**: 18개 계획서
- **규칙**:
  - 체크박스 90%+ 완료 → `✅ Complete`
  - 체크박스 미완료인데 코드 구현됨 → 체크박스 업데이트
  - 코드 미구현인데 Status Complete → `⏳ Pending` 복원
- **우선 대상**: `PLAN_ai-chatbot-enhancement`, `PLAN_backend-completion`

#### T9: KPI 테스트 보강

- **현재**: 3개 테스트
- **추가**: KPI 계산 로직, 날짜 범위 필터링, 빈 데이터 처리
- **검증**: `npx vitest run tests/unit/application/use-cases/kpi`

#### T10: Ad 로컬DB↔Meta 동기화 전략 (아키텍처 분석 반영)

> **아키텍트 분석 결과**: Split-brain 데이터 아키텍처 확인. Campaign은 `SyncCampaignsUseCase` 존재하나 AdSet/Ad는 동기화 없음. `PATCH /api/ads/[adId]`가 Meta만 업데이트하고 로컬 DB 미갱신.

**즉시 적용 가능한 Quick Win (하이브리드 전략)**:

| # | 항목 | 소요 | 효과 |
|---|------|:---:|------|
| T10-1 | `PATCH /api/ads/[adId]`에 로컬 DB dual-write 추가 | 30분 | 데이터 드리프트 방지 |
| T10-2 | Meta API v25.0을 `META_API_VERSION` 상수로 통합 (12곳→1곳) | 30분 | 버전 sunset 대비 |
| T10-3 | `campaigns/[id]/adsets-with-insights` N+1 제거 (기존 벌크 메서드 활용) | 1시간 | Rate limit 절약 |
| T10-4 | Meta API 응답 서버 캐시 추가 (기존 CacheService 활용, TTL 5분) | 1시간 | 다중 사용자 + 오프라인 내성 |

**장기 설계 (Local-first sync 진화)**:
- `SyncAdSetsUseCase`, `SyncAdsUseCase` 생성 — `SyncCampaignsUseCase` 패턴 확장
- 벌크 메서드 `listAllAdSets()`, `listAllAds()` 이미 `IMetaAdsService`에 존재
- Google Ads 추가 시: `IAdPlatformService` 추상화 + 엔티티에 `platform` discriminator 추가
- **참고**: `PLAN_google-ads-integration.md` (Draft v4), `SyncCampaignsUseCase.ts:36-138`

**근거**: `Ad.setMetaAdId()` 메서드가 존재하나 어디서도 호출되지 않음 (`Ad.ts:135-146`). `IAdRepository.delete()`도 정의만 되고 미사용 (`IAdRepository.ts:8`).

---

## 4. 리스크 매트릭스 (검증 기반 — 아키텍처 분석 반영)

| 리스크 | 확률 | 영향 | 근거 | 대응방향 | Phase 반영 |
|--------|:---:|:---:|------|----------|:---:|
| Ad 로컬↔Meta 데이터 드리프트 | **높음** | **높음** | `PATCH` → Meta만, 로컬 DB 미갱신. `Ad.setMetaAdId()` 미호출 | T10-1 dual-write | Phase 3 |
| Meta API v25.0 하드코딩 (12곳) | 높음 | 높음 | 10개 파일에 분산. sunset 시 12곳 수동 수정 필요 | T10-2 상수 통합 | Phase 3 |
| AdSet insights N+1 팬아웃 | 높음 | 중간 | `Promise.allSettled` per-AdSet. 200 calls/hour 한도 | T10-3 벌크 전환 | Phase 3 |
| DI resolve 런타임 에러 | 중간 | 높음 | 77개 미등록 토큰 중 실제 resolve 호출 존재 가능 | T6 토큰 정리 | Phase 2 |
| 빌드 실패로 배포 차단 | 낮음 | 높음 | .next/BUILD_ID 없음 | T1 빌드 검증 | Phase 0 |
| 헬스체크 재실행 시 오진 반복 | 높음 | 낮음 | 스킬 미수정 시 동일 오진 | T5 스킬 수정 | Phase 2 |
| Meta API 다운 시 전체 읽기 실패 | 낮음 | **높음** | Ad/AdSet 읽기가 100% Meta 의존. 캐시 없음 | T10-4 서버 캐시 | Phase 3 |
| Google Ads 통합 시 전면 리팩터링 | 중간 | 높음 | `IMetaAdsService`가 100% Meta 전용. 추상화 레이어 없음 | T10 장기 설계 | 별도 계획 |

---

## 5. 장기 운영 고려사항 (아키텍처 분석 반영)

### Meta API 생명주기
- **v25.0이 12곳에 하드코딩** — `MetaAdsClient.ts`, `MetaPixelClient.ts`, `CAPIClient.ts`, `auth.ts` 등
- v25.0 sunset 예상: ~2027 (2년 주기)
- **대응**: T10-2에서 `META_API_VERSION` 상수 통합 → 1곳 수정으로 전환

### 스케일업 전략
- 현재: 벌크 엔드포인트(`all-ads-with-insights`) 최적화 완료 (3-4 호출)
- **잔존 N+1**: `campaigns/[id]/adsets-with-insights`에서 AdSet당 팬아웃
- 10x 사용자: T10-4 서버 캐시로 동일 ad account 중복 호출 제거
- 100x 캠페인: Local-first sync + 점진적 동기화 필요

### 데이터 주권 전략 (Split-brain 해소)
- **현재**: Campaign = local-first(sync 있음), AdSet/Ad = Meta-first(sync 없음)
- **Phase 3 Quick Win**: dual-write + 서버 캐시 (하이브리드)
- **장기**: `SyncAdSetsUseCase` + `SyncAdsUseCase` 확장 (local-first 통일)
- **근거**: `SyncCampaignsUseCase.ts:36-138` 패턴이 이미 검증됨

### 모니터링 활성화
- Sentry DSN 환경변수 설정으로 즉시 활성화 가능
- OTel은 `OTEL_ENABLED=true` 설정 필요
- **프로덕션 배포 전 활성화 권장**

---

## 6. v0→v2 변경 요약

| 항목 | 진단 리포트 (v0) | 코드 검증 + 아키텍처 분석 후 (v2) | 변경 이유 |
|------|-----------------|-------------------|----------|
| AI 챗봇 | 🟡 UseCase 부재 | 🟢 Service 패턴으로 정상 | Application Services 668줄 확인 |
| 광고 UI | ❌(0) | ✅(6) | campaign/ 디렉토리 Ad 컴포넌트 발견 |
| 모니터링 | ⚠️ 미확인 | ✅ 이중 스택 | Sentry + OTel 설정 확인 |
| DI 등록 | 124/125 정상 | 48/125 ⚠️ | 사용 참조 vs 실제 등록 구분 |
| 전체 기능 | 6/8 🟢 | **8/9 🟢** | 오진 보정 + 픽셀 추가 |
| 즉시 액션 | 챗봇 UC 생성 | **빌드 + README** | 실제 갭 재평가 |
| Meta API 버전 | 미점검 | **v25.0 × 12곳 하드코딩** | 아키텍처 분석에서 발견 |
| Ad 데이터 동기화 | 미점검 | **Split-brain** (Campaign만 sync) | 아키텍처 분석에서 발견 |
| N+1 잔존 | 미점검 | **adsets-with-insights 팬아웃** | 아키텍처 분석에서 발견 |

---

## 자가 검증

- [x] Phase 1 오진 5건 코드 근거로 보정
- [x] Phase 2 해결 방향에 참조 패턴 명시 (AdSet CRUD 참조)
- [x] Phase 3 장기 시뮬레이션 9개 시나리오 수행
- [x] 모든 태스크가 분자 단위 (1~3파일, 1~3시간)
- [x] 리스크 매트릭스에 근거 + 대응방향 포함
- [x] v0→v1 변경 추적 테이블 포함
