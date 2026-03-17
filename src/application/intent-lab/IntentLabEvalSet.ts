// src/application/intent-lab/IntentLabEvalSet.ts
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import { IntentClassifier } from '@domain/services/IntentClassifier'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type EvalSource = 'synthetic' | 'real'

export interface EvalCase {
  input: string
  expected: ChatIntent
  difficulty: Difficulty
  source?: EvalSource
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
// Real User Pattern Cases (실 챗봇 로그 패턴 기반)
// ──────────────────────────────────────────────
// 실사용자 입력 패턴: 오타, 구어체, 감정 표현, 줄임말,
// 이모티콘, 극단적 축약, 장문 혼합, 멀티인텐트 등

const REAL_PATTERN_CASES: readonly EvalCase[] = Object.freeze([
  // ── EASY (15) — 명확한 의도 + 실사용자 표현 ──
  { input: '캠페인만들어줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy', source: 'real' as EvalSource },
  { input: '리포트좀보여줘요', expected: ChatIntent.REPORT_QUERY, difficulty: 'easy', source: 'real' as EvalSource },
  { input: 'ROAS 얼마야?', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy', source: 'real' as EvalSource },
  { input: '픽셀설치방법알려줘', expected: ChatIntent.PIXEL_SETUP, difficulty: 'easy', source: 'real' as EvalSource },
  { input: '예산 최적화좀', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'easy', source: 'real' as EvalSource },
  { input: '광고피로도체크해줘', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'easy', source: 'real' as EvalSource },
  { input: '학습단계 언제끝나요??', expected: ChatIntent.LEARNING_PHASE, difficulty: 'easy', source: 'real' as EvalSource },
  { input: '캠페인구조정리하고싶어요', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'easy', source: 'real' as EvalSource },
  { input: '리드품질 왜이래', expected: ChatIntent.LEAD_QUALITY, difficulty: 'easy', source: 'real' as EvalSource },
  { input: 'CAPI연동해야되는데', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'easy', source: 'real' as EvalSource },
  { input: 'ㅎㅇ', expected: ChatIntent.GENERAL, difficulty: 'easy', source: 'real' as EvalSource },
  { input: 'ㅋㅋ 감사합니다~', expected: ChatIntent.GENERAL, difficulty: 'easy', source: 'real' as EvalSource },
  { input: '캠페인 새로 하나 만들어줄래?', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy', source: 'real' as EvalSource },
  { input: '보고서 뽑아줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'easy', source: 'real' as EvalSource },
  { input: 'CPC 높은데 어떡해', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy', source: 'real' as EvalSource },

  // ── MEDIUM (20) — 간접 표현, 감정, 약어 ──
  { input: '아 진짜 광고비만 나가고 아무 효과가 없네 ㅡㅡ', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '사장님이 이번달 성과 물어보시는데 뭘 보여드려야해요?', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '인스타 광고 처음인데 어떻게 시작하나요', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '전환 수가 대시보드랑 광고관리자랑 달라요', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '고객들이 폼 제출만하고 전화하면 없는번호래요ㅠㅠ', expected: ChatIntent.LEAD_QUALITY, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '3일째 예산이 하나도 안 써져요 왜그런건가요', expected: ChatIntent.LEARNING_PHASE, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '광고세트가 20개인데 이래도 되나요?', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '같은거 자꾸 보이니까 사람들이 짜증내더라구요', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '이번달 예산 300인데 좀 아껴써야할것같은데', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium', source: 'real' as EvalSource },
  { input: 'GTM에서 이벤트 세팅하려는데 도와주세요', expected: ChatIntent.PIXEL_SETUP, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '어제까지 잘 되다가 갑자기 CPA가 2배됐어요', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '매출 좀 올리고싶은데 새 캠페인 돌려야하나', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '서버사이드 전환 API 연동이 안되는것같아요', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '지난주 vs 이번주 비교좀 해주세요', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '솔직히 뭘해야할지 모르겠어요 ㅎ', expected: ChatIntent.GENERAL, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '네 알겠습니다 감사합니다!', expected: ChatIntent.GENERAL, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '일예산을 좀 더 올려볼까 해서요', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '리타게팅 캠페인 세팅해주세요', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '이벤트매칭 점수가 계속 낮아요', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium', source: 'real' as EvalSource },
  { input: '소재 3주째 같은거 쓰고있는데 괜찮나요', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'medium', source: 'real' as EvalSource },

  // ── HARD (25) — 극도로 모호, 장문, 멀티인텐트, 은어 ──
  { input: '아 답답해 진짜', expected: ChatIntent.GENERAL, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '돈만 날리는 느낌이에요 어떻게 해야되죠?', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '경쟁사는 잘 되던데 우린 왜', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '일단 뭐라도 좀 해봐요', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '이거 맞아요? 숫자가 이상한거같은데', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '한 3일전부터 뭔가 이상해진것같아요', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard', source: 'real' as EvalSource },
  { input: 'ㅠㅠ 또 허수네', expected: ChatIntent.LEAD_QUALITY, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '그냥 다 끄고 싶다', expected: ChatIntent.GENERAL, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '광고가 왜 안 돌아가는지 모르겠어요 세팅은 다 했는데 예산도 넣었고 소재도 올렸거든요 근데 3일째 0원이에요', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '아까 보여준거 다시 보여줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '계속 같은 사람한테 뜨는것같은데 다른 사람한테도 보여줘야하는거 아닌가요', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '지금 상태가 정상인건지 비정상인건지', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '대행사에서 하던거 가져왔는데 어떤가요', expected: ChatIntent.GENERAL, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '??', expected: ChatIntent.GENERAL, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '고객센터에 물어봤더니 여기서 하래요', expected: ChatIntent.GENERAL, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '아 맞다 그거 하나 더 물어볼게요 전환 추적이 제대로 되고있나 확인좀', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '10만원짜리 테스트 캠페인 하나만', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '지금 돌리고있는거 성과가 어떻게 되는지 한눈에 정리해줄수있어?', expected: ChatIntent.REPORT_QUERY, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '이전에 잘됐던 세팅으로 다시 해주세요', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '프리퀀시가 7이 넘었어요', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '테스트 해볼래요 소액으로', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard', source: 'real' as EvalSource },
  { input: 'iOS14 이후로 전환 데이터가 안 맞아요', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '지금 CBO로 갈지 ABO로 갈지 고민이에요', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '아니 근데 리드가 진짜인지 봇인지 어떻게알아요', expected: ChatIntent.LEAD_QUALITY, difficulty: 'hard', source: 'real' as EvalSource },
  { input: '이거 학습 기간이 원래 이렇게 오래걸려요?', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard', source: 'real' as EvalSource },
]) as EvalCase[]

// ──────────────────────────────────────────────
// Combined set: synthetic (100) + real patterns (60)
// ──────────────────────────────────────────────

const COMBINED_CASES: readonly EvalCase[] = Object.freeze([
  ...ALL_CASES.map((c) => ({ ...c, source: 'synthetic' as EvalSource })),
  ...REAL_PATTERN_CASES,
])

// ──────────────────────────────────────────────
// 80/20 Split: synthetic 1-80 = TRAIN, synthetic 81-100 = VALIDATION
// Real-pattern cases are always in FULL set; optionally filtered by source
// ──────────────────────────────────────────────

export const TRAIN_EVAL_SET: readonly EvalCase[] = Object.freeze(ALL_CASES.slice(0, 80))
export const VALIDATION_EVAL_SET: readonly EvalCase[] = Object.freeze(ALL_CASES.slice(80))
export const FULL_EVAL_SET: readonly EvalCase[] = ALL_CASES
export const REAL_EVAL_SET: readonly EvalCase[] = REAL_PATTERN_CASES
export const COMBINED_EVAL_SET: readonly EvalCase[] = COMBINED_CASES

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
