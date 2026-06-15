import apiClient from "../api/client";

export async function createPublicReportService(formData) {
  const response = await apiClient.post("/reports", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
}

export async function trackPublicReportService(payload) {
  const response = await apiClient.post("/reports/track", payload);
  return response.data.data;
}

export async function addPublicFollowUpNoteService(trackingCode, payload) {
  const response = await apiClient.post(`/reports/${trackingCode}/follow-up`, payload);
  return response.data.data;
}