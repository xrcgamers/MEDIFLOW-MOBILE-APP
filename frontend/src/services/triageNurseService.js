import apiClient from "../api/client";

export async function getTriageQueueService() {
  const response = await apiClient.get("/triage-nurse/patients");
  return response.data.data;
}

export async function claimPatientService(patientId) {
  const response = await apiClient.post(`/triage-nurse/patients/${patientId}/claim`);
  return response.data.data;
}

export async function releasePatientClaimService(patientId) {
  const response = await apiClient.post(`/triage-nurse/patients/${patientId}/release`);
  return response.data.data;
}