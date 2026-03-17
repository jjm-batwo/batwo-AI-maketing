---
name: project-health-check
description: 프로젝트 전체 구조와 기능 구현 완성도를 CTO/기획자 관점으로 진단. 잘된 부분과 부족한 부분을 파악하고 기획자·개발자에게 실질적 업무 지시를 생성. /project-health 슬래시 커맨드로 호출.
---

# Project Health Check (프로젝트 건강 진단)

> **"이 제품을 내일 고객에게 보여줄 수 있는가?"를 코드 근거로 판정한다.**

## 트리거

| 트리거 | 설명 |
|--------|------|
| `/project-health` | 명시적 호출 |
| "프로젝트 현황", "완성도", "진행도" | 자연어 |
| "뭐부터 해야 해?", "우선순위 잡아줘" | 방향 설정 |

## 적용 수준 자동 판별

| 요청 유형 | 적용 수준 |
|-----------|----------|
| **빠른 현황** ("지금 상태?") | Phase 1 + Phase 2 요약 |
| **정기 진단** ("/project-health") | Phase 1~5 전체 |
| **다음 작업** ("뭐 해야 해?") | Phase 2 + Phase 5 |

---

## 대형 프로젝트 자동 감지

> **Phase 1 실행 후 소스 줄수가 1만줄 이상이면 자동으로 경량 모드를 적용합니다.**

### 경량 모드 규칙

| 항목 | 기본 모드 (<1만줄) | 경량 모드 (≥1만줄) |
|------|-------------------|-------------------|
| Phase 1 줄수 세기 | `find -exec cat \| wc -l` | `find \| xargs wc -l \| tail -1` |
| Phase 2 스캔 | 개별 find × 8영역 | **단일 통합 스크립트 1회** |
| Phase 2 상세 | 모든 영역 | **⚠️/❌ 영역만** |
| Phase 4 tsc/build | 매번 실행 | **캐시 확인 → 변경 없으면 스킵** |
| Phase 4 lint | 매번 실행 | **최근 커밋에서 lint 통과 여부만 확인** |
| 그룹 분할 | 한 번에 실행 가능 | **반드시 A→B→C 그룹 분할** |

---

## Phase 그룹 분할 전략

> 대형 프로젝트에서 Phase 1~5를 한 세션에 전부 실행하면 컨텍스트 오염 발생.

| 그룹 | Phase | 출력 |
|------|-------|------|
| **A: 데이터 수집** | Phase 1 + Phase 2 요약 | 규모 스냅샷 + 파이프라인 매트릭스 |
| **B: 검증 + 진단** | Phase 2 상세(⚠️/❌만) + Phase 3 + Phase 4 | 교차 검증 + 3축 진단 |
| **C: 액션 생성** | Phase 5 | 기획자/개발자 분리 액션 |

```
그룹 A → 매트릭스 테이블 1개로 압축 → 그룹 B → 진단 요약 압축 → 그룹 C
```

---

## Phase 1: 프로젝트 규모 스캔

> 정량적 기초 데이터를 수집. **추측 금지 — 반드시 명령어 실행.**

### 1-1. 통합 수집 스크립트 (단일 실행)

```bash
# === Phase 1: 프로젝트 규모 통합 스캔 ===
echo "--- 소스 ---"
SRC_FILES=$(find src/ \( -name "*.ts" -o -name "*.tsx" \) | wc -l | tr -d ' ')
SRC_LINES=$(find src/ \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 wc -l 2>/dev/null | tail -1 | awk '{print $1}')
echo "파일: $SRC_FILES | 줄수: $SRC_LINES"

echo "--- 테스트 ---"
TEST_FILES=$(find tests/ \( -name "*.test.*" -o -name "*.spec.*" \) | wc -l | tr -d ' ')
TEST_LINES=$(find tests/ \( -name "*.test.*" -o -name "*.spec.*" \) -print0 | xargs -0 wc -l 2>/dev/null | tail -1 | awk '{print $1}')
echo "파일: $TEST_FILES | 줄수: $TEST_LINES"

echo "--- 레이어 ---"
echo "Domain: $(find src/domain -name '*.ts' 2>/dev/null | wc -l | tr -d ' ')"
echo "Application: $(find src/application -name '*.ts' 2>/dev/null | wc -l | tr -d ' ')"
echo "Infrastructure: $(find src/infrastructure -name '*.ts' 2>/dev/null | wc -l | tr -d ' ')"
echo "Presentation: $(find src/presentation \( -name '*.tsx' -o -name '*.ts' \) 2>/dev/null | wc -l | tr -d ' ')"

echo "--- API/Pages/Models ---"
echo "API Routes: $(find src/app/api -name 'route.ts' 2>/dev/null | wc -l | tr -d ' ')"
echo "Pages: $(find src/app -name 'page.tsx' 2>/dev/null | wc -l | tr -d ' ')"
echo "Prisma Models: $(grep -c '^model ' prisma/schema.prisma 2>/dev/null)"
echo "DI Tokens: $(grep -c 'Symbol.for' src/lib/di/types.ts 2>/dev/null || echo 0)"

echo "--- 의존성 ---"
echo "deps: $(jq '.dependencies | length' package.json) | devDeps: $(jq '.devDependencies | length' package.json)"

echo "--- 활성도 ---"
echo "7일: $(git log --oneline --since='7 days ago' 2>/dev/null | wc -l | tr -d ' ') | 30일: $(git log --oneline --since='30 days ago' 2>/dev/null | wc -l | tr -d ' ')"
```

### 1-2. 파생 지표

| 지표 | 계산 | 건강 기준 |
|------|------|----------|
| 테스트:소스 비율 | 테스트줄수/소스줄수×100 | ≥30% 🟢 / 20~29% 🟡 / <20% 🔴 |
| 레이어 균형도 | 4개 레이어 표준편차 | 고르면 🟢 / 한쪽 비대 🟡 |
| 개발 활성도 | 7일 커밋수 | ≥10 🟢 / 5~9 🟡 / <5 🔴 |

### 1-3. 대형 프로젝트 판정

```
소스 줄수 ≥ 10,000 → 이후 모든 Phase에서 경량 모드 적용
```

---

## Phase 2: 기능 영역별 파이프라인 완성도 (핵심)

> 8개 영역을 Domain→UseCase→API→UI→Test 파이프라인으로 스캔.

### 2-1. 9개 핵심 기능 영역

| # | 영역 | Primary 디렉토리 |
|---|------|-----------------|
| 1 | 인증/계정 | `src/infrastructure/auth/`, `src/app/(auth)/` |
| 2 | 캠페인 관리 | `src/*/campaign/`, `src/app/api/campaigns/` |
| 3 | 광고 관리 | `src/application/use-cases/ad*/`, `src/presentation/components/campaign/Ad*.tsx`, `src/app/api/meta/ads/` |
| 4 | 대시보드/KPI | `src/application/use-cases/kpi/`, `src/app/(dashboard)/dashboard/` |
| 5 | AI 챗봇 | `src/application/use-cases/chat/`, `src/application/services/*Agent*`, `src/domain/entities/Conversation.ts`, `src/app/api/agent/` |
| 6 | 리포트/감사 | `src/application/use-cases/report/`, `src/application/use-cases/audit/` |
| 7 | 최적화/자동화 | `src/application/use-cases/optimization/` |
| 8 | 설정/결제 | `src/application/use-cases/payment/`, `src/app/api/payments/` |
| 9 | 픽셀/트래킹 | `src/application/use-cases/pixel/`, `src/app/api/pixel/` |

### 2-2. 명시적 경로 스캔 (단일 스크립트 — 1회 실행)

> **패턴 매칭이 아닌 명시적 경로로 스캔한다.** `*ad*` 같은 부분 매칭은 admin/loading 등에 오탐을 일으킨다.
> `find -path` 는 `\|`(OR)를 지원하지 않으므로, 복수 경로는 `-o` 문법 또는 개별 find를 사용한다.

```bash
# === Phase 2: 8영역 명시적 경로 스캔 ===
# 헬퍼: 복수 디렉토리의 파일 수 합산
count_files() { local total=0; for d in "$@"; do local c=$(find "$d" -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' '); total=$((total + c)); done; echo $total; }
count_tests() { local total=0; for p in "$@"; do local c=$(find tests -path "*/$p/*" -name "*.test.*" 2>/dev/null | wc -l | tr -d ' '); total=$((total + c)); done; echo $total; }
count_routes() { local total=0; for d in "$@"; do local c=$(find "$d" -name "route.ts" 2>/dev/null | wc -l | tr -d ' '); total=$((total + c)); done; echo $total; }

# 1. 인증/계정
echo "auth | Dom:$(count_files src/domain/entities/User.ts src/domain/repositories/IUserRepository.ts) UC:$(count_files src/infrastructure/auth) API:$(count_routes src/app/api/auth) UI:$(count_files 'src/app/(auth)') Test:$(count_tests auth)"

# 2. 캠페인 관리
echo "campaign | Dom:$(count_files src/domain/entities/Campaign.ts src/domain/repositories/ICampaignRepository.ts) UC:$(count_files src/application/use-cases/campaign) API:$(count_routes src/app/api/campaigns) UI:$(count_files 'src/presentation/components/campaign' 'src/app/(dashboard)/campaigns') Test:$(count_tests campaign)"

# 3. 광고 관리 (⚠️ "ad" 패턴 오탐 방지 — /ad/ /ads/ /adset/ 만 매칭)
# ⚠️ UI 오진 방지: Ad/AdSet 컴포넌트는 campaign/ 내 임베디드 — Ad*.tsx, AdSet*.tsx, CreativeEditor/ 포함
AD_UI=$(find src/presentation/components/campaign -maxdepth 1 \( -name 'Ad*.tsx' -o -name 'AdSet*.tsx' -o -name 'StepAdSetConfig*' \) 2>/dev/null | wc -l | tr -d ' ')
AD_UI=$((AD_UI + $(find src/presentation/components/campaign/CreativeEditor -name '*.tsx' 2>/dev/null | wc -l | tr -d ' ')))
echo "ad | Dom:$(count_files src/domain/entities/Ad.ts src/domain/entities/AdSet.ts src/domain/repositories/IAdRepository.ts src/domain/repositories/IAdSetRepository.ts) UC:$(count_files src/application/use-cases/ad src/application/use-cases/adset) API:$(count_routes src/app/api/meta/all-ads-with-insights src/app/api/meta/all-adsets-with-insights) UI:${AD_UI} Test:$(count_tests ad adset)"

# 4. 대시보드/KPI (⚠️ find -path는 \| 미지원 — 개별 count 후 합산)
echo "kpi | Dom:$(count_files src/domain/entities/KPI.ts src/domain/repositories/IKPIRepository.ts src/domain/repositories/IInsightHistoryRepository.ts) UC:$(count_files src/application/use-cases/kpi) API:$(count_routes src/app/api/insights 'src/app/api/ads/[adId]/insights') UI:$(count_files 'src/app/(dashboard)/dashboard' 'src/presentation/components/dashboard') Test:$(count_tests kpi insight)"

# 5. AI 챗봇 (⚠️ API는 agent/ 하위 전체 — chat, alerts, conversations, actions)
# ⚠️ UseCase 오진 방지: application/services/*Service.ts 도 UseCase 역할을 수행함 (에이전트 기반 아키텍처)
# ⚠️ Domain 오진 방지: Conversation.ts 엔티티 + IConversationRepository.ts 도 포함
echo "chat | Dom:$(count_files src/domain/value-objects/ChatIntent.ts src/domain/entities/Conversation.ts src/domain/repositories/IConversationRepository.ts) UC:$(( $(count_files src/application/use-cases/chat) + $(find src/application/services -maxdepth 1 -name '*Agent*Service.ts' -o -name '*Conversation*Service.ts' 2>/dev/null | wc -l | tr -d ' ') )) API:$(count_routes src/app/api/agent) UI:$(count_files src/presentation/components/chat) Test:$(count_tests chat agent)"

# 6. 리포트/감사
echo "report | Dom:$(count_files src/domain/entities/Report.ts src/domain/repositories/IReportRepository.ts) UC:$(count_files src/application/use-cases/report src/application/use-cases/audit) API:$(count_routes src/app/api/reports src/app/api/audit) UI:$(count_files 'src/app/(dashboard)/reports' 'src/app/(dashboard)/audit' src/presentation/components/report src/presentation/components/audit) Test:$(count_tests report audit)"

# 7. 최적화/자동화
echo "optimization | Dom:$(count_files src/domain/entities/OptimizationRule.ts src/domain/repositories/IOptimizationRuleRepository.ts src/domain/value-objects/RuleCondition.ts src/domain/value-objects/RuleAction.ts) UC:$(count_files src/application/use-cases/optimization) API:$(count_routes src/app/api/optimization-rules) UI:$(count_files 'src/app/(dashboard)/optimization-rules' src/presentation/components/optimization) Test:$(count_tests optimization)"

# 8. 설정/결제 (⚠️ UseCase는 payment/, API는 payments/ 디렉토리에 위치)
echo "settings | Dom:$(count_files src/domain/entities/Subscription.ts src/domain/entities/Team.ts) UC:$(count_files src/application/use-cases/payment) API:$(count_routes src/app/api/payments) UI:$(count_files 'src/app/(dashboard)/settings' src/app/checkout) Test:$(count_tests payment billing subscription)"

# 9. 픽셀/트래킹
echo "pixel | Dom:$(count_files src/domain/entities/MetaPixel.ts src/domain/entities/ConversionEvent.ts src/domain/repositories/IMetaPixelRepository.ts src/domain/repositories/IConversionEventRepository.ts) UC:$(count_files src/application/use-cases/pixel) API:$(count_routes src/app/api/pixel) UI:$(count_files src/presentation/components/pixel 'src/app/(dashboard)/settings/pixel') Test:$(count_tests pixel capi tracking)"
```

#### 디렉토리 존재 경고

스캔 결과에서 UseCase 또는 API가 0건인 영역은 **해당 디렉토리가 실제로 없는 것인지 확인**한다.
디렉토리가 존재하는데 0건이면 ⚠️, 디렉토리 자체가 없으면 ❌로 판정한다.

> **오진 방지 — 대체 경로 패턴 확인 필수**:
> - **Service-as-UseCase**: `src/application/services/` 에 `*Service.ts` 가 UseCase 역할을 하는 경우 (에이전트/오케스트레이션 아키텍처)
> - **임베디드 UI**: 광고 UI가 `components/campaign/Ad*.tsx` 처럼 다른 영역 하위에 임베디드된 경우
> - **Domain barrel export 누락**: 엔티티 파일은 존재하나 `index.ts` barrel export에 빠져 있어 import 검색에 누락되는 경우

```bash
# 디렉토리 존재 검증 (0건 영역에 대해 실행)
for DIR in src/application/use-cases/chat src/app/api/chat; do
  [ -d "$DIR" ] && echo "EXISTS: $DIR" || echo "MISSING: $DIR"
done
# 대체 경로 확인 (UseCase 0건인 영역)
echo "--- Service-as-UseCase 대체 경로 ---"
find src/application/services -maxdepth 1 -name '*Service.ts' 2>/dev/null | head -10
```

### 2-3. 판정 기준

| 판정 | 기준 |
|:---:|------|
| ✅ | 파일 존재 + 내용 유효 |
| ⚠️ | 존재하지만 불완전 (빈 메서드, TODO, 부분 구현) |
| ❌ | 파일 없음 |

**가중치**: Domain 20% / UseCase 20% / API 15% / UI 15% / Test 10% / Runtime 20%

**Runtime 판정**: E2E 테스트 존재 여부로 대체 (dev 서버 미실행 시)

**총점 → 등급**: 90%+ 🟢 / 70~89% 🟡 / 50~69% 🟠 / <50% 🔴

### 2-4. 상세 분석

**통합 스캔 후 ⚠️/❌ 영역에 대해서만** 디렉토리 기반 상세 스캔 실행. 🟢 영역은 스킵.

---

## Phase 3: 계획서 진행도 교차 검증

> 문서와 코드의 불일치를 발견.

### 3-1. 수집 (경량)

```bash
# 계획서 상태 요약 (1회 실행)
echo "=== 계획서 목록 ===" && ls docs/plans/PLAN_*.md 2>/dev/null
echo "=== 상태 ===" && grep -h "Status\|status" docs/plans/PLAN_*.md 2>/dev/null | head -20
echo "=== 체크박스 ===" && grep -ch '\- \[x\]' docs/plans/PLAN_*.md 2>/dev/null | paste -s -d+ - | bc 2>/dev/null
echo "=== 미완료 ===" && grep -ch '\- \[ \]' docs/plans/PLAN_*.md 2>/dev/null | paste -s -d+ - | bc 2>/dev/null
```

### 3-2. 검증 포인트

| 검증 | 방법 |
|------|------|
| 완료 → 코드 존재? | 계획서 태스크 vs find로 확인 |
| 완료 → 테스트 존재? | 관련 테스트 파일 확인 |
| 진행 중 → 어디까지? | `[x]` vs `[ ]` 비율 |
| 계획 밖 코드 | src/에 있지만 계획서에 없는 기능 |

---

## Phase 4: CTO 종합 진단 — 3축 판정

### 4-1. 사업적 완성도 (6점)

| # | 항목 | 확인 |
|---|------|------|
| 1 | 핵심 가치 전달 | 랜딩 페이지 CTA |
| 2 | 온보딩 플로우 | 로그인→첫화면 경로 |
| 3 | 핵심 사용자 여정 | 캠페인→대시보드→AI |
| 4 | 차별화 기능 | AI 챗봇, 자동 최적화 |
| 5 | 결제/구독 | 결제 연동 상태 |
| 6 | 법적 요구사항 | 약관/개인정보 페이지 |

등급: 6/6 🟢A / 4~5 🟡B / 2~3 🟠C / 0~1 🔴D

### 4-2. 기술적 완성도 (7점) — 캐시 기반 스킵

> **대형 프로젝트에서 tsc/build/lint를 매번 실행하면 수분~십수분 소요.**
> 아래 캐시 확인으로 스킵 여부를 먼저 판단한다.

```bash
# === 기술 점검 캐시 확인 (경량) ===
echo "--- tsc 캐시 ---"
# tsconfig의 tsBuildInfoFile이 마지막 커밋 이후면 스킵
TSBUILD=$(find . -maxdepth 2 -name "*.tsbuildinfo" 2>/dev/null | head -1)
if [ -n "$TSBUILD" ]; then
  TS_TIME=$(stat -f %m "$TSBUILD" 2>/dev/null || stat -c %Y "$TSBUILD" 2>/dev/null)
  LAST_COMMIT=$(git log -1 --format=%ct 2>/dev/null)
  [ "$TS_TIME" -gt "$LAST_COMMIT" ] 2>/dev/null && echo "CACHED: tsc 최근 통과" || echo "STALE: tsc 재실행 필요"
else
  echo "STALE: tsbuildinfo 없음"
fi

echo "--- build 캐시 ---"
# .next/BUILD_ID가 최근 커밋 이후면 스킵
if [ -f .next/BUILD_ID ]; then
  BUILD_TIME=$(stat -f %m .next/BUILD_ID 2>/dev/null || stat -c %Y .next/BUILD_ID 2>/dev/null)
  LAST_COMMIT=$(git log -1 --format=%ct 2>/dev/null)
  [ "$BUILD_TIME" -gt "$LAST_COMMIT" ] 2>/dev/null && echo "CACHED: build 최근 성공" || echo "STALE: build 재실행 필요"
else
  echo "STALE: build 없음"
fi

echo "--- 아키텍처 위반 (항상 실행 — 빠름) ---"
# ⚠️ .md 파일 제외 — AGENTS.md 등 문서 내 예시 코드 오탐 방지
find src/domain -name "*.ts" -exec grep -ln "from.*@prisma\|from.*next/\|from.*react" {} \; 2>/dev/null | head -5 || echo "위반 없음"

echo "--- DI 불일치 (항상 실행 — 빠름) ---"
# ⚠️ container.ts가 아닌 modules/*.module.ts와 비교 (모듈 기반 등록 구조)
DEFINED=$(grep "Symbol.for" src/lib/di/types.ts 2>/dev/null | sed "s/.*Symbol.for('\(.*\)').*/\1/" | sort)
REGISTERED=$(grep -rh "DI_TOKENS\." src/lib/di/modules/ 2>/dev/null | sed 's/.*DI_TOKENS\.\([A-Za-z]*\).*/\1/' | sort -u)
DEFINED_COUNT=$(echo "$DEFINED" | wc -l | tr -d ' ')
REGISTERED_COUNT=$(echo "$REGISTERED" | wc -l | tr -d ' ')
echo "정의: ${DEFINED_COUNT}개 | 등록: ${REGISTERED_COUNT}개"
[ "$DEFINED_COUNT" -le "$((REGISTERED_COUNT + 5))" ] 2>/dev/null && echo "DI 정상 (허용 범위)" || echo "DI 불일치 — 미등록 토큰 확인 필요"
```

**캐시 판정 규칙**:
- `CACHED` → 해당 항목 ✅ 처리 (재실행 불필요)
- `STALE` → **사용자에게 실행 여부 확인** 후 실행 (기본: 스킵하고 ⚠️ 처리)
- 아키텍처 위반/DI 불일치 → 항상 실행 (grep 기반이라 빠름)

등급: 7/7 🟢A / 5~6 🟡B / 3~4 🟠C / 0~2 🔴D

### 4-3. 운영 준비도 (6점)

```bash
# === 운영 점검 (경량 — 파일 존재만 확인) ===
echo "CI/CD: $(ls .github/workflows/*.yml 2>/dev/null | wc -l | tr -d ' ')개 workflow"
echo "vercel.json: $([ -f vercel.json ] && echo '있음' || echo '없음')"
echo ".env.example: $([ -f .env.example ] && wc -l < .env.example | tr -d ' ' || echo '없음')줄"
echo "husky: $([ -d .husky ] && echo '있음' || echo '없음')"
echo "README: $([ -f README.md ] && wc -l < README.md | tr -d ' ' || echo '없음')줄"
echo "prisma migrations: $(ls prisma/migrations/ 2>/dev/null | wc -l | tr -d ' ')개"

# ⚠️ 모니터링 오진 방지: Sentry 설정 + reportError 유틸리티 존재 확인
SENTRY_CONFIGS=$(ls sentry.client.config.* sentry.server.config.* sentry.edge.config.* 2>/dev/null | wc -l | tr -d ' ')
REPORT_ERROR=$([ -f src/lib/errors/reportError.ts ] && echo '있음' || echo '없음')
echo "모니터링: Sentry ${SENTRY_CONFIGS}개 config | reportError: ${REPORT_ERROR}"
```

등급: 6/6 🟢A / 4~5 🟡B / 2~3 🟠C / 0~1 🔴D

### 4-4. 종합 등급 산출

3축 등급을 종합하여 최종 판정. 출력 형식:

```markdown
## 🏥 CTO 종합 진단

| 축 | 등급 | 점수 | 핵심 코멘트 |
|----|:---:|:---:|-----------|
| 사업적 | 🟡 B | 4/6 | ... |
| 기술적 | 🟢 A | 7/7 | ... |
| 운영 | 🟡 B | 5/6 | ... |
| **종합** | **🟡 B+** | — | ... |
```

---

## Phase 5: 기획자/개발자 분리 액션 아이템

> Phase 2~4 결과를 실행 가능한 업무로 변환.

### 액션 아이템 품질 기준 (필수)

- **분자 단위** — 1~3파일, 1~3시간
- **검증 가능** — 완료 확인 명령어 포함
- **파일 경로** — 정확한 경로 명시
- **선행 조건** — 의존성 명시

### 우선순위 결정

| 우선순위 | 기획자 기준 | 개발자 기준 |
|:---:|-----------|-----------|
| 🔴 즉시 | 플로우 끊김, 핵심 미동작, 법적 누락 | 빌드 에러, 보안 취약, 데이터 손실 |
| 🟡 다음 | UX 불편, 기능 미완성 | 테스트 누락, 성능, DI 불일치 |
| 🟢 백로그 | 추가 기능, 폴리싱 | 리팩터링, 최적화, 문서화 |

### 비즈니스 임팩트 보정

| 임팩트 | 의미 |
|:---:|------|
| 💰💰💰 | 매출 직결 (결제, 핵심 여정) |
| 💰💰 | 전환율/리텐션 (온보딩, 대시보드) |
| 💰 | 차별화 (AI 챗봇, 고급 리포트) |

**보정**: 💰💰💰 + 🟠이하 → 🔴 즉시 / 💰 + 🔴이하 → 🟡 다음 (급하지 않음)

---

## 자가 검증 (진단 완료 후)

- [ ] Phase 1 수치가 실제 명령어 실행 결과인가?
- [ ] Phase 2 각 영역에 코드 근거(파일 경로)가 있는가?
- [ ] Phase 4 판정이 등급 기준표에 근거하여 산출되었는가?
- [ ] Phase 5 액션 아이템이 분자 단위인가?
- [ ] 추측성 표현("should", "probably")이 없는가?

---

## 출력 위치

| 산출물 | 위치 |
|--------|------|
| 정기 진단 리포트 | `docs/04-report/project-health-{YYYY-MM-DD}.md` |
| 빠른 현황 | 대화 내 직접 출력 |

이전 진단 비교: `ls -t docs/04-report/project-health-*.md 2>/dev/null | head -1`

---

## 연계 스킬

| 상황 | 연계 |
|------|------|
| 새 기능 계획 | `feature-planner` → `plan-deep-validation` |
| 버그 발견 | `superpowers-systematic-debugging` |
| UI 문제 | `ui-ux-pro-max` |
| 코드 리뷰 | `verify-implementation` |
| 결과 공유 | `/wrap` |
