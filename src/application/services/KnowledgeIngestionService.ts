import type { IEmbeddingService } from '@application/ports/IEmbeddingService'
import type {
    IKnowledgeBaseRepository,
    KnowledgeDocumentDTO,
} from '@application/ports/IKnowledgeBaseRepository'

/**
 * 문서 적재 입력
 */
export interface IngestDocumentInput {
    title: string
    content: string
    source: string
    category?: string
    metadata?: Record<string, unknown>
}

/**
 * 문서 적재 결과
 */
export interface IngestResult {
    source: string
    chunksProcessed: number
    errors: string[]
}

/**
 * Knowledge Ingestion Service
 *
 * 마케팅 지식 문서를 청킹 → 임베딩 → DB 저장하는 파이프라인.
 * - Markdown/텍스트 문서를 문단 단위로 청킹
 * - 각 청크를 text-embedding-3-small로 임베딩
 * - pgvector DB에 벡터와 함께 저장
 */
export class KnowledgeIngestionService {
    constructor(
        private readonly embeddingService: IEmbeddingService,
        private readonly knowledgeBaseRepository: IKnowledgeBaseRepository
    ) { }

    /**
     * 텍스트를 문단 경계를 존중하여 청킹합니다.
     * @param text - 원본 텍스트
     * @param maxChunkLength - 청크 최대 문자 수 (기본 500)
     */
    chunkText(text: string, maxChunkLength: number = 500): string[] {
        const trimmed = text.trim()
        if (!trimmed) return []

        // Split by double newline (paragraph boundary)
        const paragraphs = trimmed
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0)

        if (paragraphs.length === 0) return []

        const chunks: string[] = []
        let currentChunk = ''

        for (const paragraph of paragraphs) {
            // If adding this paragraph would exceed limit, save current and start new
            if (currentChunk && currentChunk.length + paragraph.length + 2 > maxChunkLength) {
                chunks.push(currentChunk.trim())
                currentChunk = paragraph
            } else {
                currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph
            }
        }

        // Don't forget the last chunk
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim())
        }

        return chunks
    }

    /**
     * 단일 문서를 적재합니다.
     * 기존 같은 source의 문서는 삭제 후 재적재합니다.
     */
    async ingestDocument(input: IngestDocumentInput): Promise<IngestResult> {
        const result: IngestResult = {
            source: input.source,
            chunksProcessed: 0,
            errors: [],
        }

        try {
            // 1. 기존 문서 삭제 (같은 source)
            await this.knowledgeBaseRepository.deleteBySource(input.source)

            // 2. 텍스트 청킹
            const chunks = this.chunkText(input.content)

            if (chunks.length === 0) {
                result.errors.push('No content to ingest after chunking')
                return result
            }

            // 3. 배치 임베딩 생성
            const embeddings = await this.embeddingService.generateEmbeddings(chunks)

            // 4. DB 저장
            const documents: KnowledgeDocumentDTO[] = chunks.map((chunk, i) => ({
                title: `${input.title} (${i + 1}/${chunks.length})`,
                content: chunk,
                source: input.source,
                category: input.category,
                embedding: embeddings[i],
                metadata: input.metadata,
            }))

            await this.knowledgeBaseRepository.bulkInsert(documents)
            result.chunksProcessed = documents.length
        } catch (error) {
            result.errors.push(error instanceof Error ? error.message : String(error))
        }

        return result
    }

    /**
     * 여러 문서를 순차 적재합니다.
     * 하나의 문서 실패 시 나머지는 계속 처리합니다.
     */
    async ingestMultiple(inputs: IngestDocumentInput[]): Promise<IngestResult[]> {
        const results: IngestResult[] = []

        for (const input of inputs) {
            const result = await this.ingestDocument(input)
            results.push(result)
        }

        return results
    }
}
