import apiClient from "../api/client";

export async function getStaffUsersService() {
  const response = await apiClient.get("/admin/staff-users");
  return response.data.data;
}

export async function createStaffUserService(payload) {
  const response = await apiClient.post("/admin/staff-users", payload);
  return response.data.data;
}