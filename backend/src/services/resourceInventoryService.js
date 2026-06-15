import apiClient from "../api/client";

export async function getResourceCategoriesService() {
  const response = await apiClient.get("/resources/categories");
  return response.data.data;
}

export async function getResourceItemsService(params = {}) {
  const response = await apiClient.get("/resources/items", { params });
  return response.data.data;
}

export async function createResourceItemService(payload) {
  const response = await apiClient.post("/resources/items", payload);
  return response.data.data;
}

export async function updateResourceItemService(itemId, payload) {
  const response = await apiClient.patch(`/resources/items/${itemId}`, payload);
  return response.data.data;
}

export async function allocateResourceToRequestService(requestId, payload) {
  const response = await apiClient.post(`/resources/requests/${requestId}/allocate`, payload);
  return response.data.data;
}

export async function releaseResourceAllocationService(allocationId, payload = {}) {
  const response = await apiClient.post(
    `/resources/allocations/${allocationId}/release`,
    payload
  );
  return response.data.data;
}