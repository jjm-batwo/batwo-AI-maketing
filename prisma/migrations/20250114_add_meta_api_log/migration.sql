-- CreateTable
CREATE TABLE "MetaApiLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "errorMsg" TEXT,
    "latencyMs" INTEGER NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetaApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetaApiLog_createdAt_idx" ON "MetaApiLog"("createdAt");

-- CreateIndex
CREATE INDEX "MetaApiLog_success_idx" ON "MetaApiLog"("success");

-- CreateIndex
CREATE INDEX "MetaApiLog_accountId_idx" ON "MetaApiLog"("accountId");

-- CreateIndex
CREATE INDEX "MetaApiLog_createdAt_success_idx" ON "MetaApiLog"("createdAt", "success");
