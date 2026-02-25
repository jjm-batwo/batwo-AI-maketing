import type { IAIService, AIConfig } from '@application/ports/IAIService'

// ============================================================================
// Types
// ============================================================================

export interface Summary {
  text: string
  originalMessageCount: number
  createdAt: Date
  keyIntents?: string[]
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

// ============================================================================
// Service
// ============================================================================

export class ConversationSummarizerService {
  constructor(private readonly aiService: IAIService) {}

  /**
   * 대화 히스토리를 요약합니다.
   */
  async summarize(messages: Message[], maxTokens: number): Promise<Summary> {
    if (messages.length === 0) {
      return {
        text: '',
        originalMessageCount: 0,
        createdAt: new Date(),
      }
    }

    const systemPrompt =
      '당신은 대화 요약 전문가입니다. 대화의 주요 의도(key intents)와 핵심 내용을 보존하면서 간결하게 요약해주세요. ' +
      '주요 의도를 "주요 의도:" 접두사와 함께 번호를 매겨 나열해주세요.'

    const userPrompt = this.buildUserPrompt(messages)

    const config: AIConfig = {
      temperature: 0.3,
      maxTokens,
    }

    const aiResponse = await this.aiService.chatCompletion(systemPrompt, userPrompt, config)

    const keyIntents = this.extractKeyIntents(aiResponse)

    return {
      text: aiResponse,
      originalMessageCount: messages.length,
      createdAt: new Date(),
      keyIntents: keyIntents.length > 0 ? keyIntents : undefined,
    }
  }

  /**
   * 이전 요약에 새 메시지를 추가하여 증분 요약합니다.
   */
  async summarizeIncrementally(previousSummary: Summary, newMessages: Message[]): Promise<Summary> {
    const systemPrompt =
      '당신은 대화 요약 전문가입니다. 이전 요약과 새로운 메시지를 통합하여 주요 의도(key intents)를 보존하면서 업데이트된 요약을 생성해주세요.'

    const userPrompt =
      `이전 요약:\n${previousSummary.text}\n\n새로운 메시지:\n` +
      newMessages.map((m) => `[${m.role}]: ${m.content}`).join('\n')

    const config: AIConfig = {
      temperature: 0.3,
      maxTokens: 1000,
    }

    const aiResponse = await this.aiService.chatCompletion(systemPrompt, userPrompt, config)

    const keyIntents = this.extractKeyIntents(aiResponse)

    return {
      text: aiResponse,
      originalMessageCount: previousSummary.originalMessageCount + newMessages.length,
      createdAt: new Date(),
      keyIntents: keyIntents.length > 0 ? keyIntents : previousSummary.keyIntents,
    }
  }

  /**
   * 텍스트의 예상 토큰 수를 추정합니다.
   */
  estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4)
  }

  // ──────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────

  private buildUserPrompt(messages: Message[]): string {
    return messages.map((m) => `[${m.role}]: ${m.content}`).join('\n')
  }

  private extractKeyIntents(text: string): string[] {
    const intents: string[] = []

    // "주요 의도:" 이후의 번호가 매겨진 항목을 추출
    const intentMatch = text.match(/주요 의도[:\s]*([\s\S]*)/)
    if (!intentMatch) return intents

    const intentSection = intentMatch[1]
    // 1) ... 2) ... 3) ... 패턴 매칭
    const itemPattern = /\d+\)\s*([^0-9)]+?)(?=\s*\d+\)|$)/g
    let match: RegExpExecArray | null
    while ((match = itemPattern.exec(intentSection)) !== null) {
      const intent = match[1].trim().replace(/[.。,，\s]+$/, '')
      if (intent) {
        intents.push(intent)
      }
    }

    return intents
  }
}
