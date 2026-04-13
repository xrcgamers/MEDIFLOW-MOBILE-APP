import apiClient from "../api/client";

export async function getResourcesService() {
  const response = await apiClient.get("/staff/resources");
  return response.data.data;
}

export async function addResourceActionService(resourceId, payload) {
  const response = await apiClient.post(`/staff/resources/${resourceId}/action`, payload);
  return response.data.data;
}