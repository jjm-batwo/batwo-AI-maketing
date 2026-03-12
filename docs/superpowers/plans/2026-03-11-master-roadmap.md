# 바투 AI 마케팅 솔루션 - 마스터 로드맵

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement each phase plan.

**Goal:** 11개 신규 기능을 4개 Phase로 나누어 순차 구현, 각 Phase는 독립 배포 가능

**Architecture:** 기존 클린 아키텍처(Domain → Application → Infrastructure → Presentation) 유지, TDD 기반 구현

**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL, vitest, Toss Payments, Meta Graph API, Resend, Slack API, Google Ads API

---

## Phase 개요

| Phase | 목표 | 기간 | 기능 수 | 계획서 |
|-------|------|------|---------|--------|
| **Phase 1** | 성장 엔진 | 2-4주 | 3개 | [phase1-growth-engine.md](./2026-03-11-phase1-growth-engine.md) |
| **Phase 2** | 리텐션 강화 | 1-2개월 | 4개 | [phase2-retention.md](./2026-03-11-phase2-retention.md) |
| **Phase 3-4** | 확장 + 멀티채널 | 2-3개월+ | 4개 | [phase3-4-expansion.md](./2026-03-11-phase3-4-expansion.md) |

---

## Phase 1: 성장 엔진 (최우선)

사용자 획득 퍼널의 핵심 병목 해소

| # | 기능 | 태스크 수 | 핵심 가치 |
|---|------|----------|----------|
| 1 | **14일 Pro 트라이얼** | 7 | 유료 기능 체험 장벽 제거 |
| 2 | **무료 광고 계정 진단** | 5 | "얼마나 낭비하는지" 보여줘서 전환 유도 |
| 3 | **AI 원클릭 최적화** | 6 | AI 추천→실행 마찰 제거 |

**의존성:** Feature 1 → Feature 2 (트라이얼 사용자가 진단을 경험) → Feature 3 (진단 후 최적화 실행)

**KPI:**
- 무료→유료 전환율: 3% → 8%
- AI 추천 채택률: 현재 미측정 → 30%+

---

## Phase 2: 리텐션 강화

습관 형성 + 파워유저 도구

| # | 기능 | 태스크 수 | 핵심 가치 |
|---|------|----------|----------|
| 4 | **보고서 자동 발송 + 외부 공유** | 8 | 주간 이메일로 습관적 터치포인트 형성 |
| 5 | **전환 퍼널 시각화** | 5 | 픽셀 가치 가시화 |
| 6 | **캠페인 벌크 작업** | 5 | 파워유저 생산성 향상 |
| 7 | **캠페인 성과 벤치마크** | 5 | 업종 대비 맥락 제공 |

**병렬 가능:** Feature 4, 5, 6, 7은 모두 독립적 → 동시 구현 가능

**KPI:**
- 월간 이탈률: 목표 < 5%
- 주간 보고서 열람률: 목표 60%+

---

## Phase 3-4: 확장 + 멀티채널

| # | 기능 | 태스크 수 | 핵심 가치 |
|---|------|----------|----------|
| 8 | **커스텀 대시보드** | 6 | 개인화된 모니터링 경험 |
| 9 | **슬랙/카카오톡 알림** | 6 | 실시간 알림으로 대응 시간 단축 |
| 10 | **크리에이티브 AI 이미지 생성** *(작업 보류)* | 5 | 소재 제작 병목 해소 |
| 11 | **Google Ads 연동** | 8 | 크로스 채널 예산 최적화 |

---

## 실행 방법

### 병렬 에이전트 활용 (권장)

```
Phase 1: 순차 실행 (의존성 있음)
  Agent A: Feature 1 (트라이얼) → Feature 2 (진단) → Feature 3 (원클릭)

Phase 2: 4개 에이전트 병렬
  Agent A: Feature 4 (보고서)
  Agent B: Feature 5 (퍼널)
  Agent C: Feature 6 (벌크)
  Agent D: Feature 7 (벤치마크)

Phase 3-4: 3개 에이전트 병렬 + 1개 순차
  Agent A: Feature 8 (커스텀 대시보드)
  Agent B: Feature 9 (알림) + Feature 10 (이미지 생성)
  Agent C: Feature 11 (Google Ads) — 마지막
```

### 각 Phase 완료 후 체크포인트

#### Phase 1 & 2 (완료: 2026-03-11)

- [x] `npx tsc --noEmit` 통과
- [x] `npx vitest run` 전체 테스트 통과
- [x] `npx next build` 빌드 성공
- [x] 기존 테스트 회귀 없음
- [x] `/verify-architecture` 레이어 의존성 검증
- [x] `/verify-di-registration` DI 토큰 동기화 검증

#### Phase 3 — Feature 8, 9 (완료: 2026-03-12)

- [x] `npx tsc --noEmit` 통과
- [x] `npx vitest run` 전체 테스트 통과 (240 files, 3310 passed)
- [x] `npx next build` 빌드 성공
- [x] 기존 테스트 회귀 없음
- [x] `/verify-architecture` 레이어 의존성 검증
- [x] `/verify-di-registration` DI 토큰 동기화 검증
