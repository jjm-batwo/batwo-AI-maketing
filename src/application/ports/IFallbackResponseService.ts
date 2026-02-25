/**
 * IFallbackResponseService - Port interface for fallback response handling
 *
 * Provides user-friendly fallback messages when errors occur in the
 * chatbot pipeline. Classifies errors and returns appropriate Korean
 * messages with retry guidance.
 */

export interface FallbackResponse {
  message: string
  isRetryable: boolean
  errorType: string
}

export interface IFallbackResponseService {
  getFallbackForError(error: Error): FallbackResponse
  getRetrySuggestion(error: Error): string | null
  trackFallbackUsage(errorType: string): void
}
