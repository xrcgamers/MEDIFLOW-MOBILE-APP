import apiClient from "../api/client";

export async function submitReportService(formData) {
  const payload = new FormData();

  payload.append("incidentType", formData.incidentType);
  payload.append("otherIncidentType", formData.otherIncidentType.trim());
  payload.append("autoLocationText", formData.autoLocationText.trim());
  payload.append("manualLocationText", formData.manualLocationText.trim());
  payload.append("latitude", String(formData.latitude ?? ""));
  payload.append("longitude", String(formData.longitude ?? ""));
  payload.append("victimCount", String(Number(formData.victimCount)));
  payload.append("phoneNumber", formData.phoneNumber.trim());
  payload.append("notes", formData.notes.trim());

  if (formData.capturedImage?.uri) {
    payload.append("photo", {
      uri: formData.capturedImage.uri,
      name: formData.capturedImage.fileName || `report-photo-${Date.now()}.jpg`,
      type: formData.capturedImage.mimeType || "image/jpeg",
    });
  }

  const response = await apiClient.post("/reports", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
}