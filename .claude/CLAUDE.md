<!-- OMC:START -->
<!-- OMC 전체 지침은 ~/.claude/CLAUDE.md (글로벌)에 있음. 여기는 프로젝트 오버라이드만 기록 -->
<!-- OMC:END -->

# 바투 프로젝트 에이전트 설정

## 의도 분류 프로토콜 (Intent Gate)

모든 요청에 대해 작업 시작 전 분류하고 발화한다:

| 카테고리 | 신호 | 행동 |
|---------|------|------|
| **Trivial** | 단일 파일, 명확한 위치 | 직접 실행, 위임 안 함 |
| **Explicit** | 파일/함수 명시 | 레이어 확인 → 위임 |
| **Exploratory** | "어떻게 동작?", "찾아줘" | explore 먼저 → 결과 기반 실행 |
| **Open-ended** | "개선", "리팩토링", "기능 추가" | prometheus → architect → 실행 |
| **Ambiguous** | 범위 불명확 | 명확화 질문 1개 |

발화 형식: `[Intent: <카테고리>] <요약> → <레이어> | <에이전트> (<모델>)`

예시:
- `[Intent: Explicit] Campaign 엔티티 검증 추가 → Domain | executor (sonnet)`
- `[Intent: Open-ended] 온보딩 플로우 리팩토링 → prometheus → ask_codex(architect) → executor (sonnet)`
- `[Intent: Open-ended] 랜딩 페이지 디자인 개선 → ask_gemini(designer) → executor (sonnet)`
- `[Intent: Explicit] API 보안 취약점 점검 → ask_codex(security-reviewer)`
- `[Intent: Trivial] README 오타 수정 → 직접 실행`

## 에이전트 위임 규칙

### 레이어별 담당 에이전트 (Tri-Model 라우팅)

**Claude 전용** (도구 접근 필요 — 코드 작성/실행):
| 작업 영역 | 에이전트 | 모델 | 비고 |
|----------|---------|------|------|
| Domain 엔티티/값 객체 | executor | sonnet | Claude 전용 (코드 작성) |
| Application UseCase | executor | sonnet | Claude 전용 (코드 작성) |
| Infrastructure 어댑터 | executor | sonnet | Claude 전용 (코드 작성) |
| 복잡한 자율 구현 | deep-executor | opus | Claude 전용 (장시간 자율 실행) |
| 코드베이스 탐색 | explore | haiku | Claude 전용 (파일 접근) |
| 디버깅/근본 원인 분석 | debugger | sonnet | Claude 전용 (런타임 분석) |
| 테스트 전략/작성 | test-engineer | sonnet | Claude 전용 (테스트 실행) |
| 빌드/타입 오류 | build-fixer | sonnet | Claude 전용 (빌드 실행) |
| 검증 | verifier | sonnet | Claude 전용 (커맨드 실행) |
| Git 작업 | git-master | sonnet | Claude 전용 (git 접근) |

**Codex (GPT-5.3) 우선** — 비판적 분석, 아키텍처, 보안:
| 작업 영역 | MCP 호출 | 폴백 | 비고 |
|----------|---------|------|------|
| 아키텍처 결정 | `ask_codex(role="architect")` | architect (opus) | 아키텍처 리뷰 특화 |
| 계획 비판/검증 | `ask_codex(role="critic")` | critic (opus) | Momus 패턴 (oh-my-opencode) |
| 보안 검토 | `ask_codex(role="security-reviewer")` | security-reviewer (sonnet) | 보안 취약점 분석 특화 |
| 코드 리뷰 | `ask_codex(role="code-reviewer")` | code-reviewer (opus) | 포괄적 코드 분석 |
| 계획 수립 | `ask_codex(role="planner")` | planner (opus) | 계획 검증/시퀀싱 |
| 요구사항 분석 | `ask_codex(role="analyst")` | analyst (opus) | Gap 분석 특화 |

**Gemini (gemini-3-pro-preview) 우선** — UI/UX, 문서, 시각 분석:
| 작업 영역 | MCP 호출 | 폴백 | 비고 |
|----------|---------|------|------|
| UI 컴포넌트 설계 | `ask_gemini(role="designer")` | designer (sonnet) | 1M 컨텍스트, UI/UX 특화 |
| 문서 작성 | `ask_gemini(role="writer")` | writer (haiku) | 대용량 컨텍스트 문서화 |
| 이미지/스크린샷 분석 | `ask_gemini(role="vision")` | vision (sonnet) | 시각 분석 특화 |

**API Route 보안 검토**: executor (Claude) + `ask_codex(role="security-reviewer")` 병렬 실행

### MCP 라우팅 규칙

1. **MCP 우선**: Codex/Gemini 권장 역할은 MCP 먼저 호출, 실패 시 Claude 폴백
2. **Claude 전용**: 코드 작성/실행/파일 접근이 필요한 작업은 반드시 Claude 에이전트
3. **병렬 활용**: 설계(Codex) + 구현(Claude) + 리뷰(Gemini) 동시 실행 가능
4. **context_files 필수**: MCP 호출 시 관련 파일 경로를 반드시 첨부
5. **MCP는 자문**: MCP 출력은 참고용, 최종 검증(tsc/vitest/build)은 Claude 에이전트가 수행

### 구조화된 위임 프로토콜 (6-Section Prompt)

에이전트 위임 시 다음 6개 섹션을 프롬프트에 포함한다:

```
1. TASK: 구체적 목표 (한 문장)
2. EXPECTED OUTCOME: 완료 기준 (파일, 테스트 수, 빌드 통과)
3. REQUIRED TOOLS: 도구 화이트리스트 (Read, Edit, Bash 등)
4. MUST DO: 필수사항 (TDD, 한국어, 패턴 준수)
5. MUST NOT DO: 금지사항 (테스트 약화, export 제거, _접두사 남용)
6. CONTEXT: 파일 경로, 참고 패턴, 제약조건
```

위임 전 **사전 선언** 필수:
```
[Delegation] <에이전트> (<모델>)
- 레이어: <Domain|Application|Infrastructure|Presentation|API>
- 이유: <위임 사유>
- 보안 검토: 필요/불필요
```

보안 검토가 필요한 경로:
- `src/app/api/**`, `src/infrastructure/auth/**`, `src/infrastructure/external/**`, `prisma/schema.prisma`

### TDD 에이전트 워크플로우
기능 구현 요청 시 에이전트는 반드시 다음 순서를 따른다:

```
1. RED   → 실패하는 테스트 작성 → `npx vitest run [파일]`로 실패 확인
2. GREEN → 최소 구현 작성 → `npx vitest run [파일]`로 통과 확인
3. REFACTOR → 코드 정리 → 전체 테스트 통과 확인
```

**Self-Healing**: 테스트 실패 시 테스트를 약화시키지 말고 구현 코드를 수정할 것.

### 검증 체크리스트
코드 변경 완료 후 반드시 실행:
```bash
npx tsc --noEmit        # 타입 체크
npx vitest run          # 단위 테스트
npx next build          # 빌드 확인
```

### 증거 기반 완료 검증

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

### 실패 복구 프로토콜 (3-Strike Rule)

동일 작업에서 **3회 연속 실패** 시:

1. **STOP** — 현재 접근 즉시 중단
2. **REVERT** — `git stash` 또는 변경 되돌리기
3. **DOCUMENT** — 실패 원인 기록 (에러 메시지, 시도한 접근)
4. **CONSULT** — 전문 에이전트에게 위임:
   - 타입 에러 → `build-fixer`
   - 아키텍처 문제 → `architect`
   - 테스트 설계 → `test-engineer`
   - 런타임 오류 → `debugger`
5. **ASK USER** — 4단계에서도 해결 불가 시 사용자에게 질문

발화 형식:
```
[3-Strike] <작업명> 3회 실패
- 시도 1: <접근> → <에러>
- 시도 2: <접근> → <에러>
- 시도 3: <접근> → <에러>
- 조치: CONSULT → build-fixer (sonnet)
```

## Wisdom 전달 프로토콜

서브에이전트 결과 수신 후:

1. **추출** — 새로운 패턴, 주의사항, 실패 원인을 식별
2. **대조** — MEMORY.md 기존 항목과 중복 여부 확인
3. **기록** — 신규 발견 시 `<remember>` 태그로 기록
4. **전달** — 후속 위임 시 CONTEXT 섹션에 이전 학습 포함

예시:
```
[Wisdom] MetaAdsClient 위임 결과에서 발견:
- MSW mock이 v18 경로 사용 중 → v25.0 통일 필요
- MEMORY.md에 기록 완료 → 후속 Meta API 작업에 CONTEXT로 전달
```

## 코드베이스 상태 인식

바투 프로젝트는 **Transitional** 상태이다:

| 영역 | 상태 | 전략 |
|------|------|------|
| 클린 아키텍처 계층 | **Disciplined** | 기존 패턴 엄수, 의존성 규칙 준수 |
| 캠페인/KPI/보고서 | **Disciplined** | 기존 코드와 일관성 유지 |
| 픽셀 설치 기능 | **Greenfield** | 올바른 패턴으로 신규 구현 |
| Advantage+ / AdSet / Ad | **Greenfield** | 도메인 모델 확장, 기존 패턴 참조 |
| 랜딩 페이지 디자인 | **Evolving** | 디자인 리뉴얼 진행 중, 시각적 검증 우선 |

**Disciplined 영역**: 변경 시 기존 테스트/패턴 깨지지 않도록 주의. explore로 기존 구현 확인 후 작업.
**Greenfield 영역**: 자유도 높지만 클린 아키텍처 규칙(domain←application←infrastructure) 준수.
**Evolving 영역**: CSS/Tailwind 변경은 브라우저 검증. 구조 변경 시 빌드 확인.

## 보안 자동 검토 대상
다음 경로 변경 시 `ask_codex(role="security-reviewer")` 자동 실행 (Codex 불가 시 Claude security-reviewer 폴백):
- `src/app/api/**` — API 엔드포인트
- `src/infrastructure/auth/**` — 인증/인가
- `src/infrastructure/external/**` — 외부 API 연동
- `prisma/schema.prisma` — DB 스키마 변경

## Skills

커스텀 검증 및 유지보수 스킬은 `.claude/skills/`에 정의되어 있습니다.

| Skill | Purpose |
|-------|---------|
| `verify-implementation` | 프로젝트의 모든 verify 스킬을 순차 실행하여 통합 검증 보고서를 생성합니다 |
| `manage-skills` | 세션 변경사항을 분석하고, 검증 스킬을 생성/업데이트하며, CLAUDE.md를 관리합니다 |
| `verify-architecture` | 클린 아키텍처 레이어 의존성 규칙 검증 (domain/application/infrastructure 간 import) |
| `verify-di-registration` | DI 컨테이너 토큰 정의와 실제 등록의 동기화 검증 |
| `verify-cache-tags` | ISR 캐시 태그와 revalidateTag 매핑 일관성 검증 |
| `verify-bundle` | 번들 최적화 검증 (namespace import, dev-only 누출, ssr:false) |
| `verify-meta-api-version` | Meta Graph API v25.0 버전 통일성 검증 |
| `verify-token-encryption` | DB accessToken 암복호화 적용 일관성 검증 |
| `verify-ui-components` | UI 컴포넌트 일관성, 접근성, 성능 패턴 검증 (랜딩/대시보드/채팅/최적화/픽셀/온보딩/감사 변경 후 사용) |
| `prometheus` | Prometheus 전략 계획 컨설턴트 — Pre-Interview Research, Intent-Specific Interview, Clearance Check, Verification Loop (Codex Momus), QA Scenarios. 복잡한 기능 구현 전 `/prometheus`로 호출 |
| `hephaestus` | Hephaestus 자율 딥 워커 — Codex(GPT-5.3) 기반 목표 지향 자율 실행. 목표만 주면 코드베이스 탐색 → 패턴 연구 → end-to-end 실행. `/hephaestus`로 호출 |

## 린트 자동 수정 주의사항
- `no-unused-vars` 수정 시 사용 중인 변수에 `_` 접두사를 붙이는 실수 주의
- `any→unknown` 변환 시 제네릭 저장소(ToolRegistry 등) 타입 호환성 깨짐 → 의도적 any는 eslint-disable 처리
- **린트 자동 수정 후 반드시 전체 테스트 실행**
