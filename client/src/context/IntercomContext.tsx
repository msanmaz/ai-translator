// src/context/IntercomContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { IntercomData } from '@/services/authService';
import Intercom, {
  boot,
  update as updateIntercom,
  trackEvent as trackIntercomEvent,
  show,
  hide,
  shutdown
} from '@intercom/messenger-js-sdk';

// Define types that match what the SDK provides
interface IntercomContextType {
  isReady: boolean;
  identifyUser: (userData: IntercomData) => void;
  updateUser: (userData: IntercomData) => void;
  trackEvent: (eventName: string, metadata?: Record<string, any>) => void;
  trackTranslation: (sourceLang: string, targetLang: string, characterCount: number) => void;
  showMessenger: () => void;
  hideMessenger: () => void;
  shutdown: () => void;
}

// Create a default implementation with no-op functions
const defaultContext: IntercomContextType = {
  isReady: false,
  identifyUser: () => {},
  updateUser: () => {},
  trackEvent: () => {},
  trackTranslation: () => {},
  showMessenger: () => {},
  hideMessenger: () => {},
  shutdown: () => {}
};

const IntercomContext = createContext<IntercomContextType>(defaultContext);

const apiKey = import.meta.env.VITE_INTERCOM_APP_ID || 'kug5l40q';

export const IntercomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // First, check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Initialize Intercom when on client side
  useEffect(() => {
    if (!isClient) return;
    
    try {
      // Initialize Intercom with app_id
      Intercom({ app_id: apiKey });
      setIsReady(true);
      console.log('Intercom initialized successfully');
    } catch (error) {
      console.error('Error initializing Intercom:', error);
    }
    
    // Cleanup on unmount
    return () => {
      if (isClient) {
        try {
          shutdown();
        } catch (error) {
          console.error('Error shutting down Intercom:', error);
        }
      }
    };
  }, [isClient]);
  
  // Identify a user with Intercom (equivalent to boot)
  const identifyUser = (userData: IntercomData) => {
    if (!isClient || !userData) return;
    
    try {
      // Prepare data for Intercom
      const intercomData = {
        app_id: userData.appId || apiKey,
        user_id: userData.userId,
        email: userData.email,
        name: userData.name,
        created_at: userData.createdAt,
        // Add secure hash if available
        ...(userData.userHash && { user_hash: userData.userHash }),
        // Add any custom attributes
        ...(userData.custom_attributes || {})
      };
      
      // Boot Intercom with user data
      boot(intercomData);
      setIsReady(true);
      
      console.log('Intercom identified user:', userData.email);
    } catch (error) {
      console.error('Error identifying Intercom user:', error);
    }
  };
  
  // Update user data in Intercom
  const updateUser = (userData: IntercomData) => {
    if (!isClient || !userData) return;
    
    try {
      // Update Intercom with user data
      updateIntercom({
        user_id: userData.userId,
        email: userData.email,
        name: userData.name,
        // Include custom attributes if available
        ...(userData.custom_attributes || {})
      });
      
      console.log('Intercom user updated');
    } catch (error) {
      console.error('Error updating Intercom user:', error);
    }
  };
  
  // Track an event in Intercom
  const handleTrackEvent = (eventName: string, metadata: Record<string, any> = {}) => {
    if (!isClient) return;
    
    try {
      trackIntercomEvent(eventName, metadata);
      console.log(`Intercom event tracked: ${eventName}`, metadata);
    } catch (error) {
      console.error('Error tracking Intercom event:', error);
    }
  };
  
  // Track a translation event
  const trackTranslation = (sourceLang: string, targetLang: string, characterCount: number) => {
    handleTrackEvent('translation_created', {
      source_language: sourceLang,
      target_language: targetLang,
      character_count: characterCount,
      timestamp: new Date().toISOString()
    });
  };
  
  // Show the Intercom messenger
  const showMessenger = () => {
    if (!isClient) return;
    
    try {
      show();
    } catch (error) {
      console.error('Error showing Intercom messenger:', error);
    }
  };
  
  // Hide the Intercom messenger
  const hideMessenger = () => {
    if (!isClient) return;
    
    try {
      hide();
    } catch (error) {
      console.error('Error hiding Intercom messenger:', error);
    }
  };
  
  // Shutdown Intercom (logout)
  const handleShutdown = () => {
    if (!isClient) return;
    
    try {
      // Use shutdown to clear user data
      shutdown();
      
      // Reinitialize as visitor
      Intercom({
        app_id: apiKey
      });
      
      console.log('Intercom reset to visitor mode');
    } catch (error) {
      console.error('Error shutting down Intercom:', error);
    }
  };
  
  const value = {
    isReady: isClient && isReady,
    identifyUser,
    updateUser,
    trackEvent: handleTrackEvent,
    trackTranslation,
    showMessenger,
    hideMessenger,
    shutdown: handleShutdown
  };
  
  return <IntercomContext.Provider value={value}>{children}</IntercomContext.Provider>;
};

// Custom hook to use Intercom
export const useIntercomContext = (): IntercomContextType => {
  return useContext(IntercomContext);
};