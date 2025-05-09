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

// Intercom custom attributes
export interface IntercomCustomAttributes {
  default_source_language?: string;
  default_target_language?: string;
  translation_tone?: string;
  total_translations?: number;
  total_characters_translated?: number;
  most_used_source_language?: string;
  most_used_target_language?: string;
  favorite_translations_count?: number;
  days_since_signup?: number;
  last_translation_at?: string;
  [key: string]: string | number | boolean | undefined;
}

// Intercom data structure
export interface IntercomData {
  userId: string;
  email: string;
  name: string;
  createdAt: number;
  appId: string;
  userHash?: string;
  custom_attributes?: IntercomCustomAttributes;
}

export type AuthResponse = {
  success: boolean;
  token: string;
  user: User;
  intercom?: IntercomData; // Now included in auth responses
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
  getCurrentUser: async (): Promise<{ success: boolean; user: User; intercom?: IntercomData }> => {
    return apiRequest<{ success: boolean; user: User; intercom?: IntercomData }>({
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
  
  /**
   * Save Intercom data to localStorage for easy access
   */
  setIntercomData: (data: IntercomData): void => {
    localStorage.setItem('intercom_data', JSON.stringify(data));
  },
  
  /**
   * Get Intercom data from localStorage
   */
  getIntercomData: (): IntercomData | null => {
    const data = localStorage.getItem('intercom_data');
    if (!data) return null;
    
    try {
      return JSON.parse(data) as IntercomData;
    } catch (error) {
      console.error('Error parsing Intercom data:', error);
      return null;
    }
  },
  
  /**
   * Remove Intercom data from localStorage
   */
  removeIntercomData: (): void => {
    localStorage.removeItem('intercom_data');
  },
};

export default authService;