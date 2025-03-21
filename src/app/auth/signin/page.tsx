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
  const [success, setSuccess] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [origin, setOrigin] = useState("");

  // Safe access to window object (only on client)
  useEffect(() => {
    setIsMounted(true);
    setOrigin(window.location.origin);
    
    // Function to clear bad tokens
    const clearBadTokens = () => {
      try {
        // Clear cookies
        document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Clear localStorage tokens
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('supabase.auth.token');
        
        console.log("Cleared all auth tokens on signin page load");
      } catch (e) {
        console.error('Error clearing tokens on signin page:', e);
      }
    };
    
    // Handle token errors
    const handleTokenError = (event: any) => {
      if (event.detail?.error?.message?.includes('Invalid Refresh Token')) {
        console.log("Caught invalid refresh token error on signin page");
        clearBadTokens();
        setError("Your session has expired. Please sign in again.");
      }
    };
    
    // Listen for auth errors
    window.addEventListener('supabase.auth.error', handleTokenError);
    
    // If we're on the signin page with no token (likely after signout),
    // proactively clear any bad tokens to prevent errors
    if (window.location.pathname.includes('/auth/signin')) {
      clearBadTokens();
    }
    
    return () => {
      window.removeEventListener('supabase.auth.error', handleTokenError);
    };
  }, []);

  // Check for URL parameters
  useEffect(() => {
    if (!searchParams) return;
    
    // Check for error message
    const errorMessage = searchParams.get("error");
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
    
    // Check for successful signout or token error
    const signoutSuccess = searchParams.get("signout") === "success";
    const tokenError = searchParams.get("token_error") === "true";
    
    if (signoutSuccess) {
      setSuccess("You have been successfully signed out.");
      
      // Clear any localStorage values that might cause redirect loops
      const keysToRemove = [
        'auth_navigation_intent',
        'last_redirect_time',
        'redirect_path',
        'sb-refresh-token',
        'sb-access-token',
        'supabase.auth.token'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    if (tokenError) {
      setError("Your session has expired. Please sign in again.");
      
      // Clear any token-related values
      const keysToRemove = [
        'sb-refresh-token',
        'sb-access-token',
        'supabase.auth.token'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear cookies too
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }, [searchParams]);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // If we have a success message, don't auto-redirect
        if (success) return;
        
        // Check for a recent signout or a high redirect count
        const lastSignoutTime = localStorage.getItem('last_signout_time');
        const redirectCountData = localStorage.getItem('auth_redirect_count');
        const now = Date.now();
        
        if (lastSignoutTime && (now - parseInt(lastSignoutTime)) < 10000) {
          console.log("Recent signout detected, staying on sign-in page");
          return;
        }
        
        // If we're explicitly trying to sign in, don't block based on redirect count
        const isAttemptingSignIn = sessionStorage.getItem('attempting_signin') === 'true';
        
        if (redirectCountData && !isAttemptingSignIn) {
          try {
            const data = JSON.parse(redirectCountData);
            if (data.count > 2) {
              console.log("Multiple redirects detected, staying on sign-in page");
              return;
            }
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
        
        // Don't auto-check for session on the sign-in page - wait for explicit sign-in
        const explicitSignIn = localStorage.getItem('explicit_sign_in') === 'true';
        if (!explicitSignIn) {
          console.log("No explicit sign-in, skipping auto-redirect");
          return;
        }

        // Extra safety: if we've just loaded the sign-in page, don't auto-redirect
        const pageLoadTime = sessionStorage.getItem('signin_page_load_time');
        if (pageLoadTime && (now - parseInt(pageLoadTime)) < 1000) {
          console.log("Sign-in page just loaded, skipping immediate redirect check");
          return;
        }
        
        // Check for session
        console.log("Explicitly checking for valid session...");
        const { data: { session } } = await supabase!.auth.getSession();
        
        if (session) {
          console.log("Valid session found, redirecting to dashboard");
          // Reset redirect count to avoid issues with future navigation
          localStorage.setItem('auth_redirect_count', JSON.stringify({ count: 0, timestamp: Date.now() }));
          localStorage.setItem('explicit_sign_in', 'true');
          router.push("/dashboard?from_signin=true");
        }
      } catch (err: any) {
        console.error("Error checking session:", err);
      } finally {
        // Clear the signin attempt flag
        sessionStorage.removeItem('attempting_signin');
      }
    };
    
    // Record page load time for anti-bounce protection
    sessionStorage.setItem('signin_page_load_time', Date.now().toString());
    
    if (supabase) checkSession();
  }, [supabase, router, success]);

  // Handle sign in with email/password
  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    console.log("Starting login process...");
    setIsLoading(true);
    setError(null);
    
    try {
      // Mark this as an explicit sign-in attempt
      localStorage.setItem('explicit_sign_in', 'true');
      
      // Set a flag that we're explicitly attempting to sign in
      sessionStorage.setItem('attempting_signin', 'true');
      console.log("Set attempting_signin flag");
      
      // Clear any existing redirect protection
      localStorage.removeItem('auth_redirect_count');
      document.cookie = 'auth_redirect_count=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      console.log("Cleared redirect protection");
      
      // Clear any existing tracking data and tokens to ensure a clean login
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('supabase.auth.token');
      
      // Clear cookies too
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      console.log("Cleared existing tokens");
      
      // Use Supabase client directly for authentication
      console.log("Calling Supabase auth.signInWithPassword...");
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }
      
      console.log("Login response received:", data ? "success" : "no data");
      
      // Successful login - manually redirect instead of relying on onAuthStateChange
      if (data.session) {
        console.log("Login successful, user:", data.user?.email);
        console.log("Session expires:", data.session.expires_at ? new Date(data.session.expires_at * 1000) : 'unknown');
        
        // Reset redirect count for future navigation
        localStorage.setItem('auth_redirect_count', JSON.stringify({ count: 0, timestamp: Date.now() }));
        console.log("Reset redirect count");
        
        // Clear manual login requirement
        localStorage.setItem('require_manual_login', 'false');
        document.cookie = 'require_manual_login=false; path=/; max-age=2592000';
        console.log("Cleared manual login requirement");
        
        // Explicitly store the session in localStorage to ensure it persists
        // This helps bridge client/server session state
        try {
          localStorage.setItem('sb:session', JSON.stringify(data.session));
          console.log("Stored session in localStorage");
        } catch (e) {
          console.error("Error storing session:", e);
        }
        
        // Ensure the cookie is properly set before redirecting
        // Use the exact format that Supabase expects
        try {
          // Store access token in a secure cookie with proper settings
          const maxAge = data.session.expires_in;
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
          
          // Store refresh token in a secure cookie with longer expiry (30 days)
          document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
          
          // Also store user ID for easier access in middleware
          document.cookie = `sb-user-id=${data.user?.id}; path=/; max-age=${maxAge}; SameSite=Lax`;
          
          console.log("Set auth cookies with proper configuration");
        } catch (e) {
          console.error("Error setting cookies:", e);
        }
        
        // Short delay to ensure state is updated and cookies are set
        console.log("Redirecting to dashboard in 800ms...");
        setTimeout(() => {
          console.log("Executing redirect now");
          // Pass an additional parameter to signal this is an actual login with valid session
          router.push('/dashboard?from_signin=true&has_session=true');
        }, 800);
      } else {
        console.warn("No session data received after successful login");
      }
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
          
          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
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