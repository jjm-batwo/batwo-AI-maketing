import type { Conversation } from '../entities/Conversation'

export interface ConversationMessageData {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  toolCalls: { name: string; args: Record<string, unknown> }[] | null
  toolName: string | null
  toolResult: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface IConversationRepository {
  save(conversation: Conversation): Promise<Conversation>
  findById(id: string): Promise<Conversation | null>
  findByUserId(userId: string, options?: {
    includeArchived?: boolean
    limit?: number
    offset?: number
  }): Promise<Conversation[]>
  addMessage(
    conversationId: string,
    message: Omit<ConversationMessageData, 'id' | 'conversationId' | 'createdAt'>
  ): Promise<ConversationMessageData>
  getMessages(conversationId: string, options?: {
    limit?: number
    offset?: number
  }): Promise<ConversationMessageData[]>
  archive(id: string): Promise<void>
  delete(id: string): Promise<void>
}
