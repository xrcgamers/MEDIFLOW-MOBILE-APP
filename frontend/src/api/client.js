import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getStoredToken, clearAuthSession } from "../services/tokenStorage";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong.";

    if (status === 401) {
      await clearAuthSession();
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;