import apiClient from "../api/client";

export async function getDashboardOverviewService() {
  const response = await apiClient.get("/staff/dashboard");
  return response.data.data;
}