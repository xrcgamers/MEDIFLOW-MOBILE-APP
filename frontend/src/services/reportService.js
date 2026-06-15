import apiClient from "../api/client";

async function normalizePhotoForUpload(photo) {
  if (!photo?.uri) return null;

  const fileName = photo.fileName || `incident-${Date.now()}.jpg`;
  const mimeType = photo.mimeType || "image/jpeg";

  // Web needs a real File/Blob, not React Native's { uri, name, type } object
  if (typeof window !== "undefined") {
    const response = await fetch(photo.uri);
    const blob = await response.blob();

    return new File([blob], fileName, {
      type: mimeType,
    });
  }

  // Native Expo / Android / iOS
  return {
    uri: photo.uri,
    name: fileName,
    type: mimeType,
  };
}

export async function createEmergencyReportService(form, photo) {
  const payload = new FormData();

  payload.append("incidentType", form.incidentType || "");
  payload.append("subIncidentType", form.subIncidentType || "");
  payload.append("otherIncidentType", form.otherIncidentType || "");
  payload.append("autoLocationText", form.autoLocationText || "");
  payload.append("manualLocationText", form.manualLocationText || "");
  payload.append("latitude", form.latitude || "");
  payload.append("longitude", form.longitude || "");
  payload.append("estimatedVictimCount", form.estimatedVictimCount || "1");
  payload.append("phoneNumber", form.phoneNumber || "");
  payload.append("notes", form.notes || "");

  const uploadPhoto = await normalizePhotoForUpload(photo);

  if (uploadPhoto) {
    payload.append("photo", uploadPhoto);
  }

  const response = await apiClient.post("/reports", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
}

export async function trackIncidentByCodeService(payload) {
  const response = await apiClient.post("/reports/track", payload);
  return response.data.data;
}

export async function addPublicFollowUpNoteService(trackingCode, payload) {
  const response = await apiClient.post(
    `/reports/${trackingCode}/follow-up`,
    payload
  );
  return response.data.data;
}