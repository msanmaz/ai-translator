// src/utils/tokenManager.ts

import { jwtDecode } from 'jwt-decode'; // You'll need to add this package
import authService from '@/services/authService';
import { toast } from '@/hooks/use-toast';

interface DecodedToken {
  id: string;
  exp: number;
  iat: number;
}

export class TokenManager {
  private refreshTimeoutId: number | null = null;
  private refreshCallback: () => Promise<void>;
  private logoutCallback: () => void;
  
  constructor(refreshCallback: () => Promise<void>, logoutCallback: () => void) {
    this.refreshCallback = refreshCallback;
    this.logoutCallback = logoutCallback;
  }

  /**
   * Sets up token refresh based on current token expiration
   * If token is not provided, gets it from authService
   */
  public setupTokenRefresh(token?: string): void {
    // Clear any existing refresh timers
    this.clearRefreshTimeout();
    
    // If token not provided, get from authService
    const tokenToUse = token || authService.getAuthToken();
    
    if (!tokenToUse) {
      console.log('No token available for refresh setup');
      return;
    }
    
    try {
      const decoded = jwtDecode<DecodedToken>(tokenToUse);
      const expiresAt = decoded.exp * 1000; // Convert to milliseconds
      
      // Calculate time until token expires (with 5-minute buffer)
      const currentTime = Date.now();
      const timeUntilExpiry = expiresAt - currentTime;
      const refreshBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      // If token is about to expire or already expired, trigger immediate logout
      if (timeUntilExpiry <= refreshBuffer) {
        console.log('Token about to expire or already expired');
        this.logoutCallback();
        return;
      }
      
      // Schedule refresh for 5 minutes before expiration
      const timeToRefresh = timeUntilExpiry - refreshBuffer;
      console.log(`Token refresh scheduled in ${Math.round(timeToRefresh/60000)} minutes`);
      
      this.refreshTimeoutId = window.setTimeout(async () => {
        try {
          await this.refreshCallback();
        } catch (error) {
          console.error('Failed to refresh token:', error);
          this.logoutCallback();
        }
      }, timeToRefresh);
    } catch (error) {
      console.error('Error decoding token:', error);
      this.logoutCallback();
    }
  }
  
  /**
   * Clears any existing refresh timeout
   */
  public clearRefreshTimeout(): void {
    if (this.refreshTimeoutId !== null) {
      window.clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }
  
  /**
   * Gets the remaining time until token expiration (in milliseconds)
   */
  public getTokenRemainingTime(): number | null {
    const token = authService.getAuthToken();
    if (!token) return null;
    
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return (decoded.exp * 1000) - Date.now();
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}