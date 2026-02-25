import { ChatIntent } from './ChatIntent'

/**
 * IntentClassificationResult - Immutable value object representing
 * the result of intent classification.
 *
 * Properties:
 * - intent: The classified ChatIntent
 * - confidence: Confidence score between 0 and 1
 * - method: Classification method used ('KEYWORD' or 'LLM')
 * - originalInput: The original user message that was classified
 */
export class IntentClassificationResult {
  readonly intent: ChatIntent
  readonly confidence: number
  readonly method: 'KEYWORD' | 'LLM'
  readonly originalInput: string

  private constructor(
    intent: ChatIntent,
    confidence: number,
    method: 'KEYWORD' | 'LLM',
    originalInput: string
  ) {
    this.intent = intent
    this.confidence = confidence
    this.method = method
    this.originalInput = originalInput
    Object.freeze(this)
  }

  static create(
    intent: ChatIntent,
    confidence: number,
    method: 'KEYWORD' | 'LLM',
    originalInput: string
  ): IntentClassificationResult {
    if (confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be between 0 and 1')
    }
    return new IntentClassificationResult(intent, confidence, method, originalInput)
  }

  equals(other: IntentClassificationResult): boolean {
    return (
      this.intent === other.intent &&
      this.confidence === other.confidence &&
      this.method === other.method &&
      this.originalInput === other.originalInput
    )
  }

  toJSON() {
    return {
      intent: this.intent,
      confidence: this.confidence,
      method: this.method,
      originalInput: this.originalInput,
    }
  }
}
