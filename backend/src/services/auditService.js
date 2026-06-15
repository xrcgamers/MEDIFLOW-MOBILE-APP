const prisma = require("../config/prisma");

async function createAuditLog({
  actionType,
  actorUserId = null,
  actorRole = null,
  incidentId = null,
  patientId = null,
  resourceRequestId = null,
  resourceItemId = null,
  targetTable,
  targetId,
  oldValue = null,
  newValue = null,
  reason = null,
}) {
  return prisma.auditLog.create({
    data: {
      actionType,
      actorUserId,
      actorRole,
      incidentId,
      patientId,
      resourceRequestId,
      resourceItemId,
      targetTable,
      targetId,
      oldValue,
      newValue,
      reason,
    },
  });
}

module.exports = {
  createAuditLog,
};