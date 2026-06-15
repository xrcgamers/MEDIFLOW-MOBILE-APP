import apiClient from "../api/client";

export async function getAdminDashboardService() {
  const response = await apiClient.get("/admin/dashboard");
  return response.data.data;
}

export async function getStaffUsersService() {
  const response = await apiClient.get("/admin/staff-users");
  return response.data.data;
}

export async function getStaffRolesService() {
  const response = await apiClient.get("/admin/staff-roles");
  return response.data.data;
}

export async function createStaffUserService(payload) {
  const response = await apiClient.post("/admin/staff-users", payload);
  return response.data.data;
}

export async function updateStaffUserService(userId, payload) {
  const response = await apiClient.patch(`/admin/staff-users/${userId}`, payload);
  return response.data.data;
}

export async function resetStaffPasswordService(userId, payload) {
  const response = await apiClient.post(
    `/admin/staff-users/${userId}/reset-password`,
    payload
  );
  return response.data.data;
}

export async function getAuditLogsService(params = {}) {
  const response = await apiClient.get("/admin/audit-logs", { params });
  return response.data.data;
}