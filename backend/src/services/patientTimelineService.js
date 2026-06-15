const prisma = require("../config/prisma");

async function createPatientTimelineEvent({
  patientId,
  eventType,
  eventLabel,
  eventStatus = null,
  relatedResourceRequestId = null,
  createdByUserId = null,
  isSystemGenerated = false,
  note = null,
}) {
  return prisma.patientTimelineEvent.create({
    data: {
      patientId,
      eventType,
      eventLabel,
      eventStatus,
      relatedResourceRequestId,
      createdByUserId,
      isSystemGenerated,
      note,
    },
  });
}

module.exports = {
  createPatientTimelineEvent,
};