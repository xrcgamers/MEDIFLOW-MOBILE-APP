import apiClient from "../api/client";

export async function getIncidentsService() {
  const response = await apiClient.get("/staff/incidents");
  return response.data.data;
}

export async function getIncidentByIdService(id) {
  const response = await apiClient.get(`/staff/incidents/${id}`);
  return response.data.data;
}

export async function updateIncidentStatusService(id, payload) {
  const response = await apiClient.patch(`/staff/incidents/${id}/status`, payload);
  return response.data.data;
}