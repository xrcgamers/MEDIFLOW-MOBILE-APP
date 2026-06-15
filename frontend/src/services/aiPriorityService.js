const fs = require("fs");
const path = require("path");
const { openai } = require("../lib/openai");
const prisma = require("../lib/prisma");

function toPriorityScore(level) {
  switch (level) {
    case "Critical":
      return 4;
    case "High":
      return 3;
    case "Moderate":
      return 2;
    default:
      return 1;
  }
}

function buildRiskPrompt(report) {
  return [
    "You are an emergency incident prioritization assistant for hospital accident and emergency staff.",
    "Your output is advisory only and must not claim certainty where evidence is weak.",
    "Assess the incident for operational urgency.",
    "",
    `Incident Type: ${report.resolvedIncidentType || report.incidentType || "Unknown"}`,
    `Victim Count: ${report.victimCount ?? "Unknown"}`,
    `Detected Location: ${report.autoLocationText || "Unknown"}`,
    `Manual Location: ${report.manualLocationText || "None"}`,
    `Resolved Location: ${report.resolvedLocationText || "Unknown"}`,
    `Coordinates: ${report.latitude ?? "N/A"}, ${report.longitude ?? "N/A"}`,
    `Reporter Notes: ${report.notes || "None provided"}`,
    `Phone Number Provided: ${report.phoneNumber ? "Yes" : "No"}`,
    `Media Count: ${report.mediaCount || 0}`,
    "",
    "Return a structured emergency prioritization assessment."
  ].join("\n");
}

async function analyzeReportPriority(report) {
  const media = report.mediaAttachments?.[0] || null;
  const content = [
    {
      type: "input_text",
      text: buildRiskPrompt(report),
    },
  ];

  let imageUsed = false;

  if (media?.filePath) {
    const absolutePath = path.resolve(process.cwd(), media.filePath.startsWith("uploads")
      ? media.filePath
      : media.filePath.replace(/^\/+/, ""));

    if (fs.existsSync(absolutePath)) {
      const mimeType = media.mimeType || "image/jpeg";
      const base64 = fs.readFileSync(absolutePath, { encoding: "base64" });

      content.push({
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
              "You are assisting emergency staff with advisory priority analysis. " +
              "Do not diagnose. Be cautious. Use image evidence only if it is actually useful. " +
              "If image quality is weak, rely more on text and say so in analysisBasis.",
          },
        ],
      },
      {
        role: "user",
        content,
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
              enum: ["Low", "Moderate", "High", "Critical"],
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

  const outputText = response.output_text;
  const parsed = JSON.parse(outputText);

  return {
    ...parsed,
    imageUsed,
    rawModelOutput: parsed,
    priorityScore: toPriorityScore(parsed.priorityLevel),
  };
}

async function saveAiPriorityAssessment(reportId, assessment) {
  return prisma.aiPriorityAssessment.upsert({
    where: { reportId },
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
      reportId,
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

async function runAndStoreAiPriority(reportId) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      mediaAttachments: true,
    },
  });

  if (!report) {
    throw new Error("Report not found for AI prioritization.");
  }

  const assessment = await analyzeReportPriority(report);
  const saved = await saveAiPriorityAssessment(reportId, assessment);

  return { saved, assessment };
}

module.exports = {
  analyzeReportPriority,
  saveAiPriorityAssessment,
  runAndStoreAiPriority,
  toPriorityScore,
};