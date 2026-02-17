// create axios client

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


// Request Interceptor
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // TODO: can do auth token thing here

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }

  return config;
});


// Response Interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] Response ${response.status}:`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);
