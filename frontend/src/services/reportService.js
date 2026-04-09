import apiClient from "../api/client";

export async function submitReportService(formData) {
  const payload = {
    incidentType: formData.incidentType,
    otherIncidentType: formData.otherIncidentType.trim(),
    autoLocationText: formData.autoLocationText.trim(),
    manualLocationText: formData.manualLocationText.trim(),
    latitude: formData.latitude,
    longitude: formData.longitude,
    victimCount: Number(formData.victimCount),
    phoneNumber: formData.phoneNumber.trim(),
    notes: formData.notes.trim(),
    mediaCount: formData.mediaCount || 0,
  };

  const response = await apiClient.post("/reports", payload);
  return response.data.data;
}