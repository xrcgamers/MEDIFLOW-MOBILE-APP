/*
  Warnings:

  - You are about to drop the column `reportId` on the `AiPriorityAssessment` table. All the data in the column will be lost.
  - The `keyRiskFactors` column on the `AiPriorityAssessment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `fileName` on the `MediaAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `reportId` on the `MediaAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `ResourceItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ResourceItem` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `ResourceItem` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `StaffUser` table. All the data in the column will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReportStatusHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResourceActionLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffActionLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TriageAssessment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[incidentId]` on the table `AiPriorityAssessment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `incidentId` to the `AiPriorityAssessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `incidentId` to the `MediaAttachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `ResourceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastUpdatedAt` to the `ResourceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `StaffUser` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResourceRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PARTIALLY_ALLOCATED', 'RESERVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED', 'DELAYED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "AiPriorityAssessment" DROP CONSTRAINT "AiPriorityAssessment_reportId_fkey";

-- DropForeignKey
ALTER TABLE "MediaAttachment" DROP CONSTRAINT "MediaAttachment_reportId_fkey";

-- DropForeignKey
ALTER TABLE "ReportStatusHistory" DROP CONSTRAINT "ReportStatusHistory_reportId_fkey";

-- DropForeignKey
ALTER TABLE "ResourceActionLog" DROP CONSTRAINT "ResourceActionLog_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "ResourceActionLog" DROP CONSTRAINT "ResourceActionLog_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "StaffActionLog" DROP CONSTRAINT "StaffActionLog_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "StaffActionLog" DROP CONSTRAINT "StaffActionLog_reportId_fkey";

-- DropForeignKey
ALTER TABLE "TriageAssessment" DROP CONSTRAINT "TriageAssessment_reportId_fkey";

-- DropIndex
DROP INDEX "AiPriorityAssessment_confidence_idx";

-- DropIndex
DROP INDEX "AiPriorityAssessment_reportId_key";

-- AlterTable
ALTER TABLE "AiPriorityAssessment" DROP COLUMN "reportId",
ADD COLUMN     "incidentId" TEXT NOT NULL,
DROP COLUMN "keyRiskFactors",
ADD COLUMN     "keyRiskFactors" TEXT[];

-- AlterTable
ALTER TABLE "MediaAttachment" DROP COLUMN "fileName",
DROP COLUMN "reportId",
ADD COLUMN     "incidentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ResourceItem" DROP COLUMN "category",
DROP COLUMN "updatedAt",
DROP COLUMN "value",
ADD COLUMN     "availableQuantity" INTEGER,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "currentQuantity" INTEGER,
ADD COLUMN     "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "managedByRole" TEXT,
ADD COLUMN     "subType" TEXT,
ADD COLUMN     "unitOfMeasure" TEXT,
ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "StaffUser" DROP COLUMN "role",
ADD COLUMN     "roleId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Report";

-- DropTable
DROP TABLE "ReportStatusHistory";

-- DropTable
DROP TABLE "ResourceActionLog";

-- DropTable
DROP TABLE "StaffActionLog";

-- DropTable
DROP TABLE "TriageAssessment";

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "subIncidentType" TEXT,
    "otherIncidentType" TEXT,
    "resolvedIncidentType" TEXT,
    "autoLocationText" TEXT,
    "manualLocationText" TEXT,
    "resolvedLocationText" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "estimatedVictimCount" INTEGER NOT NULL DEFAULT 1,
    "phoneNumber" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "publicStatusNote" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedEmergencyNurseId" TEXT,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentStatusHistory" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "patientCode" TEXT NOT NULL,
    "fullName" TEXT,
    "sex" TEXT,
    "estimatedAge" INTEGER,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT true,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "exclusionReason" TEXT,
    "exclusionNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNTRIAGED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedTriageNurseId" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientTriage" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "unconscious" BOOLEAN NOT NULL DEFAULT false,
    "notBreathingNormally" BOOLEAN NOT NULL DEFAULT false,
    "severeBleeding" BOOLEAN NOT NULL DEFAULT false,
    "painScore" INTEGER,
    "multipleVictimsContext" BOOLEAN NOT NULL DEFAULT false,
    "triageScore" INTEGER NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "advisory" TEXT NOT NULL,
    "reasons" TEXT[],
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientTriage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientCareUpdate" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientCareUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientTimelineEvent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "eventLabel" TEXT NOT NULL,
    "eventStatus" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentQueuePriority" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "aiRankScore" DOUBLE PRECISION NOT NULL,
    "finalPriorityScore" DOUBLE PRECISION NOT NULL,
    "finalPriorityLevel" TEXT NOT NULL,
    "manualOverrideRank" INTEGER,
    "manualOverrideReason" TEXT,
    "manualOverrideByUserId" TEXT,
    "lastReorderedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentQueuePriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceRequest" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "resourceCategoryId" TEXT NOT NULL,
    "primaryResourceItemId" TEXT,
    "assignedSectionRole" TEXT NOT NULL,
    "priority" TEXT,
    "requestReason" TEXT NOT NULL,
    "requestStatus" "ResourceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "rejectionReason" TEXT,
    "requestedQuantity" INTEGER,
    "approvedQuantity" INTEGER,
    "fulfilledQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitOfMeasureSnapshot" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ResourceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAllocation" (
    "id" TEXT NOT NULL,
    "resourceRequestId" TEXT NOT NULL,
    "resourceItemId" TEXT NOT NULL,
    "allocationStatus" "AllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "allocatedByUserId" TEXT,
    "reservedQuantity" INTEGER,
    "unitOfMeasureSnapshot" TEXT,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "releaseReason" TEXT,

    CONSTRAINT "ResourceAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceStatusEvent" (
    "id" TEXT NOT NULL,
    "resourceItemId" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "relatedPatientId" TEXT,
    "changedByUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffLoginEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "staffId" TEXT,
    "wasSuccess" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffLoginEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "incidentId" TEXT,
    "patientId" TEXT,
    "resourceRequestId" TEXT,
    "resourceItemId" TEXT,
    "targetTable" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "incidentId" TEXT,
    "patientId" TEXT,
    "resourceRequestId" TEXT,
    "resourceItemId" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL,
    "thresholdMinutes" INTEGER,
    "thresholdQuantity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationThread" (
    "id" TEXT NOT NULL,
    "threadType" TEXT NOT NULL,
    "incidentId" TEXT,
    "patientId" TEXT,
    "resourceRequestId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationParticipant" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderRole" TEXT,
    "messageType" TEXT NOT NULL DEFAULT 'INFO',
    "body" TEXT NOT NULL,
    "isSystemGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Incident_trackingCode_key" ON "Incident"("trackingCode");

-- CreateIndex
CREATE INDEX "Incident_trackingCode_idx" ON "Incident"("trackingCode");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_createdAt_idx" ON "Incident"("createdAt");

-- CreateIndex
CREATE INDEX "IncidentStatusHistory_incidentId_idx" ON "IncidentStatusHistory"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentStatusHistory_createdAt_idx" ON "IncidentStatusHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patientCode_key" ON "Patient"("patientCode");

-- CreateIndex
CREATE INDEX "Patient_incidentId_idx" ON "Patient"("incidentId");

-- CreateIndex
CREATE INDEX "Patient_patientCode_idx" ON "Patient"("patientCode");

-- CreateIndex
CREATE INDEX "Patient_status_idx" ON "Patient"("status");

-- CreateIndex
CREATE INDEX "PatientTriage_patientId_idx" ON "PatientTriage"("patientId");

-- CreateIndex
CREATE INDEX "PatientTriage_incidentId_idx" ON "PatientTriage"("incidentId");

-- CreateIndex
CREATE INDEX "PatientTriage_urgencyLevel_idx" ON "PatientTriage"("urgencyLevel");

-- CreateIndex
CREATE INDEX "PatientTriage_createdAt_idx" ON "PatientTriage"("createdAt");

-- CreateIndex
CREATE INDEX "PatientCareUpdate_patientId_idx" ON "PatientCareUpdate"("patientId");

-- CreateIndex
CREATE INDEX "PatientCareUpdate_incidentId_idx" ON "PatientCareUpdate"("incidentId");

-- CreateIndex
CREATE INDEX "PatientCareUpdate_createdAt_idx" ON "PatientCareUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "PatientTimelineEvent_patientId_idx" ON "PatientTimelineEvent"("patientId");

-- CreateIndex
CREATE INDEX "PatientTimelineEvent_incidentId_idx" ON "PatientTimelineEvent"("incidentId");

-- CreateIndex
CREATE INDEX "PatientTimelineEvent_createdAt_idx" ON "PatientTimelineEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentQueuePriority_incidentId_key" ON "IncidentQueuePriority"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentQueuePriority_finalPriorityLevel_idx" ON "IncidentQueuePriority"("finalPriorityLevel");

-- CreateIndex
CREATE INDEX "IncidentQueuePriority_manualOverrideRank_idx" ON "IncidentQueuePriority"("manualOverrideRank");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_name_key" ON "ResourceCategory"("name");

-- CreateIndex
CREATE INDEX "ResourceRequest_incidentId_idx" ON "ResourceRequest"("incidentId");

-- CreateIndex
CREATE INDEX "ResourceRequest_patientId_idx" ON "ResourceRequest"("patientId");

-- CreateIndex
CREATE INDEX "ResourceRequest_resourceCategoryId_idx" ON "ResourceRequest"("resourceCategoryId");

-- CreateIndex
CREATE INDEX "ResourceRequest_primaryResourceItemId_idx" ON "ResourceRequest"("primaryResourceItemId");

-- CreateIndex
CREATE INDEX "ResourceRequest_assignedSectionRole_idx" ON "ResourceRequest"("assignedSectionRole");

-- CreateIndex
CREATE INDEX "ResourceRequest_requestStatus_idx" ON "ResourceRequest"("requestStatus");

-- CreateIndex
CREATE INDEX "ResourceRequest_requestedAt_idx" ON "ResourceRequest"("requestedAt");

-- CreateIndex
CREATE INDEX "ResourceAllocation_resourceRequestId_idx" ON "ResourceAllocation"("resourceRequestId");

-- CreateIndex
CREATE INDEX "ResourceAllocation_resourceItemId_idx" ON "ResourceAllocation"("resourceItemId");

-- CreateIndex
CREATE INDEX "ResourceAllocation_allocationStatus_idx" ON "ResourceAllocation"("allocationStatus");

-- CreateIndex
CREATE INDEX "ResourceStatusEvent_resourceItemId_idx" ON "ResourceStatusEvent"("resourceItemId");

-- CreateIndex
CREATE INDEX "ResourceStatusEvent_createdAt_idx" ON "ResourceStatusEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffRole_name_key" ON "StaffRole"("name");

-- CreateIndex
CREATE INDEX "StaffLoginEvent_userId_idx" ON "StaffLoginEvent"("userId");

-- CreateIndex
CREATE INDEX "StaffLoginEvent_createdAt_idx" ON "StaffLoginEvent"("createdAt");

-- CreateIndex
CREATE INDEX "StaffLoginEvent_wasSuccess_idx" ON "StaffLoginEvent"("wasSuccess");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_incidentId_idx" ON "AuditLog"("incidentId");

-- CreateIndex
CREATE INDEX "AuditLog_patientId_idx" ON "AuditLog"("patientId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceRequestId_idx" ON "AuditLog"("resourceRequestId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceItemId_idx" ON "AuditLog"("resourceItemId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SystemAlert_alertType_idx" ON "SystemAlert"("alertType");

-- CreateIndex
CREATE INDEX "SystemAlert_severity_idx" ON "SystemAlert"("severity");

-- CreateIndex
CREATE INDEX "SystemAlert_status_idx" ON "SystemAlert"("status");

-- CreateIndex
CREATE INDEX "SystemAlert_incidentId_idx" ON "SystemAlert"("incidentId");

-- CreateIndex
CREATE INDEX "SystemAlert_patientId_idx" ON "SystemAlert"("patientId");

-- CreateIndex
CREATE INDEX "SystemAlert_resourceRequestId_idx" ON "SystemAlert"("resourceRequestId");

-- CreateIndex
CREATE INDEX "SystemAlert_resourceItemId_idx" ON "SystemAlert"("resourceItemId");

-- CreateIndex
CREATE INDEX "SystemAlert_createdAt_idx" ON "SystemAlert"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationRule_ruleCode_key" ON "AutomationRule"("ruleCode");

-- CreateIndex
CREATE INDEX "CommunicationThread_incidentId_idx" ON "CommunicationThread"("incidentId");

-- CreateIndex
CREATE INDEX "CommunicationThread_patientId_idx" ON "CommunicationThread"("patientId");

-- CreateIndex
CREATE INDEX "CommunicationThread_resourceRequestId_idx" ON "CommunicationThread"("resourceRequestId");

-- CreateIndex
CREATE INDEX "CommunicationThread_threadType_idx" ON "CommunicationThread"("threadType");

-- CreateIndex
CREATE INDEX "CommunicationParticipant_threadId_idx" ON "CommunicationParticipant"("threadId");

-- CreateIndex
CREATE INDEX "CommunicationParticipant_userId_idx" ON "CommunicationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationParticipant_threadId_userId_key" ON "CommunicationParticipant"("threadId", "userId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_threadId_idx" ON "CommunicationMessage"("threadId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_createdAt_idx" ON "CommunicationMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiPriorityAssessment_incidentId_key" ON "AiPriorityAssessment"("incidentId");

-- CreateIndex
CREATE INDEX "MediaAttachment_incidentId_idx" ON "MediaAttachment"("incidentId");

-- CreateIndex
CREATE INDEX "ResourceItem_categoryId_idx" ON "ResourceItem"("categoryId");

-- CreateIndex
CREATE INDEX "ResourceItem_status_idx" ON "ResourceItem"("status");

-- CreateIndex
CREATE INDEX "ResourceItem_label_idx" ON "ResourceItem"("label");

-- CreateIndex
CREATE INDEX "ResourceItem_subType_idx" ON "ResourceItem"("subType");

-- CreateIndex
CREATE INDEX "StaffUser_roleId_idx" ON "StaffUser"("roleId");

-- CreateIndex
CREATE INDEX "StaffUser_isActive_idx" ON "StaffUser"("isActive");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedEmergencyNurseId_fkey" FOREIGN KEY ("assignedEmergencyNurseId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentStatusHistory" ADD CONSTRAINT "IncidentStatusHistory_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_assignedTriageNurseId_fkey" FOREIGN KEY ("assignedTriageNurseId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTriage" ADD CONSTRAINT "PatientTriage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTriage" ADD CONSTRAINT "PatientTriage_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTriage" ADD CONSTRAINT "PatientTriage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCareUpdate" ADD CONSTRAINT "PatientCareUpdate_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCareUpdate" ADD CONSTRAINT "PatientCareUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCareUpdate" ADD CONSTRAINT "PatientCareUpdate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTimelineEvent" ADD CONSTRAINT "PatientTimelineEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTimelineEvent" ADD CONSTRAINT "PatientTimelineEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPriorityAssessment" ADD CONSTRAINT "AiPriorityAssessment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentQueuePriority" ADD CONSTRAINT "IncidentQueuePriority_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentQueuePriority" ADD CONSTRAINT "IncidentQueuePriority_manualOverrideByUserId_fkey" FOREIGN KEY ("manualOverrideByUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceItem" ADD CONSTRAINT "ResourceItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ResourceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRequest" ADD CONSTRAINT "ResourceRequest_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRequest" ADD CONSTRAINT "ResourceRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRequest" ADD CONSTRAINT "ResourceRequest_resourceCategoryId_fkey" FOREIGN KEY ("resourceCategoryId") REFERENCES "ResourceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRequest" ADD CONSTRAINT "ResourceRequest_primaryResourceItemId_fkey" FOREIGN KEY ("primaryResourceItemId") REFERENCES "ResourceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_resourceRequestId_fkey" FOREIGN KEY ("resourceRequestId") REFERENCES "ResourceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_allocatedByUserId_fkey" FOREIGN KEY ("allocatedByUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceStatusEvent" ADD CONSTRAINT "ResourceStatusEvent_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceStatusEvent" ADD CONSTRAINT "ResourceStatusEvent_relatedPatientId_fkey" FOREIGN KEY ("relatedPatientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceStatusEvent" ADD CONSTRAINT "ResourceStatusEvent_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffUser" ADD CONSTRAINT "StaffUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "StaffRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLoginEvent" ADD CONSTRAINT "StaffLoginEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_resourceRequestId_fkey" FOREIGN KEY ("resourceRequestId") REFERENCES "ResourceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAlert" ADD CONSTRAINT "SystemAlert_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAlert" ADD CONSTRAINT "SystemAlert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAlert" ADD CONSTRAINT "SystemAlert_resourceRequestId_fkey" FOREIGN KEY ("resourceRequestId") REFERENCES "ResourceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAlert" ADD CONSTRAINT "SystemAlert_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAlert" ADD CONSTRAINT "SystemAlert_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationThread" ADD CONSTRAINT "CommunicationThread_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationThread" ADD CONSTRAINT "CommunicationThread_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationThread" ADD CONSTRAINT "CommunicationThread_resourceRequestId_fkey" FOREIGN KEY ("resourceRequestId") REFERENCES "ResourceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationParticipant" ADD CONSTRAINT "CommunicationParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CommunicationThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationParticipant" ADD CONSTRAINT "CommunicationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CommunicationThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
