import { describe, it, expect, vi } from 'vitest';
import {
  createWrappedNode,
  executeGraph,
  type BaseState,
  type NodeDefinition,
} from './graph';
import { AgentError } from './errors';
import { createAgentLogger } from './logger';

describe('BaseStateAnnotation', () => {
  it('should have errors and currentStep channels', () => {
    // BaseStateAnnotation.State should have the correct shape
    const state: BaseState = {
      errors: [],
      currentStep: 'init',
    };

    expect(state.errors).toEqual([]);
    expect(state.currentStep).toBe('init');
  });
});

describe('createWrappedNode', () => {
  it('should wrap a node function with logging', async () => {
    const execute = vi.fn().mockResolvedValue({ result: 'done' });

    const node: NodeDefinition<BaseState & { result?: string }> = {
      name: 'test-node',
      description: 'A test node',
      execute,
    };

    const wrapped = createWrappedNode(node);
    const state: BaseState & { result?: string } = { errors: [], currentStep: 'init' };

    const result = await wrapped(state);

    expect(execute).toHaveBeenCalled();
    expect(result.currentStep).toBe('test-node');
    expect(result.result).toBe('done');
  });

  it('should handle node execution errors', async () => {
    const error = new AgentError('Node failed', 'NODE_ERROR', true);
    const execute = vi.fn().mockRejectedValue(error);

    const node: NodeDefinition<BaseState> = {
      name: 'failing-node',
      description: 'A node that fails',
      execute,
      retryConfig: { maxRetries: 0, initialDelayMs: 10 },
    };

    const wrapped = createWrappedNode(node);
    const state: BaseState = { errors: [], currentStep: 'init' };

    const result = await wrapped(state);

    // AgentError is returned as-is by normalizeError, so the message is just 'Node failed'
    expect(result.errors).toContain('Node failed');
    expect(result.currentStep).toBe('failing-node');
  });

  it('should use provided logger from config', async () => {
    const execute = vi.fn().mockResolvedValue({});
    const logger = createAgentLogger('test', 'user-1', {});

    const node: NodeDefinition<BaseState> = {
      name: 'logged-node',
      description: 'A node with logger',
      execute,
    };

    const wrapped = createWrappedNode(node);
    const state: BaseState = { errors: [], currentStep: 'init' };

    await wrapped(state, {
      configurable: {
        logger,
        userId: 'user-1',
      },
    });

    expect(execute).toHaveBeenCalledWith(
      state,
      expect.objectContaining({
        logger,
        userId: 'user-1',
      })
    );
  });

  it('should retry on retryable errors', async () => {
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new AgentError('Temporary failure', 'TEMP_ERROR', true))
      .mockResolvedValue({ recovered: true });

    const node: NodeDefinition<BaseState & { recovered?: boolean }> = {
      name: 'retry-node',
      description: 'A node that retries',
      execute,
      retryConfig: { maxRetries: 2, initialDelayMs: 10 },
    };

    const wrapped = createWrappedNode(node);
    const state: BaseState & { recovered?: boolean } = { errors: [], currentStep: 'init' };

    const result = await wrapped(state);

    expect(execute).toHaveBeenCalledTimes(2);
    expect(result.recovered).toBe(true);
    expect(result.errors).toBeUndefined();
  });
});

describe('executeGraph', () => {
  it('should execute a compiled graph successfully', async () => {
    const mockCompiledGraph = {
      invoke: vi.fn().mockResolvedValue({
        errors: [],
        currentStep: 'final',
        output: 'success',
      }),
    };

    const result = await executeGraph(
      mockCompiledGraph,
      { errors: [], currentStep: 'init' },
      'test-agent',
      { userId: 'user-1' }
    );

    expect(result.success).toBe(true);
    expect(result.result?.currentStep).toBe('final');
    expect(mockCompiledGraph.invoke).toHaveBeenCalledWith(
      { errors: [], currentStep: 'init' },
      expect.objectContaining({
        configurable: expect.objectContaining({
          userId: 'user-1',
        }),
      })
    );
  });

  it('should return error result when errors exist in state', async () => {
    const mockCompiledGraph = {
      invoke: vi.fn().mockResolvedValue({
        errors: ['Step 1 failed', 'Step 2 failed'],
        currentStep: 'failed',
      }),
    };

    const result = await executeGraph(
      mockCompiledGraph,
      { errors: [], currentStep: 'init' },
      'test-agent',
      { userId: 'user-1' }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Step 1 failed');
    expect(result.error?.message).toContain('Step 2 failed');
    expect(result.result?.errors).toHaveLength(2);
  });

  it('should handle graph execution errors', async () => {
    const mockCompiledGraph = {
      invoke: vi.fn().mockRejectedValue(new Error('Graph crashed')),
    };

    const result = await executeGraph(
      mockCompiledGraph,
      { errors: [], currentStep: 'init' },
      'test-agent',
      { userId: 'user-1' }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Graph crashed');
  });

  it('should call onLog callback', async () => {
    const onLog = vi.fn();
    const mockCompiledGraph = {
      invoke: vi.fn().mockResolvedValue({
        errors: [],
        currentStep: 'done',
      }),
    };

    await executeGraph(
      mockCompiledGraph,
      { errors: [], currentStep: 'init' },
      'test-agent',
      { userId: 'user-1', onLog }
    );

    expect(onLog).toHaveBeenCalled();
  });

  it('should call onComplete callback', async () => {
    const onComplete = vi.fn();
    const mockCompiledGraph = {
      invoke: vi.fn().mockResolvedValue({
        errors: [],
        currentStep: 'done',
      }),
    };

    await executeGraph(
      mockCompiledGraph,
      { errors: [], currentStep: 'init' },
      'test-agent',
      { userId: 'user-1', onComplete }
    );

    expect(onComplete).toHaveBeenCalled();
  });
});
