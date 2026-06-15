const prisma = require("../config/prisma");
const {
  manuallyOverrideIncidentQueue,
  ensureIncidentQueuePriority,
} = require("../services/incidentQueueService");
const { runAndStoreAiPriority } = require("../services/aiPriorityService");
const { createAuditLog } = require("../services/auditService");
const {
  ensureIncidentThread,
  ensurePatientThread,
  ensureResourceRequestThread,
  addParticipantToThread,
  getThreadWithMessages,
  postMessageToThread,
} = require("../services/communicationService");

async function getIncidents(req, res) {
  try {
    const { status } = req.query;

    const incidents = await prisma.incident.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        aiAssessment: true,
        queuePriority: true,
        patients: {
          where: {
            isExcluded: false,
          },
          include: {
            triages: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
            resourceRequests: {
              include: {
                resourceCategory: true,
                primaryResourceItem: true,
                allocations: {
                  include: {
                    resourceItem: true,
                  },
                },
              },
              orderBy: {
                requestedAt: "desc",
              },
            },
          },
        },
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
      message: "Failed to fetch incidents",
      error: error.message,
    });
  }
}

async function getIncidentById(req, res) {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        aiAssessment: true,
        queuePriority: true,
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
        patients: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            triages: {
              orderBy: {
                createdAt: "desc",
              },
            },
            resourceRequests: {
              include: {
                resourceCategory: true,
                primaryResourceItem: true,
                allocations: {
                  include: {
                    resourceItem: true,
                  },
                },
              },
              orderBy: {
                requestedAt: "desc",
              },
            },
            timelineEvents: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    return res.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch incident",
      error: error.message,
    });
  }
}

async function analyzeIncidentPriority(req, res) {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const aiAssessment = await runAndStoreAiPriority(id);
    const queuePriority = await ensureIncidentQueuePriority(id);

    await createAuditLog({
      actionType: "AI_ANALYSIS_RUN",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: id,
      targetTable: "AiPriorityAssessment",
      targetId: aiAssessment.id,
      newValue: {
        priorityLevel: aiAssessment.priorityLevel,
        confidence: aiAssessment.confidence,
        analysisBasis: aiAssessment.analysisBasis,
      },
      reason: "Incident AI priority analysis executed.",
    });

    return res.json({
      success: true,
      data: {
        aiAssessment,
        queuePriority,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to analyze incident priority",
      error: error.message,
    });
  }
}

async function updateIncidentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, note = "", rejectionReason = null } = req.body;

    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status,
        rejectionReason:
          status === "REJECTED" || status === "CANCELLED"
            ? rejectionReason
            : null,
      },
      include: {
        aiAssessment: true,
        queuePriority: true,
      },
    });

    await prisma.incidentStatusHistory.create({
      data: {
        incidentId: updated.id,
        status: updated.status,
        note,
        rejectionReason:
          status === "REJECTED" || status === "CANCELLED"
            ? rejectionReason
            : null,
      },
    });

    await createAuditLog({
      actionType: "INCIDENT_STATUS_UPDATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: updated.id,
      targetTable: "Incident",
      targetId: updated.id,
      oldValue: {
        status: incident.status,
        rejectionReason: incident.rejectionReason,
      },
      newValue: {
        status: updated.status,
        rejectionReason: updated.rejectionReason,
      },
      reason: note || "Incident status updated.",
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update incident status",
      error: error.message,
    });
  }
}

async function addPatientToIncident(req, res) {
  try {
    const { id } = req.params;
    const { note = "" } = req.body;

    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const count = await prisma.patient.count({
      where: {
        incidentId: id,
      },
    });

    const patientCode = `PT-${String(count + 1).padStart(3, "0")}`;

    const patient = await prisma.patient.create({
      data: {
        incidentId: id,
        patientCode,
        status: "UNTRIAGED",
        isPlaceholder: true,
      },
    });

    await prisma.patientTimelineEvent.create({
      data: {
        patientId: patient.id,
        incidentId: id,
        eventLabel: "Patient Added",
        eventStatus: "UNTRIAGED",
        note: note || "Patient record added to incident.",
      },
    });

    await createAuditLog({
      actionType: "PATIENT_ADDED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: id,
      patientId: patient.id,
      targetTable: "Patient",
      targetId: patient.id,
      newValue: {
        patientCode: patient.patientCode,
        status: patient.status,
      },
      reason: note || "Patient added to incident.",
    });

    return res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add patient to incident",
      error: error.message,
    });
  }
}

async function excludePatientFromIncident(req, res) {
  try {
    const { patientId } = req.params;
    const { note = "Patient excluded from active incident handling." } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        isExcluded: true,
        status: "EXCLUDED",
      },
    });

    await prisma.patientTimelineEvent.create({
      data: {
        patientId: updated.id,
        incidentId: updated.incidentId,
        eventLabel: "Patient Excluded",
        eventStatus: "EXCLUDED",
        note,
      },
    });

    await createAuditLog({
      actionType: "PATIENT_EXCLUDED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: updated.incidentId,
      patientId: updated.id,
      targetTable: "Patient",
      targetId: updated.id,
      oldValue: {
        isExcluded: patient.isExcluded,
        status: patient.status,
      },
      newValue: {
        isExcluded: updated.isExcluded,
        status: updated.status,
      },
      reason: note,
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to exclude patient from incident",
      error: error.message,
    });
  }
}

async function getPatientById(req, res) {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        incident: true,
        triages: {
          orderBy: {
            createdAt: "desc",
          },
        },
        resourceRequests: {
          include: {
            resourceCategory: true,
            primaryResourceItem: true,
            allocations: {
              include: {
                resourceItem: true,
              },
            },
          },
          orderBy: {
            requestedAt: "desc",
          },
        },
        timelineEvents: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
      error: error.message,
    });
  }
}

async function reorderIncidentQueue(req, res) {
  try {
    const { id } = req.params;
    const { manualOverrideRank, manualOverrideReason } = req.body;

    const updated = await manuallyOverrideIncidentQueue({
      incidentId: id,
      manualOverrideRank: Number(manualOverrideRank),
      manualOverrideReason,
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reorder incident queue",
      error: error.message,
    });
  }
}

async function addCareUpdateToPatient(req, res) {
  try {
    const { patientId } = req.params;
    const { note, eventStatus = "UPDATED" } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Care update note is required",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const event = await prisma.patientTimelineEvent.create({
      data: {
        patientId: patient.id,
        incidentId: patient.incidentId,
        eventLabel: "Care Update",
        eventStatus,
        note: note.trim(),
      },
    });

    await createAuditLog({
      actionType: "PATIENT_CARE_UPDATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: patient.incidentId,
      patientId: patient.id,
      targetTable: "PatientTimelineEvent",
      targetId: event.id,
      newValue: {
        eventLabel: event.eventLabel,
        eventStatus: event.eventStatus,
        note: event.note,
      },
      reason: "Patient care update added.",
    });

    return res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add care update",
      error: error.message,
    });
  }
}

async function getIncidentThread(req, res) {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const thread = await ensureIncidentThread({
      incidentId: id,
      createdByUserId: req.user?.id || null,
    });

    if (req.user?.id) {
      await addParticipantToThread({
        threadId: thread.id,
        userId: req.user.id,
        role: req.user.role,
      });
    }

    const fullThread = await getThreadWithMessages(thread.id);

    return res.json({
      success: true,
      data: fullThread,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch incident thread",
      error: error.message,
    });
  }
}

async function getPatientThread(req, res) {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const thread = await ensurePatientThread({
      patientId,
      incidentId: patient.incidentId,
      createdByUserId: req.user?.id || null,
    });

    if (req.user?.id) {
      await addParticipantToThread({
        threadId: thread.id,
        userId: req.user.id,
        role: req.user.role,
      });
    }

    const fullThread = await getThreadWithMessages(thread.id);

    return res.json({
      success: true,
      data: fullThread,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient thread",
      error: error.message,
    });
  }
}

async function getResourceRequestThread(req, res) {
  try {
    const { requestId } = req.params;

    const request = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Resource request not found",
      });
    }

    const thread = await ensureResourceRequestThread({
      resourceRequestId: requestId,
      incidentId: request.incidentId,
      patientId: request.patientId,
      createdByUserId: req.user?.id || null,
    });

    if (req.user?.id) {
      await addParticipantToThread({
        threadId: thread.id,
        userId: req.user.id,
        role: req.user.role,
      });
    }

    const fullThread = await getThreadWithMessages(thread.id);

    return res.json({
      success: true,
      data: fullThread,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resource request thread",
      error: error.message,
    });
  }
}

async function postThreadMessage(req, res) {
  try {
    const { threadId } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message body is required",
      });
    }

    const message = await postMessageToThread({
      threadId,
      body: body.trim(),
      senderUserId: req.user?.id || null,
      senderRole: req.user?.role || null,
    });

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to post thread message",
      error: error.message,
    });
  }
}

module.exports = {
  getIncidents,
  getIncidentById,
  analyzeIncidentPriority,
  updateIncidentStatus,
  addPatientToIncident,
  excludePatientFromIncident,
  getPatientById,
  reorderIncidentQueue,
  addCareUpdateToPatient,
  getIncidentThread,
  getPatientThread,
  getResourceRequestThread,
  postThreadMessage,
};