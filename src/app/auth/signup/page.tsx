'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/error-boundary';
import { Loading } from '@/components/ui/loading';
import Link from 'next/link';
import EmailVerification from '@/components/auth/email-verification';
import { createBrowserClient } from "@supabase/ssr";

function SignUpContent() {
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [origin, setOrigin] = useState<string>('');
  
  // Safe access to window object only on the client side
  useEffect(() => {
    setOrigin(window.location.origin);
    setIsMounted(true);
  }, []);
  
  // Check for query parameters that might indicate status
  useEffect(() => {
    if (!searchParams) return;
    
    const verificationStatus = searchParams.get('verification');
    const userEmail = searchParams.get('email');
    
    if (verificationStatus === 'sent' && userEmail) {
      setVerificationSent(true);
      setEmail(userEmail);
    }
    
    // Check for errors
    const errorMessage = searchParams.get('error');
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
  }, [searchParams]);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
        
        if (event === 'SIGNED_IN' && session) {
          router.push('/dashboard');
        } else if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
          // User has confirmed their email
          router.push('/dashboard');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Check for existing session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (session) router.push('/dashboard');
      } catch (err: any) {
        console.error('Error checking session:', err);
        setError('Failed to check authentication status. Please try again.');
      }
    };
    
    checkSession();
  }, [supabase, router]);

  // Handle sign up form submission
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use Supabase client directly for signup - no need for a separate API route
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/api/auth/callback?type=signup`,
        }
      });
      
      if (error) throw error;
      
      setVerificationSent(true);
    } catch (err: any) {
      console.error('Error during signup:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show verification instructions if email was sent
  if (verificationSent && email) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <EmailVerification 
            email={email}
            onResendSuccess={() => console.log('Verification email resent successfully')}
            redirectTo={`${origin}/api/auth/callback?type=signup`}
            showSignInLink={true}
          />
        </div>
      </ErrorBoundary>
    );
  }

  // Regular sign up form
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create a new account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${origin}/api/auth/callback`
                    }
                  });
                  if (error) throw error;
                } catch (err: any) {
                  setError(err.message);
                }
              }}
            >
              Continue with Google
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'azure',
                    options: {
                      redirectTo: `${origin}/api/auth/callback`
                    }
                  });
                  if (error) throw error;
                } catch (err: any) {
                  setError(err.message);
                }
              }}
            >
              Continue with Microsoft
            </Button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
              </div>
            </div>
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                autoComplete="email"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                autoComplete="new-password"
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing up...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/signin" className="text-sm text-blue-500 hover:underline">
              Already have an account? Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

// Wrap the component in a Suspense boundary to fix the hydration warnings
export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="flex justify-center py-8">
          <Loading text="Loading registration form..." />
        </CardContent>
      </Card>
    </div>}>
      <SignUpContent />
    </Suspense>
  );
} 