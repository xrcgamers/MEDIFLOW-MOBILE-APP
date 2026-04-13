import axios from "axios";
import { API_BASE_URL } from "../config/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong.";

    return Promise.reject(new Error(message));
  }
);

export default apiClient;