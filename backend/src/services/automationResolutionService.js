const prisma = require("../config/prisma");

async function resolvePatientTriageDelayAlerts(patientId) {
  await prisma.systemAlert.updateMany({
    where: {
      patientId,
      alertType: "TRIAGE_DELAY",
      status: "OPEN",
    },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });
}

async function resolveResourceDelayAlerts(resourceRequestId) {
  await prisma.systemAlert.updateMany({
    where: {
      resourceRequestId,
      alertType: {
        in: ["RESOURCE_DELAY", "IMAGING_DELAY"],
      },
      status: "OPEN",
    },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });
}

module.exports = {
  resolvePatientTriageDelayAlerts,
  resolveResourceDelayAlerts,
};