'use client';

import { ReactNode, useEffect, useState } from 'react';
import { handleRedirectResponse } from '@/lib/services/msal-service';

interface MicrosoftAuthProviderProps {
  children: ReactNode;
}

export default function MicrosoftAuthProvider({ children }: MicrosoftAuthProviderProps) {
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const handleRedirect = async () => {
        try {
          setIsProcessingRedirect(true);
          
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
    }
  }, []);

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