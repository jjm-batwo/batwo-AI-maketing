import { describe, it, expect } from 'vitest';
import {
  AgentError,
  LLMError,
  ValidationError,
  StateError,
  TimeoutError,
  RateLimitError,
  isAgentError,
  isRetryableError,
  normalizeError,
} from './errors';

describe('AgentError', () => {
  it('should create an AgentError with correct properties', () => {
    const error = new AgentError('Test error', 'TEST_CODE', true, { key: 'value' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.retryable).toBe(true);
    expect(error.metadata).toEqual({ key: 'value' });
    expect(error.name).toBe('AgentError');
  });

  it('should default retryable to false', () => {
    const error = new AgentError('Test error', 'TEST_CODE');
    expect(error.retryable).toBe(false);
  });
});

describe('LLMError', () => {
  it('should create an LLMError with provider info', () => {
    const error = new LLMError('LLM failed', 'openai', 500, { model: 'gpt-4' });

    expect(error.message).toBe('LLM failed');
    expect(error.provider).toBe('openai');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('LLM_ERROR');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('LLMError');
  });
});

describe('ValidationError', () => {
  it('should create a ValidationError', () => {
    const error = new ValidationError('Invalid input', 'email');

    expect(error.message).toBe('Invalid input');
    expect(error.field).toBe('email');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.retryable).toBe(false);
    expect(error.name).toBe('ValidationError');
  });
});

describe('StateError', () => {
  it('should create a StateError with current step', () => {
    const error = new StateError('State transition failed', 'analyze');

    expect(error.message).toBe('State transition failed');
    expect(error.currentStep).toBe('analyze');
    expect(error.code).toBe('STATE_ERROR');
    expect(error.retryable).toBe(false);
    expect(error.name).toBe('StateError');
  });
});

describe('TimeoutError', () => {
  it('should create a TimeoutError with timeout value', () => {
    const error = new TimeoutError('Operation timed out', 30000);

    expect(error.message).toBe('Operation timed out');
    expect(error.timeoutMs).toBe(30000);
    expect(error.code).toBe('TIMEOUT_ERROR');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('TimeoutError');
  });
});

describe('RateLimitError', () => {
  it('should create a RateLimitError with retry after', () => {
    const error = new RateLimitError('Rate limit exceeded', 60000);

    expect(error.message).toBe('Rate limit exceeded');
    expect(error.retryAfterMs).toBe(60000);
    expect(error.code).toBe('RATE_LIMIT_ERROR');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('RateLimitError');
  });
});

describe('isAgentError', () => {
  it('should return true for AgentError instances', () => {
    expect(isAgentError(new AgentError('test', 'TEST'))).toBe(true);
    expect(isAgentError(new LLMError('test', 'openai'))).toBe(true);
    expect(isAgentError(new ValidationError('test'))).toBe(true);
  });

  it('should return false for non-AgentError', () => {
    expect(isAgentError(new Error('test'))).toBe(false);
    expect(isAgentError('string error')).toBe(false);
    expect(isAgentError(null)).toBe(false);
    expect(isAgentError(undefined)).toBe(false);
  });
});

describe('isRetryableError', () => {
  it('should return true for retryable errors', () => {
    expect(isRetryableError(new LLMError('test', 'openai'))).toBe(true);
    expect(isRetryableError(new TimeoutError('test', 1000))).toBe(true);
    expect(isRetryableError(new RateLimitError('test'))).toBe(true);
  });

  it('should return false for non-retryable errors', () => {
    expect(isRetryableError(new ValidationError('test'))).toBe(false);
    expect(isRetryableError(new StateError('test', 'step'))).toBe(false);
    expect(isRetryableError(new Error('test'))).toBe(false);
  });
});

describe('normalizeError', () => {
  it('should return AgentError as-is', () => {
    const original = new AgentError('test', 'TEST');
    const result = normalizeError(original);
    expect(result).toBe(original);
  });

  it('should convert Error to AgentError', () => {
    const original = new Error('Native error');
    const result = normalizeError(original);

    expect(result).toBeInstanceOf(AgentError);
    expect(result.message).toBe('Native error');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.metadata?.originalError).toBe('Error');
  });

  it('should convert Error with context', () => {
    const original = new Error('Native error');
    const result = normalizeError(original, 'During processing');

    expect(result.message).toBe('During processing: Native error');
  });

  it('should convert non-Error to AgentError', () => {
    const result = normalizeError('string error', 'Context');

    expect(result).toBeInstanceOf(AgentError);
    expect(result.message).toBe('Context: string error');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });
});
