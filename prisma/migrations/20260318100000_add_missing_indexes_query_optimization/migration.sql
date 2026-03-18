-- Supabase Postgres Best Practices: Query Optimization Indexes
-- 규칙 적용: schema-foreign-key-indexes, query-missing-indexes, query-composite-indexes

-- 1. FK Index: Account.userId (CASCADE 삭제 + JOIN 최적화)
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");

-- 2. FK Index: Session.userId (CASCADE 삭제 + User JOIN 최적화)
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- 3. Missing Index: Ad.metaAdId (findByMetaAdId 쿼리 최적화)
CREATE INDEX IF NOT EXISTS "Ad_metaAdId_idx" ON "Ad"("metaAdId");

-- 4. Missing Index: MetaAdAccount.tokenExpiry (findExpiringBefore 크론 쿼리)
CREATE INDEX IF NOT EXISTS "MetaAdAccount_tokenExpiry_idx" ON "MetaAdAccount"("tokenExpiry");

-- 5. Composite Index: ConversionEvent(sentToMeta, createdAt) (CAPI 배치 크론 findUnsentEvents)
-- equality 컬럼(sentToMeta)을 먼저, range 컬럼(createdAt)을 뒤에 배치
CREATE INDEX IF NOT EXISTS "ConversionEvent_sentToMeta_createdAt_idx" ON "ConversionEvent"("sentToMeta", "createdAt");
