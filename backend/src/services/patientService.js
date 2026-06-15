const prisma = require("../config/prisma");
const { generatePatientCode } = require("../utils/generatePatientCode");
const { createAuditLog } = require("./auditService");
const { createPatientTimelineEvent } = require("./patientTimelineService");
const {
  ensurePatientThread,
  postSystemMessage,
} = require("./communicationService");

async function createPatientPlaceholdersForIncident({
  incidentId,
  trackingCode,
  estimatedVictimCount,
}) {
  const createdPatients = [];

  for (let i = 1; i <= estimatedVictimCount; i += 1) {
    const patient = await prisma.patient.create({
      data: {
        incidentId,
        patientNumber: i,
        patientCode: generatePatientCode(trackingCode, i),
        isPlaceholder: true,
        status: "UNTRIAGED",
      },
    });

    await createPatientTimelineEvent({
      patientId: patient.id,
      eventType: "PATIENT_CREATED",
      eventLabel: `Patient ${i} created from public incident report`,
      eventStatus: "UNTRIAGED",
      isSystemGenerated: true,
    });

    const thread = await ensurePatientThread({
      patientId: patient.id,
    });

    await postSystemMessage({
      threadId: thread.id,
      body: `Patient ${patient.patientCode} was created from incident ${trackingCode}.`,
    });

    await createAuditLog({
      actionType: "PATIENT_ADDED",
      incidentId,
      patientId: patient.id,
      targetTable: "Patient",
      targetId: patient.id,
      newValue: {
        incidentId,
        patientNumber: patient.patientNumber,
        patientCode: patient.patientCode,
        status: patient.status,
        isPlaceholder: patient.isPlaceholder,
      },
      reason: "Auto-created from estimated victim count.",
    });

    createdPatients.push(patient);
  }

  return createdPatients;
}

async function addPatientToIncident({
  incidentId,
  actorUserId,
  actorRole,
  note = "Added by staff during incident review.",
}) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      patients: {
        where: {
          isExcluded: false,
        },
        orderBy: {
          patientNumber: "desc",
        },
      },
    },
  });

  if (!incident) {
    throw new Error("Incident not found.");
  }

  const nextPatientNumber =
    incident.patients.length > 0 ? incident.patients[0].patientNumber + 1 : 1;

  const patient = await prisma.patient.create({
    data: {
      incidentId,
      patientNumber: nextPatientNumber,
      patientCode: generatePatientCode(incident.trackingCode, nextPatientNumber),
      isPlaceholder: true,
      status: "UNTRIAGED",
    },
  });

  await createPatientTimelineEvent({
    patientId: patient.id,
    eventType: "PATIENT_CREATED",
    eventLabel: `Patient ${patient.patientCode} added to incident`,
    eventStatus: "UNTRIAGED",
    createdByUserId: actorUserId,
    note,
  });

  const thread = await ensurePatientThread({
    patientId: patient.id,
    createdByUserId: actorUserId,
  });

  await postSystemMessage({
    threadId: thread.id,
    body: `Patient ${patient.patientCode} was added to this incident.`,
  });

  await createAuditLog({
    actionType: "PATIENT_ADDED",
    actorUserId,
    actorRole,
    incidentId,
    patientId: patient.id,
    targetTable: "Patient",
    targetId: patient.id,
    newValue: {
      incidentId,
      patientNumber: patient.patientNumber,
      patientCode: patient.patientCode,
      status: patient.status,
    },
    reason: note,
  });

  return patient;
}

async function excludePatient({
  patientId,
  actorUserId,
  actorRole,
  exclusionReason,
  exclusionNote = null,
}) {
  const existing = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!existing) {
    throw new Error("Patient not found.");
  }

  if (existing.isExcluded) {
    throw new Error("Patient is already excluded.");
  }

  const updated = await prisma.patient.update({
    where: { id: patientId },
    data: {
      isExcluded: true,
      status: "EXCLUDED",
      exclusionReason,
      exclusionNote,
      excludedAt: new Date(),
      excludedByUserId: actorUserId,
    },
  });

  await createPatientTimelineEvent({
    patientId,
    eventType: "PATIENT_EXCLUDED",
    eventLabel: `Patient ${updated.patientCode} excluded from active workflow`,
    eventStatus: "EXCLUDED",
    createdByUserId: actorUserId,
    note: exclusionNote || exclusionReason,
  });

  const thread = await ensurePatientThread({
    patientId,
    createdByUserId: actorUserId,
  });

  await postSystemMessage({
    threadId: thread.id,
    body: `Patient ${updated.patientCode} was excluded. Reason: ${exclusionReason}.`,
  });

  await createAuditLog({
    actionType: "PATIENT_EXCLUDED",
    actorUserId,
    actorRole,
    incidentId: updated.incidentId,
    patientId,
    targetTable: "Patient",
    targetId: patientId,
    oldValue: {
      isExcluded: existing.isExcluded,
      status: existing.status,
    },
    newValue: {
      isExcluded: updated.isExcluded,
      status: updated.status,
      exclusionReason: updated.exclusionReason,
      exclusionNote: updated.exclusionNote,
    },
    reason: exclusionNote || exclusionReason,
  });

  return updated;
}

module.exports = {
  createPatientPlaceholdersForIncident,
  addPatientToIncident,
  excludePatient,
};