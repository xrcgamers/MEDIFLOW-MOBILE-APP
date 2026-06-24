const prisma = require("../config/prisma");
const { createAuditLog } = require("../services/auditService");
const {
  resolvePatientTriageDelayAlerts,
} = require("../services/automationResolutionService");
const { getIncidentContextRisk } = require("../utils/incidentContextRisk");

function normalizeBoolean(value) {
  return value === true || value === "true";
}

function normalizeNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeGcsScore({ eyeOpening, verbalResponse, motorResponse }) {
  const eye = normalizeNumber(eyeOpening, null);
  const verbal = normalizeNumber(verbalResponse, null);
  const motor = normalizeNumber(motorResponse, null);

  if (eye === null && verbal === null && motor === null) {
    return null;
  }

  return (eye || 0) + (verbal || 0) + (motor || 0);
}

function computeTriage(input) {
  const {
    unconscious,
    notBreathingNormally,
    severeBleeding,
    painScore,
    multipleVictimsContext,
    airwayCompromised,
    respiratoryRate,
    oxygenSaturation,
    systolicBp,
    heartRate,
    capillaryRefillSeconds,
    gcsScore,
    cannotWalk,
    chestPain,
    suspectedStroke,
    majorBurn,
    seizure,
    pregnancyEmergency,
    age,
    incidentType,
    subIncidentType,
    estimatedVictimCount,
  } = input;

  let triageScore = 0;
  const reasons = [];

  if (airwayCompromised) {
    triageScore += 45;
    reasons.push("Airway is compromised.");
  }

  if (unconscious) {
    triageScore += 45;
    reasons.push("Patient is unconscious.");
  }

  if (notBreathingNormally) {
    triageScore += 45;
    reasons.push("Patient is not breathing normally.");
  }

  if (severeBleeding) {
    triageScore += 35;
    reasons.push("Severe bleeding present.");
  }

  if (gcsScore !== null) {
    if (gcsScore <= 8) {
      triageScore += 45;
      reasons.push(`GCS is ${gcsScore}, indicating severe neurological compromise.`);
    } else if (gcsScore <= 12) {
      triageScore += 30;
      reasons.push(`GCS is ${gcsScore}, indicating moderate neurological concern.`);
    } else if (gcsScore <= 14) {
      triageScore += 15;
      reasons.push(`GCS is ${gcsScore}, indicating mild altered consciousness.`);
    }
  }

  if (respiratoryRate !== null) {
    if (respiratoryRate < 8 || respiratoryRate > 30) {
      triageScore += 35;
      reasons.push(`Respiratory rate ${respiratoryRate}/min is critically abnormal.`);
    } else if (respiratoryRate < 10 || respiratoryRate > 24) {
      triageScore += 18;
      reasons.push(`Respiratory rate ${respiratoryRate}/min is abnormal.`);
    }
  }

  if (oxygenSaturation !== null) {
    if (oxygenSaturation < 90) {
      triageScore += 35;
      reasons.push(`Oxygen saturation ${oxygenSaturation}% is critically low.`);
    } else if (oxygenSaturation < 94) {
      triageScore += 20;
      reasons.push(`Oxygen saturation ${oxygenSaturation}% is low.`);
    }
  }

  if (systolicBp !== null) {
    if (systolicBp < 90) {
      triageScore += 35;
      reasons.push(`Systolic BP ${systolicBp} mmHg indicates shock risk.`);
    } else if (systolicBp < 100) {
      triageScore += 18;
      reasons.push(`Systolic BP ${systolicBp} mmHg is concerning.`);
    }
  }

  if (heartRate !== null) {
    if (heartRate < 40 || heartRate > 130) {
      triageScore += 25;
      reasons.push(`Heart rate ${heartRate}/min is critically abnormal.`);
    } else if (heartRate < 50 || heartRate > 110) {
      triageScore += 12;
      reasons.push(`Heart rate ${heartRate}/min is abnormal.`);
    }
  }

  if (capillaryRefillSeconds !== null) {
    if (capillaryRefillSeconds > 4) {
      triageScore += 25;
      reasons.push("Capillary refill is severely delayed.");
    } else if (capillaryRefillSeconds > 2) {
      triageScore += 12;
      reasons.push("Capillary refill is delayed.");
    }
  }

  if (chestPain) {
    triageScore += 25;
    reasons.push("Chest pain reported.");
  }

  if (suspectedStroke) {
    triageScore += 35;
    reasons.push("Suspected stroke signs reported.");
  }

  if (majorBurn) {
    triageScore += 30;
    reasons.push("Major burn injury reported.");
  }

  if (seizure) {
    triageScore += 25;
    reasons.push("Seizure activity or recent seizure reported.");
  }

  if (pregnancyEmergency) {
    triageScore += 25;
    reasons.push("Pregnancy-related emergency reported.");
  }

  if (cannotWalk) {
    triageScore += 15;
    reasons.push("Patient cannot walk unaided.");
  }

  if (typeof painScore === "number" && !Number.isNaN(painScore)) {
    if (painScore >= 9) {
      triageScore += 18;
      reasons.push("Extreme pain reported.");
    } else if (painScore >= 7) {
      triageScore += 12;
      reasons.push("Severe pain reported.");
    } else if (painScore >= 4) {
      triageScore += 6;
      reasons.push("Moderate pain reported.");
    }
  }

  if (multipleVictimsContext) {
    triageScore += 12;
    reasons.push("Patient is part of a multiple casualty incident.");
  }

  if (age !== null) {
    if (age < 5 || age > 70) {
      triageScore += 10;
      reasons.push("Age places patient in a higher-risk group.");
    }
  }

  const contextRisk = getIncidentContextRisk(
    incidentType,
    subIncidentType,
    estimatedVictimCount
  );

  triageScore += contextRisk.bonus;
  reasons.push(...contextRisk.reasons);

  let urgencyLevel = "LOW";
  let advisory = "Routine assessment and continued observation recommended.";

  const criticalRule =
    airwayCompromised ||
    unconscious ||
    notBreathingNormally ||
    severeBleeding ||
    gcsScore <= 8 ||
    respiratoryRate < 8 ||
    respiratoryRate > 30 ||
    oxygenSaturation < 90 ||
    systolicBp < 90 ||
    suspectedStroke ||
    triageScore >= 85;

  const highRule =
    gcsScore <= 12 ||
    oxygenSaturation < 94 ||
    respiratoryRate < 10 ||
    respiratoryRate > 24 ||
    systolicBp < 100 ||
    heartRate > 130 ||
    heartRate < 40 ||
    chestPain ||
    majorBurn ||
    seizure ||
    pregnancyEmergency ||
    triageScore >= 55;

  if (criticalRule) {
    urgencyLevel = "CRITICAL";
    advisory =
      "Immediate life-saving intervention is required. Move patient to resuscitation or highest-priority care area.";
  } else if (highRule) {
    urgencyLevel = "HIGH";
    advisory =
      "Urgent clinician review is required. Patient should not remain in routine waiting queue.";
  } else if (triageScore >= 25 || cannotWalk || painScore >= 7) {
    urgencyLevel = "MODERATE";
    advisory =
      "Prompt assessment is required. Monitor closely for deterioration.";
  }

  if (contextRisk.minPriority === "CRITICAL" && urgencyLevel !== "CRITICAL") {
    urgencyLevel = "CRITICAL";
    advisory =
      "Incident mechanism indicates very high clinical risk. Immediate intervention required.";
  } else if (
    contextRisk.minPriority === "HIGH" &&
    !["CRITICAL", "HIGH"].includes(urgencyLevel)
  ) {
    urgencyLevel = "HIGH";
    advisory =
      "Incident mechanism indicates high clinical risk. Urgent clinician review required.";
  } else if (
    contextRisk.minPriority === "MODERATE" &&
    urgencyLevel === "LOW"
  ) {
    urgencyLevel = "MODERATE";
    advisory =
      "Incident mechanism indicates moderate risk. Prompt assessment required.";
  }

  return {
    triageScore,
    urgencyLevel,
    advisory,
    reasons,
    gcsScore,
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

      airwayCompromised = false,
      respiratoryRate = null,
      oxygenSaturation = null,
      systolicBp = null,
      heartRate = null,
      capillaryRefillSeconds = null,
      eyeOpening = null,
      verbalResponse = null,
      motorResponse = null,
      cannotWalk = false,
      chestPain = false,
      suspectedStroke = false,
      majorBurn = false,
      seizure = false,
      pregnancyEmergency = false,
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

    const gcsScore = computeGcsScore({
      eyeOpening,
      verbalResponse,
      motorResponse,
    });

    const triageInput = {
      unconscious: normalizeBoolean(unconscious),
      notBreathingNormally: normalizeBoolean(notBreathingNormally),
      severeBleeding: normalizeBoolean(severeBleeding),
      painScore: normalizeNumber(painScore, null),
      multipleVictimsContext: normalizeBoolean(multipleVictimsContext),

      airwayCompromised: normalizeBoolean(airwayCompromised),
      respiratoryRate: normalizeNumber(respiratoryRate, null),
      oxygenSaturation: normalizeNumber(oxygenSaturation, null),
      systolicBp: normalizeNumber(systolicBp, null),
      heartRate: normalizeNumber(heartRate, null),
      capillaryRefillSeconds: normalizeNumber(capillaryRefillSeconds, null),
      gcsScore,
      cannotWalk: normalizeBoolean(cannotWalk),
      chestPain: normalizeBoolean(chestPain),
      suspectedStroke: normalizeBoolean(suspectedStroke),
      majorBurn: normalizeBoolean(majorBurn),
      seizure: normalizeBoolean(seizure),
      pregnancyEmergency: normalizeBoolean(pregnancyEmergency),
      age: normalizeNumber(patient.estimatedAge, null),

      incidentType: patient.incident?.incidentType,
      subIncidentType: patient.incident?.subIncidentType,
      estimatedVictimCount: patient.incident?.estimatedVictimCount ?? 1,
    };

    const triageResult = computeTriage(triageInput);

    const enrichedNote = [
      note,
      `GCS: ${triageResult.gcsScore ?? "Not recorded"}`,
      `Vitals: RR=${triageInput.respiratoryRate ?? "N/A"}, SpO2=${triageInput.oxygenSaturation ?? "N/A"}, SBP=${triageInput.systolicBp ?? "N/A"}, HR=${triageInput.heartRate ?? "N/A"}, CRT=${triageInput.capillaryRefillSeconds ?? "N/A"}`,
    ]
      .filter(Boolean)
      .join("\n");

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
        note: enrichedNote,
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
        reasons: triage.reasons,
      },
      reason: "Patient triage completed using rule-based emergency scoring.",
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