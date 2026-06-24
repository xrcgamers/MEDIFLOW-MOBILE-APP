import apiClient from "../api/client";

export async function getPatientByIdService(patientId) {
  const response = await apiClient.get(`/staff/patients/${patientId}`);
  return response.data.data;
}

export async function updatePatientService(patientId, payload) {
  const response = await apiClient.patch(`/staff/patients/${patientId}`, payload);
  return response.data.data;
}

export async function excludePatientFromIncidentService(patientId, payload = {}) {
  const response = await apiClient.post(
    `/staff/patients/${patientId}/exclude`,
    payload
  );
  return response.data.data;
}

export async function createPatientTriageService(patientId, payload) {
  const response = await apiClient.post(
    `/staff/patients/${patientId}/triage`,
    payload
  );
  return response.data.data;
}

export async function getResourceCategoriesService() {
  const response = await apiClient.get("/resources/categories");
  return response.data.data;
}

export async function createPatientResourceRequestService(patientId, payload) {
  const response = await apiClient.post(
    `/staff/patients/${patientId}/resource-requests`,
    payload
  );
  return response.data.data;
}