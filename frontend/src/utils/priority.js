export function computeIncidentPriority(incident, latestTriage) {
  let score = 0;
  const reasons = [];

  if (latestTriage?.urgency === "Critical") {
    score += 5;
    reasons.push("critical triage urgency");
  } else if (latestTriage?.urgency === "High") {
    score += 4;
    reasons.push("high triage urgency");
  } else if (latestTriage?.urgency === "Moderate") {
    score += 2;
    reasons.push("moderate triage urgency");
  }

  if (Number(incident.victimCount) >= 5) {
    score += 3;
    reasons.push("multiple victims");
  } else if (Number(incident.victimCount) >= 2) {
    score += 2;
    reasons.push("more than one victim");
  } else {
    score += 1;
    reasons.push("single victim");
  }

  if (incident.mediaCount > 0) {
    score += 1;
    reasons.push("evidence available");
  }

  if (
    incident.latitude !== null &&
    incident.latitude !== undefined &&
    incident.longitude !== null &&
    incident.longitude !== undefined
  ) {
    score += 1;
    reasons.push("location confirmed");
  }

  let level = "Low";

  if (score >= 8) {
    level = "Critical";
  } else if (score >= 6) {
    level = "High";
  } else if (score >= 4) {
    level = "Moderate";
  }

  return {
    level,
    score,
    reason: `Priority based on ${reasons.join(", ")}.`,
  };
}

export function getPriorityType(level) {
  switch (level) {
    case "Critical":
      return "danger";
    case "High":
      return "warning";
    case "Moderate":
      return "info";
    default:
      return "neutral";
  }
}