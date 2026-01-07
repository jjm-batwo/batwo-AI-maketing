-- CreateTable
CREATE TABLE "BudgetAlert" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "thresholdPercent" INTEGER NOT NULL DEFAULT 80,
    "alertedAt" TIMESTAMP(3),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetAlert_isEnabled_idx" ON "BudgetAlert"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAlert_campaignId_key" ON "BudgetAlert"("campaignId");

-- AddForeignKey
ALTER TABLE "BudgetAlert" ADD CONSTRAINT "BudgetAlert_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
