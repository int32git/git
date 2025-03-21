'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Loading } from "@/components/ui/loading";
import { useSupabase } from "@/components/providers/supabase-provider";
import ErrorBoundary from "@/components/error-boundary";

function SignInContent() {
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [origin, setOrigin] = useState("");

  // Safe access to window object (only on client)
  useEffect(() => {
    setIsMounted(true);
    setOrigin(window.location.origin);
  }, []);

  // Check for error query parameters
  useEffect(() => {
    if (!searchParams) return;
    
    const errorMessage = searchParams.get("error");
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
  }, [searchParams]);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (session) router.push("/dashboard");
      } catch (err: any) {
        console.error("Error checking session:", err);
      }
    };
    
    if (supabase) checkSession();
  }, [supabase, router]);

  // Handle sign in with email/password
  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use Supabase client directly for authentication
      const { error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Successful login - router.push happens in the auth state change handler
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth sign-in with different providers
  const handleOAuthSignIn = async (provider: 'google' | 'azure') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase!.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/api/auth/callback`,
        },
      });
      
      if (error) throw error;
      // No need to do anything else, as the browser will redirect
    } catch (err: any) {
      console.error(`${provider} sign in error:`, err);
      setError(err.message || `Failed to sign in with ${provider}.`);
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return <Loading text="Loading sign-in form..." />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
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
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
          >
            Continue with Google
          </Button>
          
          <Button 
            className="w-full" 
            variant="outline" 
            onClick={() => handleOAuthSignIn('azure')}
            disabled={isLoading}
          >
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
          
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isLoading}
              autoComplete="email"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isLoading}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/signup" className="text-sm text-blue-500 hover:underline">
            Don't have an account? Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

// Export with Suspense boundary
export default function SignInPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardContent className="flex justify-center py-8">
              <Loading text="Loading sign-in form..." />
            </CardContent>
          </Card>
        </div>
      }>
        <SignInContent />
      </Suspense>
    </ErrorBoundary>
  );
} 