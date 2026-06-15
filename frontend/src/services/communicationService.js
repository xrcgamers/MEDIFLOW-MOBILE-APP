import apiClient from "../api/client";

export async function getIncidentThreadUiService(incidentId) {
  const response = await apiClient.get(`/staff/incidents/${incidentId}/thread`);
  return response.data.data;
}

export async function getPatientThreadUiService(patientId) {
  const response = await apiClient.get(`/staff/patients/${patientId}/thread`);
  return response.data.data;
}

export async function getResourceRequestThreadUiService(requestId) {
  const response = await apiClient.get(`/staff/resource-requests/${requestId}/thread`);
  return response.data.data;
}

export async function postThreadMessageUiService(threadId, payload) {
  const response = await apiClient.post(`/staff/threads/${threadId}/messages`, payload);
  return response.data.data;
}