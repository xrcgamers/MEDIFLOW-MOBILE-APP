import apiClient from "../api/client";

export async function getTriageAssessment(form, reportId = null) {
  const response = await apiClient.post("/staff/triage/assess", {
    reportId,
    unconscious: form.unconscious,
    notBreathingNormally: form.notBreathingNormally,
    severeBleeding: form.severeBleeding,
    multipleVictims: form.multipleVictims,
    painScore: form.painScore ? Number(form.painScore) : null,
  });

  return response.data.data;
}