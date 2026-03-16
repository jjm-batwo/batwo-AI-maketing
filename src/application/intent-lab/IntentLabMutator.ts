// src/application/intent-lab/IntentLabMutator.ts
import type { IntentClassifierConfig } from '@domain/services/IntentClassifierConfig'
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import { IntentClassifier } from '@domain/services/IntentClassifier'
import { TRAIN_EVAL_SET, evaluate } from './IntentLabEvalSet'

type NonGeneralIntent = Exclude<ChatIntent, ChatIntent.GENERAL>

// Candidate keywords pool for random addition (Korean marketing domain)
const CANDIDATE_KEYWORDS: Record<NonGeneralIntent, string[]> = {
  [ChatIntent.CAMPAIGN_CREATION]: ['광고', '런칭', '오픈', '프로모션', '홍보', '집행', '세팅', '셋업'],
  [ChatIntent.REPORT_QUERY]: ['통계', '수치', '현황', '대시보드', '요약', '성적', '결과'],
  [ChatIntent.KPI_ANALYSIS]: ['효과', '지표', '메트릭', '추이', '변화', '비교', '개선', '악화', '반등'],
  [ChatIntent.PIXEL_SETUP]: ['태그', '코드', 'sdk', '스니펫', '임베드'],
  [ChatIntent.BUDGET_OPTIMIZATION]: ['비용', '지출', '효율', '절약', '배분', '할당', '증액', '감액'],
  [ChatIntent.CREATIVE_FATIGUE]: ['소재', '크리에이티브', '지겨', '식상', '새로운', 'cpm'],
  [ChatIntent.LEARNING_PHASE]: ['초기', '안정화', '데이터 부족', '전환 부족', '배달'],
  [ChatIntent.STRUCTURE_OPTIMIZATION]: ['정리', '합치', '분리', '세트', '그룹', '단순'],
  [ChatIntent.LEAD_QUALITY]: ['진성', '가짜', '스팸', '문의', '전화', '응답'],
  [ChatIntent.TRACKING_HEALTH]: ['매칭', '서버', '브라우저', '쿠키', '전환값', '어트리뷰션'],
}

const CANDIDATE_CONTEXT_PATTERNS: Record<NonGeneralIntent, string[]> = {
  [ChatIntent.CAMPAIGN_CREATION]: ['시작하고', '런칭', '프로모션', '홍보하'],
  [ChatIntent.REPORT_QUERY]: ['현황', '수치', '통계', '얼마나'],
  [ChatIntent.KPI_ANALYSIS]: ['떨어', '올라', '변화', '추이', '개선', '악화'],
  [ChatIntent.PIXEL_SETUP]: ['태그', '코드 심', '임베드'],
  [ChatIntent.BUDGET_OPTIMIZATION]: ['절약', '배분', '할당', '증액'],
  [ChatIntent.CREATIVE_FATIGUE]: ['식상', '새로운 소재', '바꿔야'],
  [ChatIntent.LEARNING_PHASE]: ['안정화', '초기', '데이터 부족'],
  [ChatIntent.STRUCTURE_OPTIMIZATION]: ['줄이', '합치', '나누', '단순화'],
  [ChatIntent.LEAD_QUALITY]: ['진성', '스팸', '응답률'],
  [ChatIntent.TRACKING_HEALTH]: ['어트리뷰션', '쿠키', '전환값'],
}

// Stop words to exclude when extracting keywords from failures
const STOP_WORDS = new Set([
  '이', '그', '저', '것', '수', '등', '좀', '더', '도', '를', '을', '에', '의', '가', '와', '과',
  '는', '은', '에서', '으로', '로', '하고', '하면', '해야', '해줘', '해봐', '인데', '인가',
  '너무', '많이', '아직', '안', '못', '왜', '어떻게', '뭐', '뭔가', '좋', '싶', '같',
])

type MutationAxis =
  | 'addKeyword'
  | 'removeKeyword'
  | 'addContext'
  | 'removeContext'
  | 'addKeywordFromFailures'
  | 'addContextFromFailures'
  | 'ambiguityThreshold'
  | 'singleMatchConfidence'
  | 'llmConfidenceCoeff'

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomIntent(): NonGeneralIntent {
  const intents = Object.values(ChatIntent).filter((i) => i !== ChatIntent.GENERAL) as NonGeneralIntent[]
  return pickRandom(intents)
}

export interface MutationResult {
  config: IntentClassifierConfig
  description: string
}

export class IntentLabMutator {
  private axes: MutationAxis[] = [
    'addKeyword',
    'removeKeyword',
    'addContext',
    'removeContext',
    'addKeywordFromFailures',
    'addKeywordFromFailures',  // 2x weight — 실패 기반이 더 유용
    'addContextFromFailures',
    'ambiguityThreshold',
    'singleMatchConfidence',
    'llmConfidenceCoeff',
  ]

  mutate(base: IntentClassifierConfig): MutationResult {
    const axis = pickRandom(this.axes)
    // Deep clone
    const config: IntentClassifierConfig = JSON.parse(JSON.stringify(base))

    switch (axis) {
      case 'addKeyword': {
        const intent = randomIntent()
        const candidates = CANDIDATE_KEYWORDS[intent].filter((k) => !config.keywordMap[intent].includes(k))
        if (candidates.length === 0) return this.mutate(base) // retry
        const keyword = pickRandom(candidates)
        config.keywordMap[intent] = [...config.keywordMap[intent], keyword]
        return { config, description: `addKeyword ${intent} += "${keyword}"` }
      }

      case 'removeKeyword': {
        const intent = randomIntent()
        if (config.keywordMap[intent].length <= 2) return this.mutate(base)
        const idx = Math.floor(Math.random() * config.keywordMap[intent].length)
        const removed = config.keywordMap[intent][idx]
        config.keywordMap[intent] = config.keywordMap[intent].filter((_, i) => i !== idx)
        return { config, description: `removeKeyword ${intent} -= "${removed}"` }
      }

      case 'addContext': {
        const intent = randomIntent()
        const candidates = CANDIDATE_CONTEXT_PATTERNS[intent].filter((p) => !config.contextMap[intent].includes(p))
        if (candidates.length === 0) return this.mutate(base)
        const pattern = pickRandom(candidates)
        config.contextMap[intent] = [...config.contextMap[intent], pattern]
        return { config, description: `addContext ${intent} += "${pattern}"` }
      }

      case 'removeContext': {
        const intent = randomIntent()
        if (config.contextMap[intent].length <= 1) return this.mutate(base)
        const idx = Math.floor(Math.random() * config.contextMap[intent].length)
        const removed = config.contextMap[intent][idx]
        config.contextMap[intent] = config.contextMap[intent].filter((_, i) => i !== idx)
        return { config, description: `removeContext ${intent} -= "${removed}"` }
      }

      case 'addKeywordFromFailures': {
        const failures = this.getFailures(config)
        if (failures.length === 0) return this.mutate(base)
        const failure = pickRandom(failures)
        const words = this.extractWords(failure.input)
        const existing = config.keywordMap[failure.expected as NonGeneralIntent] ?? []
        const candidates = words.filter((w) => !existing.includes(w) && w.length >= 2)
        if (candidates.length === 0) return this.mutate(base)
        const word = pickRandom(candidates)
        config.keywordMap[failure.expected as NonGeneralIntent] = [...existing, word]
        return { config, description: `addKeywordFromFailure ${failure.expected} += "${word}" (from: "${failure.input.slice(0, 20)}")` }
      }

      case 'addContextFromFailures': {
        const failures = this.getFailures(config)
        if (failures.length === 0) return this.mutate(base)
        const failure = pickRandom(failures)
        // 입력 문장에서 2~4글자 서브스트링 추출
        const input = failure.input.toLowerCase()
        const substrings: string[] = []
        for (let len = 2; len <= Math.min(4, input.length); len++) {
          for (let i = 0; i <= input.length - len; i++) {
            const sub = input.slice(i, i + len).trim()
            if (sub.length >= 2 && !STOP_WORDS.has(sub)) substrings.push(sub)
          }
        }
        const existing = config.contextMap[failure.expected as NonGeneralIntent] ?? []
        const candidates = substrings.filter((s) => !existing.includes(s))
        if (candidates.length === 0) return this.mutate(base)
        const pattern = pickRandom(candidates)
        config.contextMap[failure.expected as NonGeneralIntent] = [...existing, pattern]
        return { config, description: `addContextFromFailure ${failure.expected} += "${pattern}" (from: "${failure.input.slice(0, 20)}")` }
      }

      case 'ambiguityThreshold': {
        const delta = pickRandom([-0.3, -0.2, -0.1, 0.1, 0.2, 0.3])
        config.ambiguityThreshold = Math.max(
          1.5,
          Math.min(3.0, Math.round((base.ambiguityThreshold + delta) * 10) / 10),
        )
        if (config.ambiguityThreshold === base.ambiguityThreshold) return this.mutate(base)
        return { config, description: `ambiguityThreshold ${base.ambiguityThreshold} → ${config.ambiguityThreshold}` }
      }

      case 'singleMatchConfidence': {
        const delta = pickRandom([-0.1, -0.05, 0.05, 0.1])
        config.singleMatchConfidence = Math.max(
          0.4,
          Math.min(0.8, Math.round((base.singleMatchConfidence + delta) * 100) / 100),
        )
        if (config.singleMatchConfidence === base.singleMatchConfidence) return this.mutate(base)
        return {
          config,
          description: `singleMatchConfidence ${base.singleMatchConfidence} → ${config.singleMatchConfidence}`,
        }
      }

      case 'llmConfidenceCoeff': {
        const delta = pickRandom([-0.02, -0.01, 0.01, 0.02])
        config.llmConfidenceCoeff = Math.max(
          0.03,
          Math.min(0.10, Math.round((base.llmConfidenceCoeff + delta) * 100) / 100),
        )
        if (config.llmConfidenceCoeff === base.llmConfidenceCoeff) return this.mutate(base)
        return { config, description: `llmConfidenceCoeff ${base.llmConfidenceCoeff} → ${config.llmConfidenceCoeff}` }
      }
    }
  }

  private getFailures(config: IntentClassifierConfig): { input: string; expected: ChatIntent }[] {
    const classifier = IntentClassifier.create(config)
    const result = evaluate(classifier, TRAIN_EVAL_SET)
    return result.failures
  }

  private extractWords(input: string): string[] {
    return input
      .toLowerCase()
      .split(/[\s,!?.]+/)
      .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
  }
}
