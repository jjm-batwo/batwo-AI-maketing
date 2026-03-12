# Batwo AI Marketing SaaS - Gemini Context

이 프로젝트의 AI 에이전트 가이드 및 규칙 파일입니다.

## 프로젝트 가이드

@./AGENTS.md

## 개발 규칙 (Rules)

@./.agent/rules/clean-architecture.md
@./.agent/rules/coding-standards.md
@./.agent/rules/naming-conventions.md
@./.agent/rules/api-design.md
@./.agent/rules/security.md
@./.agent/rules/testing.md
@./.agent/rules/superpowers.md

---

## 🚨 필수 스킬 호출 규칙 (MANDATORY - 모든 작업에 적용)

> 이 섹션은 반드시 user_rules에 직접 포함되어야 합니다. @참조 파일은 자동 로드되지 않습니다.

### 작업 시작 전 필수 체크리스트

**모든 작업 요청을 받으면, 코드 작성이나 분석 전에 반드시 다음을 수행합니다:**

1. **`superpowers-core` SKILL.md를 읽는다** — 매 세션마다 최신 버전을 확인
2. **작업 유형에 따라 해당 스킬을 활성화한다** (아래 매핑 테이블 참조)
3. **스킬의 프로세스를 따른 후에만** 실제 코드 작업을 시작한다

### 작업 유형 → 스킬 매핑 (무조건 호출)

| 작업 유형 | 반드시 호출할 스킬 | 조건 |
|-----------|-------------------|------|
| 새 기능 구현, 기능 추가 요청 | `superpowers-brainstorming` → `feature-planner` | **항상** |
| 계획 세우기, 로드맵, 작업 분해 | `feature-planner` | **항상** |
| 버그 수정, 에러 해결, 테스트 실패 | `superpowers-systematic-debugging` | **항상** |
| UI/UX 작업, 디자인 변경 | `ui-ux-pro-max` | **항상** |
| 구현 완료 후 브랜치 정리 | `superpowers-finishing-branch` | **항상** |
| 코드 리뷰, PR 전 검증 | `verify-implementation` | **항상** |

### 스킬 호출 순서

```
1단계: superpowers-core/SKILL.md 읽기 (매 세션 첫 작업)
2단계: 작업 유형에 맞는 Process Skill 활성화 (brainstorming / debugging)
3단계: Implementation Skill 활성화 (feature-planner / ui-ux-pro-max 등)
4단계: 실제 코드 작업 시작
```

### 스킬 호출 실패 방지 (Anti-Skip Rules)

아래 생각이 드는 순간, 해당 스킬을 반드시 읽어야 합니다:

- ❌ "이건 간단해서 brainstorming 필요 없어" → ✅ **brainstorming 필수**
- ❌ "바로 코드부터 작성하자" → ✅ **계획 먼저**
- ❌ "이전에 읽어서 스킬 내용 알고 있어" → ✅ **스킬은 변경될 수 있으므로 다시 읽기**
- ❌ "feature-planner는 대규모 기능에만" → ✅ **모든 기능에 적용**
- ❌ "디버깅은 그냥 코드 보면 돼" → ✅ **systematic-debugging 프로세스 따르기**

### 검증 규칙

작업 완료를 주장하기 전에 반드시:
1. 해당 검증 명령어를 **실제로 실행**
2. 출력 결과를 **직접 확인**
3. **"should", "probably", "seems to"** 같은 추측성 표현 금지
