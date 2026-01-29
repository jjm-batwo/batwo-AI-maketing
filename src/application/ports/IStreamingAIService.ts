import type { AIConfig, GenerateAdCopyInput } from './IAIService'

/**
 * 스트리밍 AI 서비스 인터페이스
 * - 기존 IAIService와 분리 (신규 인터페이스)
 * - AsyncIterable 기반 스트리밍 응답
 */
export interface IStreamingAIService {
  /**
   * 범용 채팅 스트리밍
   */
  streamChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config?: AIConfig
  ): AsyncIterable<StreamChunk>

  /**
   * 광고 카피 스트리밍 생성
   */
  streamAdCopy(
    input: GenerateAdCopyInput
  ): AsyncIterable<AdCopyStreamChunk>
}

/**
 * 범용 스트리밍 청크
 */
export interface StreamChunk {
  type: 'text' | 'progress' | 'done' | 'error'
  content?: string
  stage?: 'analyzing' | 'generating' | 'optimizing'
  progress?: number // 0-100
  error?: string
}

/**
 * 광고 카피 스트리밍 청크
 */
export interface AdCopyStreamChunk {
  type: 'variant' | 'progress' | 'done' | 'error'
  variantIndex?: number
  field?: 'headline' | 'primaryText' | 'description' | 'callToAction'
  content?: string
  stage?: string
  error?: string
}
