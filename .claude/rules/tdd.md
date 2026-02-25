---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "tests/**"
---

# TDD 개발 지침 (필수)

## 핵심 원칙
모든 기능 구현은 TDD 프로세스를 따른다. 테스트는 '살아있는 문서'로서 비즈니스 의도를 명확히 전달해야 한다.

## RED → GREEN → REFACTOR

**1단계: RED (테스트 먼저)**
- 프로덕션 코드 작성 전, 반드시 실패하는 테스트를 먼저 작성
- 테스트는 비즈니스 로직의 의도(Intent)를 담아야 함
- 컴파일 에러 또는 테스트 실패를 확인한 후 다음 단계로 진행

**2단계: GREEN (최소 구현)**
- 테스트를 통과시키는 최소한의 코드만 작성
- 테스트 미통과 상태에서 기능 확장 금지

**3단계: REFACTOR (정리)**
- 테스트 통과를 유지하면서 코드 정리
- 중복 제거, 네이밍 개선, 구조 정리

## Self-Healing 규칙
- 기존 코드 수정 시 테스트 실패 → **테스트를 약화시키지 말고, 구현 코드를 수정**
- 에러 메시지로 "어떤 비즈니스 로직이 깨졌는지" 추론하고 복구

## 테스트 네이밍 컨벤션
Given/When/Then이 자연어로 읽히도록 서술적 작성:
```typescript
// Good - 의도가 명확하게 읽힘
it('should_create_campaign_when_valid_budget_provided')
it('should_reject_campaign_when_weekly_limit_exceeded')
it('should_calculate_roas_with_discount_applied')

// Bad - 의도 불명확
it('test campaign')
it('works correctly')
```

## 테스트 구조 및 커버리지 목표
```
tests/
├── unit/           # domain (≥95%), application (≥90%)
├── integration/    # repositories (≥85%)
└── e2e/            # Playwright (주요 시나리오 100%)
```

## 레이어별 테스트 전략
| 레이어 | 도구 | 모킹 범위 | 예시 |
|--------|------|----------|------|
| Domain | Vitest | 없음 (순수 로직) | `Campaign.create()` 검증 |
| Application | Vitest | Repository 인터페이스 | `CreateCampaignUseCase` |
| Infrastructure | Vitest | DB (Prisma mock) | `PrismaCampaignRepo` |
| Presentation | Vitest + RTL | API 호출 | `CampaignForm` 렌더링 |
| E2E | Playwright | 없음 (실제 플로우) | 캠페인 생성 전체 흐름 |

## 에이전트 출력 형식
기능 구현 시 반드시 이 순서를 따를 것:
1. **[Test Code]** — 실패하는 테스트 작성 + 실패 확인
2. **[Reasoning]** — 이 테스트가 검증하는 비즈니스 요구사항 설명
3. **[Implementation]** — 테스트를 통과시키는 최소 구현 코드
4. **[Verify]** — 테스트 통과 확인 (`npx vitest run [파일]`)

## TDD 에이전트 워크플로우
```
1. RED   → 실패하는 테스트 작성 → `npx vitest run [파일]`로 실패 확인
2. GREEN → 최소 구현 작성 → `npx vitest run [파일]`로 통과 확인
3. REFACTOR → 코드 정리 → 전체 테스트 통과 확인
```

## 검증 체크리스트
코드 변경 완료 후 반드시 실행:
```bash
npx tsc --noEmit        # 타입 체크
npx vitest run          # 단위 테스트
npx next build          # 빌드 확인
```

## 증거 기반 완료 검증

작업 유형별 필수 증거:

| 작업 유형 | 필수 증거 | 통과 기준 |
|----------|---------|----------|
| 코드 수정 | tsc + vitest + build | 모두 exit 0 |
| 새 기능 | 위 + RED 실패 → GREEN 통과 로그 | 테스트 수 증가 |
| 버그 수정 | 재현 테스트 → 수정 후 통과 로그 | 회귀 없음 |
| UI 변경 | build + 반응형 확인 (md/lg/xl) | 깨짐 없음 |
| 리팩토링 | tsc + vitest (기존 테스트 100% 통과) | 동작 변경 없음 |

완료 시 반드시 증거를 첨부한다:
```
[Evidence]
- tsc: PASS | vitest: N tests PASS | build: exit 0
- 신규 테스트: +N개 | 변경 파일: N개
- 검증 커맨드 출력 요약
```

증거 없이 "완료"를 선언하지 않는다.
