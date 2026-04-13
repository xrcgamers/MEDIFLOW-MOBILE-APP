import apiClient from "../api/client";
import { API_ROOT_URL } from "../config/api";

export async function trackReportService({ trackingCode, phoneNumber }) {
  const response = await apiClient.get(`/reports/${trackingCode.trim()}`);
  const report = response.data.data;

  return {
    trackingCode: report.trackingCode,
    phoneNumber: phoneNumber.trim(),
    incidentType: report.resolvedIncidentType,
    status: report.status,
    lastUpdatedAt: report.updatedAt || report.createdAt,
    media: (report.mediaAttachments || []).map((item) => ({
      id: item.id,
      url: `${API_ROOT_URL}${item.filePath}`,
      fileName: item.fileName,
    })),
    timeline: (report.statusHistory || []).map((item, index, arr) => ({
      id: item.id,
      title: item.label,
      description: `Status updated to ${item.label}`,
      time: new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      completed: index < arr.length - 1 || report.status === item.label,
    })),
  };
}