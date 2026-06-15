const prisma = require("../config/prisma");
const { getPriorityWeight } = require("../utils/getPriorityWeight");
const { createAuditLog } = require("./auditService");

async function ensureIncidentQueuePriority(incidentId) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      aiAssessment: true,
    },
  });

  if (!incident) {
    throw new Error("Incident not found.");
  }

  const aiRankScore = incident.aiAssessment
    ? getPriorityWeight(incident.aiAssessment.priorityLevel) *
      (incident.aiAssessment.confidence / 100)
    : 25;

  return prisma.incidentQueuePriority.upsert({
    where: { incidentId },
    update: {
      aiRankScore,
      finalPriorityScore: aiRankScore,
      finalPriorityLevel: incident.aiAssessment?.priorityLevel || "LOW",
    },
    create: {
      incidentId,
      aiRankScore,
      finalPriorityScore: aiRankScore,
      finalPriorityLevel: incident.aiAssessment?.priorityLevel || "LOW",
    },
  });
}

async function manuallyOverrideIncidentQueue({
  incidentId,
  manualOverrideRank,
  manualOverrideReason,
  actorUserId,
  actorRole,
}) {
  const existing = await prisma.incidentQueuePriority.findUnique({
    where: { incidentId },
  });

  if (!existing) {
    throw new Error("Queue priority record not found.");
  }

  const updated = await prisma.incidentQueuePriority.update({
    where: { incidentId },
    data: {
      manualOverrideRank,
      manualOverrideReason,
      manualOverrideByUserId: actorUserId,
    },
  });

  await createAuditLog({
    actionType: "QUEUE_REORDERED",
    actorUserId,
    actorRole,
    incidentId,
    targetTable: "IncidentQueuePriority",
    targetId: updated.id,
    oldValue: {
      manualOverrideRank: existing.manualOverrideRank,
      manualOverrideReason: existing.manualOverrideReason,
    },
    newValue: {
      manualOverrideRank: updated.manualOverrideRank,
      manualOverrideReason: updated.manualOverrideReason,
    },
    reason: manualOverrideReason,
  });

  return updated;
}

module.exports = {
  ensureIncidentQueuePriority,
  manuallyOverrideIncidentQueue,
};