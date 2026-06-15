const prisma = require("../config/prisma");
const { createAuditLog } = require("./auditService");

async function createSystemAlert({
  alertType,
  severity,
  incidentId = null,
  patientId = null,
  resourceRequestId = null,
  resourceItemId = null,
  message,
  status = "OPEN",
}) {
  return prisma.systemAlert.create({
    data: {
      alertType,
      severity,
      incidentId,
      patientId,
      resourceRequestId,
      resourceItemId,
      message,
      status,
    },
  });
}

async function createUniqueOpenAlert({
  alertType,
  severity,
  incidentId = null,
  patientId = null,
  resourceRequestId = null,
  resourceItemId = null,
  message,
}) {
  const existing = await prisma.systemAlert.findFirst({
    where: {
      alertType,
      incidentId,
      patientId,
      resourceRequestId,
      resourceItemId,
      status: {
        in: ["OPEN", "ACTIVE", "PENDING"],
      },
    },
  });

  if (existing) {
    return existing;
  }

  return createSystemAlert({
    alertType,
    severity,
    incidentId,
    patientId,
    resourceRequestId,
    resourceItemId,
    message,
    status: "OPEN",
  });
}

async function resolveSystemAlert({
  alertId,
  resolvedByUserId,
  actorRole = null,
}) {
  const existing = await prisma.systemAlert.findUnique({
    where: { id: alertId },
  });

  if (!existing) {
    throw new Error("System alert not found.");
  }

  const updated = await prisma.systemAlert.update({
    where: { id: alertId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedByUserId,
    },
  });

  await createAuditLog({
    actionType: "RESOURCE_REQUEST_UPDATED",
    actorUserId: resolvedByUserId,
    actorRole,
    incidentId: updated.incidentId,
    patientId: updated.patientId,
    resourceRequestId: updated.resourceRequestId,
    resourceItemId: updated.resourceItemId,
    targetTable: "SystemAlert",
    targetId: updated.id,
    oldValue: {
      status: existing.status,
    },
    newValue: {
      status: updated.status,
      resolvedAt: updated.resolvedAt,
      resolvedByUserId: updated.resolvedByUserId,
    },
    reason: "System alert resolved.",
  });

  return updated;
}

async function getOpenAlerts(params = {}) {
  const {
    incidentId,
    patientId,
    resourceRequestId,
    resourceItemId,
    severity,
  } = params;

  return prisma.systemAlert.findMany({
    where: {
      status: {
        in: ["OPEN", "ACTIVE", "PENDING"],
      },
      ...(incidentId ? { incidentId } : {}),
      ...(patientId ? { patientId } : {}),
      ...(resourceRequestId ? { resourceRequestId } : {}),
      ...(resourceItemId ? { resourceItemId } : {}),
      ...(severity ? { severity } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

module.exports = {
  createSystemAlert,
  createUniqueOpenAlert,
  resolveSystemAlert,
  getOpenAlerts,
};