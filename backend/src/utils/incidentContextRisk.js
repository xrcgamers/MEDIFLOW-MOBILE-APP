function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

function getIncidentContextRisk(incidentType, subIncidentType, estimatedVictimCount = 1) {
  const type = normalize(incidentType);
  const subtype = normalize(subIncidentType);
  const combined = `${type} ${subtype}`.trim();

  let bonus = 0;
  const reasons = [];
  let minPriority = null;
  let recommendedAction = "Standard emergency assessment.";

  if (Number(estimatedVictimCount) >= 5) {
    bonus += 20;
    reasons.push("Multiple potential patients reported.");
    minPriority = "HIGH";
    recommendedAction = "Prepare multi-patient response and rapid triage.";
  } else if (Number(estimatedVictimCount) >= 2) {
    bonus += 10;
    reasons.push("More than one potential patient reported.");
  }

  if (
    includesAny(combined, [
      "gunshot",
      "cardiac arrest",
      "building collapse",
      "mass casualty",
      "crowd crush",
      "explosion",
    ])
  ) {
    bonus += 35;
    reasons.push("Very high-risk incident mechanism reported.");
    minPriority = "CRITICAL";
    recommendedAction = "Immediate critical response and senior clinical review.";
  }

  if (
    includesAny(combined, [
      "stab wound",
      "vehicle rollover",
      "pedestrian knocked",
      "head-on collision",
      "motorcycle crash",
      "fall from height",
      "electrical burn",
      "chemical burn",
      "smoke inhalation",
      "snake bite",
      "stroke symptoms",
      "difficulty breathing",
      "seizure",
      "unconscious person",
    ])
  ) {
    bonus += 20;
    reasons.push("High-risk injury or emergency subtype reported.");
    if (!minPriority) minPriority = "HIGH";
    recommendedAction = "Urgent clinician assessment and preparation for escalation.";
  }

  if (
    includesAny(combined, [
      "fracture",
      "same level",
      "sprain",
      "dog bite",
      "child fever",
      "food poisoning",
      "bathroom fall",
    ])
  ) {
    bonus += 6;
    reasons.push("Subtype suggests clinically relevant but not automatically critical risk.");
    if (!minPriority) minPriority = "MODERATE";
  }

  if (type.includes("road_traffic_accident") || combined.includes("crash")) {
    bonus += 12;
    reasons.push("Road traffic mechanism raises trauma suspicion.");
    if (!minPriority) minPriority = "HIGH";
  }

  if (type.includes("violence_assault")) {
    bonus += 12;
    reasons.push("Violence-related event may involve internal or external trauma.");
    if (!minPriority) minPriority = "HIGH";
  }

  if (type.includes("burn")) {
    bonus += 10;
    reasons.push("Burn incidents may worsen quickly due to airway/fluid risks.");
    if (!minPriority) minPriority = "HIGH";
  }

  if (type.includes("medical_emergency")) {
    bonus += 10;
    reasons.push("Medical emergency category increases need for rapid assessment.");
    if (!minPriority) minPriority = "MODERATE";
  }

  return {
    bonus,
    reasons,
    minPriority,
    recommendedAction,
  };
}

module.exports = {
  getIncidentContextRisk,
};