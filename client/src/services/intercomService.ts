// src/services/IntercomService.ts
import Intercom, { 
    boot, 
    shutdown, 
    update,
    show,
    hide,
    trackEvent
  } from '@intercom/messenger-js-sdk';
  
  // Use the correct types from the SDK
  import * as IntercomTypes from '@intercom/messenger-js-sdk/types';
  
  export interface UserData {
    userId?: string;
    email?: string;
    name?: string;
    createdAt?: number | Date;
    userHash?: string; // For secure mode
    [key: string]: any; // Allow any additional user properties
  }
  
  export interface CustomAttributes {
    [key: string]: string | number | boolean | null | undefined;
  }
  
  export interface EventMetadata {
    [key: string]: string | number | boolean | null | undefined;
  }
  const apiKey = import.meta.env.NEXT_PUBLIC_INTERCOM_APP_ID;

  export class IntercomService {
    private static APP_ID = apiKey; // Replace with your actual Intercom App ID
    
    /**
     * Initialize Intercom for an anonymous visitor
     */
    static initializeForVisitor(): void {
      boot({
        app_id: this.APP_ID,
      });
      console.log('Intercom initialized for visitor');
    }
    
    /**
     * Initialize or update Intercom for an authenticated user
     * @param userData User data for identification
     */
    static identifyUser(userData: UserData): void {
      // Prepare the data for Intercom
      const intercomData: IntercomTypes.IntercomSettings = {
        app_id: this.APP_ID,
      };
      
      // Add user identification fields if available
      if (userData.userId) intercomData.user_id = userData.userId;
      if (userData.email) intercomData.email = userData.email;
      if (userData.name) intercomData.name = userData.name;
      
      // Convert Date to Unix timestamp if needed
      if (userData.createdAt) {
        intercomData.created_at = userData.createdAt instanceof Date 
          ? Math.floor(userData.createdAt.getTime() / 1000)
          : userData.createdAt;
      }
      
      // Add HMAC for secure mode if provided
      if (userData.userHash) {
        intercomData.user_hash = userData.userHash;
      }
      
      // Handle custom attributes - add them directly to the intercomData
      // since the SDK's type definition expects them at the top level
      Object.keys(userData).forEach(key => {
        if (!['userId', 'email', 'name', 'createdAt', 'userHash'].includes(key)) {
          intercomData[key] = userData[key];
        }
      });
      
      // Boot or update Intercom
      boot(intercomData);
      console.log('Intercom identified user:', userData.email || userData.userId);
    }
    
    /**
     * Update specific custom user attributes
     * @param attributes Custom attributes to update
     */
    static updateCustomAttributes(attributes: CustomAttributes): void {
      // According to the types, we can't pass { custom_attributes: attributes }
      // Instead, we pass the attributes directly to update
      update(attributes as IntercomTypes.UserArgs);
    }
    
    /**
     * Track a custom event
     * @param eventName Name of the event
     * @param metadata Additional event data
     */
    static trackEvent(eventName: string, metadata?: EventMetadata): void {
      if (!eventName) return;
      
      // The type definition shows trackEvent accepts any arguments
      trackEvent(eventName, metadata || {});
      console.log(`Intercom event tracked: ${eventName}`, metadata);
    }
    
    /**
     * Show the Intercom messenger
     */
    static showMessenger(): void {
      show();
    }
    
    /**
     * Hide the Intercom messenger
     */
    static hideMessenger(): void {
      hide();
    }
    
    /**
     * Completely shut down Intercom
     * Useful when logging out a user
     */
    static shutdownMessenger(): void {
      shutdown();
    }
    
    /**
     * Track page view
     * @param pageName Name of the page
     * @param metadata Additional page data
     */
    static trackPageView(pageName: string, metadata?: EventMetadata): void {
      // Create an object for the update
      const updateData: IntercomTypes.UserArgs = {
        last_page_viewed: pageName,
      };
      
      // Update Intercom with the page view
      update(updateData);
      
      // Also track as an event for better analytics
      this.trackEvent('viewed_page', {
        page_name: pageName,
        ...(metadata || {})
      });
    }
  }
  
  export default IntercomService;