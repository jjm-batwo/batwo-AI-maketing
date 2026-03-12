import { z } from 'zod'
import type {
  AgentTool,
  AgentContext,
  ToolExecutionResult,
} from '@application/ports/IConversationalAgent'
import type { IEmbeddingService } from '@application/ports/IEmbeddingService'
import type {
  IKnowledgeBaseRepository,
  KnowledgeSearchResult,
} from '@application/ports/IKnowledgeBaseRepository'

const paramsSchema = z.object({
  query: z.string().describe('검색할 마케팅 관련 질문 또는 키워드'),
  limit: z.number().min(1).max(10).default(5).describe('반환할 최대 문서 수'),
})

type Params = z.infer<typeof paramsSchema>

export function createSearchKnowledgeBaseTool(
  embeddingService: IEmbeddingService,
  knowledgeBaseRepository: IKnowledgeBaseRepository
): AgentTool<Params> {
  return {
    name: 'searchKnowledgeBase',
    description:
      '마케팅 지식 베이스에서 관련 문서를 검색합니다. Meta 광고 정책, ROAS 최적화 전략, 카피 작성 가이드, 예산 관리 팁 등 마케팅 전문 지식이 필요할 때 사용합니다. 사용자의 실시간 캠페인 데이터가 아닌, 일반적인 마케팅 지식/가이드/정책을 조회할 때 활용하세요.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, _context: AgentContext): Promise<ToolExecutionResult> {
      const { query, limit = 5 } = params
      const SIMILARITY_THRESHOLD = 0.7

      // 1. 쿼리를 임베딩 벡터로 변환
      const queryEmbedding = await embeddingService.generateEmbedding(query)

      // 2. 벡터 유사도 검색
      const results = await knowledgeBaseRepository.findSimilar(
        queryEmbedding,
        limit,
        SIMILARITY_THRESHOLD
      )

      // 3. 결과 포맷팅
      if (results.length === 0) {
        return {
          success: true,
          data: [],
          formattedMessage: `📚 "${query}"에 대한 관련 문서를 찾지 못했습니다. 다른 키워드로 검색해 보세요.`,
        }
      }

      const formattedResults = results
        .map((doc: KnowledgeSearchResult, i: number) => {
          const similarity = Math.round(doc.similarity * 100)
          return [
            `**${i + 1}. ${doc.title}** (유사도: ${similarity}%)`,
            `   출처: ${doc.source}`,
            `   ${doc.content}`,
          ].join('\n')
        })
        .join('\n\n')

      const formattedMessage = [
        `📚 "${query}" 관련 지식 검색 결과 (${results.length}건):`,
        '',
        formattedResults,
      ].join('\n')

      return {
        success: true,
        data: results,
        formattedMessage,
      }
    },
  }
}
