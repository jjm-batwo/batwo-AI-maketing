import { ChatIntent } from '../value-objects/ChatIntent'

/**
 * Domain port for LLM-based intent classification.
 * Used as fallback when keyword matching confidence is low.
 */
export interface IIntentLLMPort {
  classifyIntent(message: string, candidates: ChatIntent[]): Promise<ChatIntent>
}
