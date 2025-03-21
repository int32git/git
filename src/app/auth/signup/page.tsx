'use client';

import { useState, useEffect, Suspense } from 'react';
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

import type { AuthChangeEvent } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Database } from "@/types/supabase";
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/error-boundary';
import { Loading } from '@/components/ui/loading';
import Link from 'next/link';
import EmailVerification from '@/components/auth/email-verification';
import { createBrowserClient } from "@supabase/ssr";

function SignUpContent() {
  const [supabase] = useState(() => 
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
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

  // Debug Supabase connection
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        console.log('Checking Supabase connection...');
        // Simple test to check if API is responding
        const { error: pingError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        
        if (pingError) {
          console.error('Supabase connection test failed:', pingError);
          // Only set error if it's a connection issue, not a permissions issue
          if (pingError.code === 'NETWORK_ERROR' || pingError.message.includes('fetch')) {
            setError('Unable to connect to the authentication service. Please check your internet connection.');
          }
        } else {
          console.log('Supabase connection test successful');
        }
      } catch (err) {
        console.error('Error checking Supabase connection:', err);
      }
    };
    
    checkSupabaseConnection();
  }, [supabase]);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
        
        if (event === 'SIGNED_IN' && session) {
          setIsLoading(true);
          router.push('/dashboard');
        } else if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
          // User has confirmed their email
          setIsLoading(true);
          router.push('/dashboard');
        } else if (event === 'INITIAL_SESSION') {
          console.log('Initial session loaded');
        }
        // We're no longer checking for SIGNED_UP as it's not in the AuthChangeEvent type
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
        if (sessionError) {
          throw sessionError;
        }
        if (session) {
          router.push('/dashboard');
        }
      } catch (err: any) {
        console.error('Error checking session:', err);
        setError('Failed to check authentication status. Please try again.');
      }
    };
    
    checkSession();
  }, [supabase, router]);

  // Function to resend verification email
  const handleResendVerification = async () => {
    if (!email) {
      setError('Email address is required to resend verification');
      return;
    }
    
    setIsResending(true);
    setError(null);
    
    try {
      console.log('Resending verification email to:', email);
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${origin}/api/auth/callback?type=signup`,
        }
      });
      
      if (resendError) {
        console.error('Error from resend API:', resendError);
        throw resendError;
      }
      
      console.log('Verification email resent successfully');
      // Show success message
      setError(null);
      setVerificationSent(true);
    } catch (err: any) {
      console.error('Error resending verification:', err);
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Manual signup function (as a backup)
  const handleManualSignUp = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setRegistrationError(null);
    
    try {
      console.log('Attempting manual signup via API for:', email);
      
      // Use our custom API endpoint instead of Supabase client directly
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      console.log('Manual signup API response:', data);
      setEmail(email);
      setVerificationSent(true);
    } catch (err: any) {
      console.error('Error during manual signup:', err);
      setRegistrationError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Custom handling for sign up form submission to capture email
  const handleSignUpFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Always prevent default form submission
    
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const emailFromForm = formData.get('email') as string;
    const passwordFromForm = formData.get('password') as string;
    
    if (!emailFromForm || !passwordFromForm) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailFromForm,
        password: passwordFromForm,
        options: {
          emailRedirectTo: `${origin}/api/auth/callback?type=signup`,
        }
      });
      
      if (error) throw error;
      
      setEmail(emailFromForm);
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
            <CardDescription>Choose a method to sign up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="outline" onClick={() => {/* Handle Google sign-in */}}>
              Continue with Google
            </Button>
            <Button className="w-full" variant="outline" onClick={() => {/* Handle Microsoft sign-in */}}>
              Continue with Microsoft
            </Button>
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign in with email</span>
              </div>
            </div>
            <form onSubmit={handleSignUpFormSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            <Link href="/auth/signup" className="text-sm text-blue-500 hover:underline">
              Don't have an account? Register
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