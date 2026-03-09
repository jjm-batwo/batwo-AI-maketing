import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KnowledgeIngestionService } from '@application/services/KnowledgeIngestionService'
import type { IEmbeddingService } from '@application/ports/IEmbeddingService'
import type { IKnowledgeBaseRepository } from '@application/ports/IKnowledgeBaseRepository'

function createMockEmbeddingService(): IEmbeddingService {
    return {
        generateEmbedding: vi.fn().mockResolvedValue(Array(1536).fill(0.01)),
        generateEmbeddings: vi.fn().mockImplementation((texts: string[]) =>
            Promise.resolve(texts.map(() => Array(1536).fill(0.01)))
        ),
    }
}

function createMockRepository(): IKnowledgeBaseRepository {
    return {
        findSimilar: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockResolvedValue(undefined),
        bulkInsert: vi.fn().mockResolvedValue(undefined),
        deleteBySource: vi.fn().mockResolvedValue(undefined),
    }
}

describe('KnowledgeIngestionService', () => {
    let service: KnowledgeIngestionService
    let mockEmbedding: IEmbeddingService
    let mockRepo: IKnowledgeBaseRepository

    beforeEach(() => {
        mockEmbedding = createMockEmbeddingService()
        mockRepo = createMockRepository()
        service = new KnowledgeIngestionService(mockEmbedding, mockRepo)
    })

    // ─────────────────────── chunkText ───────────────────────
    describe('chunkText', () => {
        it('should_split_text_by_paragraph_boundaries', () => {
            const text = [
                '# ROAS 최적화 가이드',
                '',
                '첫 번째 문단입니다. 이 문단은 ROAS에 대해 설명합니다.',
                '',
                '두 번째 문단입니다. 이 문단은 CPA에 대해 설명합니다.',
                '',
                '세 번째 문단입니다. 이 문단은 CTR에 대해 설명합니다.',
            ].join('\n')

            const chunks = service.chunkText(text, 100)

            expect(chunks.length).toBeGreaterThanOrEqual(2)
            // Each chunk should be non-empty
            chunks.forEach((chunk) => {
                expect(chunk.trim().length).toBeGreaterThan(0)
            })
        })

        it('should_return_single_chunk_for_short_text', () => {
            const text = '짧은 텍스트입니다.'
            const chunks = service.chunkText(text, 500)

            expect(chunks).toHaveLength(1)
            expect(chunks[0]).toBe('짧은 텍스트입니다.')
        })

        it('should_handle_empty_text', () => {
            const chunks = service.chunkText('', 500)
            expect(chunks).toHaveLength(0)
        })
    })

    // ─────────────────────── ingestDocument ───────────────────────
    describe('ingestDocument', () => {
        it('should_chunk_embed_and_store_a_document', async () => {
            const result = await service.ingestDocument({
                title: 'Meta 광고 정책',
                content: '첫 번째 문단.\n\n두 번째 문단.\n\n세 번째 문단.',
                source: 'meta_policy',
                category: 'policy',
            })

            expect(result.chunksProcessed).toBeGreaterThan(0)
            expect(result.errors).toHaveLength(0)
            expect(mockEmbedding.generateEmbeddings).toHaveBeenCalled()
            expect(mockRepo.bulkInsert).toHaveBeenCalled()
        })

        it('should_delete_existing_documents_from_same_source_before_ingesting', async () => {
            await service.ingestDocument({
                title: 'Updated Guide',
                content: 'New content here.',
                source: 'guide_v2',
            })

            expect(mockRepo.deleteBySource).toHaveBeenCalledWith('guide_v2')
        })

        it('should_report_partial_failures', async () => {
            ; (mockEmbedding.generateEmbeddings as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                new Error('Rate limit')
            )

            const result = await service.ingestDocument({
                title: 'Test',
                content: 'Some content to ingest.',
                source: 'test_source',
            })

            expect(result.errors.length).toBeGreaterThan(0)
        })
    })

    // ─────────────────────── ingestMultiple ───────────────────────
    describe('ingestMultiple', () => {
        it('should_process_multiple_documents', async () => {
            const docs = [
                { title: 'Doc 1', content: 'Content 1', source: 'src_1' },
                { title: 'Doc 2', content: 'Content 2', source: 'src_2' },
            ]

            const results = await service.ingestMultiple(docs)

            expect(results).toHaveLength(2)
            expect(mockRepo.deleteBySource).toHaveBeenCalledTimes(2)
        })

        it('should_continue_processing_even_if_one_document_fails', async () => {
            ; (mockRepo.deleteBySource as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('DB error'))

            const docs = [
                { title: 'Doc 1', content: 'Content 1', source: 'src_1' },
                { title: 'Doc 2', content: 'Content 2', source: 'src_2' },
            ]

            // Should not throw, even if one doc fails
            const results = await service.ingestMultiple(docs)
            expect(results).toHaveLength(2)
        })
    })
})
