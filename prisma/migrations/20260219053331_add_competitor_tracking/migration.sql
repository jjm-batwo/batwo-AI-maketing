-- CreateTable
CREATE TABLE "CompetitorTracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "industry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetitorTracking_userId_idx" ON "CompetitorTracking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorTracking_userId_pageId_key" ON "CompetitorTracking"("userId", "pageId");

-- AddForeignKey
ALTER TABLE "CompetitorTracking" ADD CONSTRAINT "CompetitorTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
