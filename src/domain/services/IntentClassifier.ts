import { ChatIntent } from '../value-objects/ChatIntent'
import { IntentClassificationResult } from '../value-objects/IntentClassificationResult'

/**
 * Keyword map: intent → array of keywords (lowercase).
 * Korean and English keywords for each intent category.
 */
const KEYWORD_MAP: Record<Exclude<ChatIntent, ChatIntent.GENERAL>, string[]> = {
  [ChatIntent.CAMPAIGN_CREATION]: ['캠페인', 'campaign', 'create', '만들', '생성', '시작'],
  [ChatIntent.REPORT_QUERY]: ['리포트', 'report', '보고서', '보여줘', '보기', '조회'],
  [ChatIntent.KPI_ANALYSIS]: [
    'roas',
    'cpc',
    '성과',
    '분석',
    'performance',
    'analyze',
    '전환율',
    '하락',
    '급증',
    '급감',
    '이상',
    '감지',
    'ctr',
  ],
  [ChatIntent.PIXEL_SETUP]: ['픽셀', 'pixel', '설치', 'install'],
  [ChatIntent.BUDGET_OPTIMIZATION]: ['예산', 'budget', '최적화', 'optimize'],
}

/**
 * Korean negation patterns that negate the preceding verb/action.
 */
const NEGATION_PATTERNS = ['지 마', '지마', '하지', '안 ', '못 ', '없']

/**
 * LLM context keyword map for fallback classification.
 * These are broader semantic patterns that indicate intent
 * when direct keywords are not matched.
 */
const LLM_CONTEXT_MAP: Record<Exclude<ChatIntent, ChatIntent.GENERAL>, string[]> = {
  [ChatIntent.CAMPAIGN_CREATION]: ['매출', '전략', '광고를 시작', '새로'],
  [ChatIntent.REPORT_QUERY]: ['데이터', '살펴', '확인', '실적'],
  [ChatIntent.KPI_ANALYSIS]: ['효율', '대비', '어떤가', '올리', '지표', '광고 효율'],
  [ChatIntent.PIXEL_SETUP]: ['추적', '트래킹'],
  [ChatIntent.BUDGET_OPTIMIZATION]: ['비용', '절감', '조정'],
}

/**
 * IntentClassifier - Domain service for two-stage intent classification.
 *
 * Stage 1 (KEYWORD): Fast synchronous keyword matching with high confidence.
 * Stage 2 (LLM): Fallback for messages without direct keyword hits.
 *                 (Stubbed — uses contextual pattern matching for now.)
 */
export class IntentClassifier {
  static readonly CONFIDENCE_HIGH = 0.8
  static readonly CONFIDENCE_MEDIUM = 0.5
  static readonly CONFIDENCE_LOW = 0.3

  private constructor() {}

  static create(): IntentClassifier {
    return new IntentClassifier()
  }

  /**
   * Classify a user message into a ChatIntent.
   *
   * @param message - The user's input message
   * @returns IntentClassificationResult with intent, confidence, method, and originalInput
   * @throws Error if message is empty string
   */
  classify(message: string): IntentClassificationResult {
    if (message === '') {
      throw new Error('Message cannot be empty')
    }

    // Whitespace-only → GENERAL with confidence 0
    if (message.trim().length === 0) {
      return IntentClassificationResult.create(ChatIntent.GENERAL, 0, 'KEYWORD', message)
    }

    const normalized = message.toLowerCase().trim()

    // Check for negation — if the message negates an action keyword,
    // skip keyword classification for that intent
    const hasNegation = NEGATION_PATTERNS.some((pattern) => normalized.includes(pattern))

    // Stage 1: Keyword-based classification
    if (!hasNegation) {
      const keywordResult = this.classifyByKeyword(normalized, message)
      if (keywordResult) {
        return keywordResult
      }
    }

    // Stage 2: LLM fallback (stubbed with contextual pattern matching)
    return this.classifyByLLM(normalized, message)
  }

  /**
   * Stage 1: Keyword matching.
   * Returns null if no keywords match.
   * Returns null if multiple intents match with similar scores (ambiguous - let LLM handle).
   */
  private classifyByKeyword(
    normalized: string,
    originalInput: string
  ): IntentClassificationResult | null {
    const intentScores: Array<{ intent: ChatIntent; score: number; matches: number }> = []

    for (const [intentStr, keywords] of Object.entries(KEYWORD_MAP)) {
      const intent = intentStr as ChatIntent
      let intentScore = 0
      let intentMatches = 0

      for (const keyword of keywords) {
        if (normalized.includes(keyword)) {
          intentMatches++
          intentScore += keyword.length
        }
      }

      if (intentMatches > 0) {
        intentScores.push({ intent, score: intentScore, matches: intentMatches })
      }
    }

    if (intentScores.length === 0) {
      return null
    }

    // Sort by score descending
    intentScores.sort((a, b) => b.score - a.score)

    // Check for ambiguity: if top 2 intents have similar scores (within 100%), use LLM
    if (intentScores.length >= 2) {
      const topScore = intentScores[0].score
      const secondScore = intentScores[1].score
      if (secondScore > 0 && topScore / secondScore < 2.0) {
        // Ambiguous - let LLM handle it
        return null
      }
    }

    const bestMatch = intentScores[0]
    const { intent: bestIntent, matches: matchCount } = bestMatch

    // Determine confidence based on match quality
    let confidence: number
    if (matchCount >= 2) {
      // Multiple keyword hits → high confidence
      confidence = 0.95
    } else {
      // Single keyword hit - use medium confidence
      confidence = IntentClassifier.CONFIDENCE_MEDIUM + 0.1 // 0.6
    }

    return IntentClassificationResult.create(bestIntent, confidence, 'KEYWORD', originalInput)
  }

  /**
   * Stage 2: LLM fallback (stubbed).
   * Uses contextual pattern matching to simulate LLM classification.
   */
  private classifyByLLM(normalized: string, originalInput: string): IntentClassificationResult {
    let bestIntent: ChatIntent | null = null
    let bestScore = 0

    for (const [intentStr, contextKeywords] of Object.entries(LLM_CONTEXT_MAP)) {
      const intent = intentStr as ChatIntent
      let score = 0

      for (const keyword of contextKeywords) {
        if (normalized.includes(keyword)) {
          score += keyword.length
        }
      }

      if (score > bestScore) {
        bestIntent = intent
        bestScore = score
      }
    }

    if (bestIntent !== null && bestScore > 0) {
      // LLM result — lower confidence than keyword matches
      const confidence = Math.min(0.75, 0.4 + bestScore * 0.05)
      return IntentClassificationResult.create(bestIntent, confidence, 'LLM', originalInput)
    }

    // No match at all → GENERAL with very low confidence
    const confidence = 0.1
    return IntentClassificationResult.create(ChatIntent.GENERAL, confidence, 'LLM', originalInput)
  }
}
