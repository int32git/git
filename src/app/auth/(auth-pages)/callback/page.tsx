'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleRedirectResponse, initializeMsal } from '@/lib/services/msal-service';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AuthCallback() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    
    // Separate handler function to isolate try/catch from the redirect
    const processAuthentication = async () => {
      try {
        setIsLoading(true);
        
        // Initialize MSAL first
        const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '';
        const tenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || '';
        
        if (!clientId || !tenantId) {
          throw new Error('Microsoft client ID or tenant ID not configured');
        }
        
        // Initialize MSAL
        initializeMsal(clientId, tenantId);
        
        // Add a small delay to ensure MSAL is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Handle redirect response from Microsoft
        const response = await handleRedirectResponse();
        console.log('MSAL auth callback processed successfully');
        
        setIsLoading(false);
        return true; // Authentication successful
      } catch (err: any) {
        console.error('Error during authentication callback:', err);
        setError(err.message || 'Authentication failed. Please try again.');
        setIsLoading(false);
        return false; // Authentication failed
      }
    };

    // Handle callback processing
    const handleCallback = async () => {
      const success = await processAuthentication();
      
      // Keep redirects outside try/catch blocks
      if (success) {
        // Redirect happens outside the try/catch block
        router.push('/dashboard');
      } else {
        // Set timer to redirect back to login after showing error
        redirectTimer = setTimeout(() => {
          router.push('/auth/signin');
        }, 5000);
      }
    };

    handleCallback();

    // Clean up timer on unmount
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-center text-gray-600">
              Processing your authentication...
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-center text-sm text-gray-500 mt-4">
              Redirecting to login page in 5 seconds...
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
} 