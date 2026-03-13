# Meta Batch API 통합 — 디자인 문서

> **결정일**: 2026-03-13
> **접근법**: #2 — Account-Level Insights + 계정 레벨 구조 조회
> **핵심 목표**: API 호출 71회 → 4회 감소

## 1. 아키텍처 — MetaAdsClient 확장

`MetaAdsClient`에 계정 레벨 벌크 조회 메서드 3개 추가:

```typescript
listAllAdSets(token, accountId, { campaignIds? })
listAllAds(token, accountId, { adSetIds? })
getAccountInsights(token, accountId, { level, datePreset, campaignIds? })
```

- 기존 개별 조회 메서드는 **삭제하지 않음** (캠페인 상세 등 단일 조회용 유지)
- 4단계 구조는 동일하되, 각 단계가 **1회 API 호출**로 완료 (loop 제거)

## 2. API 라우트 리팩터링

| 엔드포인트 | Before | After |
|-----------|--------|-------|
| `all-ads-with-insights` | ~71회 | **4회** |
| `all-adsets-with-insights` | ~41회 | **3회** |
| `AuditAdAccountUseCase` | ~101회 | **2회** |

- `mapWithConcurrency` 루프 → 단일 호출로 교체
- Response에서 ID 기반 매핑(`Map<id, insights>`)으로 데이터 조합
- Partial failure → 전체 성공/실패 (소규모 타겟에 적합)

## 3. 테스트 전략

- 기존 36개 테스트: 시나리오 유지, Mock만 새 메서드로 교체
- 신규 ~15개 테스트: 새 메서드의 정상/에러/빈 결과 검증

## 4. 위험 관리

- 기존 코드 추가만, 삭제 없음 → 문제 시 즉시 Rollback 가능
- 엔터프라이즈 대형 계정 → `filtering` 파라미터로 범위 제한
