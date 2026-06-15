const prisma = require("../config/prisma");
const { runAndStoreAiPriority } = require("../services/aiPriorityService");
const { ensureIncidentQueuePriority } = require("../services/incidentQueueService");

async function createMissingPatientsForIncident(incident) {
  const existingCount = await prisma.patient.count({
    where: {
      incidentId: incident.id,
      isExcluded: false,
    },
  });

  const targetCount = Number(incident.estimatedVictimCount || 1);
  const missingCount = Math.max(0, targetCount - existingCount);

  const createdPatients = [];

  for (let i = 0; i < missingCount; i += 1) {
    const patientNumber = existingCount + i + 1;
    const patientCode = `${incident.trackingCode}-P${String(patientNumber).padStart(2, "0")}`;

    const patient = await prisma.patient.create({
      data: {
        incidentId: incident.id,
        patientCode,
        status: "UNTRIAGED",
        isPlaceholder: true,
        timelineEvents: {
          create: {
            incidentId: incident.id,
            eventLabel: "Patient Placeholder Created",
            eventStatus: "UNTRIAGED",
            note: "Created automatically after emergency nurse accepted the incident.",
          },
        },
      },
    });

    createdPatients.push(patient);
  }

  return createdPatients;
}

exports.getIncomingIncidents = async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        status: {
          in: ["RECEIVED", "UNDER_REVIEW"],
        },
      },
      include: {
        mediaAttachments: true,
        aiAssessment: true,
        queuePriority: true,
        patients: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load incoming incidents",
      error: error.message,
    });
  }
};

exports.reviewIncident = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { status, publicStatusNote = "" } = req.body;

    if (!["UNDER_REVIEW", "ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review status",
      });
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const updatedIncident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status,
        publicStatusNote:
          publicStatusNote ||
          (status === "ACCEPTED"
            ? "Emergency report accepted and patients are being prepared for triage."
            : status === "REJECTED"
            ? "Emergency report was reviewed and rejected."
            : "Emergency report is under review."),
      },
    });

    await prisma.incidentStatusHistory.create({
      data: {
        incidentId,
        status,
        note: updatedIncident.publicStatusNote,
      },
    });

    let createdPatients = [];

    if (status === "ACCEPTED") {
      await runAndStoreAiPriority(incidentId);
      await ensureIncidentQueuePriority(incidentId);
      createdPatients = await createMissingPatientsForIncident(updatedIncident);
    }

    const fullIncident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        mediaAttachments: true,
        aiAssessment: true,
        queuePriority: true,
        patients: {
          orderBy: {
            createdAt: "asc",
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        incident: fullIncident,
        createdPatients,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to review incident",
      error: error.message,
    });
  }
};