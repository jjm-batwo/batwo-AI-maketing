# 📋 바투 AI 마케팅 SaaS — 계획/로드맵 마스터 인덱스

> **최종 업데이트**: 2026-03-11
> 모든 Plan, Roadmap 문서를 상태별로 정리한 통합 인덱스입니다.

---

## 목차

- [✅ 완료된 계획 (Completed)](#-완료된-계획-completed)
- [⏳ 진행 중 (In Progress)](#-진행-중-in-progress)
- [📝 미착수 (Pending)](#-미착수-pending)
- [📂 파일 위치 인덱스](#-파일-위치-인덱스)

---

## ✅ 완료된 계획 (Completed)

### MVP & 초기 개발

| # | 계획명 | 완료일 | 요약 | 파일 |
|---|--------|--------|------|------|
| 1 | **MVP 전체 구현** | 2025-12-24 | 클린 아키텍처 기반 MVP 전체 구현 (아키텍처, 의존성, 테스트, 구현 Phase 1-6) | [PLAN_batwo-ai-marketing.md](./PLAN_batwo-ai-marketing.md) |
| 2 | **MVP 실제 완성** | 2025-12-29 | API Route ↔ Use Case DI 연결, DB 연동 최종 통합 | [PLAN_mvp-completion.md](./PLAN_mvp-completion.md) |
| 3 | **프로덕션 배포** | 2025-12-29 | Vercel + Supabase 배포, Sentry 모니터링, CI/CD 구성 | [PLAN_production-deployment.md](./PLAN_production-deployment.md) |

### 대시보드 & 데이터

| # | 계획명 | 완료일 | 요약 | 파일 |
|---|--------|--------|------|------|
| 4 | **대시보드 차트 데이터** | 2026-01-07 | KPI 트렌드 Repository/Application/API/Presentation 통합 (TDD) | [PLAN_phase1_dashboard_chart_data.md](./PLAN_phase1_dashboard_chart_data.md) |

### UX & 기능 개선

| # | 계획명 | 완료일 | 요약 | 파일 |
|---|--------|--------|------|------|
| 5 | **UX 개선** | 2026-01 | Phase 5 UX 개선 — i18n, 접근성, 디자인 시스템 통일 | [PLAN_phase5_ux_improvement.md](./PLAN_phase5_ux_improvement.md) |
| 6 | **Ryze AI 레퍼런스 P0 기능** | 2026-02-25 | Auto-Fix, 실시간 모니터링 이상탐지, 무료 Audit 기능 도입 | [PLAN_ryze-inspired-features.md](./PLAN_ryze-inspired-features.md) |
| 7 | **광고 진단 계정 선택** | 2026-02-27 | 멀티 Ad Account 선택 UI, 캐시 업데이트, API 라우트 생성 | [PLAN_audit-account-selector.md](./PLAN_audit-account-selector.md) |
| 8 | **무료검사 종합 개선** | 2026-02-27 | 서버리스 캐시, 레이스 컨디션, UX(alert→toast), HMAC 보안 경화 | [PLAN_audit-improvements.md](./PLAN_audit-improvements.md) |
| 9 | **픽셀 하이브리드 트래킹** | 완료 | EMQ 모니터링, 하이브리드 헬스 대시보드, RAG 진단 통합 | [PLAN_pixel-hybrid-tracking-enhancement.md](./PLAN_pixel-hybrid-tracking-enhancement.md) |
| 10 | **개선 로드맵** | 2026-02-05 | Match Rate 90%→95%, E2E·RBAC·A/B통계·PDF·Redis (3 Phase 전체 완료) | [PLAN_improvement-roadmap.md](./PLAN_improvement-roadmap.md) |

### AI & 인텔리전스

| # | 계획명 | 완료일 | 요약 | 파일 |
|---|--------|--------|------|------|
| 11 | **Hybrid RAG 통합** | 완료 | pgvector, 임베딩 서비스, 인제스션 파이프라인, GPT-5 업그레이드 | [PLAN_hybrid-rag-integration.md](./PLAN_hybrid-rag-integration.md) |

### 전면 감사 로드맵 (2026-03-11)

| # | 계획명 | 완료일 | 요약 | 파일 |
|---|--------|--------|------|------|
| 12 | **전면 감사 기반 개선 로드맵** | 2026-03-11 | 보안·UX·성능·코드품질·테스트 5개 영역 동시 감사 (Critical 9 / High 26 / Medium 28 / Low 10), Phase 1~4 전체 완료 | [PLAN_full-audit-roadmap.md](./PLAN_full-audit-roadmap.md) |

### 기존 INDEX.md에만 기록된 완료 항목

| # | 계획명 | 완료일 | 요약 |
|---|--------|--------|------|
| 13 | AX(AI Experience) 최적화 | 2026-02 | 스트리밍 AI 경험 최적화 |
| 14 | 과학 기반 마케팅 인텔리전스 | 2026-02 | 마케팅 인텔리전스 레이어 구축 |
| 15 | 프로덕션 준비 | 2026-02 | Meta 앱 검수 + 랜딩 + E2E |
| 16 | i18n 영어 UI 지원 | 2026-02 | Meta 앱 검수용 영어 UI (next-intl) |
| 17 | 픽셀 멀티 플랫폼 확장 | 2026-02 | 멀티 플랫폼 픽셀 + CAPI 이벤트 |
| 18 | CLAUDE.md 모듈화 | 2026-02-25 | .claude/rules/ 분리 |
| 19 | Meta OAuth 수정 | 2026-02 | Meta OAuth 로그인 수정 |

---

## ⏳ 진행 중 (In Progress)

| # | 계획명 | 시작일 | 예상 완료 | 요약 | 파일 |
|---|--------|--------|----------|------|------|
| 1 | **AI 챗봇 강화** | 2026-02-24 | 2026-03-03 | 레거시 → Conversational Agent 통합, 인텐트 분류, 프롬프트 관리, 피드백 루프 | [PLAN_ai-chatbot-enhancement.md](./PLAN_ai-chatbot-enhancement.md) |

---

## 📝 미착수 (Pending)

### 개별 기능 계획

| # | 계획명 | 생성일 | 요약 | 파일 |
|---|--------|--------|------|------|
| 1 | **RAG 2026 알고리즘 정렬** | 2026-03-09 | Meta Trinity 기반 지식 코드 통합 (GEM, Lattice, Andromeda) | [PLAN_rag-2026-algorithm-alignment.md](./PLAN_rag-2026-algorithm-alignment.md) |
| 2 | **대화형 AI 에이전트 전환** | 2026-02-06 | LLM 기반 대화형 마케팅 에이전트로 전환, 도구 레지스트리 15개, SSE 스트리밍 | [PLAN_conversational-ai-pivot.md](./PLAN_conversational-ai-pivot.md) |
| 3 | **백엔드 기능 완성** | 2026-02-06 | AI 채팅 E2E 동작 보장, 빌드/타입 안정화, Mock/Fallback 모드 | [PLAN_backend-completion.md](./PLAN_backend-completion.md) |

### 마스터 로드맵 (11개 신규 기능)

| Phase | 기능 | 태스크 수 | 핵심 가치 | 파일 |
|-------|------|----------|----------|------|
| **Phase 1: 성장 엔진** | 14일 Pro 트라이얼 | 7 | 유료 기능 체험 장벽 제거 | [../superpowers/plans/2026-03-11-phase1-growth-engine.md](../superpowers/plans/2026-03-11-phase1-growth-engine.md) |
| | 무료 광고 계정 진단 | 3 | 전환 유도 |  |
| | AI 원클릭 최적화 | 5 | AI 추천→실행 마찰 제거 |  |
| **Phase 2: 리텐션 강화** | 보고서 자동 발송 + 외부 공유 | 12 | 이메일 습관 형성 | [../superpowers/plans/2026-03-11-phase2-retention.md](../superpowers/plans/2026-03-11-phase2-retention.md) |
| | 전환 퍼널 시각화 | 7 | 픽셀 가치 가시화 |  |
| | 캠페인 벌크 작업 | 6 | 파워유저 생산성 |  |
| | 캠페인 성과 벤치마크 | 8 | 업종 대비 맥락 제공 |  |
| **Phase 3-4: 확장** | 커스텀 대시보드 | 10 | 개인화 모니터링 | [../superpowers/plans/2026-03-11-phase3-4-expansion.md](../superpowers/plans/2026-03-11-phase3-4-expansion.md) |
| | 슬랙/카카오톡 알림 | 10 | 실시간 알림 대응 |  |
| | 크리에이티브 AI 이미지 | 8 | 소재 병목 해소 |  |
| | Google Ads 연동 | 11 | 크로스 채널 최적화 |  |

> **마스터 로드맵 개요**: [../superpowers/plans/2026-03-11-master-roadmap.md](../superpowers/plans/2026-03-11-master-roadmap.md)

---

## 📂 파일 위치 인덱스

### 정리된 폴더 구조

```
docs/
├── plans/                   ← 🟢 모든 Plan/Roadmap 파일 통합
│   ├── MASTER_INDEX.md      ← 이 파일 (통합 인덱스)
│   ├── INDEX.md             ← 기존 단순 인덱스
│   ├── PLAN_batwo-ai-marketing.md
│   ├── PLAN_mvp-completion.md
│   ├── PLAN_production-deployment.md
│   ├── PLAN_phase1_dashboard_chart_data.md
│   ├── PLAN_phase5_ux_improvement.md
│   ├── PLAN_hybrid-rag-integration.md
│   ├── PLAN_ryze-inspired-features.md
│   ├── PLAN_audit-account-selector.md
│   ├── PLAN_audit-improvements.md
│   ├── PLAN_pixel-hybrid-tracking-enhancement.md
│   ├── PLAN_ai-chatbot-enhancement.md         ← ⏳ In Progress
│   ├── PLAN_rag-2026-algorithm-alignment.md   ← 📝 Pending
│   ├── PLAN_full-audit-roadmap.md             ← ✅ 이동됨 (roadmap/ → plans/)
│   ├── PLAN_improvement-roadmap.md            ← ✅ 이동됨 (01-plan/ → plans/)
│   ├── PLAN_conversational-ai-pivot.md        ← 📝 이동됨 (01-plan/ → plans/)
│   └── PLAN_backend-completion.md             ← 📝 이동됨 (01-plan/ → plans/)
│
├── 02-design/features/      ← 🔵 PDCA Design 문서 (유지)
│   └── improvement-roadmap.design.md
│
├── 04-report/features/      ← 🔵 PDCA Report 문서 (유지)
│   ├── improvement-roadmap-phase1.report.md
│   ├── improvement-roadmap-phase2.report.md
│   └── improvement-roadmap-phase3.report.md
│
└── superpowers/plans/       ← 🟣 마스터 로드맵 + Phase별 상세 (유지)
    ├── 2026-03-11-master-roadmap.md
    ├── 2026-03-11-phase1-growth-engine.md
    ├── 2026-03-11-phase2-retention.md
    └── 2026-03-11-phase3-4-expansion.md
```

> **제거된 폴더:**
> - `docs/01-plan/` → 파일들을 `docs/plans/`로 이동 후 삭제
> - `docs/roadmap/` → 파일을 `docs/plans/`로 이동 후 삭제
> - `docs/archive/2026-02/` → 원본이 02-design, 04-report에 있으므로 중복 삭제

---

## 📊 통계 요약

| 구분 | 수량 |
|------|:----:|
| ✅ 완료된 계획 | **19** |
| ⏳ 진행 중 | **1** |
| 📝 미착수 | **3 + 마스터 로드맵 (11 기능)** |
| **전체 문서** | **~25 파일** (4개 폴더) |

---

*이 인덱스는 `/feature-development` 워크플로우에 의해 자동 업데이트됩니다.*
