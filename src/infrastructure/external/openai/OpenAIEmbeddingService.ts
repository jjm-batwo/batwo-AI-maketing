import type { IEmbeddingService } from '@application/ports/IEmbeddingService'

/**
 * OpenAI Embeddings API 클라이언트 타입 (openai 패키지 직접 의존 없이)
 */
interface OpenAIEmbeddingsClient {
    embeddings: {
        create(params: {
            model: string
            input: string | string[]
        }): Promise<{
            data: Array<{ embedding: number[]; index: number }>
            model: string
            usage: { prompt_tokens: number; total_tokens: number }
        }>
    }
}

/**
 * OpenAI Embedding Service 구현체
 *
 * text-embedding-3-small 모델을 사용하여 텍스트를 1536차원 벡터로 변환합니다.
 * RAG 파이프라인에서 문서 임베딩 생성 및 쿼리 임베딩 생성에 사용됩니다.
 */
export class OpenAIEmbeddingService implements IEmbeddingService {
    private readonly model = 'text-embedding-3-small'

    constructor(private readonly openai: OpenAIEmbeddingsClient) { }

    async generateEmbedding(text: string): Promise<number[]> {
        const trimmed = text.trim()
        if (!trimmed) {
            throw new Error('Embedding text must not be empty')
        }

        const response = await this.openai.embeddings.create({
            model: this.model,
            input: trimmed,
        })

        return response.data[0].embedding
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const validTexts = texts.filter((t) => t.trim().length > 0)

        if (validTexts.length === 0) {
            return []
        }

        const response = await this.openai.embeddings.create({
            model: this.model,
            input: validTexts,
        })

        // Sort by index to ensure order matches input order
        const sorted = [...response.data].sort((a, b) => a.index - b.index)
        return sorted.map((item) => item.embedding)
    }
}
