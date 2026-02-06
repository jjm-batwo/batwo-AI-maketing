import type { IToolRegistry, AgentContext } from '@application/ports/IConversationalAgent'
import type { IPendingActionRepository } from '@domain/repositories/IPendingActionRepository'
import type { IConversationRepository } from '@domain/repositories/IConversationRepository'

// ============================================================================
// Types
// ============================================================================

export interface ActionConfirmResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

// ============================================================================
// Service
// ============================================================================

export class ActionConfirmationService {
  constructor(
    private readonly pendingActionRepo: IPendingActionRepository,
    private readonly conversationRepo: IConversationRepository,
    private readonly toolRegistry: IToolRegistry,
    private readonly buildAgentContext: (userId: string) => Promise<AgentContext>,
  ) {}

  /**
   * 액션 확인 및 실행
   * 사용자가 확인 버튼을 클릭했을 때 호출
   */
  async confirmAndExecute(actionId: string, userId: string): Promise<ActionConfirmResult> {
    // 1. PendingAction 로드
    const action = await this.pendingActionRepo.findById(actionId)
    if (!action) throw new Error('Action not found')
    if (action.isExpired) throw new Error('Action has expired')

    // 2. 확인 → 실행 상태 전이
    const confirmed = action.confirm()
    const executing = confirmed.startExecution()
    await this.pendingActionRepo.update(executing)

    // 3. 도구 찾기 및 실행
    const agentTool = this.toolRegistry.get(action.toolName)
    if (!agentTool) throw new Error(`Tool '${action.toolName}' not found`)

    const context = await this.buildAgentContext(userId)
    const agentContext: AgentContext = { ...context, conversationId: action.conversationId }

    try {
      const result = await agentTool.execute(action.toolArgs, agentContext)

      // 4. 완료 상태로 전이
      const completed = executing.complete(result.data as Record<string, unknown>)
      await this.pendingActionRepo.update(completed)

      // 5. 대화에 결과 메시지 추가
      await this.conversationRepo.addMessage(action.conversationId, {
        role: 'assistant',
        content: result.formattedMessage,
        toolCalls: null,
        toolName: action.toolName,
        toolResult: result.data as Record<string, unknown>,
        metadata: { actionId, status: 'completed' },
      })

      return {
        success: true,
        message: result.formattedMessage,
        data: result.data as Record<string, unknown>,
      }
    } catch (error) {
      // 실패 상태로 전이
      const errorMsg = error instanceof Error ? error.message : 'Execution failed'
      const failed = executing.fail(errorMsg)
      await this.pendingActionRepo.update(failed)

      // 대화에 오류 메시지 추가
      await this.conversationRepo.addMessage(action.conversationId, {
        role: 'assistant',
        content: `실행 중 오류가 발생했습니다: ${errorMsg}`,
        toolCalls: null,
        toolName: action.toolName,
        toolResult: null,
        metadata: { actionId, status: 'failed', error: errorMsg },
      })

      return { success: false, message: `실행 중 오류가 발생했습니다: ${errorMsg}` }
    }
  }

  /**
   * 액션 취소
   */
  async cancelAction(actionId: string): Promise<void> {
    const action = await this.pendingActionRepo.findById(actionId)
    if (!action) throw new Error('Action not found')

    const cancelled = action.cancel()
    await this.pendingActionRepo.update(cancelled)

    // 대화에 취소 메시지 추가
    await this.conversationRepo.addMessage(action.conversationId, {
      role: 'assistant',
      content: '작업이 취소되었습니다.',
      toolCalls: null,
      toolName: null,
      toolResult: null,
      metadata: { actionId, status: 'cancelled' },
    })
  }

  /**
   * 액션 파라미터 수정
   */
  async modifyAction(actionId: string, newArgs: Record<string, unknown>): Promise<void> {
    const action = await this.pendingActionRepo.findById(actionId)
    if (!action) throw new Error('Action not found')

    const modified = action.modifyArgs(newArgs)
    await this.pendingActionRepo.update(modified)
  }

  /**
   * 만료된 액션 정리 (크론에서 호출)
   */
  async cleanupExpiredActions(): Promise<number> {
    return this.pendingActionRepo.expirePendingActions()
  }
}
