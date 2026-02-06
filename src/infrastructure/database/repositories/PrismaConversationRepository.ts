import type { PrismaClient } from '@/generated/prisma'
import type {
  IConversationRepository,
  ConversationMessageData,
} from '@domain/repositories/IConversationRepository'
import { Conversation } from '@domain/entities/Conversation'

export class PrismaConversationRepository implements IConversationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(conversation: Conversation): Promise<Conversation> {
    const saved = await this.prisma.conversation.create({
      data: {
        userId: conversation.userId,
        title: conversation.title,
        isArchived: conversation.isArchived,
      },
    })

    return Conversation.fromPersistence({
      id: saved.id,
      userId: saved.userId,
      title: saved.title,
      isArchived: saved.isArchived,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    })
  }

  async findById(id: string): Promise<Conversation | null> {
    const record = await this.prisma.conversation.findUnique({ where: { id } })
    if (!record) return null

    return Conversation.fromPersistence({
      id: record.id,
      userId: record.userId,
      title: record.title,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  async findByUserId(
    userId: string,
    options?: { includeArchived?: boolean; limit?: number; offset?: number }
  ): Promise<Conversation[]> {
    const records = await this.prisma.conversation.findMany({
      where: {
        userId,
        ...(options?.includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    })

    return records.map((r) =>
      Conversation.fromPersistence({
        id: r.id,
        userId: r.userId,
        title: r.title,
        isArchived: r.isArchived,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    )
  }

  async addMessage(
    conversationId: string,
    message: Omit<ConversationMessageData, 'id' | 'conversationId' | 'createdAt'>
  ): Promise<ConversationMessageData> {
    const saved = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        role: message.role,
        content: message.content,
        toolCalls: message.toolCalls as unknown as undefined,
        toolName: message.toolName,
        toolResult: message.toolResult as unknown as undefined,
        metadata: message.metadata as unknown as undefined,
      },
    })

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return {
      id: saved.id,
      conversationId: saved.conversationId,
      role: saved.role as ConversationMessageData['role'],
      content: saved.content,
      toolCalls: saved.toolCalls as ConversationMessageData['toolCalls'],
      toolName: saved.toolName,
      toolResult: saved.toolResult as ConversationMessageData['toolResult'],
      metadata: saved.metadata as ConversationMessageData['metadata'],
      createdAt: saved.createdAt,
    }
  }

  async getMessages(
    conversationId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ConversationMessageData[]> {
    const records = await this.prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    })

    return records.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      role: r.role as ConversationMessageData['role'],
      content: r.content,
      toolCalls: r.toolCalls as ConversationMessageData['toolCalls'],
      toolName: r.toolName,
      toolResult: r.toolResult as ConversationMessageData['toolResult'],
      metadata: r.metadata as ConversationMessageData['metadata'],
      createdAt: r.createdAt,
    }))
  }

  async archive(id: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id },
      data: { isArchived: true },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.conversation.delete({ where: { id } })
  }
}
