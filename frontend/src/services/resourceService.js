import apiClient from "../api/client";

export async function getResourcesService() {
  const response = await apiClient.get("/staff/resources");
  return response.data.data;
}