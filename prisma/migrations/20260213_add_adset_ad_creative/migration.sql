-- CreateEnum
CREATE TYPE "AdSetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'DELETED');

-- CreateEnum
CREATE TYPE "CreativeFormat" AS ENUM ('SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL');

-- CreateEnum
CREATE TYPE "BillingEvent" AS ENUM ('IMPRESSIONS', 'LINK_CLICKS');

-- CreateEnum
CREATE TYPE "OptimizationGoal" AS ENUM ('CONVERSIONS', 'LINK_CLICKS', 'IMPRESSIONS', 'REACH', 'LANDING_PAGE_VIEWS', 'VALUE');

-- CreateEnum
CREATE TYPE "BidStrategy" AS ENUM ('LOWEST_COST_WITHOUT_CAP', 'COST_CAP', 'LOWEST_COST_WITH_BID_CAP', 'LOWEST_COST_WITH_MIN_ROAS');

-- CreateEnum
CREATE TYPE "CTAType" AS ENUM ('LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'CONTACT_US', 'GET_OFFER', 'BOOK_NOW', 'APPLY_NOW');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable: Campaign 확장 (buyingType, advantageConfig)
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "buyingType" TEXT NOT NULL DEFAULT 'AUCTION';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "advantageConfig" JSONB;

-- CreateTable
CREATE TABLE "AdSet" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AdSetStatus" NOT NULL DEFAULT 'DRAFT',
    "dailyBudget" DECIMAL(15,2),
    "lifetimeBudget" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "billingEvent" "BillingEvent" NOT NULL DEFAULT 'IMPRESSIONS',
    "optimizationGoal" "OptimizationGoal" NOT NULL DEFAULT 'CONVERSIONS',
    "bidStrategy" "BidStrategy" NOT NULL DEFAULT 'LOWEST_COST_WITHOUT_CAP',
    "targeting" JSONB,
    "placements" JSONB,
    "schedule" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "metaAdSetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'DRAFT',
    "creativeId" TEXT NOT NULL,
    "metaAdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creative" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "CreativeFormat" NOT NULL DEFAULT 'SINGLE_IMAGE',
    "primaryText" TEXT,
    "headline" TEXT,
    "description" TEXT,
    "callToAction" "CTAType" NOT NULL DEFAULT 'LEARN_MORE',
    "linkUrl" TEXT,
    "assets" JSONB,
    "metaCreativeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "blobUrl" TEXT NOT NULL,
    "metaHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreativeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdSet_campaignId_idx" ON "AdSet"("campaignId");

-- CreateIndex
CREATE INDEX "AdSet_status_idx" ON "AdSet"("status");

-- CreateIndex
CREATE INDEX "Ad_adSetId_idx" ON "Ad"("adSetId");

-- CreateIndex
CREATE INDEX "Ad_creativeId_idx" ON "Ad"("creativeId");

-- CreateIndex
CREATE INDEX "Creative_userId_idx" ON "Creative"("userId");

-- CreateIndex
CREATE INDEX "CreativeAsset_userId_idx" ON "CreativeAsset"("userId");

-- AddForeignKey
ALTER TABLE "AdSet" ADD CONSTRAINT "AdSet_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "AdSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creative" ADD CONSTRAINT "Creative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeAsset" ADD CONSTRAINT "CreativeAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
