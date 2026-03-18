import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaKnowledgeBaseRepository } from '@infrastructure/database/repositories/PrismaKnowledgeBaseRepository'
import type { KnowledgeDocumentDTO } from '@application/ports/IKnowledgeBaseRepository'

function createMockPrisma() {
    return {
        $queryRawUnsafe: vi.fn(),
        $executeRawUnsafe: vi.fn(),
        knowledgeDocument: {
            deleteMany: vi.fn(),
        },
    } as unknown as import('@/generated/prisma').PrismaClient
}

describe('PrismaKnowledgeBaseRepository', () => {
    let repo: PrismaKnowledgeBaseRepository
    let mockPrisma: ReturnType<typeof createMockPrisma>

    beforeEach(() => {
        mockPrisma = createMockPrisma()
        repo = new PrismaKnowledgeBaseRepository(mockPrisma)
    })

    // ─────────────────────── insert ───────────────────────
    describe('insert', () => {
        it('should_save_a_knowledge_document_with_embedding', async () => {
            ; (mockPrisma.$executeRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue(1)

            const doc: KnowledgeDocumentDTO = {
                title: 'Meta 광고 정책 2026',
                content: 'Meta는 2023년부터 텍스트 20% 규칙을 폐지했습니다.',
                source: 'meta_policy_2026',
                category: 'policy',
                embedding: Array(1536).fill(0.01),
                metadata: { version: '2026-03' },
            }

            await repo.insert(doc)

            expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1)
            const callArgs = (mockPrisma.$executeRawUnsafe as ReturnType<typeof vi.fn>).mock.calls[0]
            expect(callArgs[0]).toContain('INSERT INTO')
            expect(callArgs[0]).toContain('knowledge_documents')
        })

        it('should_propagate_error_on_insert_failure', async () => {
            ; (mockPrisma.$executeRawUnsafe as ReturnType<typeof vi.fn>).mockRejectedValue(
                new Error('DB connection failed')
            )

            const doc: KnowledgeDocumentDTO = {
                title: 'Test',
                content: 'Test content',
                source: 'test',
                embedding: Array(1536).fill(0),
            }

            await expect(repo.insert(doc)).rejects.toThrow('DB connection failed')
        })
    })

    // ─────────────────────── bulkInsert ───────────────────────
    describe('bulkInsert', () => {
        it('should_insert_multiple_documents', async () => {
            ; (mockPrisma.$executeRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue(1)

            const docs: KnowledgeDocumentDTO[] = [
                {
                    title: 'Doc 1',
                    content: 'Content 1',
                    source: 'source_a',
                    embedding: Array(1536).fill(0.01),
                },
                {
                    title: 'Doc 2',
                    content: 'Content 2',
                    source: 'source_a',
                    embedding: Array(1536).fill(0.02),
                },
            ]

            await repo.bulkInsert(docs)

            // 배치 INSERT: 2개 문서를 단일 SQL로 삽입 (N+1 제거)
            expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1)
            const callArgs = (mockPrisma.$executeRawUnsafe as ReturnType<typeof vi.fn>).mock.calls[0]
            expect(callArgs[0]).toContain('INSERT INTO')
            expect(callArgs[0]).toContain('knowledge_documents')
        })

        it('should_handle_empty_array', async () => {
            await repo.bulkInsert([])
            expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled()
        })
    })

    // ─────────────────────── findSimilar ───────────────────────
    describe('findSimilar', () => {
        it('should_return_similar_documents_with_similarity_score', async () => {
            const mockResults = [
                {
                    id: 'doc-1',
                    title: 'ROAS 최적화 가이드',
                    content: 'ROAS를 높이려면...',
                    source: 'marketing_guide',
                    category: 'optimization',
                    similarity: 0.92,
                    metadata: null,
                },
                {
                    id: 'doc-2',
                    title: '캠페인 예산 배분',
                    content: '예산을 효율적으로...',
                    source: 'marketing_guide',
                    category: 'budget',
                    similarity: 0.85,
                    metadata: { tags: ['budget'] },
                },
            ]
                ; (mockPrisma.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults)

            const embedding = Array(1536).fill(0.05)
            const results = await repo.findSimilar(embedding, 5)

            expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1)
            const callArgs = (mockPrisma.$queryRawUnsafe as ReturnType<typeof vi.fn>).mock.calls[0]
            expect(callArgs[0]).toContain('1 - (embedding <=> ')
            expect(callArgs[0]).toContain('ORDER BY similarity DESC')

            expect(results).toHaveLength(2)
            expect(results[0].similarity).toBe(0.92)
            expect(results[0].title).toBe('ROAS 최적화 가이드')
        })

        it('should_apply_similarity_threshold_filter', async () => {
            ; (mockPrisma.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([])

            await repo.findSimilar(Array(1536).fill(0), 5, 0.8)

            const callArgs = (mockPrisma.$queryRawUnsafe as ReturnType<typeof vi.fn>).mock.calls[0]
            // SEC-04: threshold는 SQL 문자열이 아닌 파라미터 $3으로 전달
            expect(callArgs[0]).toContain('$3')
            expect(callArgs[3]).toBe(0.8)
        })

        it('should_use_default_threshold_of_0.7', async () => {
            ; (mockPrisma.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([])

            await repo.findSimilar(Array(1536).fill(0), 5)

            const callArgs = (mockPrisma.$queryRawUnsafe as ReturnType<typeof vi.fn>).mock.calls[0]
            // SEC-04: threshold는 파라미터 $3으로 전달 (기본값 0.7)
            expect(callArgs[0]).toContain('$3')
            expect(callArgs[3]).toBe(0.7)
        })

        it('should_return_empty_array_when_no_similar_documents', async () => {
            ; (mockPrisma.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([])

            const results = await repo.findSimilar(Array(1536).fill(0), 5)
            expect(results).toEqual([])
        })
    })

    // ─────────────────────── deleteBySource ───────────────────────
    describe('deleteBySource', () => {
        it('should_delete_all_documents_by_source', async () => {
            ; (mockPrisma.$executeRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue(5)

            await repo.deleteBySource('meta_policy_2026')

            expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
                'DELETE FROM knowledge_documents WHERE source = $1',
                'meta_policy_2026'
            )
        })

        it('should_not_throw_when_no_documents_found', async () => {
            ; (mockPrisma.$executeRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue(0)

            await expect(repo.deleteBySource('nonexistent')).resolves.not.toThrow()
        })
    })
})
