const prisma = require("../config/prisma");

function getTriageAssessment(form) {
  let score = 0;
  const reasons = [];

  if (form.unconscious) {
    score += 4;
    reasons.push("Patient is unconscious");
  }

  if (form.notBreathingNormally) {
    score += 4;
    reasons.push("Breathing is abnormal");
  }

  if (form.severeBleeding) {
    score += 3;
    reasons.push("Severe bleeding detected");
  }

  if (Number(form.painScore) >= 8) {
    score += 2;
    reasons.push("Very high pain score");
  }

  if (form.multipleVictims) {
    score += 1;
    reasons.push("Multiple casualty context");
  }

  let urgency = "Low";
  let advisory = "Continue monitoring and queue for standard review.";

  if (score >= 8) {
    urgency = "Critical";
    advisory =
      "Immediate attention required. Prioritize resuscitation and senior review.";
  } else if (score >= 5) {
    urgency = "High";
    advisory = "Urgent assessment required. Move patient up the queue.";
  } else if (score >= 3) {
    urgency = "Moderate";
    advisory = "Prompt clinical review recommended.";
  }

  return {
    score,
    urgency,
    advisory,
    reasons,
  };
}

exports.assessTriage = async (req, res) => {
  try {
    const {
      reportId = null,
      unconscious = false,
      notBreathingNormally = false,
      severeBleeding = false,
      multipleVictims = false,
      painScore = null,
    } = req.body;

    const result = getTriageAssessment({
      unconscious,
      notBreathingNormally,
      severeBleeding,
      multipleVictims,
      painScore,
    });

    const saved = await prisma.triageAssessment.create({
      data: {
        reportId,
        unconscious,
        notBreathingNormally,
        severeBleeding,
        multipleVictims,
        painScore: painScore !== null && painScore !== "" ? Number(painScore) : null,
        score: result.score,
        urgency: result.urgency,
        advisory: result.advisory,
        reasons: result.reasons,
      },
    });

    if (reportId) {
      await prisma.staffActionLog.create({
        data: {
          reportId,
          actionType: "TRIAGE_ASSESSMENT",
          status: result.urgency,
          note: result.advisory,
          actorName: "Staff User",
        },
      });
    }

    res.json({
      success: true,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assess triage",
      error: error.message,
    });
  }
};