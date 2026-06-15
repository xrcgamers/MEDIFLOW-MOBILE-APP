import apiClient from "../api/client";

export async function getIncomingIncidentsService() {
  const response = await apiClient.get(
    "/emergency-nurse/incidents"
  );

  return response.data.data;
}

export async function reviewIncidentService(
  incidentId,
  payload
) {
  const response = await apiClient.patch(
    `/emergency-nurse/incidents/${incidentId}/review`,
    payload
  );

  return response.data.data;
}