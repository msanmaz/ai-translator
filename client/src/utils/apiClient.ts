import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from '@/hooks/use-toast';

// API base URL from environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Define type for API error response
interface ApiErrorResponse {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

// Create an event system for auth status changes
export const authEvents = {
  listeners: new Set<() => void>(),
  
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  
  emitAuthFailure() {
    this.listeners.forEach(listener => listener());
  }
};

/**
 * Create and configure an Axios instance for API requests
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    // Add timeout to prevent hanging requests
    timeout: 15000, // 15 seconds
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => {
      console.log('API Response:', response.status, response.config.url);
      return response;
    },
    (error: AxiosError<ApiErrorResponse>) => {
      console.error('API Error:', error.message);
      
      // Handle network errors (no response)
      if (!error.response) {
        toast({
          title: 'Network Error',
          description: 'Please check your internet connection and try again.',
          variant: 'destructive',
        });
        return Promise.reject(error);
      }
      
      const { response } = error;

      if (response?.status === 401 && !error.config.url?.includes('/auth/login')) {
        // Clear auth token
        localStorage.removeItem('auth_token');
        
        // Emit auth failure event
        authEvents.emitAuthFailure();
        
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Create the API client instance
const apiClient = createApiClient();

/**
 * Type-safe API request helper function
 */
export const apiRequest = async <T>(
  config: AxiosRequestConfig,
  signal?: AbortSignal
): Promise<T> => {
  try {
    // Add signal to config if provided
    if (signal) {
      config.signal = signal;
    }
    
    // Add debug information
    console.log(`API Request starting: ${config.method} ${config.url}`);
    
    const response: AxiosResponse<T> = await apiClient(config);
    
    console.log(`API Request successful: ${config.method} ${config.url}`);
    return response.data;
  } catch (error) {
    console.error(`API Request failed: ${config.method} ${config.url}`, error);
    throw error; // Re-throw the error for component handling
  }
};

export default apiClient;