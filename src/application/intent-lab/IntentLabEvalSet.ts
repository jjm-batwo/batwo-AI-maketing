// src/application/intent-lab/IntentLabEvalSet.ts
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import { IntentClassifier } from '@domain/services/IntentClassifier'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface EvalCase {
  input: string
  expected: ChatIntent
  difficulty: Difficulty
}

export interface EvalResult {
  accuracy: number
  correct: number
  total: number
  failures: { input: string; expected: ChatIntent; got: ChatIntent }[]
  byDifficulty: Record<Difficulty, { accuracy: number; correct: number; total: number }>
}

// ──────────────────────────────────────────────
// Immutable 100 Eval Cases
// ──────────────────────────────────────────────

const ALL_CASES: readonly EvalCase[] = Object.freeze([
  // ── EASY (30) ──────────────────────────────
  { input: '캠페인 만들어줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
  { input: '새 캠페인 시작하고 싶어', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
  { input: 'create a new campaign', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
  { input: '리포트 보여줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'easy' },
  { input: '주간 보고서 보기', expected: ChatIntent.REPORT_QUERY, difficulty: 'easy' },
  { input: 'ROAS 분석해줘', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy' },
  { input: 'CPC가 너무 높아', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy' },
  { input: '전환율 확인', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy' },
  { input: '픽셀 설치 도와줘', expected: ChatIntent.PIXEL_SETUP, difficulty: 'easy' },
  { input: '페이스북 픽셀 설정', expected: ChatIntent.PIXEL_SETUP, difficulty: 'easy' },
  { input: '예산 최적화 해줘', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'easy' },
  { input: '광고 예산 조정', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'easy' },
  { input: '피로도 확인해줘', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'easy' },
  { input: '광고 노출 빈도가 높아', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'easy' },
  { input: '학습단계가 끝나질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'easy' },
  { input: '예산이 소진이 안 돼', expected: ChatIntent.LEARNING_PHASE, difficulty: 'easy' },
  { input: '캠페인 구조 통합하고 싶어', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'easy' },
  { input: '세트 개수가 너무 많아', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'easy' },
  { input: '리드 품질이 좋지 않아', expected: ChatIntent.LEAD_QUALITY, difficulty: 'easy' },
  { input: '허수 고객이 많아', expected: ChatIntent.LEAD_QUALITY, difficulty: 'easy' },
  { input: 'CAPI 설정해야해', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'easy' },
  { input: '전환 추적 설정해줘', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'easy' },
  { input: '안녕하세요', expected: ChatIntent.GENERAL, difficulty: 'easy' },
  { input: '오늘 날씨 어때?', expected: ChatIntent.GENERAL, difficulty: 'easy' },
  { input: '고마워', expected: ChatIntent.GENERAL, difficulty: 'easy' },
  { input: '뭐 할 수 있어?', expected: ChatIntent.GENERAL, difficulty: 'easy' },
  { input: '캠페인 생성해줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
  { input: '성과 분석 부탁해', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy' },
  { input: '보고서 조회해줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'easy' },
  { input: 'EMQ 점수 확인해줘', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'easy' },

  // ── MEDIUM (35) ────────────────────────────
  { input: '매출을 올려야 하는데 뭐부터 해야 해?', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'medium' },
  { input: '새로운 고객을 찾아야 해', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'medium' },
  { input: '광고를 시작하려고', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'medium' },
  { input: '지난 달 데이터 좀 살펴봐줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium' },
  { input: '실적이 어떻게 됐는지 확인해줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium' },
  { input: '이번 주 실적 궁금해', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium' },
  { input: '광고 효율이 어떤가요?', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'medium' },
  { input: '지표가 좀 이상해', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'medium' },
  { input: '대비 효율이 떨어졌어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'medium' },
  { input: '광고비가 너무 나가', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium' },
  { input: '비용 좀 줄여야겠어', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium' },
  { input: '돈을 아껴야 해', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium' },
  { input: '같은 광고가 계속 보여', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'medium' },
  { input: 'CPM이 급등했어', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'medium' },
  { input: '소재를 교체해야 할까?', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'medium' },
  { input: '광고가 나가질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'medium' },
  { input: '돈이 써지질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'medium' },
  { input: '노출이 나오질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'medium' },
  { input: '캠페인이 너무 많아', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'medium' },
  { input: '광고를 정리하고 싶어', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'medium' },
  { input: '너무 분산돼 있어', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'medium' },
  { input: '가짜 고객이 많아', expected: ChatIntent.LEAD_QUALITY, difficulty: 'medium' },
  { input: '전화해도 연락이 안 돼', expected: ChatIntent.LEAD_QUALITY, difficulty: 'medium' },
  { input: '양질의 리드가 필요해', expected: ChatIntent.LEAD_QUALITY, difficulty: 'medium' },
  { input: '전환이 잡히질 않아', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium' },
  { input: '이벤트가 누락되는 것 같아', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium' },
  { input: '서버 이벤트가 들어오질 않아', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium' },
  { input: '그냥 인사하러 왔어', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '잘 모르겠어', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '음...', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '반갑습니다', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '도움이 필요해', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '광고 예산을 늘려볼까', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium' },
  { input: '트래킹 코드 심어야 해', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium' },
  { input: '이번 달 리포트 만들어줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium' },

  // ── HARD (35) ──────────────────────────────
  { input: '광고 좀 해줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard' },
  { input: '뭔가 좀 해봐야 할 것 같은데', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '요즘 반응이 별로야', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '전환이 안 나와요 추적 문제인가', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard' },
  { input: '같은 사람한테 자꾸 광고가 떠', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'hard' },
  { input: '돈은 쓰는데 결과가 없어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '새로 시작하고 싶은데 어떻게?', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard' },
  { input: '숫자가 맞지 않아', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard' },
  { input: '광고가 멈춰버렸어', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard' },
  { input: '성과가 갑자기 확 떨어졌어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '다 합쳐버릴까?', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'hard' },
  { input: '진짜 고객인지 모르겠어', expected: ChatIntent.LEAD_QUALITY, difficulty: 'hard' },
  { input: '머신러닝이 아직 덜 된 건가', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard' },
  { input: '우리 광고 잘 되고 있어?', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '광고 끄고 싶어', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '캠페인을 만들지 마세요', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '비용 대비 효과가 좀...', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '요즘 왜 이래', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '데이터 좀 봐줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'hard' },
  { input: '엊그제부터 이상해', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '소재 좀 바꿔야겠다', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'hard' },
  { input: '예산을 더 넣을까 말까', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'hard' },
  { input: '문의 건이 이상한 게 많아', expected: ChatIntent.LEAD_QUALITY, difficulty: 'hard' },
  { input: '구글 태그매니저에서 이벤트가 이상해', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard' },
  { input: '광고 좀 더 해볼까', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard' },
  { input: '전환이 줄었어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '학습이 끝나질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard' },
  { input: '새 소재 넣어야 하나', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'hard' },
  { input: '타겟이 너무 좁은 거 아냐?', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'hard' },
  { input: '이거 왜 안 되지?', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '매칭률이 떨어져', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard' },
  { input: '클릭은 많은데 구매가 없어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '광고 세트를 좀 줄여야겠어', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'hard' },
  { input: '리드가 진짜인지 확인해줘', expected: ChatIntent.LEAD_QUALITY, difficulty: 'hard' },
  { input: '배달이 안 되고 있어', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard' },
]) as EvalCase[]

// ──────────────────────────────────────────────
// 80/20 Split: cases 1-80 = TRAIN, cases 81-100 = VALIDATION
// ──────────────────────────────────────────────

export const TRAIN_EVAL_SET: readonly EvalCase[] = Object.freeze(ALL_CASES.slice(0, 80))
export const VALIDATION_EVAL_SET: readonly EvalCase[] = Object.freeze(ALL_CASES.slice(80))
export const FULL_EVAL_SET: readonly EvalCase[] = ALL_CASES

// ──────────────────────────────────────────────
// Evaluate function
// ──────────────────────────────────────────────

export function evaluate(
  classifier: IntentClassifier,
  cases: readonly EvalCase[]
): EvalResult {
  const failures: EvalResult['failures'] = []
  let correct = 0

  const byDifficultyAccum: Record<Difficulty, { correct: number; total: number }> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  }

  for (const evalCase of cases) {
    const result = classifier.classify(evalCase.input)
    const got = result.intent

    byDifficultyAccum[evalCase.difficulty].total++

    if (got === evalCase.expected) {
      correct++
      byDifficultyAccum[evalCase.difficulty].correct++
    } else {
      failures.push({
        input: evalCase.input,
        expected: evalCase.expected,
        got,
      })
    }
  }

  const total = cases.length

  const byDifficulty: EvalResult['byDifficulty'] = {
    easy: {
      ...byDifficultyAccum.easy,
      accuracy: byDifficultyAccum.easy.total > 0
        ? byDifficultyAccum.easy.correct / byDifficultyAccum.easy.total
        : 0,
    },
    medium: {
      ...byDifficultyAccum.medium,
      accuracy: byDifficultyAccum.medium.total > 0
        ? byDifficultyAccum.medium.correct / byDifficultyAccum.medium.total
        : 0,
    },
    hard: {
      ...byDifficultyAccum.hard,
      accuracy: byDifficultyAccum.hard.total > 0
        ? byDifficultyAccum.hard.correct / byDifficultyAccum.hard.total
        : 0,
    },
  }

  return {
    accuracy: total > 0 ? correct / total : 0,
    correct,
    total,
    failures,
    byDifficulty,
  }
}
