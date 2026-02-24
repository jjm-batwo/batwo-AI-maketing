-- AlterEnum
ALTER TYPE "EcommercePlatform" ADD VALUE 'NAVER_SMARTSTORE';

-- CreateTable
CREATE TABLE "optimization_rules" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "trigger_count" INTEGER NOT NULL DEFAULT 0,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "optimization_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_logs" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_params" JSONB,
    "before_metrics" JSONB,
    "estimated_savings" DOUBLE PRECISION,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "optimization_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "optimization_rules_campaign_id_idx" ON "optimization_rules"("campaign_id");

-- CreateIndex
CREATE INDEX "optimization_rules_user_id_idx" ON "optimization_rules"("user_id");

-- CreateIndex
CREATE INDEX "optimization_rules_is_enabled_idx" ON "optimization_rules"("is_enabled");

-- CreateIndex
CREATE INDEX "optimization_logs_rule_id_idx" ON "optimization_logs"("rule_id");

-- CreateIndex
CREATE INDEX "optimization_logs_campaign_id_idx" ON "optimization_logs"("campaign_id");

-- AddForeignKey
ALTER TABLE "optimization_rules" ADD CONSTRAINT "optimization_rules_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_rules" ADD CONSTRAINT "optimization_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_logs" ADD CONSTRAINT "optimization_logs_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "optimization_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_logs" ADD CONSTRAINT "optimization_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
