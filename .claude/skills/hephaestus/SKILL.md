---
name: hephaestus
description: Hephaestus 자율 딥 워커 - Codex(GPT) 기반 목표 지향 자율 실행 에이전트. 목표만 주면 코드베이스를 탐색하고 패턴을 연구하여 end-to-end로 실행합니다.
---

<Purpose>
Hephaestus는 oh-my-opencode의 "The Legitimate Craftsman" 에이전트에서 영감을 받은 **Codex(GPT-5.3) 기반 자율 딥 워커**입니다.

**핵심 원칙: "목표를 주라, 레시피를 주지 마라."**

Claude(Opus/Sonnet)가 아닌 Codex(GPT)로 실행하여:
1. **Cross-model diversity** — Claude의 편향을 보완하는 다른 관점의 구현
2. **자율 탐색** — 코드베이스를 스스로 탐색하고 패턴을 연구
3. **End-to-end 실행** — 중간 확인 없이 목표까지 완주

**아키텍처 위치:**
```
Prometheus (계획) → Sisyphus/Ralph (오케스트레이션) → Hephaestus (자율 실행)
```
</Purpose>

<Use_When>
- "헤파이스토스", "hephaestus", "codex로 실행", "GPT로 구현"
- Prometheus 계획 완료 후 Codex 기반 자율 실행이 필요할 때
- Claude와 다른 관점의 구현이 필요할 때 (cross-model diversity)
- 단일 목표를 자율적으로 end-to-end 완수해야 할 때
- 코드베이스 패턴을 스스로 파악하여 구현해야 할 때
</Use_When>

<Do_Not_Use_When>
- Trivial 작업 (단일 파일, <10줄) → 직접 실행이 빠름
- UI/프론트엔드 작업 → Gemini(designer) 또는 Claude(designer)가 적합
- 아키텍처 결정이 필요한 작업 → Prometheus 또는 architect 먼저
- Codex MCP가 불가할 때 → deep-executor(opus) 폴백
</Do_Not_Use_When>

<Steps>

## PHASE 0: 실행 모드 분류

### Step 0: 입력 유형 판별

| 입력 유형 | 행동 |
|----------|------|
| **Prometheus 계획 파일** | 계획의 TODO를 순차/병렬로 Codex에게 위임 |
| **목표 문장** (e.g. "인증 모듈 추가해줘") | 목표를 Codex 프롬프트로 변환하여 자율 실행 |
| **모호한 요청** | 1-2개 명확화 질문 후 실행 |

### Step 1: 사전 컨텍스트 수집

Codex에게 위임하기 전, 필수 컨텍스트를 수집합니다:

```
Task(subagent_type="oh-my-claudecode:explore", model="haiku",
  prompt="[CONTEXT] Hephaestus 실행 준비. {goal} 관련 파일/패턴 매핑.
  [REQUEST] 1) 관련 파일 목록 (최대 10개)
  2) 기존 패턴/컨벤션 요약
  3) 테스트 파일 위치와 전략
  4) import 관계도",
  run_in_background=false)
```

---

## PHASE 1: Codex 자율 실행

### 실행 모드 A: 단일 목표 실행

단일 목표를 Codex에게 완전 위임합니다.

```
mcp__plugin_oh-my-claudecode_x__ask_codex(
  agent_role="executor",
  prompt="## 목표
  {goal}

  ## 코드베이스 컨텍스트
  {explore 결과 요약}

  ## 프로젝트 규칙
  - 클린 아키텍처: domain ← application ← infrastructure/presentation
  - TDD: RED → GREEN → REFACTOR (테스트 먼저 작성)
  - 한국어 주석 우선, 기술 용어는 영문 허용
  - Tailwind CSS 4 + shadcn/ui 사용
  - TypeScript strict mode

  ## 실행 지침
  1. 코드베이스를 먼저 탐색하여 기존 패턴을 파악하라
  2. 기존 패턴을 따르되, 개선이 명확한 경우에만 벗어나라
  3. 테스트를 먼저 작성하고, 통과시키는 최소 코드를 구현하라
  4. 완료 후 `npx tsc --noEmit && npx vitest run` 실행하여 검증하라
  5. 검증 실패 시 스스로 수정하라

  ## 금지 사항
  - 기존 테스트를 약화시키지 마라 (테스트 삭제/스킵 금지)
  - export를 제거하거나 _접두사를 남용하지 마라
  - 과도한 추상화를 만들지 마라",
  context_files=[{관련 파일 목록}])
```

### 실행 모드 B: 계획 기반 병렬 실행

Prometheus 계획이 있을 때, Wave별로 Codex를 병렬 실행합니다.

```
# Wave 1 — 기반 + 스캐폴딩 (병렬)
mcp__plugin_oh-my-claudecode_x__ask_codex(
  agent_role="executor",
  prompt="[PLAN] .omc/plans/{name}.md의 Task 1 실행\n{task 1 상세}",
  context_files=[계획 파일, 관련 소스],
  background=true)

mcp__plugin_oh-my-claudecode_x__ask_codex(
  agent_role="executor",
  prompt="[PLAN] .omc/plans/{name}.md의 Task 2 실행\n{task 2 상세}",
  context_files=[계획 파일, 관련 소스],
  background=true)

# Wave 2 — 핵심 구현 (Wave 1 완료 후)
# ... 순차 진행
```

### 실행 모드 C: Claude-Codex 협업 (Cross-Model)

복잡한 작업에서 Claude와 Codex가 역할 분담합니다.

```
# 1. Claude가 도메인 모델/인터페이스 설계
Task(subagent_type="oh-my-claudecode:executor", model="sonnet",
  prompt="도메인 엔티티와 포트 인터페이스 설계: {goal}",
  run_in_background=false)

# 2. Codex가 구현체/테스트 작성
mcp__plugin_oh-my-claudecode_x__ask_codex(
  agent_role="executor",
  prompt="Claude가 설계한 인터페이스에 맞춰 구현체와 테스트 작성: {goal}
  인터페이스 파일: {paths}",
  context_files=[인터페이스 파일들])

# 3. Claude가 통합 검증
Task(subagent_type="oh-my-claudecode:verifier", model="sonnet",
  prompt="Hephaestus 실행 결과 검증: tsc, vitest, build",
  run_in_background=false)
```

---

## PHASE 2: 검증 및 완료

### Step 1: 자동 검증

Codex 실행 완료 후 반드시 검증합니다:

```bash
npx tsc --noEmit      # 타입 체크
npx vitest run         # 단위 테스트
npx next build         # 빌드 확인
```

### Step 2: 결과 리뷰 (선택적 Cross-Model Review)

```
# Codex가 구현한 코드를 Claude가 리뷰
Task(subagent_type="oh-my-claudecode:quality-reviewer", model="sonnet",
  prompt="Hephaestus(Codex)가 구현한 코드를 리뷰하세요:
  변경된 파일: {files}
  목표: {goal}
  검증 결과: {tsc/vitest/build 결과}",
  run_in_background=false)
```

### Step 3: 실패 시 복구

| 실패 유형 | 행동 |
|----------|------|
| tsc 에러 | Codex에게 에러 메시지와 함께 재시도 요청 |
| vitest 실패 | Codex에게 실패 테스트 로그와 함께 수정 요청 |
| build 실패 | build-fixer(sonnet) 에이전트에게 위임 |
| 3회 연속 실패 | 중단 → Claude deep-executor(opus) 폴백 |

**Codex 재시도:**
```
mcp__plugin_oh-my-claudecode_x__ask_codex(
  agent_role="executor",
  prompt="이전 실행에서 다음 에러가 발생했습니다:
  {에러 메시지}

  수정하고 다시 검증하세요.",
  context_files=[에러 발생 파일들])
```

**폴백 (3회 실패 시):**
```
Task(subagent_type="oh-my-claudecode:deep-executor", model="opus",
  prompt="Codex(Hephaestus)가 3회 실패한 작업입니다:
  목표: {goal}
  실패 이력: {에러 요약}
  Claude로 완수하세요.",
  run_in_background=false)
```

</Steps>

<Tool_Usage>
**Primary (Codex 기반):**
- `mcp__plugin_oh-my-claudecode_x__ask_codex(agent_role="executor")` — 자율 코드 실행
- `mcp__plugin_oh-my-claudecode_x__ask_codex(agent_role="architect")` — 설계 판단 필요 시

**Support (Claude 기반):**
- `Task(subagent_type="oh-my-claudecode:explore", model="haiku")` — 사전 컨텍스트 수집
- `Task(subagent_type="oh-my-claudecode:verifier", model="sonnet")` — 실행 결과 검증
- `Task(subagent_type="oh-my-claudecode:quality-reviewer", model="sonnet")` — Cross-model 코드 리뷰
- `Task(subagent_type="oh-my-claudecode:deep-executor", model="opus")` — Codex 실패 시 폴백

**모델 배정 근거 (oh-my-opencode 원본):**
| 역할 | oh-my-opencode | 우리 구현 |
|------|---------------|----------|
| Hephaestus (자율 실행) | gpt-5.3-codex | Codex MCP (gpt-5.3-codex) |
| Sisyphus (오케스트레이션) | Claude Opus 4.6 | ralph/autopilot (opus 4.6) |
| 검증 | Claude 기반 | verifier (sonnet 4.6) |
| 폴백 | N/A | deep-executor (opus 4.6) |
</Tool_Usage>

<Execution_Principles>
## 실행 원칙 (The Craftsman's Code)

1. **목표 지향**: 단계별 지시가 아닌 최종 목표를 전달한다
2. **자율 탐색**: Codex가 스스로 코드베이스를 파악하도록 한다
3. **패턴 준수**: 기존 패턴을 먼저 발견하고 따르도록 컨텍스트를 제공한다
4. **TDD 내장**: 테스트 먼저 → 구현 → 검증 사이클을 프롬프트에 내장한다
5. **자가 수정**: 검증 실패 시 Codex가 스스로 수정하도록 한다
6. **Cross-model 보완**: Claude가 설계하고 Codex가 구현하는 협업 패턴 지원
7. **폴백 안전망**: Codex 3회 실패 시 Claude deep-executor로 자동 전환
</Execution_Principles>

<Escalation_And_Stop_Conditions>
- Codex 정상 완료 + 검증 통과 → 완료 보고
- Codex 1-2회 실패 → 에러 피드백과 함께 재시도
- Codex 3회 연속 실패 → Claude deep-executor(opus) 폴백
- Codex MCP 불가 → 즉시 deep-executor(opus) 폴백
- 아키텍처 결정 필요 → Prometheus로 에스컬레이션
- 사용자 "중단" → 즉시 중단 + 현재 상태 보고
</Escalation_And_Stop_Conditions>

<Final_Checklist>
- [ ] 사전 컨텍스트 수집 완료 (explore)
- [ ] Codex에게 목표 + 컨텍스트 + 규칙 전달
- [ ] 실행 완료 확인
- [ ] `npx tsc --noEmit` 통과
- [ ] `npx vitest run` 통과
- [ ] `npx next build` 통과
- [ ] 실패 시 재시도 또는 폴백 완료
- [ ] (선택) Cross-model 리뷰 완료
</Final_Checklist>
