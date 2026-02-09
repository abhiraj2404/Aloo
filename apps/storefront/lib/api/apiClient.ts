import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, ApiErrorResponse } from './types';

/**
 * Centralized API Client using Axios
 * 
 * Features:
 * - Base URL configuration with API versioning
 * - Request/Response interceptors
 * - Consistent error handling
 * - Auto JSON parsing
 * - Authentication token attachment (if needed later)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request Interceptor
 * - Attach auth token if available (for future use)
 * - Add custom headers
 * - Log requests in development
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Future: Attach auth token
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Handle successful responses
 * - Transform errors consistently
 * - Handle token expiration (future)
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response ${response.status}:`, response.data);
    }
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'An error occurred';

      console.error(`[API] Error ${status}:`, message);

      // Handle specific status codes
      switch (status) {
        case 401:
          // Future: Handle unauthorized (redirect to login, clear token)
          throw new ApiError('Unauthorized. Please login.', status, data);
        
        case 403:
          throw new ApiError('Access forbidden.', status, data);
        
        case 404:
          throw new ApiError('Resource not found.', status, data);
        
        case 422:
          throw new ApiError('Validation failed.', status, data);
        
        case 500:
          throw new ApiError('Server error. Please try again later.', status, data);
        
        default:
          throw new ApiError(message, status, data);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('[API] No response received:', error.request);
      throw new ApiError('Network error. Please check your connection.', undefined, error);
    } else {
      // Something else happened
      console.error('[API] Error:', error.message);
      throw new ApiError(error.message || 'An unexpected error occurred.', undefined, error);
    }
  }
);

/**
 * Helper function to get auth token (for future use)
 */
// function getAuthToken(): string | null {
//   if (typeof window !== 'undefined') {
//     return localStorage.getItem('authToken');
//   }
//   return null;
// }

export default apiClient;
