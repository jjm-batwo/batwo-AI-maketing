import { ChatIntent } from '../value-objects/ChatIntent'
import { IntentClassificationResult } from '../value-objects/IntentClassificationResult'
import type { IIntentLLMPort } from '../ports/IIntentLLMPort'
import {
  IntentClassifierConfig,
  DEFAULT_INTENT_CLASSIFIER_CONFIG,
} from './IntentClassifierConfig'

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

  private constructor(
    private readonly config: IntentClassifierConfig,
    private readonly llmPort?: IIntentLLMPort,
  ) {}

  static create(config?: IntentClassifierConfig, llmPort?: IIntentLLMPort): IntentClassifier {
    return new IntentClassifier(config ?? DEFAULT_INTENT_CLASSIFIER_CONFIG, llmPort)
  }

  getConfig(): IntentClassifierConfig {
    return this.config
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

    // Check for action negation — "만들지 마", "하지 마" 같은 행동 부정만 필터.
    // "안 돼", "안 나와", "안 잡혀" 같은 문제 호소는 부정이 아님.
    const hasActionNegation = this.isActionNegation(normalized)

    // Stage 1: Keyword-based classification
    if (!hasActionNegation) {
      const keywordResult = this.classifyByKeyword(normalized, message)
      if (keywordResult) {
        return keywordResult
      }
    }

    // Stage 2: LLM fallback (stubbed with contextual pattern matching)
    return this.classifyByLLM(normalized, message)
  }

  /**
   * Async classify with LLM fallback.
   * Calls sync classify() first. If confidence < threshold and llmPort exists,
   * delegates to LLM. On LLM error, falls back to sync result.
   */
  async classifyAsync(message: string): Promise<IntentClassificationResult> {
    const syncResult = this.classify(message)

    // High confidence or no LLM port → return sync result
    if (syncResult.confidence > this.config.llmFallbackThreshold || !this.llmPort) {
      return syncResult
    }

    // Low confidence → try LLM
    try {
      const allIntents = Object.values(ChatIntent)
      const llmIntent = await this.llmPort.classifyIntent(message, allIntents)
      return IntentClassificationResult.create(llmIntent, 0.85, 'LLM', message)
    } catch {
      // LLM failed → graceful fallback to sync result
      return syncResult
    }
  }

  /**
   * Detect action negation (행동 부정) vs problem complaint (문제 호소).
   *
   * Action negation: "캠페인을 만들지 마세요", "하지 마" → skip keyword matching
   * Problem complaint: "전환이 안 나와요", "노출이 안 돼" → NOT negation, proceed normally
   *
   * Heuristic: "지 마", "지마", "하지 마" = action negation (verb + 지 마)
   * "안 " / "못 " alone = usually problem complaint in marketing context
   */
  private isActionNegation(normalized: string): boolean {
    // Strong action negation patterns — these clearly negate an action
    const actionNegationPatterns = ['지 마', '지마', '하지 마', '하지마']
    return actionNegationPatterns.some((pattern) => normalized.includes(pattern))
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

    for (const [intentStr, keywords] of Object.entries(this.config.keywordMap)) {
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
      if (secondScore > 0 && topScore / secondScore < this.config.ambiguityThreshold) {
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
      confidence = this.config.singleMatchConfidence // 0.6
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

    for (const [intentStr, contextKeywords] of Object.entries(this.config.contextMap)) {
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
      const confidence = Math.min(0.75, 0.4 + bestScore * this.config.llmConfidenceCoeff)
      return IntentClassificationResult.create(bestIntent, confidence, 'LLM', originalInput)
    }

    // No match at all → GENERAL with very low confidence
    const confidence = 0.1
    return IntentClassificationResult.create(ChatIntent.GENERAL, confidence, 'LLM', originalInput)
  }
}
