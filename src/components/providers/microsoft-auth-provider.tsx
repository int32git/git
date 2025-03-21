'use client';

import { ReactNode, useEffect, useState } from 'react';
import { handleRedirectResponse, initializeMsal } from '@/lib/services/msal-service';

interface MicrosoftAuthProviderProps {
  children: ReactNode;
}

export default function MicrosoftAuthProvider({ children }: MicrosoftAuthProviderProps) {
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  const [msalInitialized, setMsalInitialized] = useState(false);

  // First, initialize MSAL
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        // Initialize with your app's values
        const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '';
        const tenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || '';
        
        if (clientId && tenantId) {
          initializeMsal(clientId, tenantId);
          setMsalInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing MSAL:', error);
      }
    }
  }, []);

  // Then, handle redirects after MSAL is initialized
  useEffect(() => {
    if (!msalInitialized) return;
    
    const handleRedirect = async () => {
      try {
        setIsProcessingRedirect(true);
        
        // Add a small delay to ensure MSAL is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Handle any redirect response silently, needed for pages other than callback
        await handleRedirectResponse();
      } catch (error) {
        console.error('Error handling redirect:', error);
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    // Handle redirect response if there is one
    handleRedirect();
  }, [msalInitialized]);

  // If we're processing a redirect, show a minimal loading indicator
  // This prevents the app from rendering protected content before the redirect is processed
  if (isProcessingRedirect) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-current border-t-transparent text-primary" />
      </div>
    );
  }

  return <>{children}</>;
} 