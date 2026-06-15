import apiClient from "../api/client";

export async function getIncidentsService(params = {}) {
  const response = await apiClient.get("/staff/incidents", { params });
  return response.data.data;
}

export async function getIncidentByIdService(id) {
  const response = await apiClient.get(`/staff/incidents/${id}`);
  return response.data.data;
}

export async function analyzeIncidentPriorityService(id) {
  const response = await apiClient.post(`/staff/incidents/${id}/analyze-priority`);
  return response.data.data;
}

export async function updateIncidentStatusService(id, payload) {
  const response = await apiClient.patch(`/staff/incidents/${id}/status`, payload);
  return response.data.data;
}

export async function addPatientToIncidentService(id, payload = {}) {
  const response = await apiClient.post(`/staff/incidents/${id}/patients`, payload);
  return response.data.data;
}

export async function excludePatientFromIncidentService(patientId, payload = {}) {
  const response = await apiClient.post(`/staff/patients/${patientId}/exclude`, payload);
  return response.data.data;
}

export async function getPatientByIdService(patientId) {
  const response = await apiClient.get(`/staff/patients/${patientId}`);
  return response.data.data;
}

export async function reorderIncidentQueueService(id, payload) {
  const response = await apiClient.post(`/staff/incidents/${id}/reorder-queue`, payload);
  return response.data.data;
}

export async function addCareUpdateToPatientService(patientId, payload) {
  const response = await apiClient.post(`/staff/patients/${patientId}/care-update`, payload);
  return response.data.data;
}

export async function createPatientTriageService(patientId, payload) {
  const response = await apiClient.post(`/staff/patients/${patientId}/triage`, payload);
  return response.data.data;
}

export async function createPatientResourceRequestService(patientId, payload) {
  const response = await apiClient.post(
    `/staff/patients/${patientId}/resource-requests`,
    payload
  );
  return response.data.data;
}

export async function getResourceCategoriesService() {
  const response = await apiClient.get("/resources/categories");
  return response.data.data;
}