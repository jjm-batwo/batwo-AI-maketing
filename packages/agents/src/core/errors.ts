/**
 * 에이전트 오류 클래스 정의
 */

export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class LLMError extends AgentError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'LLM_ERROR', true, metadata);
    this.name = 'LLMError';
  }
}

export class ValidationError extends AgentError {
  constructor(
    message: string,
    public readonly field?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', false, metadata);
    this.name = 'ValidationError';
  }
}

export class StateError extends AgentError {
  constructor(
    message: string,
    public readonly currentStep: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'STATE_ERROR', false, metadata);
    this.name = 'StateError';
  }
}

export class TimeoutError extends AgentError {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'TIMEOUT_ERROR', true, metadata);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends AgentError {
  constructor(
    message: string,
    public readonly retryAfterMs?: number,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT_ERROR', true, metadata);
    this.name = 'RateLimitError';
  }
}

/**
 * 에러 타입 가드
 */
export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError;
}

export function isRetryableError(error: unknown): boolean {
  if (isAgentError(error)) {
    return error.retryable;
  }
  return false;
}

/**
 * 에러 정규화 - 모든 에러를 AgentError로 변환
 */
export function normalizeError(error: unknown, context?: string): AgentError {
  if (isAgentError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AgentError(
      context ? `${context}: ${error.message}` : error.message,
      'UNKNOWN_ERROR',
      false,
      { originalError: error.name, stack: error.stack }
    );
  }

  return new AgentError(
    context ? `${context}: ${String(error)}` : String(error),
    'UNKNOWN_ERROR',
    false
  );
}
