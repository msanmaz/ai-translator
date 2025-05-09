// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { User, IntercomData } from '@/services/authService';
import { useIntercomContext } from '@/context/IntercomContext'; // We'll create this next

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuthToken: () => Promise<boolean>;
  intercomData: IntercomData | null; // Add Intercom data to context
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [intercomData, setIntercomData] = useState<IntercomData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const intercom = useIntercomContext(); // Get Intercom context

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      
      if (authService.isAuthenticated()) {
        try {
          // Get fresh user data
          const response = await authService.getCurrentUser();
          
          if (response.success) {
            setUser(response.user);
            
            // Handle Intercom data if available
            if (response.intercom) {
              setIntercomData(response.intercom);
              authService.setIntercomData(response.intercom);
              
              // Initialize Intercom with user data
              intercom.identifyUser(response.intercom);
            }
          } else {
            // Something went wrong, clear auth
            handleLogout();
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          handleLogout();
        }
      }
      
      setIsLoading(false);
    };

    checkAuthStatus();
  }, [intercom]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.token) {
        authService.setAuthToken(response.token);
        setUser(response.user);
        
        // Handle Intercom data
        if (response.intercom) {
          setIntercomData(response.intercom);
          authService.setIntercomData(response.intercom);
          
          // Initialize Intercom with user data
          intercom.identifyUser(response.intercom);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await authService.signup({ name, email, password });
      
      if (response.success && response.token) {
        authService.setAuthToken(response.token);
        setUser(response.user);
        
        // Handle Intercom data
        if (response.intercom) {
          setIntercomData(response.intercom);
          authService.setIntercomData(response.intercom);
          
          // Initialize Intercom with user data
          intercom.identifyUser(response.intercom);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.removeAuthToken();
    authService.removeIntercomData();
    setUser(null);
    setIntercomData(null);
    
    // Reset Intercom to visitor mode
    intercom.shutdown();
  };

  const refreshAuthToken = async (): Promise<boolean> => {
    try {
      const response = await authService.refreshToken();
      
      if (response.success && response.token) {
        authService.setAuthToken(response.token);
        setUser(response.user);
        
        // Update Intercom data if available
        if (response.intercom) {
          setIntercomData(response.intercom);
          authService.setIntercomData(response.intercom);
          
          // Update Intercom with fresh data
          intercom.updateUser(response.intercom);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    refreshAuthToken,
    intercomData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};