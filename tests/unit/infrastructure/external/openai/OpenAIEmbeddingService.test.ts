import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIEmbeddingService } from '@infrastructure/external/openai/OpenAIEmbeddingService'

// Mock OpenAI client
function createMockOpenAI() {
    return {
        embeddings: {
            create: vi.fn(),
        },
    }
}

describe('OpenAIEmbeddingService', () => {
    let service: OpenAIEmbeddingService
    let mockOpenAI: ReturnType<typeof createMockOpenAI>

    beforeEach(() => {
        mockOpenAI = createMockOpenAI()
        service = new OpenAIEmbeddingService(mockOpenAI as never)
    })

    // ─────────────────────── generateEmbedding ───────────────────────
    describe('generateEmbedding', () => {
        it('should_return_embedding_vector_for_text', async () => {
            const fakeEmbedding = Array(1536).fill(0.01)
            mockOpenAI.embeddings.create.mockResolvedValue({
                data: [{ embedding: fakeEmbedding, index: 0 }],
                model: 'text-embedding-3-small',
                usage: { prompt_tokens: 10, total_tokens: 10 },
            })

            const result = await service.generateEmbedding('ROAS 최적화 방법')

            expect(result).toHaveLength(1536)
            expect(result).toEqual(fakeEmbedding)
            expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
                model: 'text-embedding-3-small',
                input: 'ROAS 최적화 방법',
            })
        })

        it('should_throw_on_empty_text', async () => {
            await expect(service.generateEmbedding('')).rejects.toThrow()
        })

        it('should_throw_on_whitespace_only_text', async () => {
            await expect(service.generateEmbedding('   ')).rejects.toThrow()
        })

        it('should_propagate_openai_api_error', async () => {
            mockOpenAI.embeddings.create.mockRejectedValue(
                new Error('API rate limit exceeded')
            )

            await expect(
                service.generateEmbedding('test')
            ).rejects.toThrow('API rate limit exceeded')
        })
    })

    // ─────────────────────── generateEmbeddings ───────────────────────
    describe('generateEmbeddings', () => {
        it('should_return_embeddings_for_multiple_texts', async () => {
            const fakeEmbeddings = [
                Array(1536).fill(0.01),
                Array(1536).fill(0.02),
                Array(1536).fill(0.03),
            ]
            mockOpenAI.embeddings.create.mockResolvedValue({
                data: fakeEmbeddings.map((emb, i) => ({ embedding: emb, index: i })),
                model: 'text-embedding-3-small',
                usage: { prompt_tokens: 30, total_tokens: 30 },
            })

            const texts = ['텍스트 1', '텍스트 2', '텍스트 3']
            const results = await service.generateEmbeddings(texts)

            expect(results).toHaveLength(3)
            expect(results[0]).toHaveLength(1536)
            expect(results[1]).toHaveLength(1536)
            expect(results[2]).toHaveLength(1536)
            expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
                model: 'text-embedding-3-small',
                input: texts,
            })
        })

        it('should_return_empty_array_for_empty_input', async () => {
            const results = await service.generateEmbeddings([])
            expect(results).toEqual([])
            expect(mockOpenAI.embeddings.create).not.toHaveBeenCalled()
        })

        it('should_filter_out_empty_texts', async () => {
            const fakeEmbedding = Array(1536).fill(0.01)
            mockOpenAI.embeddings.create.mockResolvedValue({
                data: [{ embedding: fakeEmbedding, index: 0 }],
                model: 'text-embedding-3-small',
                usage: { prompt_tokens: 5, total_tokens: 5 },
            })

            const results = await service.generateEmbeddings(['valid text', '', '   '])

            expect(results).toHaveLength(1)
            expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
                model: 'text-embedding-3-small',
                input: ['valid text'],
            })
        })

        it('should_preserve_order_matching_input_order', async () => {
            // OpenAI API can return embeddings out of order (by index)
            const emb1 = Array(1536).fill(0.1)
            const emb2 = Array(1536).fill(0.2)
            mockOpenAI.embeddings.create.mockResolvedValue({
                data: [
                    { embedding: emb2, index: 1 },
                    { embedding: emb1, index: 0 },
                ],
                model: 'text-embedding-3-small',
                usage: { prompt_tokens: 10, total_tokens: 10 },
            })

            const results = await service.generateEmbeddings(['first', 'second'])

            // Should be sorted by index to match input order
            expect(results[0]).toEqual(emb1)
            expect(results[1]).toEqual(emb2)
        })
    })
})
