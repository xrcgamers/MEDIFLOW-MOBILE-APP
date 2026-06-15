import apiClient from "../api/client";

export async function getAdminDashboardSummaryService() {
  const response = await apiClient.get("/admin-dashboard/summary");
  return response.data.data;
}