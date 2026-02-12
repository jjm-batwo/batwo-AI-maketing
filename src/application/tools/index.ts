import { tool } from 'ai'
import type {
  AgentTool,
  IToolRegistry,
  ToolCategory,
} from '@application/ports/IConversationalAgent'

/**
 * 도구 레지스트리 - 모든 에이전트 도구를 관리
 */
export class ToolRegistry implements IToolRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tools = new Map<string, AgentTool<any, any>>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(agentTool: AgentTool<any, any>): void {
    this.tools.set(agentTool.name, agentTool)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(name: string): AgentTool<any, any> | undefined {
    return this.tools.get(name)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAll(): AgentTool<any, any>[] {
    return Array.from(this.tools.values())
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getByCategory(category: ToolCategory): AgentTool<any, any>[] {
    const META_TOOLS = ['askClarification', 'freeformResponse']

    return this.getAll().filter((t) => {
      if (category === 'mutation') return t.requiresConfirmation
      if (category === 'query') return !t.requiresConfirmation && !META_TOOLS.includes(t.name)
      return META_TOOLS.includes(t.name)
    })
  }

  /**
   * Vercel AI SDK의 tools 형식으로 변환
   * Usage: streamText({ tools: registry.toVercelAITools() })
   */
  toVercelAITools(): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [name, agentTool] of this.tools) {
      result[name] = tool({
        description: agentTool.description,
        inputSchema: agentTool.parameters,
      })
    }

    return result
  }
}
