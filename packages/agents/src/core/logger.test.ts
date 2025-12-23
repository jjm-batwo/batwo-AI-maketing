import { describe, it, expect, vi } from 'vitest';
import { createAgentLogger } from './logger';

describe('AgentLogger', () => {
  it('should generate unique execution ID', () => {
    const logger1 = createAgentLogger('test-agent', 'user-1', { input: 'test' });
    const logger2 = createAgentLogger('test-agent', 'user-1', { input: 'test' });

    expect(logger1.getExecutionId()).not.toBe(logger2.getExecutionId());
    expect(logger1.getExecutionId()).toContain('test-agent');
  });

  it('should log info messages', () => {
    const onLog = vi.fn();
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, { onLog });

    logger.info('Test message', { key: 'value' });

    const logs = logger.getLogs();
    // First log is the startup log
    expect(logs.length).toBe(2);
    expect(logs[1].level).toBe('info');
    expect(logs[1].message).toBe('Test message');
    expect(logs[1].metadata).toEqual({ key: 'value' });
  });

  it('should log warn messages', () => {
    const onLog = vi.fn();
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, { onLog });

    logger.warn('Warning message');

    const logs = logger.getLogs();
    expect(logs[1].level).toBe('warn');
    expect(logs[1].message).toBe('Warning message');
  });

  it('should log error messages', () => {
    const onLog = vi.fn();
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, { onLog });

    logger.error('Error message');

    const logs = logger.getLogs();
    expect(logs[1].level).toBe('error');
    expect(logs[1].message).toBe('Error message');
  });

  it('should not log debug messages by default', () => {
    const onLog = vi.fn();
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, { onLog });

    logger.debug('Debug message');

    // Debug should be filtered out (only startup info log)
    expect(logger.getLogs().length).toBe(1);
  });

  it('should log debug messages when minLevel is debug', () => {
    const onLog = vi.fn();
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, {
      onLog,
      minLevel: 'debug',
    });

    logger.debug('Debug message');

    expect(logger.getLogs().length).toBe(2);
    expect(logger.getLogs()[1].level).toBe('debug');
  });

  it('should call onLog callback', () => {
    const onLog = vi.fn();
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, { onLog });

    logger.info('Test message');

    // Called for startup + test message
    expect(onLog).toHaveBeenCalledTimes(2);
    expect(onLog).toHaveBeenLastCalledWith(expect.objectContaining({
      level: 'info',
      message: 'Test message',
    }));
  });

  it('should track tokens used', () => {
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, { minLevel: 'debug' });

    expect(logger.getTokensUsed()).toBe(0);

    logger.addTokens(100);
    expect(logger.getTokensUsed()).toBe(100);

    logger.addTokens(50);
    expect(logger.getTokensUsed()).toBe(150);
  });

  it('should log step entry and exit', () => {
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' });

    logger.enterStep('analyze');
    logger.exitStep('analyze', { result: 'done' });

    const logs = logger.getLogs();
    expect(logs[1].message).toBe('Entering step: analyze');
    expect(logs[2].message).toBe('Completed step: analyze');
    expect(logs[2].metadata).toEqual({ step: 'analyze', result: { result: 'done' } });
  });

  it('should complete with output', async () => {
    const onComplete = vi.fn();
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, {
      onExecutionComplete: onComplete,
    });

    const log = await logger.complete({ result: 'success' });

    expect(log.status).toBe('completed');
    expect(log.output).toEqual({ result: 'success' });
    expect(log.agentType).toBe('test-agent');
    expect(log.userId).toBe('user-1');
    expect(onComplete).toHaveBeenCalledWith(log);
  });

  it('should fail with error', async () => {
    const onComplete = vi.fn();
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, {
      onExecutionComplete: onComplete,
    });

    const error = new Error('Test failure');
    const log = await logger.fail(error);

    expect(log.status).toBe('failed');
    expect(logger.getLastError()).toBe(error);
    expect(onComplete).toHaveBeenCalledWith(log);
  });

  it('should calculate duration', async () => {
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' });

    // Wait a small amount
    await new Promise((resolve) => setTimeout(resolve, 10));

    const log = await logger.complete({ result: 'done' });

    expect(log.duration).toBeGreaterThanOrEqual(10);
  });

  it('should handle onExecutionComplete errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onComplete = vi.fn().mockRejectedValue(new Error('Save failed'));
    const logger = createAgentLogger('test-agent', 'user-1', { input: 'test' }, {
      onExecutionComplete: onComplete,
    });

    const log = await logger.complete({ result: 'success' });

    expect(log.status).toBe('completed');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('createAgentLogger', () => {
  it('should create logger with default options', () => {
    const logger = createAgentLogger('my-agent', 'user-123', { data: 'test' });

    expect(logger.getExecutionId()).toContain('my-agent');
    expect(logger.getTokensUsed()).toBe(0);
  });

  it('should merge options', () => {
    const onLog = vi.fn();
    const logger = createAgentLogger('my-agent', 'user-123', { data: 'test' }, {
      onLog,
      minLevel: 'warn',
    });

    logger.info('This should be filtered');
    logger.warn('This should pass');

    expect(onLog).toHaveBeenCalledTimes(1);
  });
});
