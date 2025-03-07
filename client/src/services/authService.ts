// src/services/authService.ts

import { apiRequest } from '@/utils/apiClient';
import { jwtDecode } from 'jwt-decode';

// Types
export type LoginCredentials = {
    email: string;
    password: string;
  };
  
  export type SignupCredentials = {
    name: string;
    email: string;
    password: string;
  };

export type AuthResponse = {
  success: boolean;
  token: string;
  user: User;
};

export interface UserPreferences {
  defaultSourceLanguage?: string;
  defaultTargetLanguage?: string;
  defaultTranslationOptions?: {
    tone?: string;
    style?: string;
    preserveFormatting?: boolean;
  };
  [key: string]: unknown;
}

export type User = {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Authentication service to handle API calls related to auth
 */
const authService = {
  /**
   * Register a new user
   */
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/signup',
      data: credentials,
    });
  },

  /**
   * Log in an existing user
   */
  login: async (credentials: LoginCredentials, signal?: AbortSignal): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
    }, signal);
  },
  /**
   * Get the current logged in user
   */
  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    return apiRequest<{ success: boolean; user: User }>({
      method: 'GET',
      url: '/auth/me',
    });
  },

  refreshToken: async (): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/refresh-token',
    });
  },
  
  // You'll also need to add a method to decode token expiration
  getTokenExpiration: (): number | null => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      return decoded.exp;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  /**
   * Save auth token to localStorage
   */
  setAuthToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  /**
   * Get auth token from localStorage
   */
  getAuthToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  /**
   * Remove auth token from localStorage
   */
  removeAuthToken: (): void => {
    localStorage.removeItem('auth_token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};

export default authService;