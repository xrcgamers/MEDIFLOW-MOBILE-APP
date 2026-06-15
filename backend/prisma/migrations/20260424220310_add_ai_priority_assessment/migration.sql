-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "resolvedIncidentType" DROP NOT NULL,
ALTER COLUMN "resolvedLocationText" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Received',
ALTER COLUMN "source" SET DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "AiPriorityAssessment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "priorityLevel" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "keyRiskFactors" JSONB NOT NULL,
    "recommendedNextAction" TEXT NOT NULL,
    "handoverSummary" TEXT NOT NULL,
    "analysisBasis" TEXT NOT NULL,
    "imageUsed" BOOLEAN NOT NULL DEFAULT false,
    "rawModelOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPriorityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiPriorityAssessment_reportId_key" ON "AiPriorityAssessment"("reportId");

-- CreateIndex
CREATE INDEX "AiPriorityAssessment_priorityLevel_idx" ON "AiPriorityAssessment"("priorityLevel");

-- CreateIndex
CREATE INDEX "AiPriorityAssessment_confidence_idx" ON "AiPriorityAssessment"("confidence");

-- AddForeignKey
ALTER TABLE "AiPriorityAssessment" ADD CONSTRAINT "AiPriorityAssessment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
