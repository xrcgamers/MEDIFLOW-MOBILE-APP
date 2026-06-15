import apiClient from "../api/client";

export async function loginService(payload) {
  const response = await apiClient.post("/auth/login", payload);
  return response.data.data;
}

export async function meService() {
  const response = await apiClient.get("/auth/me");
  return response.data.data;
}

export async function logoutService() {
  const response = await apiClient.post("/auth/logout");
  return response.data;
}