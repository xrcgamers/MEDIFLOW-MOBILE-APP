import apiClient from "../api/client";

export async function getTriageAssessment(form) {
  const response = await apiClient.post("/staff/triage/assess", {
    unconscious: form.unconscious,
    notBreathingNormally: form.notBreathingNormally,
    severeBleeding: form.severeBleeding,
    multipleVictims: form.multipleVictims,
    painScore: form.painScore ? Number(form.painScore) : null,
  });

  return response.data.data;
}