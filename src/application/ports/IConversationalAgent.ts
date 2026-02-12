import type { z } from 'zod'

/**
 * 에이전트 컨텍스트 - 모든 도구 실행에 필요한 공통 정보
 */
export interface AgentContext {
  userId: string
  accessToken: string | null
  adAccountId: string | null
  conversationId: string
}

/**
 * 도구 실행 결과
 */
export interface ToolExecutionResult<T = unknown> {
  success: boolean
  data: T
  formattedMessage: string
}

/**
 * 에이전트 도구 정의
 */
export interface AgentTool<TParams = unknown, TResult = unknown> {
  name: string
  description: string
  parameters: z.ZodSchema<TParams>
  requiresConfirmation: boolean
  execute: (params: TParams, context: AgentContext) => Promise<ToolExecutionResult<TResult>>
  buildConfirmation?: (params: TParams, context: AgentContext) => Promise<{
    summary: string
    details: { label: string; value: string; changed?: boolean }[]
    warnings: string[]
  }>
}

/**
 * 도구 카테고리
 */
export type ToolCategory = 'query' | 'mutation' | 'meta'

/**
 * 도구 레지스트리 인터페이스
 */
export interface IToolRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(tool: AgentTool<any, any>): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(name: string): AgentTool<any, any> | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAll(): AgentTool<any, any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getByCategory(category: ToolCategory): AgentTool<any, any>[]
  toVercelAITools(): Record<string, unknown>
}
