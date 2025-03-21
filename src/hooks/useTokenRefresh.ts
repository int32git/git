import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { PublicClientApplication } from '@azure/msal-browser';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

// Constants for token refresh timing
const REFRESH_MARGIN_MS = 5 * 60 * 1000; // 5 minutes before expiry
const REFRESH_INTERVAL_MS = 4 * 60 * 1000; // Check every 4 minutes
const MAX_REFRESH_ATTEMPTS = 3;

// Types for token refresh
interface TokenRefreshProps {
  msalInstance?: PublicClientApplication;
  msalAccount?: string;
  onSupabaseRefreshSuccess?: () => void;
  onSupabaseRefreshError?: (error: unknown) => void;
  onMsalRefreshSuccess?: () => void;
  onMsalRefreshError?: (error: unknown) => void;
}

/**
 * Custom hook for centralized token refresh management for both Supabase and MSAL
 */
export function useTokenRefresh({
  msalInstance,
  msalAccount,
  onSupabaseRefreshSuccess,
  onSupabaseRefreshError,
  onMsalRefreshSuccess,
  onMsalRefreshError
}: TokenRefreshProps = {}) {
  const { toast } = useToast();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshAttemptsRef = useRef<number>(0);
  
  // Function to refresh Supabase token
  const refreshSupabaseToken = useCallback(async () => {
    try {
      logger.debug('Attempting to refresh Supabase token');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.error('Failed to refresh Supabase token', error);
        if (onSupabaseRefreshError) {
          onSupabaseRefreshError(error);
        }
        return false;
      }
      
      if (data?.session) {
        logger.debug('Supabase token refreshed successfully');
        if (onSupabaseRefreshSuccess) {
          onSupabaseRefreshSuccess();
        }
        refreshAttemptsRef.current = 0;
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Unexpected error refreshing Supabase token', error);
      if (onSupabaseRefreshError) {
        onSupabaseRefreshError(error);
      }
      return false;
    }
  }, [onSupabaseRefreshSuccess, onSupabaseRefreshError]);
  
  // Function to refresh MSAL token
  const refreshMsalToken = useCallback(async () => {
    if (!msalInstance || !msalAccount) {
      return false;
    }
    
    try {
      logger.debug('Attempting to refresh MSAL token');
      
      // Use silent token acquisition
      const account = msalInstance.getAccountByUsername(msalAccount);
      if (!account) {
        logger.warn('No MSAL account found for token refresh');
        return false;
      }
      
      const silentRequest = {
        scopes: ['User.Read', 'DeviceManagementManagedDevices.Read.All'],
        account,
        forceRefresh: true
      };
      
      await msalInstance.acquireTokenSilent(silentRequest);
      logger.debug('MSAL token refreshed successfully');
      
      if (onMsalRefreshSuccess) {
        onMsalRefreshSuccess();
      }
      
      refreshAttemptsRef.current = 0;
      return true;
    } catch (error) {
      logger.error('Failed to refresh MSAL token', error);
      if (onMsalRefreshError) {
        onMsalRefreshError(error);
      }
      return false;
    }
  }, [msalInstance, msalAccount, onMsalRefreshSuccess, onMsalRefreshError]);
  
  // Combine both refresh mechanisms
  const refreshTokens = useCallback(async () => {
    logger.debug('Checking if tokens need refresh');
    let supabaseSuccess = true;
    let msalSuccess = true;
    
    // Increment attempt counter
    refreshAttemptsRef.current += 1;
    
    // Only try to refresh if we haven't exceeded max attempts
    if (refreshAttemptsRef.current <= MAX_REFRESH_ATTEMPTS) {
      try {
        // Try to refresh Supabase token
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.expires_at) {
          // Check if token needs refresh (expires within refresh margin)
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          const timeUntilExpiry = expiresAt.getTime() - now.getTime();
          
          if (timeUntilExpiry < REFRESH_MARGIN_MS) {
            supabaseSuccess = await refreshSupabaseToken();
          }
        }
        
        // Try to refresh MSAL token if instance is provided
        if (msalInstance && msalAccount) {
          msalSuccess = await refreshMsalToken();
        }
      } catch (error) {
        logger.error('Error checking token expiration', error);
        supabaseSuccess = false;
      }
    }
    
    // If we've exceeded max attempts or failed to refresh, notify user
    if (refreshAttemptsRef.current > MAX_REFRESH_ATTEMPTS || 
        (!supabaseSuccess || !msalSuccess)) {
      // Only show toast if max attempts reached
      if (refreshAttemptsRef.current >= MAX_REFRESH_ATTEMPTS) {
        toast({
          title: "Session refresh failed",
          description: "You may need to log in again to continue.",
          variant: "destructive"
        });
      }
      return false;
    } else {
      // Reset counter on success
      refreshAttemptsRef.current = 0;
      return true;
    }
  }, [refreshSupabaseToken, refreshMsalToken, msalInstance, msalAccount, toast]);
  
  // Set up refresh interval
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set new interval
    refreshIntervalRef.current = setInterval(() => {
      refreshTokens();
    }, REFRESH_INTERVAL_MS);
    
    // Run initial refresh check
    refreshTokens();
    
    // Clean up on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshTokens]);
  
  // Return manual refresh function for use outside the interval
  return {
    refreshTokens,
    refreshSupabaseToken,
    refreshMsalToken
  };
} 