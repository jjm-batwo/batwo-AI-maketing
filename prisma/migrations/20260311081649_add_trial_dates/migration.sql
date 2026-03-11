/*
  Warnings:

  - You are about to drop the `knowledge_documents` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "trialEndDate" TIMESTAMP(3),
ADD COLUMN     "trialStartedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "knowledge_documents";
