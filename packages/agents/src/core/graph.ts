/**
 * LangGraph StateGraph 기본 설정 및 유틸리티
 */

import { Annotation } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import { AgentLogger, createAgentLogger } from './logger';
import { AgentError, normalizeError } from './errors';
import { withRetry, type RetryConfig, DEFAULT_RETRY_CONFIG } from './retry';

// ============================================================================
// 상태 채널 타입
// ============================================================================

/**
 * 기본 상태 Annotation - 모든 에이전트 그래프가 확장해야 함
 */
export const BaseStateAnnotation = Annotation.Root({
  errors: Annotation<string[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  currentStep: Annotation<string>({
    reducer: (_a, b) => b,
    default: () => 'init',
  }),
});

export type BaseState = typeof BaseStateAnnotation.State;

export interface GraphContext {
  logger: AgentLogger;
  userId: string;
  config?: RunnableConfig;
}

// ============================================================================
// 노드 정의 타입
// ============================================================================

export type NodeFunction<TState> = (
  state: TState,
  context: GraphContext
) => Promise<Partial<TState>>;

export interface NodeDefinition<TState> {
  name: string;
  description: string;
  execute: NodeFunction<TState>;
  retryConfig?: Partial<RetryConfig>;
}

// ============================================================================
// 엣지 정의 타입
// ============================================================================

export type ConditionalEdgeFunction<TState> = (
  state: TState
) => string;

export interface EdgeDefinition<TState> {
  from: string;
  to: string | ConditionalEdgeFunction<TState>;
}

// ============================================================================
// 노드 래퍼
// ============================================================================

/**
 * 노드 래퍼 - 로깅, 에러 핸들링, 재시도 적용
 */
export function createWrappedNode<TState extends BaseState>(
  node: NodeDefinition<TState>
): (state: TState, config?: RunnableConfig) => Promise<Partial<TState>> {
  return async (state: TState, config?: RunnableConfig): Promise<Partial<TState>> => {
    const context: GraphContext = {
      logger: (config?.configurable?.logger as AgentLogger) ??
        createAgentLogger(node.name, 'unknown', state),
      userId: (config?.configurable?.userId as string) ?? 'unknown',
      config,
    };

    context.logger.enterStep(node.name);

    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...node.retryConfig };

    const result = await withRetry(
      async () => node.execute(state, context),
      retryConfig
    );

    if (!result.success) {
      const agentError = normalizeError(result.error, `Node ${node.name} failed`);
      context.logger.error(`Node failed after ${result.attempts} attempts`, {
        error: agentError.message,
        code: agentError.code,
      });

      return {
        errors: [...state.errors, agentError.message],
        currentStep: node.name,
      } as Partial<TState>;
    }

    context.logger.exitStep(node.name, result.data);
    return {
      ...result.data,
      currentStep: node.name,
    } as Partial<TState>;
  };
}

// ============================================================================
// 그래프 실행 유틸리티
// ============================================================================

export interface GraphExecutionConfig {
  userId: string;
  onLog?: (entry: { level: string; message: string }) => void;
  onComplete?: (log: unknown) => Promise<void>;
}

export interface GraphExecutionResult<TState> {
  success: boolean;
  result?: TState;
  error?: AgentError;
}

/**
 * 컴파일된 그래프 실행
 * @example
 * ```typescript
 * const result = await executeGraph(
 *   compiledGraph,
 *   { errors: [], currentStep: 'init' },
 *   'my-agent',
 *   { userId: 'user-123' }
 * );
 * ```
 */
export async function executeGraph<TState extends BaseState>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compiledGraph: { invoke: (input: any, config?: any) => Promise<any> },
  input: Partial<TState>,
  agentType: string,
  config: GraphExecutionConfig
): Promise<GraphExecutionResult<TState>> {
  const logger = createAgentLogger(agentType, config.userId, input, {
    onLog: config.onLog ? (entry) => config.onLog?.({ level: entry.level, message: entry.message }) : undefined,
    onExecutionComplete: config.onComplete,
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await compiledGraph.invoke(input, {
      configurable: {
        logger,
        userId: config.userId,
      },
    });

    const typedResult = result as TState;

    if (typedResult.errors && typedResult.errors.length > 0) {
      await logger.fail(new AgentError(typedResult.errors.join('; '), 'EXECUTION_ERROR'));
      return {
        success: false,
        result: typedResult,
        error: new AgentError(typedResult.errors.join('; '), 'EXECUTION_ERROR'),
      };
    }

    await logger.complete(typedResult);
    return { success: true, result: typedResult };
  } catch (error) {
    const agentError = normalizeError(error, `Graph execution failed: ${agentType}`);
    await logger.fail(agentError);
    return { success: false, error: agentError };
  }
}

// Re-export LangGraph constants
export { END, START, Annotation, StateGraph } from '@langchain/langgraph';
