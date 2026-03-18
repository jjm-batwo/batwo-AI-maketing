---
description: 프로젝트 전체 구조와 기능 구현 완성도를 CTO/기획자 관점으로 진단
---

# Project Health Check Workflow

> **스킬**: `.agent/skills/project-health-check/SKILL.md`
> **대형 프로젝트 최적화 적용** — 1만줄 이상 시 경량 모드 자동 전환

---

## Step 1: 규모 스캔 + 모드 판별

단일 통합 스크립트로 소스/테스트/레이어/API/페이지 수치 수집.
소스 ≥1만줄이면 경량 모드 적용 (tsc/build 캐시 스킵, 그룹 분할 필수).

## Step 2: 8영역 파이프라인 완성도

`scan_area()` 함수로 8영역을 **1회 실행**으로 통합 스캔.
🟢 영역은 스킵, ⚠️/❌ 영역만 상세 분석.

## Step 3: 계획서 교차 검증

계획서 상태 + 체크박스 비율을 경량 스크립트로 수집.
완료↔코드 불일치 발견.

## Step 4: CTO 종합 진단

- 사업적 (6점) + 기술적 (7점, 캐시 기반) + 운영 (6점)
- tsc/build는 캐시 확인 → STALE일 때만 사용자에게 실행 여부 확인

## Step 5: 액션 아이템 생성

기획자용/개발자용 분리. 비즈니스 임팩트 보정 적용.

**리포트 저장**: `docs/04-report/project-health-{YYYY-MM-DD}.md`

---

## Status Tag

```
[프로젝트 건강 진단 완료]
- 규모: N개 파일 / N줄
- 기능 완성도: N/8 영역 🟢
- 즉시 필요 액션: N건
- 리포트: docs/04-report/project-health-{날짜}.md
```
