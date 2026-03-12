/**
 * Knowledge Base Repository Port
 *
 * RAG(Retrieval-Augmented Generation)를 위한 벡터 검색 저장소 인터페이스.
 * pgvector 기반 유사도 검색을 추상화합니다.
 *
 * @note DI 미등록 의도적 — KnowledgeBaseService가 퍼사드로 내부 통합 관리
 */

export interface KnowledgeDocumentDTO {
  title: string
  content: string
  source: string
  category?: string
  embedding: number[]
  metadata?: Record<string, unknown>
}

export interface KnowledgeSearchResult {
  id: string
  title: string
  content: string
  source: string
  category?: string
  similarity: number
  metadata?: Record<string, unknown>
}

export interface IKnowledgeBaseRepository {
  /**
   * 임베딩 벡터로 유사한 문서를 검색합니다.
   * @param embedding - 쿼리 임베딩 벡터 (1536 dimensions)
   * @param limit - 반환할 최대 문서 수
   * @param similarityThreshold - 최소 유사도 (0~1, 기본 0.7)
   */
  findSimilar(
    embedding: number[],
    limit: number,
    similarityThreshold?: number
  ): Promise<KnowledgeSearchResult[]>

  /**
   * 단일 문서를 저장합니다.
   */
  insert(document: KnowledgeDocumentDTO): Promise<void>

  /**
   * 여러 문서를 일괄 저장합니다.
   */
  bulkInsert(documents: KnowledgeDocumentDTO[]): Promise<void>

  /**
   * 특정 소스의 모든 문서를 삭제합니다.
   */
  deleteBySource(source: string): Promise<void>
}
