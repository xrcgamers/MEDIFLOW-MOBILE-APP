const prisma = require("../config/prisma");
const { createAuditLog } = require("./auditService");
const { createPatientTimelineEvent } = require("./patientTimelineService");
const {
  ensurePatientThread,
  addParticipantToThread,
  postSystemMessage,
} = require("./communicationService");

function computeTriage({ unconscious, notBreathingNormally, severeBleeding, multipleVictimsContext, painScore }) {
  let score = 0;
  const reasons = [];

  if (unconscious) {
    score += 30;
    reasons.push("Patient unconscious");
  }

  if (notBreathingNormally) {
    score += 30;
    reasons.push("Abnormal breathing");
  }

  if (severeBleeding) {
    score += 25;
    reasons.push("Severe bleeding");
  }

  if (multipleVictimsContext) {
    score += 5;
    reasons.push("Multiple casualty context");
  }

  if (painScore !== null && painScore !== undefined) {
    const normalized = Math.max(0, Math.min(Number(painScore), 10));
    score += normalized * 2;
    reasons.push(`Pain score ${normalized}/10`);
  }

  let urgencyLevel = "LOW";
  let advisory = "Monitor and continue routine review.";

  if (score >= 70) {
    urgencyLevel = "CRITICAL";
    advisory = "Immediate stabilization and urgent escalation required.";
  } else if (score >= 45) {
    urgencyLevel = "HIGH";
    advisory = "Rapid clinical attention required.";
  } else if (score >= 20) {
    urgencyLevel = "MODERATE";
    advisory = "Prompt review recommended.";
  }

  return {
    urgencyLevel,
    triageScore: score,
    advisory,
    reasons,
  };
}

async function createPatientTriage({
  patientId,
  performedByUserId,
  performedByRole,
  payload,
}) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new Error("Patient not found.");
  }

  const triageResult = computeTriage(payload);

  const triage = await prisma.patientTriage.create({
    data: {
      patientId,
      unconscious: !!payload.unconscious,
      notBreathingNormally: !!payload.notBreathingNormally,
      severeBleeding: !!payload.severeBleeding,
      multipleVictimsContext: !!payload.multipleVictimsContext,
      painScore:
        payload.painScore === null || payload.painScore === undefined || payload.painScore === ""
          ? null
          : Number(payload.painScore),
      urgencyLevel: triageResult.urgencyLevel,
      triageScore: triageResult.triageScore,
      advisory: triageResult.advisory,
      reasons: triageResult.reasons,
      performedByUserId,
    },
  });

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      status: "TRIAGED",
      consciousnessState: payload.unconscious ? "Unconscious" : "Conscious/Unknown",
      breathingState: payload.notBreathingNormally ? "Abnormal" : "Normal/Unknown",
      bleedingState: payload.severeBleeding ? "Severe" : "None/Mild/Unknown",
      currentConditionSummary: triageResult.advisory,
    },
  });

  await createPatientTimelineEvent({
    patientId,
    eventType: "TRIAGE_COMPLETED",
    eventLabel: `Triage completed`,
    eventStatus: triageResult.urgencyLevel,
    createdByUserId: performedByUserId,
    note: triageResult.advisory,
  });

  const thread = await ensurePatientThread({
    patientId,
    createdByUserId: performedByUserId,
  });

  await addParticipantToThread({
    threadId: thread.id,
    userId: performedByUserId,
    role: performedByRole,
  });

  await postSystemMessage({
    threadId: thread.id,
    body: `Triage completed. Urgency: ${triageResult.urgencyLevel}.`,
  });

  await createAuditLog({
    actionType: "TRIAGE_CREATED",
    actorUserId: performedByUserId,
    actorRole: performedByRole,
    incidentId: patient.incidentId,
    patientId,
    targetTable: "PatientTriage",
    targetId: triage.id,
    newValue: {
      urgencyLevel: triage.urgencyLevel,
      triageScore: triage.triageScore,
      reasons: triage.reasons,
    },
    reason: triage.advisory,
  });

  return triage;
}

module.exports = {
  computeTriage,
  createPatientTriage,
};