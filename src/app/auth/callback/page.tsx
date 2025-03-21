'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleRedirectResponse } from '@/lib/services/msal-service';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Handle the redirect response from Microsoft Authentication
        const response = await handleRedirectResponse();
        
        // Check if we have a valid response
        if (response && response.account) {
          // Successfully authenticated
          console.log('Authentication successful, redirecting to dashboard');
          
          // Redirect back to dashboard
          router.push('/dashboard');
        } else {
          // No response means we're not in a callback flow
          // This might happen if user navigates to this page directly
          console.log('No authentication response found, returning to dashboard');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Authentication callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        
        // After 5 seconds, redirect back to dashboard even on error
        setTimeout(() => {
          router.push('/dashboard');
        }, 5000);
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted px-4">
      {error ? (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting back to dashboard in a few seconds...</p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Completing Authentication</h1>
          <p className="text-muted-foreground">Please wait while we process your login...</p>
        </div>
      )}
    </div>
  );
} 