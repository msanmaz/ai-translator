import axios, { AxiosError } from 'axios';

// Match the backend error response format
interface ErrorResponse {
  success: boolean;
  message: string;
}

/**
 * Handles authentication-related errors with specific messages
 */
export const handleAuthError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError<ErrorResponse>;
    
    if (!axiosError.response) {
      return "Network error. Please check your connection.";
    }
    
    // Handle specific status codes
    switch (axiosError.response.status) {
      case 400:
        return axiosError.response.data?.message || "Invalid request. Please check your inputs.";
      case 401: 
        return "Invalid credentials. Please check your email and password.";
      case 403:
        return "Your account is locked. Please contact support.";
      case 429:
        return "Too many attempts. Please try again later.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again later.";
      default:
        return axiosError.response.data?.message || "Authentication failed.";
    }
  }
  
  return "An unexpected error occurred. Please try again.";
};

export const handleApiError = (err: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError<ErrorResponse>;
    
    if (!axiosError.response) {
      return "Network error. Please check your connection.";
    }
    
    // Handle specific status codes
    switch (axiosError.response.status) {
      case 400:
        return axiosError.response.data?.message || "Invalid request. Please check your inputs.";
      case 401:
        return "Session expired. Please log in again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again later.";
      default:
        return axiosError.response.data?.message || defaultMessage;
    }
  }
  
  return defaultMessage;
};