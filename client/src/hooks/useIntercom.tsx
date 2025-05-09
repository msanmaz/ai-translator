// src/hooks/useIntercom.tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import IntercomService, {EventMetadata, CustomAttributes } from '@/services/intercomService'; 

export interface IntercomHookReturn {
  trackEvent: (eventName: string, metadata?: EventMetadata) => void;
  trackFeatureUsage: (featureName: string, metadata?: EventMetadata) => void;
  trackError: (errorType: string, errorMessage: string, metadata?: EventMetadata) => void;
  trackTranslation: (sourceLanguage: string, targetLanguage: string, charCount: number) => void;
  updateCustomAttributes: (attributes: CustomAttributes) => void;
  showMessenger: () => void;
  hideMessenger: () => void;
}

/**
 * Custom hook for Intercom integration
 * Handles initialization, user identification, and provides tracking methods
 */
export function useIntercom(): IntercomHookReturn {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isInitializedRef = useRef(false);

  // Initialize Intercom on first load
  useEffect(() => {
    if (!isInitializedRef.current) {
      IntercomService.initializeForVisitor();
      isInitializedRef.current = true;
    }

    // Clean up Intercom when component unmounts
    return () => {
      IntercomService.shutdownMessenger();
    };
  }, []);

  // Update user data when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // Convert user object to format expected by Intercom
      IntercomService.identifyUser({
        userId: user.id,
        email: user.email,
        name: user.name,
        createdAt: new Date(user.createdAt),
      });
    } else if (!isAuthenticated && isInitializedRef.current) {
      // Reset to visitor mode if user logs out
      IntercomService.shutdownMessenger();
      IntercomService.initializeForVisitor();
    }
  }, [isAuthenticated, user]);

  // Track page views
  useEffect(() => {
    const pageName = getPageNameFromPath(location.pathname);
    IntercomService.trackPageView(pageName);
  }, [location.pathname]);

  // Parse path into page name
  const getPageNameFromPath = (path: string): string => {
    const parts = path.split('/').filter(Boolean);
    return parts.length > 0 ? parts.join('_') : 'home';
  };

  // Return a stable API for components to use
  return {
    trackEvent: IntercomService.trackEvent,
    
    trackFeatureUsage: (featureName: string, metadata: EventMetadata = {}) => {
      IntercomService.trackEvent('used_feature', {
        feature_name: featureName,
        ...metadata
      });
    },
    
    trackError: (errorType: string, errorMessage: string, metadata: EventMetadata = {}) => {
      IntercomService.trackEvent('encountered_error', {
        error_type: errorType,
        error_message: errorMessage,
        page: getPageNameFromPath(location.pathname),
        ...metadata
      });
    },
    
    trackTranslation: (sourceLanguage: string, targetLanguage: string, charCount: number) => {
      IntercomService.trackEvent('performed_translation', {
        source_language: sourceLanguage,
        target_language: targetLanguage,
        character_count: charCount
      });
    },
    
    updateCustomAttributes: IntercomService.updateCustomAttributes,
    showMessenger: IntercomService.showMessenger,
    hideMessenger: IntercomService.hideMessenger
  };
}

export default useIntercom;