const prisma = require("../config/prisma");

function minutesBetween(dateA, dateB = new Date()) {
  return Math.floor((dateB.getTime() - new Date(dateA).getTime()) / 60000);
}

function relationWhere({
  incidentId = null,
  patientId = null,
  resourceRequestId = null,
  resourceItemId = null,
}) {
  return {
    ...(incidentId ? { incident: { id: incidentId } } : {}),
    ...(patientId ? { patient: { id: patientId } } : {}),
    ...(resourceRequestId ? { resourceRequest: { id: resourceRequestId } } : {}),
    ...(resourceItemId ? { resourceItem: { id: resourceItemId } } : {}),
  };
}

function relationCreate({
  incidentId = null,
  patientId = null,
  resourceRequestId = null,
  resourceItemId = null,
}) {
  return {
    ...(incidentId ? { incident: { connect: { id: incidentId } } } : {}),
    ...(patientId ? { patient: { connect: { id: patientId } } } : {}),
    ...(resourceRequestId
      ? { resourceRequest: { connect: { id: resourceRequestId } } }
      : {}),
    ...(resourceItemId ? { resourceItem: { connect: { id: resourceItemId } } } : {}),
  };
}

async function createAlertIfMissing({
  alertType,
  severity,
  message,
  incidentId = null,
  patientId = null,
  resourceRequestId = null,
  resourceItemId = null,
  metadata = null,
}) {
  const existing = await prisma.systemAlert.findFirst({
    where: {
      alertType,
      status: "OPEN",
      ...relationWhere({
        incidentId,
        patientId,
        resourceRequestId,
        resourceItemId,
      }),
    },
  });

  if (existing) return existing;

  return prisma.systemAlert.create({
  data: {
    alertType,
    severity,
    message,
    status: "OPEN",
    ...relationCreate({
      incidentId,
      patientId,
      resourceRequestId,
      resourceItemId,
    }),
  },
});
}

function buildIncidentContextLabel(incident) {
  if (!incident) return "Unknown incident context";

  if (incident.subIncidentType) {
    return `${incident.incidentType || "Incident"} / ${incident.subIncidentType}`;
  }

  return incident.incidentType || "Unknown incident type";
}

async function monitorLowBloodStock() {
  const rule = await prisma.automationRule.findUnique({
    where: { ruleCode: "LOW_BLOOD_STOCK" },
  });

  if (!rule?.isActive) return [];

  const lowItems = await prisma.resourceItem.findMany({
    where: {
      category: { name: "BLOOD" },
      availableQuantity: {
        lte: rule.thresholdQuantity ?? 5,
      },
    },
    include: {
      category: true,
    },
  });

  const results = [];

  for (const item of lowItems) {
    const alert = await createAlertIfMissing({
      alertType: "LOW_BLOOD_STOCK",
      severity: rule.severity,
      resourceItemId: item.id,
      message: `Blood stock is low for ${item.subType || item.label}. Available: ${
        item.availableQuantity ?? 0
      } ${item.unitOfMeasure || ""}. Location: ${item.location || "Unknown"}.`,
      metadata: {
        category: item.category?.name || "BLOOD",
        subType: item.subType || null,
        availableQuantity: item.availableQuantity,
        thresholdQuantity: rule.thresholdQuantity ?? 5,
        unitOfMeasure: item.unitOfMeasure || null,
      },
    });

    results.push(alert);
  }

  return results;
}

async function monitorTriageDelays() {
  const rule = await prisma.automationRule.findUnique({
    where: { ruleCode: "TRIAGE_DELAY" },
  });

  if (!rule?.isActive) return [];

  const patients = await prisma.patient.findMany({
    where: {
      isExcluded: false,
      status: "UNTRIAGED",
    },
    include: {
      incident: true,
    },
  });

  const results = [];

  for (const patient of patients) {
    const waitMinutes = minutesBetween(patient.createdAt);

    if (waitMinutes >= (rule.thresholdMinutes ?? 10)) {
      const alert = await createAlertIfMissing({
        alertType: "TRIAGE_DELAY",
        severity: rule.severity,
        incidentId: patient.incidentId,
        patientId: patient.id,
        message: `Triage delay for patient ${patient.patientCode}. Waiting ${waitMinutes} minutes. Incident context: ${buildIncidentContextLabel(
          patient.incident
        )}.`,
        metadata: {
          patientCode: patient.patientCode,
          waitMinutes,
          thresholdMinutes: rule.thresholdMinutes ?? 10,
          incidentType: patient.incident?.incidentType || null,
          subIncidentType: patient.incident?.subIncidentType || null,
        },
      });

      results.push(alert);
    }
  }

  return results;
}

async function monitorResourceDelays() {
  const rule = await prisma.automationRule.findUnique({
    where: { ruleCode: "RESOURCE_DELAY" },
  });

  if (!rule?.isActive) return [];

  const requests = await prisma.resourceRequest.findMany({
    where: {
      requestStatus: {
        in: [
          "REQUESTED",
          "APPROVED",
          "PARTIALLY_ALLOCATED",
          "RESERVED",
          "IN_PROGRESS",
          "DELAYED",
        ],
      },
      resourceCategory: {
        name: {
          in: ["BLOOD", "BED", "THEATRE"],
        },
      },
    },
    include: {
      incident: true,
      patient: true,
      resourceCategory: true,
      allocations: {
        include: {
          resourceItem: true,
        },
      },
    },
  });

  const results = [];

  for (const request of requests) {
    const waitMinutes = minutesBetween(request.requestedAt);

    if (waitMinutes >= (rule.thresholdMinutes ?? 20)) {
      const alert = await createAlertIfMissing({
        alertType: "RESOURCE_DELAY",
        severity: rule.severity,
        incidentId: request.incidentId,
        patientId: request.patientId,
        resourceRequestId: request.id,
        message: `Resource delay for ${
          request.resourceCategory?.name || "RESOURCE"
        } request on patient ${
          request.patient?.patientCode || "Unknown"
        }. Requested: ${request.requestedQuantity ?? 0} ${
          request.unitOfMeasureSnapshot || ""
        }, fulfilled: ${request.fulfilledQuantity ?? 0} ${
          request.unitOfMeasureSnapshot || ""
        }, waiting ${waitMinutes} minutes. Incident context: ${buildIncidentContextLabel(
          request.incident
        )}.`,
        metadata: {
          category: request.resourceCategory?.name || null,
          requestStatus: request.requestStatus,
          requestedQuantity: request.requestedQuantity,
          approvedQuantity: request.approvedQuantity,
          fulfilledQuantity: request.fulfilledQuantity,
          allocationCount: request.allocations?.length || 0,
          waitMinutes,
          thresholdMinutes: rule.thresholdMinutes ?? 20,
          incidentType: request.incident?.incidentType || null,
          subIncidentType: request.incident?.subIncidentType || null,
        },
      });

      results.push(alert);
    }
  }

  return results;
}

async function monitorImagingDelays() {
  const rule = await prisma.automationRule.findUnique({
    where: { ruleCode: "IMAGING_DELAY" },
  });

  if (!rule?.isActive) return [];

  const requests = await prisma.resourceRequest.findMany({
    where: {
      requestStatus: {
        in: [
          "REQUESTED",
          "APPROVED",
          "PARTIALLY_ALLOCATED",
          "RESERVED",
          "IN_PROGRESS",
          "DELAYED",
        ],
      },
      resourceCategory: {
        name: "IMAGING",
      },
    },
    include: {
      incident: true,
      patient: true,
      resourceCategory: true,
      primaryResourceItem: true,
      allocations: {
        include: {
          resourceItem: true,
        },
      },
    },
  });

  const results = [];

  for (const request of requests) {
    const waitMinutes = minutesBetween(request.requestedAt);

    if (waitMinutes >= (rule.thresholdMinutes ?? 20)) {
      const assignedUnit =
        request.primaryResourceItem?.subType ||
        request.primaryResourceItem?.label ||
        null;

      const alert = await createAlertIfMissing({
        alertType: "IMAGING_DELAY",
        severity: rule.severity,
        incidentId: request.incidentId,
        patientId: request.patientId,
        resourceRequestId: request.id,
        message: `Imaging delay for patient ${
          request.patient?.patientCode || "Unknown"
        }. Waiting ${waitMinutes} minutes. Assigned unit: ${
          assignedUnit || "Not yet assigned"
        }. Incident context: ${buildIncidentContextLabel(request.incident)}.`,
        metadata: {
          category: request.resourceCategory?.name || "IMAGING",
          requestStatus: request.requestStatus,
          assignedUnit,
          allocationCount: request.allocations?.length || 0,
          waitMinutes,
          thresholdMinutes: rule.thresholdMinutes ?? 20,
          incidentType: request.incident?.incidentType || null,
          subIncidentType: request.incident?.subIncidentType || null,
        },
      });

      results.push(alert);
    }
  }

  return results;
}

async function monitorIncidentReviewDelays() {
  const rule = await prisma.automationRule.findUnique({
    where: { ruleCode: "INCIDENT_REVIEW_DELAY" },
  });

  if (!rule?.isActive) return [];

  const incidents = await prisma.incident.findMany({
    where: {
      status: "UNDER_REVIEW",
    },
  });

  const results = [];

  for (const incident of incidents) {
    const waitMinutes = minutesBetween(incident.updatedAt || incident.createdAt);

    if (waitMinutes >= (rule.thresholdMinutes ?? 15)) {
      const alert = await createAlertIfMissing({
        alertType: "INCIDENT_REVIEW_DELAY",
        severity: rule.severity,
        incidentId: incident.id,
        message: `Incident ${incident.trackingCode} has remained under review for ${waitMinutes} minutes. Context: ${buildIncidentContextLabel(
          incident
        )}. Estimated patients: ${incident.estimatedVictimCount ?? 0}.`,
        metadata: {
          trackingCode: incident.trackingCode,
          waitMinutes,
          thresholdMinutes: rule.thresholdMinutes ?? 15,
          incidentType: incident.incidentType || null,
          subIncidentType: incident.subIncidentType || null,
          estimatedVictimCount: incident.estimatedVictimCount ?? 0,
        },
      });

      results.push(alert);
    }
  }

  return results;
}

async function runAutomationMonitoringCycle() {
  const results = await Promise.all([
    monitorLowBloodStock(),
    monitorTriageDelays(),
    monitorResourceDelays(),
    monitorImagingDelays(),
    monitorIncidentReviewDelays(),
  ]);

  return results.flat();
}

module.exports = {
  monitorLowBloodStock,
  monitorTriageDelays,
  monitorResourceDelays,
  monitorImagingDelays,
  monitorIncidentReviewDelays,
  runAutomationMonitoringCycle,
  runDelayAndLowStockChecks: runAutomationMonitoringCycle,
};