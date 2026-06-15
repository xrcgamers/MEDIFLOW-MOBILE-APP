const prisma = require("../config/prisma");
const { createAuditLog } = require("./auditService");
const { createPatientTimelineEvent } = require("./patientTimelineService");
const {
  ensureResourceRequestThread,
  ensurePatientThread,
  addParticipantToThread,
  postSystemMessage,
} = require("./communicationService");

async function createResourceRequest({
  patientId,
  requestedByUserId,
  requestedByRole,
  resourceCategoryId,
  resourceItemId = null,
  assignedSectionRole,
  priority = null,
  requestReason,
}) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new Error("Patient not found.");
  }

  const category = await prisma.resourceCategory.findUnique({
    where: { id: resourceCategoryId },
  });

  if (!category) {
    throw new Error("Resource category not found.");
  }

  const request = await prisma.resourceRequest.create({
    data: {
      patientId,
      incidentId: patient.incidentId,
      resourceCategoryId,
      resourceItemId,
      requestedByUserId,
      assignedSectionRole,
      priority,
      requestReason,
      requestStatus: "REQUESTED",
    },
    include: {
      resourceCategory: true,
      resourceItem: true,
    },
  });

  const resourceThread = await ensureResourceRequestThread({
    resourceRequestId: request.id,
    createdByUserId: requestedByUserId,
  });

  const patientThread = await ensurePatientThread({
    patientId,
    createdByUserId: requestedByUserId,
  });

  await addParticipantToThread({
    threadId: resourceThread.id,
    userId: requestedByUserId,
    role: requestedByRole,
  });

  await addParticipantToThread({
    threadId: patientThread.id,
    userId: requestedByUserId,
    role: requestedByRole,
  });

  await postSystemMessage({
    threadId: resourceThread.id,
    body: `${request.resourceCategory.name} request created for patient.`,
  });

  await postSystemMessage({
    threadId: patientThread.id,
    body: `${request.resourceCategory.name} request created.`,
  });

  await createPatientTimelineEvent({
    patientId,
    eventType: "RESOURCE_REQUESTED",
    eventLabel: `${request.resourceCategory.name} requested`,
    eventStatus: request.requestStatus,
    relatedResourceRequestId: request.id,
    createdByUserId: requestedByUserId,
    note: requestReason,
  });

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      status: "WAITING_RESOURCE",
    },
  });

  await createAuditLog({
    actionType: "RESOURCE_REQUEST_CREATED",
    actorUserId: requestedByUserId,
    actorRole: requestedByRole,
    incidentId: patient.incidentId,
    patientId,
    resourceRequestId: request.id,
    targetTable: "ResourceRequest",
    targetId: request.id,
    newValue: {
      resourceCategoryId,
      resourceItemId,
      assignedSectionRole,
      priority,
      requestStatus: request.requestStatus,
      requestReason,
    },
    reason: requestReason,
  });

  return request;
}

async function updateResourceRequestStatus({
  requestId,
  actorUserId,
  actorRole,
  requestStatus,
  rejectionReason = null,
  resourceItemId = null,
}) {
  const existing = await prisma.resourceRequest.findUnique({
    where: { id: requestId },
    include: {
      resourceCategory: true,
    },
  });

  if (!existing) {
    throw new Error("Resource request not found.");
  }

  const updateData = {
    requestStatus,
    rejectionReason,
  };

  if (resourceItemId) {
    updateData.resourceItemId = resourceItemId;
  }

  if (requestStatus === "IN_PROGRESS") {
    updateData.startedAt = new Date();
  }

  if (requestStatus === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  if (requestStatus === "REJECTED") {
    updateData.rejectedAt = new Date();
  }

  const updated = await prisma.resourceRequest.update({
    where: { id: requestId },
    data: updateData,
    include: {
      resourceCategory: true,
      resourceItem: true,
    },
  });

  const resourceThread = await ensureResourceRequestThread({
    resourceRequestId: requestId,
    createdByUserId: actorUserId,
  });

  await addParticipantToThread({
    threadId: resourceThread.id,
    userId: actorUserId,
    role: actorRole,
  });

  await postSystemMessage({
    threadId: resourceThread.id,
    body: `${updated.resourceCategory.name} request status changed to ${updated.requestStatus}${rejectionReason ? `. Reason: ${rejectionReason}` : ""}.`,
  });

  await createPatientTimelineEvent({
    patientId: updated.patientId,
    eventType:
      updated.requestStatus === "COMPLETED"
        ? "RESOURCE_COMPLETED"
        : updated.requestStatus === "IN_PROGRESS"
        ? "RESOURCE_IN_PROGRESS"
        : updated.requestStatus === "APPROVED"
        ? "RESOURCE_APPROVED"
        : "RESOURCE_REQUESTED",
    eventLabel: `${updated.resourceCategory.name} ${updated.requestStatus.toLowerCase()}`,
    eventStatus: updated.requestStatus,
    relatedResourceRequestId: updated.id,
    createdByUserId: actorUserId,
    note: rejectionReason,
  });

  await createAuditLog({
    actionType:
      updated.requestStatus === "APPROVED"
        ? "RESOURCE_REQUEST_APPROVED"
        : updated.requestStatus === "REJECTED"
        ? "RESOURCE_REQUEST_REJECTED"
        : "RESOURCE_REQUEST_UPDATED",
    actorUserId,
    actorRole,
    incidentId: updated.incidentId,
    patientId: updated.patientId,
    resourceRequestId: updated.id,
    targetTable: "ResourceRequest",
    targetId: updated.id,
    oldValue: {
      requestStatus: existing.requestStatus,
      resourceItemId: existing.resourceItemId,
      rejectionReason: existing.rejectionReason,
    },
    newValue: {
      requestStatus: updated.requestStatus,
      resourceItemId: updated.resourceItemId,
      rejectionReason: updated.rejectionReason,
    },
    reason: rejectionReason || `Status changed to ${updated.requestStatus}`,
  });

  return updated;
}

module.exports = {
  createResourceRequest,
  updateResourceRequestStatus,
};