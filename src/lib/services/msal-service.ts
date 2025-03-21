import { PublicClientApplication, Configuration, AuthenticationResult, AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';

// MSAL configuration
const msalConfig: Configuration = {
  auth: {
    clientId: '', // Will be populated at runtime
    authority: '', // Will be populated at runtime (https://login.microsoftonline.com/{tenantId})
    redirectUri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error(message);
            return;
          case 1:
            console.warn(message);
            return;
          case 2:
            console.info(message);
            return;
          case 3:
            console.debug(message);
            return;
          default:
            console.log(message);
            return;
        }
      },
      piiLoggingEnabled: false
    }
  }
};

// Scopes for Microsoft Graph API
export const graphScopes = {
  intune: [
    'DeviceManagementManagedDevices.Read.All',
    'DeviceManagementConfiguration.Read.All'
  ],
  defender: [
    'SecurityEvents.Read.All',
    'SecurityActions.Read.All'
  ]
};

// Singleton instance
let msalInstance: PublicClientApplication | null = null;

// Storage keys
const MSAL_CONFIG_KEY = 'msal_config';
const MSAL_ACCOUNT_KEY = 'msal_account';

/**
 * Initialize the MSAL instance with client ID and tenant ID
 */
export function initializeMsal(clientId: string, tenantId: string) {
  if (!clientId || !tenantId) {
    throw new Error('Client ID and Tenant ID are required to initialize MSAL');
  }
  
  // Update config with runtime values
  const config = {
    ...msalConfig,
    auth: {
      ...msalConfig.auth,
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`
    }
  };
  
  // Store config in session storage for retrieval after redirect
  sessionStorage.setItem(MSAL_CONFIG_KEY, JSON.stringify({
    clientId,
    tenantId
  }));
  
  // Create new instance
  msalInstance = new PublicClientApplication(config);
  return msalInstance;
}

/**
 * Get or initialize MSAL instance
 */
export function getMsalInstance(): PublicClientApplication {
  if (msalInstance) {
    return msalInstance;
  }
  
  // Try to retrieve config from session storage
  try {
    const storedConfig = sessionStorage.getItem(MSAL_CONFIG_KEY);
    if (storedConfig) {
      const { clientId, tenantId } = JSON.parse(storedConfig);
      if (clientId && tenantId) {
        return initializeMsal(clientId, tenantId);
      }
    }
    
    // Check if env vars are available as a fallback
    if (typeof process !== 'undefined' && 
        process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID && 
        process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID) {
      return initializeMsal(
        process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
        process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID
      );
    }
  } catch (error) {
    console.error('Error initializing MSAL from stored config:', error);
  }
  
  throw new Error('MSAL instance not initialized. Call initializeMsal first.');
}

/**
 * Login with popup
 */
export async function loginWithPopup(scopes: string[]): Promise<AuthenticationResult | null> {
  try {
    const instance = getMsalInstance();
    const response = await instance.loginPopup({
      scopes,
      prompt: 'select_account'
    });
    
    if (response) {
      // Store account in session storage
      sessionStorage.setItem(MSAL_ACCOUNT_KEY, response.account?.homeAccountId || '');
      return response;
    }
    return null;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

/**
 * Login with redirect
 */
export async function loginWithRedirect(scopes: string[]): Promise<void> {
  try {
    const instance = getMsalInstance();
    await instance.loginRedirect({
      scopes,
      prompt: 'select_account'
    });
  } catch (error) {
    console.error('Login redirect failed:', error);
    throw error;
  }
}

/**
 * Handle redirect response
 */
export async function handleRedirectResponse(): Promise<AuthenticationResult | null> {
  try {
    // Check if instance exists, if not attempt to initialize
    let instance: PublicClientApplication;
    try {
      instance = getMsalInstance();
    } catch (initError) {
      console.error('Failed to get MSAL instance during redirect handling:', initError);
      // Try to initialize from environment variables as a fallback
      if (typeof process !== 'undefined' && 
          process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID && 
          process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID) {
        
        instance = initializeMsal(
          process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
          process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID
        );
      } else {
        // If we can't initialize, re-throw the error
        throw initError;
      }
    }
    
    // Now handle the redirect
    const response = await instance.handleRedirectPromise();
    
    if (response) {
      // Store account in session storage
      sessionStorage.setItem(MSAL_ACCOUNT_KEY, response.account?.homeAccountId || '');
      return response;
    }
    return null;
  } catch (error) {
    console.error('Handle redirect failed:', error);
    throw error;
  }
}

/**
 * Get active account
 */
export function getActiveAccount(): AccountInfo | null {
  try {
    const instance = getMsalInstance();
    
    // First try the current account
    const currentAccounts = instance.getAllAccounts();
    if (currentAccounts.length > 0) {
      return currentAccounts[0];
    }
    
    // Try to get from session storage
    const accountId = sessionStorage.getItem(MSAL_ACCOUNT_KEY);
    if (accountId) {
      const accounts = instance.getAllAccounts();
      return accounts.find(account => account.homeAccountId === accountId) || null;
    }
    
    return null;
  } catch (error) {
    console.error('Get active account failed:', error);
    return null;
  }
}

/**
 * Get token silently
 */
export async function getTokenSilent(scopes: string[]): Promise<string | null> {
  try {
    const account = getActiveAccount();
    if (!account) {
      throw new Error('No active account');
    }
    
    const instance = getMsalInstance();
    const response = await instance.acquireTokenSilent({
      scopes,
      account
    });
    
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Silent token acquisition failed, user interaction required
      return null;
    }
    console.error('Get token silent failed:', error);
    throw error;
  }
}

/**
 * Acquire token with popup
 */
export async function acquireTokenWithPopup(scopes: string[]): Promise<string | null> {
  try {
    const account = getActiveAccount();
    if (!account) {
      throw new Error('No active account');
    }
    
    const instance = getMsalInstance();
    const response = await instance.acquireTokenPopup({
      scopes,
      account
    });
    
    return response.accessToken;
  } catch (error) {
    console.error('Acquire token with popup failed:', error);
    throw error;
  }
}

/**
 * Check if MSAL is initialized
 */
export function isMsalInitialized(): boolean {
  return msalInstance !== null;
}

/**
 * Logout
 */
export function logout(): void {
  try {
    const instance = getMsalInstance();
    
    // Clear session storage
    sessionStorage.removeItem(MSAL_CONFIG_KEY);
    sessionStorage.removeItem(MSAL_ACCOUNT_KEY);
    
    // Logout
    instance.logoutRedirect();
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getActiveAccount() !== null;
}

/**
 * Clear all MSAL data
 */
export function clearMsalData(): void {
  sessionStorage.removeItem(MSAL_CONFIG_KEY);
  sessionStorage.removeItem(MSAL_ACCOUNT_KEY);
  
  // Clear any other MSAL-related items in session storage
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('msal.') || key.includes('msal')) {
      sessionStorage.removeItem(key);
    }
  });
  
  msalInstance = null;
} 