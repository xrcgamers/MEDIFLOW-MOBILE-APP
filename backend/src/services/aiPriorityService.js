const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");

let openai = null;

try {
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require("openai");
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn("OpenAI SDK not available. Falling back to local priority engine.");
}

function resolveAbsoluteMediaPath(filePath) {
  if (!filePath) return null;

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(process.cwd(), filePath.replace(/^\/+/, ""));
}

function detectVisualSignals(incident) {
  const firstMedia = incident.mediaAttachments?.[0];

  if (!firstMedia?.filePath) {
    return {
      hasUsableImage: false,
      imageUsed: false,
      visualFactors: [],
      visualNotes: "No image available.",
    };
  }

  const absolutePath = resolveAbsoluteMediaPath(firstMedia.filePath);

  if (!absolutePath || !fs.existsSync(absolutePath)) {
    return {
      hasUsableImage: false,
      imageUsed: false,
      visualFactors: [],
      visualNotes: "Image path not accessible.",
    };
  }

  const stats = fs.statSync(absolutePath);
  const usable = stats.size > 15 * 1024;

  return {
    hasUsableImage: usable,
    imageUsed: usable,
    visualFactors: usable ? ["Image evidence available for staff review"] : [],
    visualNotes: usable
      ? "Image exists and may support scene review."
      : "Image exists but may be too small or low quality for reliable analysis.",
  };
}

function getHighestPatientUrgency(patients = []) {
  const weights = {
    LOW: 1,
    MODERATE: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  let highest = "LOW";

  for (const patient of patients) {
    const latestTriage = patient.triages?.[0];
    if (latestTriage && weights[latestTriage.urgencyLevel] > weights[highest]) {
      highest = latestTriage.urgencyLevel;
    }
  }

  return highest;
}

function localPriorityAssessment(incident) {
  const text = [
    incident.incidentType,
    incident.resolvedIncidentType,
    incident.otherIncidentType,
    incident.notes,
    incident.autoLocationText,
    incident.manualLocationText,
    incident.resolvedLocationText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const patientCount = Number(incident.estimatedVictimCount || incident.patients?.length || 0);
  const hasCoordinates =
    incident.latitude !== null &&
    incident.latitude !== undefined &&
    incident.longitude !== null &&
    incident.longitude !== undefined;

  const highestUrgency = getHighestPatientUrgency(incident.patients || []);
  const visual = detectVisualSignals(incident);

  let score = 0;
  const keyRiskFactors = [];
  const recommendedActions = [];

  const highRiskKeywords = [
    "not breathing",
    "unconscious",
    "bleeding heavily",
    "severe bleeding",
    "fire",
    "burn",
    "crash",
    "accident",
    "explosion",
    "collapsed",
    "multiple victims",
    "many injured",
    "critical",
    "head injury",
    "fracture",
  ];

  const moderateRiskKeywords = [
    "pain",
    "injury",
    "bleeding",
    "fall",
    "wound",
    "collision",
    "hit",
    "emergency",
  ];

  for (const keyword of highRiskKeywords) {
    if (text.includes(keyword)) {
      score += 2;
      keyRiskFactors.push(`Text mentions ${keyword}`);
    }
  }

  for (const keyword of moderateRiskKeywords) {
    if (text.includes(keyword)) {
      score += 1;
      keyRiskFactors.push(`Text suggests ${keyword}`);
    }
  }

  if (patientCount >= 5) {
    score += 4;
    keyRiskFactors.push("High number of reported patients");
  } else if (patientCount >= 2) {
    score += 2;
    keyRiskFactors.push("Multiple patients reported");
  } else if (patientCount === 1) {
    score += 1;
    keyRiskFactors.push("Single patient reported");
  }

  if (highestUrgency === "CRITICAL") {
    score += 5;
    keyRiskFactors.push("At least one patient triaged as CRITICAL");
  } else if (highestUrgency === "HIGH") {
    score += 3;
    keyRiskFactors.push("At least one patient triaged as HIGH");
  } else if (highestUrgency === "MODERATE") {
    score += 1;
    keyRiskFactors.push("At least one patient triaged as MODERATE");
  }

  if (hasCoordinates) {
    score += 1;
    keyRiskFactors.push("Location coordinates available");
  }

  if (visual.imageUsed) {
    score += 1;
    keyRiskFactors.push("Image evidence available");
  }

  const uniqueFactors = [...new Set(keyRiskFactors)].slice(0, 6);

  let priorityLevel = "LOW";
  let confidence = 55;

  if (score >= 10) {
    priorityLevel = "CRITICAL";
    confidence = 88;
  } else if (score >= 7) {
    priorityLevel = "HIGH";
    confidence = 78;
  } else if (score >= 4) {
    priorityLevel = "MODERATE";
    confidence = 67;
  }

  if (priorityLevel === "CRITICAL") {
    recommendedActions.push(
      "Place near top of emergency queue and alert staff for immediate review."
    );
  } else if (priorityLevel === "HIGH") {
    recommendedActions.push(
      "Prioritize for rapid staff review and prepare emergency response coordination."
    );
  } else if (priorityLevel === "MODERATE") {
    recommendedActions.push(
      "Review soon and confirm escalation need based on staff assessment."
    );
  } else {
    recommendedActions.push(
      "Keep in queue for normal review unless new information increases urgency."
    );
  }

  if (visual.imageUsed) {
    recommendedActions.push("Review image evidence alongside incident text.");
  }

  if (hasCoordinates) {
    recommendedActions.push("Use confirmed location for response planning.");
  }

  if (uniqueFactors.length === 0) {
    uniqueFactors.push("Limited incident detail available");
  }

  const handoverSummary = [
    `AI-style fallback assessment suggests ${priorityLevel.toLowerCase()} priority.`,
    `Patient count: ${patientCount || "unknown"}.`,
    `Highest patient triage: ${highestUrgency}.`,
    hasCoordinates ? "Location appears available." : "Location confirmation is limited.",
    visual.imageUsed ? "Image evidence is available." : "No reliable image evidence used.",
  ].join(" ");

  const analysisBasis = [
    "Fallback emergency priority engine used because no OpenAI API key is configured.",
    "Scoring based on incident text, patient count, latest patient triage, location completeness, and image availability.",
    visual.visualNotes,
  ].join(" ");

  return {
    priorityLevel,
    confidence,
    keyRiskFactors: uniqueFactors,
    recommendedNextAction: recommendedActions.join(" "),
    handoverSummary,
    analysisBasis,
    imageUsed: visual.imageUsed,
    rawModelOutput: {
      engine: "fallback-local-priority-engine",
      score,
      highestUrgency,
      visualNotes: visual.visualNotes,
    },
  };
}

function buildPrompt(incident) {
  const highestUrgency = getHighestPatientUrgency(incident.patients || []);

  return [
    "You are an AI assistant helping hospital accident and emergency staff prioritize incoming incidents.",
    "Your role is advisory only.",
    "Do not diagnose.",
    "Do not overstate confidence.",
    "Assess operational urgency and produce a structured response.",
    "",
    `Tracking Code: ${incident.trackingCode || "Unknown"}`,
    `Incident Type: ${incident.resolvedIncidentType || incident.incidentType || "Unknown"}`,
    `Estimated Patient Count: ${incident.estimatedVictimCount ?? "Unknown"}`,
    `Highest Patient Triage: ${highestUrgency}`,
    `Detected Location: ${incident.autoLocationText || "Unknown"}`,
    `Manual Location: ${incident.manualLocationText || "None"}`,
    `Resolved Location: ${incident.resolvedLocationText || "Unknown"}`,
    `Coordinates: ${incident.latitude ?? "N/A"}, ${incident.longitude ?? "N/A"}`,
    `Reporter Notes: ${incident.notes || "None provided"}`,
    `Phone Number Provided: ${incident.phoneNumber ? "Yes" : "No"}`,
    `Media Count: ${incident.mediaCount || 0}`,
  ].join("\n");
}

async function openAiPriorityAssessment(incident) {
  if (!openai) {
    throw new Error("OpenAI client is not configured.");
  }

  const firstMedia = incident.mediaAttachments?.[0] || null;

  const userContent = [
    {
      type: "input_text",
      text: buildPrompt(incident),
    },
  ];

  let imageUsed = false;

  if (firstMedia?.filePath) {
    const absolutePath = resolveAbsoluteMediaPath(firstMedia.filePath);

    if (absolutePath && fs.existsSync(absolutePath)) {
      const mimeType = firstMedia.mimeType || "image/jpeg";
      const base64 = fs.readFileSync(absolutePath, { encoding: "base64" });

      userContent.push({
        type: "input_image",
        image_url: `data:${mimeType};base64,${base64}`,
        detail: "auto",
      });

      imageUsed = true;
    }
  }

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are assisting emergency staff with advisory priority analysis. Return only structured JSON. Final judgment remains with hospital staff.",
          },
        ],
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "incident_priority_assessment",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            priorityLevel: {
              type: "string",
              enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
            },
            confidence: {
              type: "integer",
              minimum: 0,
              maximum: 100,
            },
            keyRiskFactors: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 6,
            },
            recommendedNextAction: {
              type: "string",
            },
            handoverSummary: {
              type: "string",
            },
            analysisBasis: {
              type: "string",
            },
          },
          required: [
            "priorityLevel",
            "confidence",
            "keyRiskFactors",
            "recommendedNextAction",
            "handoverSummary",
            "analysisBasis",
          ],
        },
      },
    },
  });

  const parsed = JSON.parse(response.output_text);

  return {
    priorityLevel: parsed.priorityLevel,
    confidence: parsed.confidence,
    keyRiskFactors: parsed.keyRiskFactors,
    recommendedNextAction: parsed.recommendedNextAction,
    handoverSummary: parsed.handoverSummary,
    analysisBasis: parsed.analysisBasis,
    imageUsed,
    rawModelOutput: parsed,
  };
}

async function analyzeIncidentPriority(incident) {
  if (openai && process.env.OPENAI_API_KEY) {
    try {
      return await openAiPriorityAssessment(incident);
    } catch (error) {
      console.warn(
        "OpenAI prioritization failed. Falling back to local engine:",
        error.message
      );
    }
  }

  return localPriorityAssessment(incident);
}

async function saveAiPriorityAssessment(incidentId, assessment) {
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

async function runAndStoreAiPriority(incidentId) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      mediaAttachments: true,
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
          resourceRequests: true,
        },
      },
    },
  });

  if (!incident) {
    throw new Error("Incident not found.");
  }

  const assessment = await analyzeIncidentPriority(incident);
  return saveAiPriorityAssessment(incidentId, assessment);
}

module.exports = {
  analyzeIncidentPriority,
  saveAiPriorityAssessment,
  runAndStoreAiPriority,
};