'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FaSpinner } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Form schema
const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  remember: z.boolean().default(false),
});

export default function SignInPage() {
  const { user, loading, initialized, signIn, debugLog } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [forceStayOnPage, setForceStayOnPage] = useState(false);
  const { toast } = useToast();

  // Debug mode for development
  const DEBUG_SIGNIN = process.env.NODE_ENV === 'development';
  
  // Function to log if in debug mode
  const pageDebugLog = (...args: any[]) => {
    if (DEBUG_SIGNIN) {
      console.log('[SignIn]', ...args);
      
      // If useAuth hook's debugLog is available, use it for persistent logging
      if (debugLog) {
        debugLog(`signInPage_${args[0]}`, args.length > 1 ? args.slice(1).join(' ') : '');
      }
    }
  };

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  // Check URL params on load
  useEffect(() => {
    pageDebugLog('pageInitialized', { url: window.location.href });
    
    const url = new URL(window.location.href);
    const force = url.searchParams.get('force');
    if (force === 'true') {
      pageDebugLog('forceStayParam', 'Force stay on page parameter detected');
      setForceStayOnPage(true);
      // Clear the 'force' param without refreshing
      url.searchParams.delete('force');
      window.history.replaceState({}, '', url.toString());
    }

    // Check for recent redirects to prevent loops
    const lastRedirectTime = localStorage.getItem('last_redirect_time');
    const now = Date.now();
    if (lastRedirectTime && (now - parseInt(lastRedirectTime)) < 5000) {
      pageDebugLog('redirectLoopDetected', {
        timeSinceLastRedirect: now - parseInt(lastRedirectTime),
        threshold: 5000,
        currentPath: window.location.pathname
      });
      setForceStayOnPage(true);
      
      toast({
        title: "Notice",
        description: "You've been redirected multiple times. You'll need to sign in manually.",
        variant: "default",
      });
      
      // Set manual login requirement with longer expiration
      localStorage.setItem('require_manual_login', 'true');
      document.cookie = `require_manual_login=true; path=/; max-age=2592000`;
    }
    
    // Check if we already have debug logs from previous session
    const navIntent = localStorage.getItem('auth_navigation_intent');
    if (navIntent) {
      try {
        const intent = JSON.parse(navIntent);
        pageDebugLog('previousNavigationIntent', intent);
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Display authentication status
    if (user) {
      pageDebugLog('userAlreadyAuthenticated', { 
        userId: user.id,
        email: user.email
      });
    } else if (loading) {
      pageDebugLog('authLoading', 'Authentication state is loading');
    } else if (initialized) {
      pageDebugLog('notAuthenticated', 'User is not authenticated');
    }
  }, [toast, user, loading, initialized, debugLog]);

  // Check if the user is already authenticated and should be redirected
  useEffect(() => {
    if (!initialized) return;
    
    const pathname = window.location.pathname;
    pageDebugLog('authInitialized', { 
      pathname,
      isAuthenticated: !!user,
      forceStayOnPage
    });
    
    if (user && !forceStayOnPage && !loading) {
      pageDebugLog('prepareRedirect', 'User authenticated, preparing redirect');
      
      // Don't redirect if we've recently been redirected
      const lastRedirectTime = localStorage.getItem('last_redirect_time');
      const now = Date.now();
      if (lastRedirectTime && (now - parseInt(lastRedirectTime)) < 5000) {
        pageDebugLog('redirectLoopPrevented', {
          timeSinceLastRedirect: now - parseInt(lastRedirectTime),
          threshold: 5000,
          currentPath: window.location.pathname
        });
        setForceStayOnPage(true);
        return;
      }
      
      // Set redirect time to prevent loops
      localStorage.setItem('last_redirect_time', now.toString());
      document.cookie = `last_redirect_time=${now}; path=/; max-age=5`;
      
      setSignInSuccess(true);
      pageDebugLog('signInSuccessSet', 'Sign-in success state set to true');
      
      // Determine the correct dashboard based on user role
      const userRole = localStorage.getItem('user_role') || 'basic_user';
      const dashboardPath = 
        userRole === 'admin' ? '/admin' : 
        '/dashboard';  // Both premium and basic users go to regular dashboard
      
      pageDebugLog('redirectingToDashboard', { dashboardPath });
      
      // Handle redirect here instead of relying on middleware
      setTimeout(() => {
        window.location.href = `${dashboardPath}?from_signin=true`;
      }, 100);
    }
  }, [user, loading, initialized, forceStayOnPage, debugLog]);

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      pageDebugLog('formSubmitAttempt', { email: values.email, remember: false });
      
      // Rate limiting that's more reasonable
      const loginAttempts = parseInt(localStorage.getItem('login_attempts') || '0');
      const lastAttemptTime = localStorage.getItem('last_login_attempt');
      const now = Date.now();
      
      // Only rate limit if we've had excessive attempts in a short time
      if (lastAttemptTime && (now - parseInt(lastAttemptTime)) < 3000 && loginAttempts > 15) {
        pageDebugLog('rateLimitExceeded', { attempts: loginAttempts });
        toast({
          title: "Too many attempts",
          description: "Please wait a moment before trying again",
          variant: "destructive",
        });
        
        // Add a delay before allowing next attempt
        setTimeout(() => {
          localStorage.setItem('login_attempts', '0');
          pageDebugLog('rateLimitReset', 'Reset login attempts counter');
        }, 5000);
        
        setIsSubmitting(false);
        return;
      }
      
      // Update attempt tracking
      localStorage.setItem('login_attempts', (loginAttempts + 1).toString());
      localStorage.setItem('last_login_attempt', now.toString());
      
      // Always require manual login
      pageDebugLog('manualLoginRequired', 'Always requiring manual login for security');
      localStorage.setItem('require_manual_login', 'true');
      document.cookie = `require_manual_login=true; path=/; max-age=2592000`;
      
      // Check if there's a return URL in the query params
      const url = new URL(window.location.href);
      const returnUrl = url.searchParams.get('return_to');
      const validReturnPaths = ['/dashboard', '/tag-manager', '/troubleshooting-assistant'];
      
      // Store the return URL if it's valid (starts with one of the valid paths)
      if (returnUrl && validReturnPaths.some(path => returnUrl.startsWith(path))) {
        pageDebugLog('validReturnUrlFound', { returnUrl });
        localStorage.setItem('auth_return_url', returnUrl);
      }
      
      pageDebugLog('callingSignIn', 'Calling signIn function from useAuth hook');
      
      // Clear past error indicators before attempting sign-in
      localStorage.removeItem('signin_page_error');
      
      const result = await signIn({
        email: values.email,
        password: values.password,
        remember: false
      });

      // Handle rate limit errors specifically
      if (!result.success && result.error && typeof result.error === 'string' && 
          (result.error.includes('rate limit') || result.error.includes('Too many'))) {
        pageDebugLog('rateLimitError', result.error);
        
        // Force rate limit prevention on client-side
        localStorage.setItem('login_attempts', '20'); // Set high to trigger local rate limiting
        
        toast({
          title: "Rate limit exceeded",
          description: "Too many sign-in attempts. Please wait a few minutes before trying again.",
          variant: "destructive",
        });
        
        setIsSubmitting(false);
        return;
      }

      if (!result.success) {
        pageDebugLog('signInFailed', result.error || 'Failed to sign in');
        throw new Error(result.error || 'Failed to sign in');
      }
      
      // Reset login attempts counter on success
      localStorage.setItem('login_attempts', '0');
      
      pageDebugLog('signInSuccessful', 'Sign-in succeeded, setting success state');
      setSignInSuccess(true);
      
      toast({
        title: "Success!",
        description: "You've been signed in successfully",
      });
      
      // The redirection will be handled by middleware or the useAuth hook
      pageDebugLog('waitingForRedirect', 'Waiting for redirection to dashboard');
      
      // Store navigation attempt for debugging
      localStorage.setItem('signin_page_redirect_attempt', JSON.stringify({
        timestamp: Date.now(),
        remember: false,
        success: true
      }));
    } catch (error) {
      console.error('Sign-in error:', error);
      pageDebugLog('signInError', error instanceof Error ? error.message : 'Unknown error');
      
      // Store failed attempt for debugging
      localStorage.setItem('signin_page_error', JSON.stringify({
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      
      toast({
        title: "Sign-in failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      pageDebugLog('submissionCompleted', 'Form submission completed');
    }
  };

  // If already authenticated and waiting for redirect, show a spinner
  if (user && signInSuccess && !forceStayOnPage) {
    // Determine the correct dashboard based on user role
    const userRole = localStorage.getItem('user_role') || 'basic_user';
    const dashboardPath = 
      userRole === 'admin' ? '/admin' : 
      '/dashboard';  // Both premium and basic users go to regular dashboard
      
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Redirecting</CardTitle>
            <CardDescription>You're already signed in. Taking you to the dashboard...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <FaSpinner className="text-primary h-8 w-8 animate-spin" />
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href={`${dashboardPath}?force=true`}>Go to Dashboard</Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setForceStayOnPage(true)}>
              Stay on this page
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            {forceStayOnPage ? "You'll need to sign in manually" : "Enter your credentials below to sign in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} method="post" className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="name@example.com" 
                        type="email" 
                        autoComplete="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        autoComplete="current-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        disabled={true}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium leading-none cursor-pointer text-muted-foreground">
                      Remember me (disabled - manual login required)
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 