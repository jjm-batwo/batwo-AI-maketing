-- CreateTable
CREATE TABLE "InsightHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsightHistory_userId_createdAt_idx" ON "InsightHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InsightHistory_campaignId_idx" ON "InsightHistory"("campaignId");

-- CreateIndex
CREATE INDEX "InsightHistory_createdAt_idx" ON "InsightHistory"("createdAt");
