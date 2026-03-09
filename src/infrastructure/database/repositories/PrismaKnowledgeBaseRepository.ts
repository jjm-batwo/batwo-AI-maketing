import type { PrismaClient } from '@/generated/prisma'
import type {
    IKnowledgeBaseRepository,
    KnowledgeDocumentDTO,
    KnowledgeSearchResult,
} from '@application/ports/IKnowledgeBaseRepository'

/**
 * pgvector 기반 Knowledge Base Repository 구현체.
 *
 * Prisma가 pgvector를 네이티브 지원하지 않으므로
 * $queryRawUnsafe / $executeRawUnsafe를 사용합니다.
 * 벡터 연산은 cosine distance (<=>)를 사용합니다.
 */
export class PrismaKnowledgeBaseRepository implements IKnowledgeBaseRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findSimilar(
        embedding: number[],
        limit: number,
        similarityThreshold: number = 0.7
    ): Promise<KnowledgeSearchResult[]> {
        const vectorString = `[${embedding.join(',')}]`

        const results = await this.prisma.$queryRawUnsafe<KnowledgeSearchResult[]>(
            `SELECT
        id,
        title,
        content,
        source,
        metadata,
        1 - (embedding <=> $1::vector) AS similarity
      FROM knowledge_documents
      WHERE 1 - (embedding <=> $1::vector) >= ${similarityThreshold}
      ORDER BY similarity DESC
      LIMIT $2`,
            vectorString,
            limit
        )

        return results
    }

    async insert(document: KnowledgeDocumentDTO): Promise<void> {
        const vectorString = `[${document.embedding.join(',')}]`

        await this.prisma.$executeRawUnsafe(
            `INSERT INTO knowledge_documents (id, source, title, content, embedding, metadata, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, $5::jsonb, NOW(), NOW())`,
            document.source,
            document.title,
            document.content,
            vectorString,
            document.metadata ? JSON.stringify(document.metadata) : null
        )
    }

    async bulkInsert(documents: KnowledgeDocumentDTO[]): Promise<void> {
        for (const doc of documents) {
            await this.insert(doc)
        }
    }

    async deleteBySource(source: string): Promise<void> {
        await this.prisma.knowledgeDocument.deleteMany({
            where: { source },
        })
    }
}
