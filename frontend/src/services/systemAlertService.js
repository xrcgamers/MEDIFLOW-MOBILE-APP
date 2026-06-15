import apiClient from "../api/client";

export async function getSystemAlertsService(params = {}) {
  const response = await apiClient.get("/alerts", { params });
  return response.data.data;
}

export async function resolveSystemAlertService(alertId) {
  const response = await apiClient.patch(`/alerts/${alertId}/resolve`);
  return response.data.data;
}

export async function runAutomationChecksService() {
  const response = await apiClient.post("/alerts/run-checks");
  return response.data.data;
}