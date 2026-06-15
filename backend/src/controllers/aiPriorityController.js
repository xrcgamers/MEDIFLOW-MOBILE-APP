const prisma = require("../config/prisma");
const { getIncidentContextRisk } = require("../utils/incidentContextRisk");

let OpenAI = null;
try {
  OpenAI = require("openai");
} catch (error) {
  console.log("OpenAI SDK not available. Falling back to local priority engine.");
}

function toPriority(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MODERATE";
  return "LOW";
}

function minimumPriority(basePriority, minPriority) {
  const order = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
  const a = order.indexOf(basePriority);
  const b = order.indexOf(minPriority || "LOW");
  return order[Math.max(a, b)];
}

function buildLocalAssessment(incident) {
  const reasons = [];
  let score = 0;

  const contextRisk = getIncidentContextRisk(
    incident.incidentType,
    incident.subIncidentType,
    incident.estimatedVictimCount
  );

  score += contextRisk.bonus;
  reasons.push(...contextRisk.reasons);

  if ((incident.notes || "").trim()) {
    score += 5;
    reasons.push("Caller notes provided additional clinical context.");
  }

  if ((incident.mediaAttachments || []).length > 0) {
    score += 5;
    reasons.push("Supporting media attachment is available.");
  }

  const patientCount = (incident.patients || []).filter((item) => !item.isExcluded).length;
  if (patientCount >= 3) {
    score += 10;
    reasons.push("Several patient records already linked to incident.");
  } else if (patientCount >= 1) {
    score += 4;
    reasons.push("At least one patient linked to incident.");
  }

  const openRequests = (incident.resourceRequests || []).filter((item) =>
    ["REQUESTED", "APPROVED", "PARTIALLY_ALLOCATED", "RESERVED", "IN_PROGRESS", "DELAYED"].includes(
      item.requestStatus
    )
  );

  if (openRequests.length >= 3) {
    score += 12;
    reasons.push("Multiple open resource requests indicate operational pressure.");
  } else if (openRequests.length >= 1) {
    score += 6;
    reasons.push("Open resource requests linked to the incident.");
  }

  let priorityLevel = toPriority(score);
  priorityLevel = minimumPriority(priorityLevel, contextRisk.minPriority);

  let recommendedNextAction = contextRisk.recommendedAction;
  if (priorityLevel === "CRITICAL") {
    recommendedNextAction =
      "Immediate senior clinical response, fast triage, and resource coordination.";
  } else if (priorityLevel === "HIGH") {
    recommendedNextAction =
      "Urgent clinician review, prepare section coordination, and monitor for deterioration.";
  } else if (priorityLevel === "MODERATE") {
    recommendedNextAction =
      "Prompt assessment and close monitoring.";
  }

  return {
    priorityLevel,
    confidence: Math.min(95, Math.max(55, Math.round(55 + score / 2))),
    keyRiskFactors: reasons.slice(0, 8),
    recommendedNextAction,
    handoverSummary: `Incident ${incident.trackingCode}: ${incident.incidentType}${
      incident.subIncidentType ? ` / ${incident.subIncidentType}` : ""
    }. Estimated patients: ${incident.estimatedVictimCount}.`,
    analysisBasis: "LOCAL_RULE_ENGINE",
    imageUsed: (incident.mediaAttachments || []).length > 0,
    rawModelOutput: {
      localScore: score,
      patientCount,
      openResourceRequests: openRequests.length,
      subtype: incident.subIncidentType || null,
    },
  };
}

async function runAndStoreAiPriority(incidentId) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      mediaAttachments: true,
      patients: true,
      resourceRequests: true,
      aiAssessment: true,
    },
  });

  if (!incident) {
    throw new Error("Incident not found.");
  }

  // Keep local engine as primary safe baseline.
  const assessment = buildLocalAssessment(incident);

  return prisma.aiPriorityAssessment.upsert({
    where: { incidentId },
    update: {
      priorityLevel: assessment.priorityLevel,
      confidence: assessment.confidence,
      keyRiskFactors: assessment.keyRiskFactors,
      recommendedNextAction: assessment.recommendedNextAction,
      handoverSummary: assessment.handoverSummary,
      analysisBasis: assessment.analysisBasis,
      imageUsed: assessment.imageUsed,
      rawModelOutput: assessment.rawModelOutput,
    },
    create: {
      incidentId,
      priorityLevel: assessment.priorityLevel,
      confidence: assessment.confidence,
      keyRiskFactors: assessment.keyRiskFactors,
      recommendedNextAction: assessment.recommendedNextAction,
      handoverSummary: assessment.handoverSummary,
      analysisBasis: assessment.analysisBasis,
      imageUsed: assessment.imageUsed,
      rawModelOutput: assessment.rawModelOutput,
    },
  });
}

module.exports = {
  runAndStoreAiPriority,
};