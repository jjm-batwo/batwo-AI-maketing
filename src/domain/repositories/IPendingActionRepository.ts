import type { PendingAction } from '../entities/PendingAction'

export interface IPendingActionRepository {
  save(action: PendingAction): Promise<PendingAction>
  findById(id: string): Promise<PendingAction | null>
  findByConversationId(conversationId: string, status?: string): Promise<PendingAction[]>
  update(action: PendingAction): Promise<PendingAction>
  expirePendingActions(): Promise<number>
}
