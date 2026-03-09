import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSearchKnowledgeBaseTool } from '@application/tools/queries/searchKnowledgeBase.tool'
import type { IEmbeddingService } from '@application/ports/IEmbeddingService'
import type { IKnowledgeBaseRepository, KnowledgeSearchResult } from '@application/ports/IKnowledgeBaseRepository'
import type { AgentContext } from '@application/ports/IConversationalAgent'

function createMockEmbeddingService(): IEmbeddingService {
    return {
        generateEmbedding: vi.fn().mockResolvedValue(Array(1536).fill(0.01)),
        generateEmbeddings: vi.fn().mockResolvedValue([]),
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

const mockContext: AgentContext = {
    userId: 'user-1',
    accessToken: null,
    adAccountId: null,
    conversationId: 'conv-1',
}

describe('searchKnowledgeBase.tool', () => {
    let mockEmbedding: IEmbeddingService
    let mockRepo: IKnowledgeBaseRepository

    beforeEach(() => {
        mockEmbedding = createMockEmbeddingService()
        mockRepo = createMockRepository()
    })

    it('should_have_correct_tool_metadata', () => {
        const tool = createSearchKnowledgeBaseTool(mockEmbedding, mockRepo)

        expect(tool.name).toBe('searchKnowledgeBase')
        expect(tool.requiresConfirmation).toBe(false)
        expect(tool.description).toContain('마케팅')
    })

    it('should_search_and_return_formatted_results', async () => {
        const mockResults: KnowledgeSearchResult[] = [
            {
                id: '1',
                title: 'ROAS 최적화 가이드',
                content: 'ROAS를 높이려면 타겟팅을 세분화하세요.',
                source: 'marketing_guide',
                similarity: 0.92,
            },
            {
                id: '2',
                title: '예산 관리 팁',
                content: '일 예산은 목표 CPA의 5배로 설정하세요.',
                source: 'budget_guide',
                similarity: 0.85,
            },
        ]
            ; (mockRepo.findSimilar as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults)

        const tool = createSearchKnowledgeBaseTool(mockEmbedding, mockRepo)
        const result = await tool.execute({ query: 'ROAS 높이는 방법' }, mockContext)

        expect(result.success).toBe(true)
        expect(result.formattedMessage).toContain('ROAS 최적화 가이드')
        expect(result.formattedMessage).toContain('92%')
        expect(mockEmbedding.generateEmbedding).toHaveBeenCalledWith('ROAS 높이는 방법')
        expect(mockRepo.findSimilar).toHaveBeenCalled()
    })

    it('should_return_no_results_message_when_empty', async () => {
        ; (mockRepo.findSimilar as ReturnType<typeof vi.fn>).mockResolvedValue([])

        const tool = createSearchKnowledgeBaseTool(mockEmbedding, mockRepo)
        const result = await tool.execute({ query: '관련 없는 질문' }, mockContext)

        expect(result.success).toBe(true)
        expect(result.formattedMessage).toContain('관련 문서를 찾지 못했습니다')
    })

    it('should_respect_limit_parameter', async () => {
        ; (mockRepo.findSimilar as ReturnType<typeof vi.fn>).mockResolvedValue([])

        const tool = createSearchKnowledgeBaseTool(mockEmbedding, mockRepo)
        await tool.execute({ query: 'test', limit: 3 }, mockContext)

        expect(mockRepo.findSimilar).toHaveBeenCalledWith(
            expect.any(Array),
            3,
            expect.any(Number)
        )
    })
})
