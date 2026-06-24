const prisma = require("../config/prisma");

function getAuthUserId(req) {
  return req.user?.id || req.user?.userId || req.user?.staffUserId || null;
}

exports.getTriageQueue = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const isAdmin = req.user?.role === "ADMIN";

    const patients = await prisma.patient.findMany({
      where: {
        isExcluded: false,
        status: {
          in: ["UNTRIAGED", "TRIAGED"],
        },
        incident: {
          status: "ACCEPTED",
        },
        ...(isAdmin
          ? {}
          : {
              OR: [
                { assignedTriageNurseId: null },
                { assignedTriageNurseId: userId },
              ],
            }),
      },
      include: {
        assignedTriageNurse: true,
        incident: {
          include: {
            mediaAttachments: true,
            aiAssessment: true,
            queuePriority: true,
          },
        },
        triages: {
          orderBy: { createdAt: "desc" },
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
          orderBy: { requestedAt: "desc" },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    });

    return res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load triage queue",
      error: error.message,
    });
  }
};

exports.claimPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID missing. Please login again.",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        assignedTriageNurse: true,
      },
    });

    if (!patient || patient.isExcluded) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (
      patient.assignedTriageNurseId &&
      patient.assignedTriageNurseId !== userId
    ) {
      return res.status(409).json({
        success: false,
        message: `Patient is already assigned to ${
          patient.assignedTriageNurse?.name || "another triage nurse"
        }`,
      });
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        assignedTriageNurseId: userId,
      },
      include: {
        assignedTriageNurse: true,
        incident: true,
        triages: {
          orderBy: { createdAt: "desc" },
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
          orderBy: { requestedAt: "desc" },
        },
      },
    });

    await prisma.patientTimelineEvent.create({
      data: {
        patientId: updated.id,
        incidentId: updated.incidentId,
        eventLabel: "Patient Claimed",
        eventStatus: "ASSIGNED",
        note: `Patient assigned to ${
          updated.assignedTriageNurse?.name || "triage nurse"
        }.`,
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to claim patient",
      error: error.message,
    });
  }
};

exports.releasePatientClaim = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = getAuthUserId(req);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (req.user?.role !== "ADMIN" && patient.assignedTriageNurseId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned triage nurse or admin can release this patient",
      });
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        assignedTriageNurseId: null,
      },
      include: {
        assignedTriageNurse: true,
      },
    });

    await prisma.patientTimelineEvent.create({
      data: {
        patientId: updated.id,
        incidentId: updated.incidentId,
        eventLabel: "Patient Claim Released",
        eventStatus: "UNASSIGNED",
        note: "Patient returned to the unassigned triage queue.",
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to release patient claim",
      error: error.message,
    });
  }
};