# CLAUDE.md - 바투 AI 마케팅 솔루션

> Claude Code 전용 프로젝트 설정. 아키텍처 상세는 `AGENTS.md` 참조.

## 프로젝트 개요

**Stack**: Next.js 16.1 + React 19.2 + TypeScript 5.x + PostgreSQL + Prisma 7.x + NextAuth.js v5
**Pattern**: Clean Architecture (domain → application → infrastructure → presentation)
**Language**: 코드: TypeScript | 문서: Korean

## 검증 명령어 (필수)

```bash
# 타입 체크 (가장 빠름, 항상 먼저)
npx tsc --noEmit

# 유닛 테스트 (182파일, 2,770테스트)
npx vitest run --pool forks

# 프로덕션 빌드
npx next build

# 린트
npm run lint

# E2E (@axe-core/playwright 포함)
npx playwright test

# 통합 CI 체크 (Makefile)
make check-quick    # lint + type-check + test-unit (≈15초)
make check-full     # + format + integration + build (≈60초)
```

**검증 순서**: `tsc --noEmit` → `vitest run` → `next build` (항상 이 순서)

## 아키텍처 규칙

### 레이어 의존성 (절대 위반 금지)
```
domain     → 외부 의존성 없음 (No Prisma, No React, No Next.js)
application → domain만 의존
infrastructure → domain, application 의존
presentation → 모든 레이어 의존 가능
```

**위반 검출**: `find src/domain -name "*.ts" -exec grep -l "from.*@prisma\|from.*next/\|from.*react" {} \;`

### DI 컨테이너
- 토큰 정의: `src/lib/di/types.ts` (Symbol.for)
- 등록: `src/lib/di/modules/*.module.ts`
- ⚠️ 정의 125개 vs 등록 48개 (62% 갭) — `resolve()` 호출 있는데 미등록이면 런타임 크래시

### 핵심 패턴
- **Entity**: private constructor + `create()` factory + `restore()` for DB hydration
- **UseCase**: 생성자 DI, 단일 책임, DTO 반환 (도메인 엔티티 직접 반환 금지)
- **Service**: `ConversationalAgentService` (668줄) — UseCase가 아닌 Application Service 패턴 (유효)
- **Repository**: 인터페이스(포트)는 domain/, 구현체는 infrastructure/
- **API Route**: Zod 검증 → DI UseCase 호출 → typed response

### UI/컴포넌트 위치
- Ad UI: `src/presentation/components/campaign/Ad*.tsx` (별도 `ad/` 디렉토리 없음)
- shadcn/ui + Tailwind CSS 4, `cn()` 유틸리티
- 서버 상태: TanStack Query / 클라이언트 상태: Zustand

## 코딩 규칙

### TypeScript
- `strict` 모드, `any` 타입 금지 → `unknown` 사용
- `_` 접두사 린트 자동수정 주의 — 호환성 깨질 수 있음, 수정 후 전체 테스트 필수

### 테스트
- TDD: RED → GREEN → REFACTOR
- 테스트 옵션: `--pool forks` 필수 (일부 테스트 hang 방지)
- Domain ≥95% / Application ≥90% / Infrastructure ≥85% 커버리지

### Next.js 16 주의사항
- `revalidateTag('tag', 'default')` — 2인자 필수
- `useEffect` freeze-once-visible: `isIntersecting`은 ref로 관리 (deps 넣으면 무한 재생성)
- 반응형: `lg`(1024)~`xl`(1280) 브레이크포인트 필수 확인

### 커밋
- Format: `[type]: [description]`
- Types: feat, fix, refactor, test, docs, chore, perf

## 스킬 시스템 (.agent/skills/)

### 스킬 활성화 규칙

**모든 작업 전에 작업 유형에 맞는 스킬을 확인합니다.**

| 작업 유형 | 스킬 | 조건 |
|-----------|------|------|
| 새 기능 (소규모 1~3일) | `feature-planner` | 항상 |
| 새 기능 (중규모 1~2주) | `feature-planner` → `plan-deep-validation` | 항상 |
| 새 기능 (대규모 3주+) | `brainstorming` → `feature-planner` → `plan-deep-validation` | 항상 |
| 버그/에러 | `superpowers-systematic-debugging` | 항상 |
| UI/UX | `ui-ux-pro-max` | 항상 |
| 구현 후 검증 | `verify-implementation` | 항상 |
| 프로젝트 현황 | `project-health-check` | 항상 |
| 브랜치 정리 | `superpowers-finishing-branch` | 항상 |
| 커밋/푸시 전 | `pre-push-ci-check` | 항상 |
| 계획 검토/보완 | `plan-deep-validation` | 항상 |

### 스킬 읽기

```bash
# 스킬 내용 확인
cat .agent/skills/{skill-name}/SKILL.md
```

### 검증 스킬 (verify-*)

| 스킬 | 검증 대상 |
|------|----------|
| verify-architecture | application→infrastructure import 위반 |
| verify-di-registration | DI 토큰-컨테이너 등록 동기화 |
| verify-cache-tags | ISR 태그-revalidateTag 매핑 |
| verify-bundle | namespace import, dev-only 라이브러리 |
| verify-meta-api-version | Meta Graph API v25.0 버전 통일 |
| verify-token-encryption | DB accessToken 암복호화 |
| verify-ui-components | UI 일관성, 접근성, 성능 |
| verify-audit-security | 감사 HMAC 서명/검증 |
| verify-chat-intents | ChatIntent enum 매핑 |
| verify-domain-analyzers | Domain analyzer 클래스/DI 검증 |
| verify-knowledge-documents | 마케팅 지식 문서 규칙 |

## 워크플로우 (.agent/workflows/)

| 커맨드 | 설명 |
|--------|------|
| `/wrap` | 세션 마무리 다이제스트 |
| `/wrap-todo` | 전날 작업 To-Do 불러오기 |
| `/tdd` | RED → GREEN → REFACTOR |
| `/code-review` | Pre-commit 체크리스트 |
| `/feature-development` | 전체 기능 구현 플로우 |
| `/plan-validation` | 계획서 장기 시뮬레이션 |
| `/project-health` | 프로젝트 건강 진단 |
| `/full-audit` | 전체 감사 |
| `/bundle-audit` | 번들 감사 |
| `/cache-audit` | 캐시 감사 |
| `/rendering-audit` | 렌더링 감사 |
| `/image-audit` | 이미지 감사 |

## 환경변수 (프로덕션 필수)

- `TOKEN_ENCRYPTION_KEY` — 64자 hex, Meta 토큰 암호화
- `CRON_SECRET` — Vercel Cron 인증
- `AUDIT_HMAC_SECRET` — 감사 리포트 HMAC 서명
- `META_MOCK_MODE=false` — 프로덕션에서 반드시 false

## 주요 파일 참조

| 파일 | 용도 |
|------|------|
| `AGENTS.md` | 프로젝트 아키텍처 상세 가이드 |
| `.agent/skills/*/SKILL.md` | 스킬 정의 (24개) |
| `.agent/workflows/*.md` | 워크플로우 정의 (15개) |
| `docs/plans/INDEX.md` | 구현 계획서 인덱스 |
| `docs/backlog.md` | P2 백로그 |
| `docs/wrap-logs/` | 세션별 작업 기록 |
| `prisma/schema.prisma` | DB 스키마 |
| `.env.example` | 환경변수 템플릿 |
