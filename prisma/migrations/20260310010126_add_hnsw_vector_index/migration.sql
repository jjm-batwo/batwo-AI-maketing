-- CreateIndex
-- HNSW 벡터 인덱스: knowledge_documents.embedding 컬럼에 대한
-- cosine distance 기반 근사 최근접 이웃 검색(ANN)을 가속합니다.
-- m=16 (그래프 연결 수), ef_construction=64 (빌드 시 탐색 폭)
-- 현재 ~100건 미만이지만, 문서 증가 시 full-scan 방지를 위해 선제 적용.
CREATE INDEX "knowledge_documents_embedding_idx"
ON "knowledge_documents"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
