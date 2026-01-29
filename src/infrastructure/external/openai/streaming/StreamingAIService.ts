import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type {
  IStreamingAIService,
  StreamChunk,
  AdCopyStreamChunk,
} from '@application/ports/IStreamingAIService'
import type {
  AIConfig,
  GenerateAdCopyInput,
  AdCopyVariant,
} from '@application/ports/IAIService'
import {
  buildAdCopyPrompt,
  AD_COPY_SYSTEM_PROMPT,
  AD_COPY_AI_CONFIG,
} from '../prompts/adCopyGeneration'

/**
 * Vercel AI SDK 기반 스트리밍 AI 서비스
 * - streamText API를 활용한 실시간 스트리밍
 * - AsyncIterable을 통한 청크 단위 전송
 */
export class StreamingAIService implements IStreamingAIService {
  private readonly model: string

  constructor(model: string = 'gpt-4o-mini') {
    this.model = model
  }

  /**
   * 범용 채팅 스트리밍
   */
  async *streamChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config?: AIConfig
  ): AsyncIterable<StreamChunk> {
    try {
      // 초기 진행 상태 전송
      yield {
        type: 'progress',
        stage: 'analyzing',
        progress: 0,
      }

      // Vercel AI SDK streamText 호출
      const result = await streamText({
        model: openai(config?.model || this.model),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxTokens ?? 1500,
        topP: config?.topP,
      })

      // 생성 단계로 전환
      yield {
        type: 'progress',
        stage: 'generating',
        progress: 30,
      }

      // 스트림에서 텍스트 청크 추출
      for await (const chunk of result.textStream) {
        yield {
          type: 'text',
          content: chunk,
        }
      }

      // 완료
      yield {
        type: 'done',
        progress: 100,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'

      yield {
        type: 'error',
        error: errorMessage,
      }
    }
  }

  /**
   * 광고 카피 스트리밍 생성
   */
  async *streamAdCopy(
    input: GenerateAdCopyInput
  ): AsyncIterable<AdCopyStreamChunk> {
    try {
      // 초기 진행 상태
      yield {
        type: 'progress',
        stage: 'analyzing',
      }

      const userPrompt = buildAdCopyPrompt(input)
      const variantCount = input.variantCount ?? 3

      // Vercel AI SDK streamText 호출
      const result = await streamText({
        model: openai(AD_COPY_AI_CONFIG.model || this.model),
        system: AD_COPY_SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: AD_COPY_AI_CONFIG.temperature,
        maxOutputTokens: AD_COPY_AI_CONFIG.maxTokens,
        topP: AD_COPY_AI_CONFIG.topP,
      })

      // 생성 중
      yield {
        type: 'progress',
        stage: 'generating',
      }

      // 전체 응답을 수집한 후 파싱
      let fullResponse = ''
      for await (const chunk of result.textStream) {
        fullResponse += chunk
      }

      // JSON 파싱
      const cleanedResponse = this.cleanJsonResponse(fullResponse)
      const variants: AdCopyVariant[] = JSON.parse(cleanedResponse)

      // 각 변형을 필드별로 스트리밍
      for (let i = 0; i < variants.length && i < variantCount; i++) {
        const variant = variants[i]

        yield {
          type: 'variant',
          variantIndex: i,
          field: 'headline',
          content: variant.headline,
        }

        yield {
          type: 'variant',
          variantIndex: i,
          field: 'primaryText',
          content: variant.primaryText,
        }

        yield {
          type: 'variant',
          variantIndex: i,
          field: 'description',
          content: variant.description,
        }

        yield {
          type: 'variant',
          variantIndex: i,
          field: 'callToAction',
          content: variant.callToAction,
        }
      }

      // 완료
      yield {
        type: 'done',
        stage: 'complete',
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'

      yield {
        type: 'error',
        error: errorMessage,
      }
    }
  }

  /**
   * JSON 응답 정제 (코드블록 제거)
   */
  private cleanJsonResponse(response: string): string {
    // ```json ... ``` 제거
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    // 앞뒤 공백 제거
    cleaned = cleaned.trim()
    return cleaned
  }
}
