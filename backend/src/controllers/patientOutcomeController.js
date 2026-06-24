const prisma = require("../config/prisma");
const { createAuditLog } = require("../services/auditService");
const {
  releasePatientReusableResources,
} = require("../services/resourceReleaseService");

const VALID_OUTCOMES = [
  "UNDER_TREATMENT",
  "DISCHARGED",
  "DECEASED",
  "INVALID",
];

function getOutcomeLabel(status) {
  switch (status) {
    case "UNDER_TREATMENT":
      return "Patient Under Treatment";
    case "DISCHARGED":
      return "Patient Discharged";
    case "DECEASED":
      return "Patient Deceased";
    case "INVALID":
      return "Patient Marked Invalid";
    default:
      return "Patient Status Updated";
  }
}

function shouldReleaseReusableResources(status) {
  return ["DISCHARGED", "DECEASED", "INVALID"].includes(status);
}

exports.updatePatientOutcome = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, note = "" } = req.body;

    if (!VALID_OUTCOMES.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid patient outcome. Use UNDER_TREATMENT, DISCHARGED, DECEASED, or INVALID.",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.patient.update({
        where: {
          id: patientId,
        },
        data: {
          status,
          isExcluded: status === "INVALID" ? true : patient.isExcluded,
          exclusionReason:
            status === "INVALID" ? "INVALID_PATIENT_RECORD" : patient.exclusionReason,
          exclusionNote:
            status === "INVALID"
              ? note || "Patient marked invalid during clinical review."
              : patient.exclusionNote,
        },
        include: {
          assignedTriageNurse: true,
          incident: true,
          triages: {
            orderBy: {
              createdAt: "desc",
            },
          },
          resourceRequests: {
            include: {
              resourceCategory: true,
              primaryResourceItem: {
                include: {
                  category: true,
                },
              },
              allocations: {
                include: {
                  resourceItem: {
                    include: {
                      category: true,
                    },
                  },
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

      const releasedCount = shouldReleaseReusableResources(status)
        ? await releasePatientReusableResources({
            tx,
            patientId,
            categories: ["BED", "IMAGING", "THEATRE"],
            reason: `${getOutcomeLabel(status)}. Reusable resources released automatically.`,
            changedByUserId: req.user?.id || null,
          })
        : 0;

      const event = await tx.patientTimelineEvent.create({
        data: {
          patientId,
          incidentId: patient.incidentId,
          eventLabel: getOutcomeLabel(status),
          eventStatus: status,
          note:
            note ||
            `${patient.patientCode} changed from ${patient.status} to ${status}. ${
              releasedCount
                ? `${releasedCount} reusable allocation(s) released.`
                : ""
            }`,
        },
      });

      return {
        patient: updated,
        timelineEvent: event,
        releasedReusableAllocations: releasedCount,
      };
    });

    await createAuditLog({
      actionType: "PATIENT_OUTCOME_UPDATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: patient.incidentId,
      patientId,
      targetTable: "Patient",
      targetId: patientId,
      oldValue: {
        status: patient.status,
        isExcluded: patient.isExcluded,
      },
      newValue: {
        status,
        isExcluded: status === "INVALID" ? true : patient.isExcluded,
      },
      reason: note || "Patient outcome changed.",
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update patient outcome",
      error: error.message,
    });
  }
};