-- CreateTable
CREATE TABLE "AdKPISnapshot" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "linkClicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "revenue" DECIMAL(15,2) NOT NULL,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "frequency" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "cpm" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "cpc" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "videoViews" INTEGER NOT NULL DEFAULT 0,
    "thruPlays" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdKPISnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdKPISnapshot_adId_date_key" ON "AdKPISnapshot"("adId", "date");

-- CreateIndex
CREATE INDEX "AdKPISnapshot_adId_idx" ON "AdKPISnapshot"("adId");

-- CreateIndex
CREATE INDEX "AdKPISnapshot_adSetId_idx" ON "AdKPISnapshot"("adSetId");

-- CreateIndex
CREATE INDEX "AdKPISnapshot_campaignId_idx" ON "AdKPISnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "AdKPISnapshot_creativeId_idx" ON "AdKPISnapshot"("creativeId");

-- CreateIndex
CREATE INDEX "AdKPISnapshot_date_idx" ON "AdKPISnapshot"("date");

-- CreateIndex
CREATE INDEX "AdKPISnapshot_campaignId_date_idx" ON "AdKPISnapshot"("campaignId", "date");

-- CreateIndex
CREATE INDEX "AdKPISnapshot_creativeId_date_idx" ON "AdKPISnapshot"("creativeId", "date");

-- AddForeignKey
ALTER TABLE "AdKPISnapshot" ADD CONSTRAINT "AdKPISnapshot_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
