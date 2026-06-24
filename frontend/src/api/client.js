import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AUTH_STORAGE_KEY = "mediflow_auth_token";

const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Request failed";

    return Promise.reject(new Error(message));
  }
);

export default apiClient;