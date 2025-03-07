import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import authService, { User } from '@/services/authService';
import { toast } from '@/hooks/use-toast';
import axios,{ AxiosError } from "axios";
import { TokenManager } from '@/utils/tokenManager';
import { handleAuthError } from "@/utils/errorHandlers";


type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean; 
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
};

// Match the backend error response format
interface ErrorResponse {
  success: boolean;
  message: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tokenManagerRef = useRef<TokenManager | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  
  // Clear error state
  const clearError = useCallback(() => {
      setError(null);
    
  }, []);
  
  const safeSetUser = useCallback((newUser: User | null) => {    
        setUser(newUser);
  }, []);
  
  const safeSetError = useCallback((newError: string | null) => {    
        setError(newError);
  }, []);

  
  
  
  // Initialize auth state
  useEffect(() => {
    let isCancelled = false;
    
    const initAuth = async () => {
      
      setIsLoading(true);
      
      try {
        if (authService.isAuthenticated()) {
          try {
            console.log("Checking for existing session...");
            const { user } = await authService.getCurrentUser();
            
            if (!isCancelled) {
              safeSetUser(user);
            }
          } catch (err) {
            console.error("Invalid session, clearing token", err);
            authService.removeAuthToken();
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    
    initAuth();
    
    return () => {
      isCancelled = true;
    };
  }, [safeSetUser]);

  

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      console.log('Attempting to refresh token...');
      const response = await authService.refreshToken();
      
      authService.setAuthToken(response.token);
      safeSetUser(response.user);
      
      // Set up next refresh cycle
      tokenManagerRef.current?.setupTokenRefresh();
      
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, [safeSetUser]);

    // Set up token refresh when user changes
    useEffect(() => {
      if (user) {
        tokenManagerRef.current?.setupTokenRefresh();
      } else {
        tokenManagerRef.current?.clearRefreshTimeout();
      }
    }, [user]);

    
  

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
      const abortController = new AbortController();
      
      // Start authentication
      setIsAuthenticating(true);
      safeSetError(null);
      
      console.log("Login started for:", email);
      
      try {
        // Validate inputs
        if (!email || !password) {
          safeSetError("Email and password are required");
          setIsAuthenticating(false);
          return false;
        }
        
        // Call the login API endpoint with abort signal
        console.log("Sending login request...");
        const response = await authService.login(
          { email, password },
          abortController.signal
        );
        console.log("Login response received");
        
        // Success path - save token first
        authService.setAuthToken(response.token);
        
        // Set up token refresh
        tokenManagerRef.current?.setupTokenRefresh(response.token);
        
        // Then update user state (batched)
        safeSetUser(response.user);
        
        // Show success toast (delayed to avoid UI conflicts)
        setTimeout(() => {
          toast({
            title: "Welcome back!",
            description: `You've successfully logged in as ${response.user.name}.`,
          });
        }, 300);
        
        return true;
      } catch (err) {
  // Check if request was cancelled
  if (axios.isCancel(err)) {
    console.log('Login request was cancelled');
    return false;
  }
  
  console.error("Login error:", err);
  
  // Use the dedicated error handler
  const errorMessage = handleAuthError(err);
  
  // Update error state
  safeSetError(errorMessage);
  
  // Show toast notification (delayed)
  setTimeout(() => {
    toast({
      title: "Login Failed",
      description: errorMessage,
      variant: "destructive",
    });
  }, 300);
  
  return false;
      } finally {
        // Ensure we always update loading state
        setIsAuthenticating(false);
      }
    }, [safeSetUser, safeSetError]);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    
    // Start authentication
    setIsAuthenticating(true);
    safeSetError(null);
    
    try {
      // Validate inputs
      if (!name || !email || !password) {
        safeSetError("Name, email, and password are required");
        setIsAuthenticating(false);
        return false;
      }
      
      // Call the signup API endpoint
      const response = await authService.signup({ name, email, password });
      
      
      // Success path - save token first
      authService.setAuthToken(response.token);

      // In the signup function, after setting the token
      authService.setAuthToken(response.token);
    
      // Set up token refresh
      tokenManagerRef.current?.setupTokenRefresh(response.token);
      
      // Then update user state (batched)
      safeSetUser(response.user);
      
      // Show success toast (delayed to avoid UI conflicts)
      setTimeout(() => {
          toast({
            title: "Account created!",
            description: `Welcome to AI Translator, ${response.user.name}!`,
          });
      }, 300);
      
      return true;
    } catch (err) {
      console.error("Signup error:", err);
      
      // Error handling
      let errorMessage = "Failed to create account. Please try again.";
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponse>;
        
        if (!axiosError.response) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = axiosError.response.data?.message || errorMessage;
        }
      }
      
      // Update error state
      safeSetError(errorMessage);
      
      // Show toast notification (delayed)
      setTimeout(() => {
          toast({
            title: "Signup Failed",
            description: errorMessage,
            variant: "destructive",
          });
        
      }, 300);
      
      return false;
    } finally {
        setIsAuthenticating(false);
      
    }
  }, [safeSetUser, safeSetError]);

  const logout = useCallback(() => {
    tokenManagerRef.current?.clearRefreshTimeout();

    // Remove token
    authService.removeAuthToken();
    
    // Update state
    safeSetUser(null);
    
    // Show toast
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  }, [safeSetUser]);

  useEffect(() => {
    tokenManagerRef.current = new TokenManager(refreshToken, logout);
    
    return () => {
      tokenManagerRef.current?.clearRefreshTimeout();
    };
  }, [refreshToken, logout]);

  // Stable context value to prevent unnecessary rerenders
  const contextValue = React.useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading, 
    isAuthenticating,
    login,
    signup,
    logout,
    error,
    clearError,
    refreshToken
  }), [user, isLoading, isAuthenticating, login, signup, logout, error, clearError,refreshToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;