---
paths:
  - "src/domain/entities/OptimizationRule.ts"
  - "src/domain/value-objects/OptimizationGoal.ts"
  - "src/domain/value-objects/RuleAction.ts"
  - "src/domain/value-objects/RuleCondition.ts"
  - "src/domain/value-objects/SavingsCalculator.ts"
  - "src/domain/repositories/IOptimizationRuleRepository.ts"
  - "src/application/use-cases/optimization/**"
  - "src/application/dto/optimization/**"
  - "src/infrastructure/database/repositories/PrismaOptimizationRuleRepository.ts"
  - "src/app/api/optimization-rules/**"
  - "src/app/api/optimization/**"
  - "src/app/api/cron/evaluate-rules/**"
  - "src/app/(dashboard)/optimization-rules/**"
  - "src/presentation/components/optimization/**"
  - "src/presentation/components/dashboard/OptimizationTimeline.tsx"
  - "src/presentation/components/dashboard/SavingsWidget.tsx"
  - "src/presentation/hooks/useOptimizationRules.ts"
  - "src/lib/validations/optimization.ts"
---

# 최적화 규칙 엔진

## 개요
자동 최적화 규칙 엔진 (조건-액션 기반). 캠페인 성과를 모니터링하고 자동으로 예산/입찰 조정.

## 도메인 모델
- **OptimizationRule**: 조건(RuleCondition) + 액션(RuleAction) 조합
- **RuleCondition**: 메트릭, 연산자, 임계값 (e.g. CPA > 5000원)
- **RuleAction**: 실행할 최적화 (e.g. 예산 10% 감소)
- **OptimizationGoal**: ROAS, CPA, CTR 등 최적화 목표
- **SavingsCalculator**: 절감 금액 계산 로직

## 유스케이스 (7개)
| UseCase | 설명 |
|---------|------|
| CreateOptimizationRule | 규칙 생성 |
| UpdateOptimizationRule | 규칙 수정 |
| DeleteOptimizationRule | 규칙 삭제 |
| GetOptimizationRules | 규칙 목록 조회 |
| GetOptimizationPresets | 프리셋 조회 |
| EvaluateOptimizationRules | 규칙 평가/실행 (크론) |
| CalculateSavingsUseCase | 절감 금액 계산 |

## API 엔드포인트
- `GET/POST /api/optimization-rules` — CRUD
- `GET /api/optimization-rules/presets` — 프리셋 목록
- `GET /api/optimization/savings` — 절감 금액 조회
- `POST /api/cron/evaluate-rules` — 15분 주기 크론 (CRON_SECRET 인증)

## 크론 패턴
- 15분 주기 evaluate-rules 실행
- `CRON_SECRET` 환경변수로 인증
