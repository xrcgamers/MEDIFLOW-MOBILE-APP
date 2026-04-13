import apiClient from "../api/client";
import {
  saveAuthSession,
  getStoredUser,
  clearAuthSession,
} from "./tokenStorage";

export async function loginStaffService(form) {
  const response = await apiClient.post("/auth/login", {
    identifier: form.identifier.trim(),
    password: form.password,
  });

  const { token, user } = response.data.data;
  await saveAuthSession(token, user);

  return { token, user };
}

export async function getCurrentStaffService() {
  const response = await apiClient.get("/auth/me");
  return response.data.data;
}

export async function getCachedStaffUserService() {
  return getStoredUser();
}

export async function logoutStaffService() {
  await clearAuthSession();
}