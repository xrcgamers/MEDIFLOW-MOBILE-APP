const prisma = require("../config/prisma");
const { createAuditLog } = require("../services/auditService");
const { resolvePatientTriageDelayAlerts } = require("../services/automationResolutionService");
const { getIncidentContextRisk } = require("../utils/incidentContextRisk");

function normalizeBoolean(value) {
  return value === true || value === "true";
}

function computeTriage({
  unconscious,
  notBreathingNormally,
  severeBleeding,
  painScore,
  multipleVictimsContext,
  incidentType,
  subIncidentType,
  estimatedVictimCount,
}) {
  let triageScore = 0;
  const reasons = [];

  if (unconscious) {
    triageScore += 50;
    reasons.push("Patient reported as unconscious.");
  }

  if (notBreathingNormally) {
    triageScore += 50;
    reasons.push("Patient is not breathing normally.");
  }

  if (severeBleeding) {
    triageScore += 35;
    reasons.push("Severe bleeding reported.");
  }

  if (typeof painScore === "number" && !Number.isNaN(painScore)) {
    triageScore += Math.min(10, Math.max(0, painScore));
    if (painScore >= 7) {
      reasons.push("High pain score reported.");
    }
  }

  if (multipleVictimsContext) {
    triageScore += 10;
    reasons.push("Patient is part of a multiple casualty incident.");
  }

  const contextRisk = getIncidentContextRisk(
    incidentType,
    subIncidentType,
    estimatedVictimCount
  );

  triageScore += contextRisk.bonus;
  reasons.push(...contextRisk.reasons);

  let urgencyLevel = "LOW";
  let advisory = "Continue monitoring and routine assessment.";

  if (unconscious || notBreathingNormally || triageScore >= 70) {
    urgencyLevel = "CRITICAL";
    advisory = "Immediate intervention required.";
  } else if (severeBleeding || triageScore >= 45) {
    urgencyLevel = "HIGH";
    advisory = "Urgent clinician review required.";
  } else if (triageScore >= 20) {
    urgencyLevel = "MODERATE";
    advisory = "Prompt assessment required.";
  }

  if (contextRisk.minPriority === "CRITICAL" && urgencyLevel !== "CRITICAL") {
    urgencyLevel = "CRITICAL";
    advisory = "Incident mechanism indicates very high clinical risk. Immediate intervention required.";
  } else if (
    contextRisk.minPriority === "HIGH" &&
    !["CRITICAL", "HIGH"].includes(urgencyLevel)
  ) {
    urgencyLevel = "HIGH";
    advisory = "Incident mechanism indicates high risk. Urgent clinician review required.";
  } else if (
    contextRisk.minPriority === "MODERATE" &&
    urgencyLevel === "LOW"
  ) {
    urgencyLevel = "MODERATE";
    advisory = "Incident mechanism indicates moderate risk. Prompt assessment required.";
  }

  return {
    triageScore,
    urgencyLevel,
    advisory,
    reasons,
  };
}

exports.createPatientTriage = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      unconscious = false,
      notBreathingNormally = false,
      severeBleeding = false,
      painScore = null,
      multipleVictimsContext = false,
      note = "",
    } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        incident: true,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const triageInput = {
      unconscious: normalizeBoolean(unconscious),
      notBreathingNormally: normalizeBoolean(notBreathingNormally),
      severeBleeding: normalizeBoolean(severeBleeding),
      painScore:
        painScore === null || painScore === undefined || painScore === ""
          ? null
          : Number(painScore),
      multipleVictimsContext: normalizeBoolean(multipleVictimsContext),
      incidentType: patient.incident?.incidentType,
      subIncidentType: patient.incident?.subIncidentType,
      estimatedVictimCount: patient.incident?.estimatedVictimCount ?? 1,
    };

    const triageResult = computeTriage(triageInput);

    const triage = await prisma.patientTriage.create({
      data: {
        patientId: patient.id,
        incidentId: patient.incidentId,
        unconscious: triageInput.unconscious,
        notBreathingNormally: triageInput.notBreathingNormally,
        severeBleeding: triageInput.severeBleeding,
        painScore: triageInput.painScore,
        multipleVictimsContext: triageInput.multipleVictimsContext,
        triageScore: triageResult.triageScore,
        urgencyLevel: triageResult.urgencyLevel,
        advisory: triageResult.advisory,
        reasons: triageResult.reasons,
        note,
        createdByUserId: req.user?.id || null,
      },
    });

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        status: "TRIAGED",
      },
    });

    await prisma.patientTimelineEvent.create({
      data: {
        patientId: patient.id,
        incidentId: patient.incidentId,
        eventLabel: "Triage Completed",
        eventStatus: triageResult.urgencyLevel,
        note: triageResult.advisory,
      },
    });

    await resolvePatientTriageDelayAlerts(patient.id);

    await createAuditLog({
      actionType: "TRIAGE_CREATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId: patient.incidentId,
      patientId: patient.id,
      targetTable: "PatientTriage",
      targetId: triage.id,
      newValue: {
        triageScore: triage.triageScore,
        urgencyLevel: triage.urgencyLevel,
        advisory: triage.advisory,
      },
      reason: "Patient triage completed with incident context.",
    });

    return res.status(201).json({
      success: true,
      data: triage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create triage assessment",
      error: error.message,
    });
  }
};

exports.getPatientTriages = async (req, res) => {
  try {
    const { patientId } = req.params;

    const triages = await prisma.patientTriage.findMany({
      where: {
        patientId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: triages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient triage history",
      error: error.message,
    });
  }
};