/**
 * Embedding Service Port
 *
 * 텍스트를 벡터 임베딩으로 변환하는 서비스 인터페이스.
 * RAG 검색에서 쿼리와 문서를 벡터로 변환하는 데 사용됩니다.
 *
 * @note DI 미등록 의도적 — KnowledgeBaseService가 퍼사드로 내부 통합 관리
 */

export interface IEmbeddingService {
    /**
     * 단일 텍스트를 임베딩 벡터로 변환합니다.
     * @param text - 변환할 텍스트
     * @returns 1536차원 벡터
     */
    generateEmbedding(text: string): Promise<number[]>

    /**
     * 여러 텍스트를 배치로 임베딩 벡터로 변환합니다.
     * @param texts - 변환할 텍스트 배열
     * @returns 각 텍스트에 대응하는 1536차원 벡터 배열
     */
    generateEmbeddings(texts: string[]): Promise<number[][]>
}
