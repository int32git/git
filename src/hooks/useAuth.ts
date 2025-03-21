import { useCallback, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../lib/supabase-client';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserAccess } from '../types/user-types';
import { useRouter } from 'next/navigation';

// Define the user role type to match the database enum
export type UserRole = 'basic_user' | 'premium_user' | 'admin';

// Local storage key to track if manual login is required
const MANUAL_LOGIN_KEY = 'require_manual_login';
const AUTH_DEBUG_LOG = 'auth_debug_log';

// Define the protected paths for checking in useAuth hook
const protectedPaths = ['/dashboard', '/admin', '/premium-dashboard', '/tag-manager', '/troubleshooting-assistant'];

// Track redirect counts to detect and break loops
const REDIRECT_COUNT_KEY = 'auth_redirect_count';
const MAX_REDIRECTS = 3;
const REDIRECT_RESET_TIME = 30000; // 30 seconds

// Make sure manual login is required by default
const DEFAULT_REQUIRE_MANUAL_LOGIN = true;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isManualLoginRequired, setIsManualLoginRequired] = useState(DEFAULT_REQUIRE_MANUAL_LOGIN);
  const [redirectsDetected, setRedirectsDetected] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  // Debug mode for development
  const DEBUG_AUTH = process.env.NODE_ENV === 'development';
  
  // Function to add debug entry with timestamp that persists across page loads
  const addDebugEntry = useCallback((action: string, details: any) => {
    if (!DEBUG_AUTH) return;
    
    try {
      // Get existing log
      const existingLog = localStorage.getItem(AUTH_DEBUG_LOG);
      const log = existingLog ? JSON.parse(existingLog) : [];
      
      // Add new entry with timestamp
      const entry = {
        timestamp: new Date().toISOString(),
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        url: window.location.href
      };
      
      // Keep only the last 100 entries to avoid storage issues
      if (log.length > 100) {
        log.shift();
      }
      
      log.push(entry);
      
      // Save back to localStorage
      localStorage.setItem(AUTH_DEBUG_LOG, JSON.stringify(log));
      
      // Also log to console
      console.log(`[useAuth][${action}]`, details);
    } catch (error) {
      console.error('Error saving debug log:', error);
    }
  }, [DEBUG_AUTH]);
  
  // Function to log if in debug mode
  const debugLog = useCallback((...args: any[]) => {
    if (DEBUG_AUTH) {
      const action = args[0] || 'log';
      const details = args.length > 1 ? args.slice(1).join(' ') : '';
      addDebugEntry(action, details);
    }
  }, [DEBUG_AUTH, addDebugEntry]);

  // Clear debug log on demand
  const clearDebugLog = useCallback(() => {
    localStorage.removeItem(AUTH_DEBUG_LOG);
    console.log('[useAuth] Debug log cleared');
  }, []);

  // Function to set manual login requirement
  const requireManualLogin = useCallback((required: boolean) => {
    try {
      setIsManualLoginRequired(required);
      localStorage.setItem('require_manual_login', required ? 'true' : 'false');
      document.cookie = required
        ? `require_manual_login=true; path=/; max-age=2592000`
        : `require_manual_login=false; path=/; max-age=2592000`;
      
      debugLog('setManualLoginRequirement', { required });
    } catch (error) {
      console.error('Error setting manual login requirement:', error);
      debugLog('setManualLoginRequirementError', error);
    }
  }, [debugLog]);

  // Check if manual login is required
  const checkManualLoginRequired = useCallback(() => {
    try {
      // Always default to requiring manual login if not explicitly set to false
      const storedValue = localStorage.getItem('require_manual_login');
      
      // Check both localStorage and cookies
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('require_manual_login='))
        ?.split('=')[1];
        
      debugLog('checkManualLoginRequired', { 
        localStorage: storedValue, 
        cookie: cookieValue,
        defaultValue: DEFAULT_REQUIRE_MANUAL_LOGIN
      });
      
      // If we're on the sign-in page, force manual login to true to prevent redirects
      if (window.location.pathname.includes('/auth/signin')) {
        debugLog('onSignInPage', 'Enforcing manual login requirement');
        setIsManualLoginRequired(true);
        
        // Update storage to be consistent
        localStorage.setItem('require_manual_login', 'true');
        document.cookie = `require_manual_login=true; path=/; max-age=2592000`;
        
        return true;
      }
      
      // Default to requiring manual login
      const requireManualLogin = storedValue === null ? DEFAULT_REQUIRE_MANUAL_LOGIN : storedValue === 'true';
      
      // Update state to match
      setIsManualLoginRequired(requireManualLogin);
      
      // Set the cookie value to match localStorage for middleware
      if (requireManualLogin) {
        document.cookie = `require_manual_login=true; path=/; max-age=2592000`;
      } else {
        document.cookie = `require_manual_login=false; path=/; max-age=2592000`;
      }
      
      return requireManualLogin;
    } catch (error) {
      console.error('Error checking manual login requirement:', error);
      debugLog('checkManualLoginRequiredError', error);
      return DEFAULT_REQUIRE_MANUAL_LOGIN;
    }
  }, [debugLog]);

  const fetchUserAccess = useCallback(async (userId: string): Promise<UserAccess> => {
    try {
      debugLog('fetchingUserAccess', { userId });
      
      // First check if this is a special test user that should have premium access
      // This is a fallback mechanism for testing/development
      if (userId === '177b3ff9-e888-47c5-8659-8368a5f73e78') {
        debugLog('specialUserDetected', 'Using premium role for test user');
        return {
          user_id: userId,
          role: 'premium_user',
          is_active: true,
          created_at: new Date().toISOString(),
        };
      }
      
      // Try to get the user access record from the database
      // Use maybeSingle() instead of single() to avoid errors when no rows are found
      const { data, error } = await supabase
        .from('user_access')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        debugLog('errorFetchingUserAccess', error);
        console.error('Error fetching user access:', error);
        
        // If we get a 406 error or other database error, provide a default access
        // instead of returning null to prevent access issues
        const isPremiumUser = userId === '177b3ff9-e888-47c5-8659-8368a5f73e78';
        const defaultAccess: UserAccess = {
          user_id: userId,
          role: isPremiumUser ? 'premium_user' : 'basic_user',
          is_active: true,
          created_at: new Date().toISOString(),
        };
        debugLog('usingDefaultAccessDueToError', { userId, error: error.message, role: defaultAccess.role });
        return defaultAccess;
      }
      
      // If no record was found, we'll return null
      if (!data) {
        debugLog('noUserAccessFound', { userId });
        console.log('No user access record found for user:', userId);
        
        // Try to create a default user access record
        try {
          const isPremiumUser = userId === '177b3ff9-e888-47c5-8659-8368a5f73e78';
          const { data: insertData, error: insertError } = await supabase
            .from('user_access')
            .insert({
              user_id: userId,
              role: isPremiumUser ? 'premium_user' : 'basic_user',
              is_active: true
            })
            .select()
            .single();
            
          if (insertError) {
            debugLog('errorCreatingDefaultAccess', insertError);
            console.error('Error creating default user access:', insertError);
            
            // Even if insertion fails, provide a default access object
            // to prevent access issues
            const defaultAccess: UserAccess = {
              user_id: userId,
              role: isPremiumUser ? 'premium_user' : 'basic_user',
              is_active: true,
              created_at: new Date().toISOString(),
            };
            debugLog('usingDefaultAccessDueToInsertError', { userId, error: insertError.message, role: defaultAccess.role });
            return defaultAccess;
          } else if (insertData) {
            debugLog('createdDefaultUserAccess', insertData);
            return insertData as UserAccess;
          }
        } catch (insertErr) {
          debugLog('exceptionCreatingDefaultAccess', insertErr);
          console.error('Exception creating default user access:', insertErr);
          
          // If there's an exception during insertion, provide a default access
          const isPremiumUser = userId === '177b3ff9-e888-47c5-8659-8368a5f73e78';
          const defaultAccess: UserAccess = {
            user_id: userId,
            role: isPremiumUser ? 'premium_user' : 'basic_user',
            is_active: true,
            created_at: new Date().toISOString(),
          };
          debugLog('usingDefaultAccessDueToException', { userId, role: defaultAccess.role });
          return defaultAccess;
        }
        
        // If we reach here, we provide a default access object rather than null
        const isPremiumUser = userId === '177b3ff9-e888-47c5-8659-8368a5f73e78';
        const defaultAccess: UserAccess = {
          user_id: userId,
          role: isPremiumUser ? 'premium_user' : 'basic_user',
          is_active: true,
          created_at: new Date().toISOString(),
        };
        debugLog('usingDefaultAccessAsFallback', { userId, role: defaultAccess.role });
        return defaultAccess;
      }

      debugLog('userAccessFound', { role: data.role, userId });
      return data as UserAccess;
    } catch (error) {
      debugLog('exceptionInFetchUserAccess', error);
      console.error('Error in fetchUserAccess:', error);
      
      // In case of any uncaught exception, provide a default access
      // instead of returning null
      const isPremiumUser = userId === '177b3ff9-e888-47c5-8659-8368a5f73e78';
      const defaultAccess: UserAccess = {
        user_id: userId,
        role: isPremiumUser ? 'premium_user' : 'basic_user',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      debugLog('usingDefaultAccessAfterException', { userId, role: defaultAccess.role });
      return defaultAccess;
    }
  }, [debugLog]);

  const routeBasedOnRole = useCallback(async (user: User, fromSignIn = false) => {
    const pathname = window.location.pathname;
    if (!pathname.includes('/auth/signin') && !fromSignIn) {
      return;
    }
    try {
      if (!user?.id) {
        console.error('No user ID provided for routing');
        return;
      }
      
      const access = await fetchUserAccess(user.id);
      // Since fetchUserAccess now always returns an access object, we just need to check for the right role
      const isPremiumUser = user.id === '177b3ff9-e888-47c5-8659-8368a5f73e78';
      
      // If the access doesn't match what we expect for a premium user, override it
      if (isPremiumUser && access.role !== 'premium_user') {
        debugLog('correctingAccessForPremiumUser', { userId: user.id, oldRole: access.role });
        setUserAccess({ 
          user_id: user.id, 
          role: 'premium_user', 
          is_active: true, 
          created_at: new Date().toISOString() 
        });
      } else {
        setUserAccess(access);
      }
      
      if (checkManualLoginRequired()) {
        return;
      }
      const lastRedirectTime = localStorage.getItem('last_redirect_time');
      const now = Date.now();
      if (lastRedirectTime && (now - parseInt(lastRedirectTime)) < 5000) {
        return;
      }
      localStorage.setItem('last_redirect_time', now.toString());
      document.cookie = `last_redirect_time=${now}; path=/; max-age=5`;
      if (access.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error routing based on role:', error);
      const lastRedirectTime = localStorage.getItem('last_redirect_time');
      const now = Date.now();
      if (lastRedirectTime && (now - parseInt(lastRedirectTime)) < 5000) {
        return;
      }
      localStorage.setItem('last_redirect_time', now.toString());
      document.cookie = `last_redirect_time=${now}; path=/; max-age=5`;
      router.push('/dashboard');
    }
  }, [fetchUserAccess, checkManualLoginRequired, router]);

  const signIn = useCallback(async ({ email, password, remember }: { email: string; password: string; remember: boolean }) => {
    try {
      setLoading(true);
      
      debugLog('signInAttempt', { email, remember });
      
      // Track login attempts in localStorage
      const loginAttempts = parseInt(localStorage.getItem('login_attempts') || '0');
      localStorage.setItem('login_attempts', (loginAttempts + 1).toString());
      
      // Always require manual login regardless of the remember option
      // This ensures users must manually sign in each time
      requireManualLogin(DEFAULT_REQUIRE_MANUAL_LOGIN);
      
      // For development, store auth debug timestamp
      if (DEBUG_AUTH) {
        localStorage.setItem('auth_debug_timestamp', Date.now().toString());
      }
      
      // Check for redirect loops before attempting signin
      const lastRedirectTime = localStorage.getItem('last_redirect_time');
      const now = Date.now();
      if (lastRedirectTime && (now - parseInt(lastRedirectTime)) < 5000) {
        debugLog('preventingRedirectLoop', {
          timeSinceLastRedirect: now - parseInt(lastRedirectTime),
          threshold: 5000,
          currentPath: window.location.pathname
        });
        
        // If we detect potential redirect loop, delay next sign-in attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        debugLog('signInError', error.message);
        throw error;
      }

      debugLog('signInSuccess', { userId: data?.user?.id });
      
      // Store session info for cross-page debugging
      if (data?.user) {
        localStorage.setItem('last_auth_user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          timestamp: Date.now()
        }));
        
        if (data.session) {
          localStorage.setItem('last_auth_session', JSON.stringify({
            id: data.session.access_token?.substring(0, 10) || 'none',
            created_at: new Date().toISOString(),
            expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'unknown'
          }));
        }
        
        // Update the state
        setUser(data.user);
        setSession(data.session);
        
        try {
          // Fetch user access before routing
          const access = await fetchUserAccess(data.user.id);
          debugLog('fetchedUserAccess', access);
          
          // Check if there's a saved return URL
          const savedReturnUrl = localStorage.getItem('auth_return_url');
          const validReturnPaths = ['/dashboard', '/tag-manager', '/troubleshooting-assistant'];
          const hasValidReturnUrl = savedReturnUrl && validReturnPaths.some(path => savedReturnUrl.startsWith(path));
          
          if (hasValidReturnUrl) {
            debugLog('returnUrlFound', { returnUrl: savedReturnUrl });
            
            // Clear the saved return URL
            localStorage.removeItem('auth_return_url');
            
            // Store navigation intent to verify after reload
            localStorage.setItem('auth_navigation_intent', JSON.stringify({
              from: window.location.pathname,
              to: savedReturnUrl,
              timestamp: Date.now()
            }));
            
            // Set last redirect time to prevent loops
            localStorage.setItem('last_redirect_time', Date.now().toString());
            
            // Use a small delay to ensure the debug logs are written 
            // before the page transition
            setTimeout(() => {
              router.push(`${savedReturnUrl}?from_auth=true`);
            }, 300);
            
            return { success: true, data };
          }
          
          if (access) {
            setUserAccess(access);
            
            // Store user role for cross-page debugging
            localStorage.setItem('user_role', access.role);
            
            // Route based on user role
            const destinationPath = access.role === 'admin' 
              ? '/admin' 
              : '/dashboard';  // Both premium and basic users go to regular dashboard
            
            debugLog('redirectingTo', destinationPath);
            
            // Store navigation intent to verify after reload
            localStorage.setItem('auth_navigation_intent', JSON.stringify({
              from: window.location.pathname,
              to: destinationPath,
              timestamp: Date.now()
            }));
            
            // Set last redirect time to prevent loops
            localStorage.setItem('last_redirect_time', Date.now().toString());
            
            // Use a longer delay to ensure the debug logs are written 
            // before the page transition
            setTimeout(() => {
              router.push(`${destinationPath}?from_auth=true`);
            }, 300);
          } else {
            // Default user access
            const defaultAccess: UserAccess = {
              user_id: data.user.id,
              role: data.user.id === '177b3ff9-e888-47c5-8659-8368a5f73e78' ? 'premium_user' : 'basic_user',
              is_active: true,
              created_at: new Date().toISOString(),
            };
            setUserAccess(defaultAccess);
            localStorage.setItem('user_role', 'basic_user');
            
            debugLog('noUserAccessFound', 'Using default and routing to dashboard');
            
            // Store navigation intent to verify after reload
            localStorage.setItem('auth_navigation_intent', JSON.stringify({
              from: window.location.pathname,
              to: '/dashboard',
              timestamp: Date.now()
            }));
            
            // Set last redirect time to prevent loops
            localStorage.setItem('last_redirect_time', Date.now().toString());
            
            // Use a longer delay to ensure the debug logs are written 
            // before the page transition
            setTimeout(() => {
              router.push('/dashboard?from_auth=true');
            }, 300);
          }
        } catch (accessError) {
          debugLog('errorFetchingAccess', accessError);
          // Don't let access fetching errors prevent successful login
          return { success: true, data };
        }
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      debugLog('signInCaughtError', error.message);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  }, [fetchUserAccess, debugLog, requireManualLogin, router]);

  const signUp = useCallback(async ({ email, password, metadata }: { email: string; password: string; metadata?: any }) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      // For email confirmation flows, we won't have a user right away
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      debugLog('signOut', 'User signing out');
      
      // First ensure manual login is required to prevent auto-login
      requireManualLogin(true);
      
      // Reset redirect count to prevent false detection
      localStorage.setItem(REDIRECT_COUNT_KEY, JSON.stringify({ count: 0, timestamp: Date.now() }));
      
      // Call Supabase auth signOut
      await supabase.auth.signOut();
      
      // Clear auth-related state
      setUser(null);
      setSession(null);
      setUserAccess(null);
      
      // Selectively clear localStorage items related to authentication
      // rather than clearing all localStorage which breaks auth flow tracking
      const authKeys = [
        'user_role',
        'last_auth_user',
        'last_auth_session',
        'last_redirect_time',
        'redirect_path',
        'auth_navigation_intent',
        'auth_return_url',
        'last_session_notice',
        'last_recovery_notice',
        'last_error_notice',
        'session_refresh_attempt'
      ];
      
      authKeys.forEach(key => localStorage.removeItem(key));
      
      // Clear specific cookies
      document.cookie = 'require_manual_login=true; path=/; max-age=2592000';
      document.cookie = 'last_redirect_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Add a sign out timestamp to prevent immediate redirects
      localStorage.setItem('last_signout_time', Date.now().toString());
      
      debugLog('signOutComplete', 'Redirecting to sign-in page');
      
      // Use a small delay to ensure cookies and localStorage are updated
      // before navigating to sign-in page
      setTimeout(() => {
        router.push('/auth/signin?signout=success');
      }, 300);
    } catch (error) {
      console.error('Sign out error:', error);
      debugLog('signOutError', error);
      toast({
        title: 'Error signing out',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, router, debugLog, requireManualLogin]);

  // Function to increment and check redirect count
  const trackRedirect = useCallback(() => {
    try {
      // Get current count and timestamp
      const redirectData = localStorage.getItem(REDIRECT_COUNT_KEY);
      const now = Date.now();
      let count = 0;
      let timestamp = now;
      
      if (redirectData) {
        try {
          const data = JSON.parse(redirectData);
          // Reset count if it's been more than the reset time
          if (now - data.timestamp > REDIRECT_RESET_TIME) {
            count = 1;
            timestamp = now;
          } else {
            count = data.count + 1;
            timestamp = now;
          }
        } catch (e) {
          count = 1;
          timestamp = now;
        }
      } else {
        count = 1;
        timestamp = now;
      }
      
      // Store updated count
      localStorage.setItem(REDIRECT_COUNT_KEY, JSON.stringify({ count, timestamp }));
      
      // Check if we've exceeded the limit
      if (count > MAX_REDIRECTS) {
        debugLog('redirectLoopDetected', `Detected ${count} redirects in ${REDIRECT_RESET_TIME}ms`);
        // Force manual login to break the loop
        requireManualLogin(true);
        // Clear the redirect path
        localStorage.removeItem('redirect_path');
        // Show error toast
        toast({
          title: "Authentication issue detected",
          description: "Too many redirects detected. Please try signing in manually.",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Error tracking redirects:', e);
      return false;
    }
  }, [debugLog, requireManualLogin, toast]);

  // Function to check if current path is protected
  const isProtectedPath = useCallback((path: string) => {
    // Root path is not protected
    if (path === '/') return false;
    
    // Auth paths are not protected
    if (path.startsWith('/auth/')) return false;
    
    // Public pages are not protected
    const publicPaths = ['/pricing', '/about', '/contact', '/help', '/privacy', '/terms'];
    if (publicPaths.some(p => path === p)) return false;
    
    // Check against protected paths
    return protectedPaths.some(p => path.startsWith(p));
  }, []);

  // Global initialization - delayed to avoid race conditions
  useEffect(() => {
    let isMounted = true;
    const pathname = window.location.pathname;
    debugLog('init', { pathname });
    
    // Handle invalid refresh token errors
    const handleSupabaseTokenError = () => {
      debugLog('invalidRefreshToken', 'Handling invalid refresh token');
      // Clear auth state
      setUser(null);
      setSession(null);
      setUserAccess(null);
      
      // Ensure manual login is required
      requireManualLogin(true);
      
      // Clear supabase cookies to prevent further errors
      try {
        document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Also clear localStorage tokens
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('supabase.auth.token');
      } catch (e) {
        console.error('Error clearing tokens:', e);
      }
    };
    
    // Listen for token errors
    const handleTokenErrorEvent = (event: any) => {
      if (event.detail?.error?.message?.includes('Invalid Refresh Token')) {
        handleSupabaseTokenError();
      }
    };
    
    // Add listener for auth error events
    window.addEventListener('supabase.auth.error', handleTokenErrorEvent);
    
    // First thing: check manual login requirement
    const manualLoginRequired = checkManualLoginRequired();
    debugLog('initialManualLoginCheck', { manualLoginRequired });
    
    // If manual login is not required, enforce it (default to true for security)
    if (!manualLoginRequired) {
      debugLog('enforcingManualLogin', 'Setting manual login to required by default');
      requireManualLogin(true);
    }
    
    // Get the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const fromAuth = urlParams.get('from_auth') === 'true';
    const forceParam = urlParams.get('force') === 'true';
    const signoutSuccess = urlParams.get('signout') === 'success';
    
    // If we came from auth redirection, clean up the URL
    if (fromAuth) {
      debugLog('cleaningUrl', 'Removing from_auth parameter');
      urlParams.delete('from_auth');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
    
    // If we came from a successful signout, clean up the URL
    if (signoutSuccess) {
      debugLog('cleaningUrl', 'Removing signout parameter');
      urlParams.delete('signout');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
    
    // Check if we're on the signin page
    const isSignInPage = pathname.startsWith('/auth/signin');
    
    // Check if we've recently signed out
    const lastSignoutTime = localStorage.getItem('last_signout_time');
    const now = Date.now();
    const recentSignout = lastSignoutTime && (now - parseInt(lastSignoutTime)) < 10000; // 10 seconds
    
    // If we've recently signed out and we're on the signin page, don't do anything else
    if (recentSignout && isSignInPage) {
      debugLog('recentSignout', 'Recently signed out, staying on sign-in page');
      // Clear the last signout time after a successful navigation to sign-in
      localStorage.removeItem('last_signout_time');
      
      // Finish initialization
      setLoading(false);
      setInitialized(true);
      debugLog('initCompletedAfterSignout', 'Initialization completed after signout');
      
      return () => {
        isMounted = false;
      };
    }
    
    // If we're on the signin page with a signout success parameter, don't do anything else
    if (isSignInPage && signoutSuccess) {
      debugLog('signoutSuccess', 'Successfully signed out, staying on sign-in page');
      
      // Finish initialization
      setLoading(false);
      setInitialized(true);
      debugLog('initCompletedAfterSignoutSuccess', 'Initialization completed after signout success');
      
      return () => {
        isMounted = false;
      };
    }
    
    // Add a longer delay before initialization to prevent rapid auth checks on page load
    const initTimer = setTimeout(async () => {
      if (!isMounted) return;
      
      try {
        debugLog('sessionCheck', 'Getting session from Supabase');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          debugLog('sessionCheckError', error.message);
          
          // Handle specific errors differently rather than throwing
          if (error.message.includes("Failed to fetch") || error.message.includes("Network Error")) {
            debugLog('networkError', 'Network error during session check - allowing navigation');
            setLoading(false);
            setInitialized(true);
            
            // Allow navigation without redirecting
            toast({
              title: "Network issue",
              description: "Unable to verify your session due to network issues.",
              variant: "default",
            });
            return;
          }
          
          throw error;
        }
        
        // Check for special cases that should skip redirect logic
        const isFromSignIn = urlParams.get('from_signin') === 'true';
        const hasExplicitSession = urlParams.get('has_session') === 'true';
        
        // If we're coming from explicit sign-in, reset the flag
        if (isFromSignIn) {
          debugLog('fromSignInDetected', 'Coming from explicit sign-in');
          localStorage.setItem('explicit_sign_in', 'true');
        }
        
        // Special handling for coming directly from sign-in with explicit session
        if (isFromSignIn && hasExplicitSession && !data?.session) {
          debugLog('explicitSessionButNotDetected', 'Session was explicitly set but not detected by Supabase');
          
          // Try to recover session from localStorage
          try {
            const storedSession = localStorage.getItem('sb:session');
            if (storedSession) {
              const parsedSession = JSON.parse(storedSession);
              debugLog('restoringSessionFromLocalStorage', 'Found session in localStorage');
              
              // Set session from localStorage
              setSession(parsedSession);
              setUser(parsedSession.user);
              
              // Verify and set user access
              if (parsedSession.user) {
                const access = await fetchUserAccess(parsedSession.user.id);
                setUserAccess(access);
              }
              
              // Complete initialization without redirect
              setLoading(false);
              setInitialized(true);
              debugLog('restoredSessionState', 'Initialized with recovered session');
              return;
            }
          } catch (e) {
            debugLog('sessionRecoveryError', e);
          }
        }
        
        // If we're on a protected path and this was loaded via a redirect from sign-in
        if (isProtectedPath(pathname) && isFromSignIn && !data?.session) {
          // Special handling for pages coming from sign-in with explicit session marker
          if (hasExplicitSession) {
            debugLog('noSessionAfterExplicitSignIn', 'No session found after explicit sign-in - allowing access anyway');
            
            // Allow access to the page but warn the user that there might be session issues
            toast({
              title: "Authentication notice",
              description: "Your login was successful but session verification is pending. Some features may be limited.",
              variant: "default",
            });
            
            setLoading(false);
            setInitialized(true);
            return;
          }
          
          debugLog('noSessionAfterSignIn', 'No session found after sign-in redirect - staying on page');
          // Stay on the current page but warn the user
          toast({
            title: "Authentication issue",
            description: "Unable to verify your session. Please try signing in again.",
            variant: "destructive",
          });
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        // If we're not on a protected path, just update state and stop
        if (!isProtectedPath(pathname) && !isSignInPage) {
          debugLog('notOnProtectedPath', 'Current path is not protected, skipping redirect logic');
          
          // Update state with session if available
          if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
            
            // Fetch user access if we have a user
            if (data.session.user) {
              const access = await fetchUserAccess(data.session.user.id);
              setUserAccess(access);
            }
          }
          
          // Set loading and initialization to complete
          setLoading(false);
          setInitialized(true);
          debugLog('initCompletedOnNonProtectedPath', 'Initialization completed on non-protected path');
          return;
        }
        
        // Check if we have a stored session in localStorage when Supabase doesn't find one
        // This helps with cases where the session exists but Supabase fails to retrieve it
        if (!data?.session && isProtectedPath(pathname)) {
          try {
            const storedSession = localStorage.getItem('sb:session');
            if (storedSession) {
              const parsedSession = JSON.parse(storedSession);
              if (parsedSession && parsedSession.user) {
                debugLog('usingStoredSession', 'Session not found via API but exists in localStorage');
                
                // Use the localStorage session
                setSession(parsedSession);
                setUser(parsedSession.user);
                
                // Get user access
                const access = await fetchUserAccess(parsedSession.user.id);
                setUserAccess(access);
                
                // Complete initialization without redirect
                setLoading(false);
                setInitialized(true);
                
                // Check if we've already shown the session notice recently
                const lastSessionNotice = localStorage.getItem('last_session_notice');
                const now = Date.now();
                const recentNotice = lastSessionNotice && (now - parseInt(lastSessionNotice)) < 300000; // 5 minutes
                
                if (!recentNotice) {
                  // Warn the user that there might be session issues, but only once per 5 minutes
                  toast({
                    title: "Session notice",
                    description: "Using saved session data. Some features may require refreshing.",
                    variant: "default",
                  });
                  
                  // Record that we showed the notice
                  localStorage.setItem('last_session_notice', now.toString());
                }
                return;
              }
            }
          } catch (e) {
            debugLog('storedSessionError', e);
          }
        }
        
        // Handle authenticated state - if there's a session
        if (data?.session) {
          debugLog('sessionFound', {
            userId: data.session.user.id,
            expires: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'unknown'
          });
          
          setSession(data.session);
          setUser(data.session.user);
          
          // If we're on a sign-in page with a valid session, redirect to dashboard
          if (isSignInPage) {
            // If coming directly from sign-in, skip the redirect
            if (isFromSignIn) {
              debugLog('fromSigninPage', 'Skipping redirect as already redirecting from signin page');
              setLoading(false);
              setInitialized(true);
              return;
            }
            
            // Skip redirect if force parameter is present
            if (forceParam) {
              debugLog('forceParameterDetected', 'Skipping redirect from sign-in page');
              setLoading(false);
              setInitialized(true);
              return;
            }
            
            // Check if we can redirect
            if (!trackRedirect()) {
              // Too many redirects detected
              setLoading(false);
              setInitialized(true);
              return;
            }
            
            const access = await fetchUserAccess(data.session.user.id);
            setUserAccess(access);
            const dashboardPath = access.role === 'admin' ? '/admin' : '/dashboard';
            debugLog('redirectingFromSignInPage', { to: dashboardPath });
            localStorage.setItem('explicit_sign_in', 'true');
            router.push(`${dashboardPath}?from_auth=true`);
          }
          
          // Update user access for protected pages
          const access = await fetchUserAccess(data.session.user.id);
          setUserAccess(access);
          
          // If this is a protected path, we're authenticated, so just set loading to false and return
          setLoading(false);
          setInitialized(true);
          debugLog('authenticatedOnProtectedPath', 'User is authenticated on protected path');
          return;
        } else {
          // Handle unauthenticated state
          debugLog('noSessionFound', 'User is not logged in');
          
          // Special handling for pages loaded directly from sign-in
          if (isFromSignIn && isProtectedPath(pathname)) {
            debugLog('fromSignInButNoSession', 'Coming from sign-in but no session found');
            // This is a special case - we should not redirect but show an error
            toast({
              title: "Session issue",
              description: "Your login session could not be verified. Please try signing in again.",
              variant: "destructive",
            });
            setLoading(false);
            setInitialized(true);
            return;
          }
          
          // If we're on a protected path but no session, redirect to sign-in
          if (isProtectedPath(pathname)) {
            // Skip redirect if force parameter is present
            if (forceParam) {
              debugLog('forceParameterDetected', 'Skipping redirect to sign-in page');
              setLoading(false);
              setInitialized(true);
              return;
            }
            
            // Check if we can redirect
            if (!trackRedirect()) {
              // Too many redirects detected
              setLoading(false);
              setInitialized(true);
              return;
            }
            
            // Check if there's a session cookie or token in localStorage that we might be missing
            const hasRefreshToken = document.cookie.includes('sb-refresh-token') || 
                                  localStorage.getItem('sb-refresh-token');
            
            if (hasRefreshToken) {
              debugLog('foundTokenButNoSession', 'Found token but no session - allowing access temporarily');
              
              // Check if we've already shown the session recovery notice recently
              const lastRecoveryNotice = localStorage.getItem('last_recovery_notice');
              const now = Date.now();
              const recentNotice = lastRecoveryNotice && (now - parseInt(lastRecoveryNotice)) < 300000; // 5 minutes
              
              if (!recentNotice) {
                // Allow access to the page but warn the user
                toast({
                  title: "Session recovery",
                  description: "Attempting to recover your session. Please refresh if you experience issues.",
                  variant: "default",
                });
                
                // Record that we showed the notice
                localStorage.setItem('last_recovery_notice', now.toString());
              }
              
              // Try refreshing the page once to see if that helps recover the session
              const hasRefreshed = localStorage.getItem('session_refresh_attempt');
              if (!hasRefreshed) {
                localStorage.setItem('session_refresh_attempt', 'true');
                // Set a timeout to clear this flag so we don't get stuck
                setTimeout(() => {
                  localStorage.removeItem('session_refresh_attempt');
                }, 30000);
                
                // Complete initialization without redirect
                setLoading(false);
                setInitialized(true);
                return;
              }
              
              // Clear the refresh attempt flag
              localStorage.removeItem('session_refresh_attempt');
            }
            
            debugLog('accessingProtectedPathWithoutSession', { pathname, redirecting: true });
            
            // Save the current path to redirect back after login
            localStorage.setItem('auth_return_url', pathname);
            
            // Clear explicit_sign_in flag since we're redirecting to sign-in
            localStorage.removeItem('explicit_sign_in');
            
            router.push('/auth/signin');
            return;
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        debugLog('initError', error);
        
        // Check if there might be an auth token that's not being recognized
        const hasAuthTokens = document.cookie.includes('sb-refresh-token') || 
                             localStorage.getItem('sb-refresh-token');
        
        if (hasAuthTokens && isProtectedPath(pathname)) {
          debugLog('tokensPresentDespiteError', 'Auth tokens found despite error - allowing access');
          
          // Check if we've already shown the session error notice recently
          const lastErrorNotice = localStorage.getItem('last_error_notice');
          const now = Date.now();
          const recentNotice = lastErrorNotice && (now - parseInt(lastErrorNotice)) < 300000; // 5 minutes
          
          if (!recentNotice) {
            // Allow access but warn the user
            toast({
              title: "Session error",
              description: "Error verifying your session. Some features may be limited.",
              variant: "default",
            });
            
            // Record that we showed the notice
            localStorage.setItem('last_error_notice', now.toString());
          }
          
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        // Force manual login if there's an error during initialization
        localStorage.setItem('require_manual_login', 'true');
        document.cookie = `require_manual_login=true; path=/; max-age=3600`;
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
          debugLog('initComplete', { authenticated: !!user });
        }
      }
    }, 500);
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (isMounted) {
        debugLog('Auth state changed:', _event);
        
        // Handle auth error events specifically
        if (_event === 'TOKEN_REFRESHED') {
          debugLog('tokenRefreshed', 'Token was successfully refreshed');
        }
        
        if (_event === 'SIGNED_OUT') {
          debugLog('signedOut', 'User was signed out');
          // Clear all tokens to ensure we don't have invalid tokens
          try {
            localStorage.removeItem('sb-refresh-token');
            localStorage.removeItem('sb-access-token');
            localStorage.removeItem('supabase.auth.token');
          } catch (e) {
            console.error('Error clearing tokens during signout:', e);
          }
        }
        
        setSession(session);
        setUser(session?.user || null);
        
        // Fetch user access if we have a session
        if (session?.user) {
          const access = await fetchUserAccess(session.user.id);
          setUserAccess(access);
        } else {
          setUserAccess(null);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      subscription.unsubscribe();
      window.removeEventListener('supabase.auth.error', handleTokenErrorEvent);
    };
  }, [fetchUserAccess, router, isProtectedPath, trackRedirect, requireManualLogin]);

  // Function to clear all auth tokens and cookies
  const clearAuthTokens = useCallback(() => {
    debugLog('clearingAuthTokens', 'Manually clearing all auth tokens');
    
    try {
      // Clear cookies
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Clear localStorage tokens
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('supabase.auth.token');
      
      // Also clear specific auth items
      const authKeys = [
        'user_role',
        'last_auth_user',
        'last_auth_session',
        'auth_navigation_intent',
        'auth_return_url'
      ];
      
      authKeys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Error clearing auth tokens:', e);
    }
  }, [debugLog]);

  return {
    user,
    userAccess,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    routeBasedOnRole,
    debugLog,
    clearDebugLog,
    requireManualLogin,
    isManualLoginRequired,
    clearAuthTokens,
  };
} 