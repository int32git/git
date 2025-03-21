'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useRouter } from 'next/navigation';
import logger from '@/utils/logger';
import { UserAccess } from '@/types/user-types';

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_MSAL_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  }
};

// Define auth context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  userAccess: UserAccess | null;
  msalInstance: PublicClientApplication | null;
  msalAccount: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  connectMicrosoftAccount: () => Promise<boolean>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [msalAccount, setMsalAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Initialize MSAL instance
  useEffect(() => {
    try {
      if (!msalInstance && msalConfig.auth.clientId) {
        const instance = new PublicClientApplication(msalConfig);
        setMsalInstance(instance);

        // Register event callbacks
        const callbackId = instance.addEventCallback((event: EventMessage) => {
          if (event.eventType === EventType.LOGIN_SUCCESS) {
            const result = event.payload as AuthenticationResult;
            if (result.account) {
              setMsalAccount(result.account.username);
            }
          }
        });

        // Initialize MSAL instance
        instance.initialize().then(() => {
          instance.handleRedirectPromise().catch(error => {
            logger.error('Error handling MSAL redirect', error);
          });
        });

        // Clean up on unmount
        return () => {
          if (callbackId) {
            instance.removeEventCallback(callbackId);
          }
        };
      }
    } catch (error) {
      logger.error('Error initializing MSAL', error);
    }
  }, []);

  // Set up authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // If we have an active session, try to get user access level
        if (currentSession?.user) {
          try {
            const { data: accessData, error: accessError } = await supabase
              .from('user_access')
              .select('*')
              .eq('user_id', currentSession.user.id)
              .single();
              
            if (accessError) {
              logger.error('Error fetching user access', accessError);
            } else if (accessData) {
              setUserAccess(accessData as UserAccess);
            }
          } catch (error) {
            logger.error('Error in user access fetch', error);
          }
        }
        
        // Check for MSAL account
        if (msalInstance) {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            setMsalAccount(accounts[0].username);
          }
        }
        
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user || null);
            
            // When signing out, also clear MSAL state
            if (event === 'SIGNED_OUT') {
              setMsalAccount(null);
              if (msalInstance) {
                const accounts = msalInstance.getAllAccounts();
                accounts.forEach(account => {
                  msalInstance.logoutRedirect({ account });
                });
              }
            }
          }
        );
        
        setIsInitialized(true);
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        logger.error('Error initializing auth', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, [msalInstance]);
  
  // Set up token refresh
  const { refreshTokens } = useTokenRefresh({
    msalInstance: msalInstance || undefined,
    msalAccount: msalAccount || undefined,
    onSupabaseRefreshSuccess: () => {
      logger.debug('Supabase token refreshed via provider');
    },
    onSupabaseRefreshError: (error) => {
      logger.error('Error refreshing Supabase token in provider', error);
      toast({
        title: 'Session error',
        description: 'There was a problem with your session. You may need to sign in again.',
        variant: 'destructive',
      });
    },
    onMsalRefreshSuccess: () => {
      logger.debug('MSAL token refreshed via provider');
    },
    onMsalRefreshError: (error) => {
      logger.error('Error refreshing MSAL token in provider', error);
    }
  });
  
  // Sign in handler
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error during sign in', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred during sign in' 
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign out handler
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Sign out from MSAL if connected
      if (msalInstance && msalAccount) {
        const account = msalInstance.getAccountByUsername(msalAccount);
        if (account) {
          await msalInstance.logoutRedirect({ account });
        }
      }
      
      // Reset state
      setUser(null);
      setSession(null);
      setUserAccess(null);
      setMsalAccount(null);
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      logger.error('Error signing out', error);
      toast({
        title: 'Sign out error',
        description: 'There was a problem signing out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manual session refresh
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      
      // Since refreshTokens doesn't return a value, we'll do our own refresh here
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.error('Error refreshing session', error);
        return false;
      }
      
      // Call refreshTokens for MSAL, but don't depend on its return value
      await refreshTokens();
      
      return true;
    } catch (error) {
      logger.error('Error refreshing session', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Connect Microsoft account
  const connectMicrosoftAccount = async () => {
    if (!msalInstance) {
      toast({
        title: 'Microsoft authentication not available',
        description: 'Please try again later or contact support.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      setIsLoading(true);
      
      const loginRequest = {
        scopes: ['User.Read', 'DeviceManagementManagedDevices.Read.All'],
      };
      
      await msalInstance.loginRedirect(loginRequest);
      return true;
    } catch (error) {
      logger.error('Error connecting Microsoft account', error);
      toast({
        title: 'Microsoft connection failed',
        description: 'Unable to connect to Microsoft account. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    user,
    session,
    userAccess,
    msalInstance,
    msalAccount,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    refreshSession,
    connectMicrosoftAccount,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 