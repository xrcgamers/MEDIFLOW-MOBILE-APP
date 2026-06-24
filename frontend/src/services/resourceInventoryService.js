import apiClient from "../api/client";

export async function getResourceCategoriesService() {
  const response = await apiClient.get("/resources/categories");
  return response.data.data;
}

export async function getResourceItemsService(params = {}) {
  const response = await apiClient.get("/resources", { params });
  return response.data.data;
}

export async function createResourceItemService(payload) {
  const response = await apiClient.post("/resources", payload);
  return response.data.data;
}

export async function updateResourceItemService(resourceItemId, payload) {
  const response = await apiClient.patch(`/resources/${resourceItemId}`, payload);
  return response.data.data;
}

export async function deleteResourceItemService(resourceItemId) {
  const response = await apiClient.delete(`/resources/${resourceItemId}`);
  return response.data.data;
}

export async function getResourceRequestsService(params = {}) {
  const response = await apiClient.get("/resources/requests", { params });
  return response.data.data;
}

export async function updateResourceRequestService(requestId, payload) {
  const response = await apiClient.patch(`/resources/requests/${requestId}`, payload);
  return response.data.data;
}

export async function allocateResourceToRequestService(requestId, payload) {
  const response = await apiClient.post(
    `/resources/requests/${requestId}/allocate`,
    payload
  );
  return response.data.data;
}

export async function releaseResourceAllocationService(allocationId, payload) {
  const response = await apiClient.post(
    `/resources/allocations/${allocationId}/release`,
    payload
  );
  return response.data.data;
}