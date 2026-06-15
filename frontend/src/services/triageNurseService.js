import apiClient from "../api/client";

export async function getTriageQueueService() {
  const response = await apiClient.get("/triage-nurse/patients");
  return response.data.data;
}