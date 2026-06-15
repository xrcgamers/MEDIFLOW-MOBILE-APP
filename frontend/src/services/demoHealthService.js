import apiClient from "../api/client";

export async function getDemoHealthService() {
  const response = await apiClient.get("/demo-health");
  return response.data.data;
}