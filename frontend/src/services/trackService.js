import apiClient from "../api/client";

export async function trackReportService({ trackingCode, phoneNumber }) {
  const response = await apiClient.get(`/reports/${trackingCode.trim()}`);
  const report = response.data.data;

  return {
    trackingCode: report.trackingCode,
    phoneNumber: phoneNumber.trim(),
    incidentType: report.resolvedIncidentType,
    status: report.status,
    lastUpdatedAt: report.updatedAt || report.createdAt,
    timeline: (report.statusHistory || []).map((item) => ({
      id: item.id,
      title: item.label,
      description: `Status updated to ${item.label}`,
      time: new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      completed: true,
    })),
  };
}