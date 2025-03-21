import { useCallback, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../lib/supabase-client';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserAccess } from '../types/user-types';

// Define the user role type to match the database enum
export type UserRole = 'basic_user' | 'premium_user' | 'admin';

// Local storage key to track if manual login is required
const MANUAL_LOGIN_KEY = 'require_manual_login';
const AUTH_DEBUG_LOG = 'auth_debug_log';

// Define the protected paths for checking in useAuth hook
const protectedPaths = ['/dashboard', '/admin', '/premium-dashboard', '/tag-manager', '/troubleshooting-assistant'];

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

  const fetchUserAccess = useCallback(async (userId: string): Promise<UserAccess | null> => {
    try {
      const { data, error } = await supabase
        .from('user_access')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user access:', error);
        return null;
      }

      return data as UserAccess;
    } catch (error) {
      console.error('Error in fetchUserAccess:', error);
      return null;
    }
  }, []);

  const routeBasedOnRole = useCallback(async (user: User, fromSignIn = false) => {
    const pathname = window.location.pathname;
    if (!pathname.includes('/auth/signin') && !fromSignIn) {
      return;
    }
    try {
      const access = await fetchUserAccess(user.id);
      if (!access) {
        setUserAccess({ user_id: user.id, role: 'basic_user', is_active: true, created_at: new Date().toISOString() });
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
        window.location.replace('/dashboard');
        return;
      }
      setUserAccess(access);
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
        window.location.replace('/admin');
      } else {
        window.location.replace('/dashboard');
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
      window.location.replace('/dashboard');
    }
  }, [fetchUserAccess, checkManualLoginRequired]);

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
              window.location.href = `${savedReturnUrl}?from_auth=true`;
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
              window.location.href = `${destinationPath}?from_auth=true`;
            }, 300);
          } else {
            // Default user access
            const defaultAccess: UserAccess = {
              user_id: data.user.id,
              role: 'basic_user',
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
              window.location.href = '/dashboard?from_auth=true';
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
  }, [fetchUserAccess, debugLog, requireManualLogin]);

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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserAccess(null);
      localStorage.clear();
      document.cookie = 'require_manual_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'last_redirect_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.replace('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error signing out',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Global initialization - delayed to avoid race conditions
  useEffect(() => {
    let isMounted = true;
    const pathname = window.location.pathname;
    debugLog('init', { pathname });
    
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
    
    // If we came from auth redirection, clean up the URL
    if (fromAuth) {
      debugLog('cleaningUrl', 'Removing from_auth parameter');
      urlParams.delete('from_auth');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
    
    // Check if we just navigated from a login
    const navIntent = localStorage.getItem('auth_navigation_intent');
    if (navIntent) {
      try {
        const intent = JSON.parse(navIntent);
        const now = Date.now();
        // If this is a recent navigation (within last 5 seconds)
        if (now - intent.timestamp < 5000) {
          debugLog('navigationCheck', {
            expected: intent.to,
            actual: pathname,
            elapsed: now - intent.timestamp
          });
          
          // If we're not on the expected page
          if (pathname !== intent.to) {
            debugLog('navigationMismatch', {
              expected: intent.to,
              actual: pathname,
              elapsed: now - intent.timestamp
            });
            // Track the redirect mismatch
            setRedirectsDetected(prev => prev + 1);
          }
        }
        // Clear the intent after checking
        localStorage.removeItem('auth_navigation_intent');
      } catch (e) {
        localStorage.removeItem('auth_navigation_intent');
      }
    }
    
    // If we have detected too many redirects, force manual login to break the loop
    if (redirectsDetected > 2) {
      debugLog('tooManyRedirects', 'Detected multiple redirects, enforcing manual login');
      requireManualLogin(true);
      
      // Reset the counter
      setRedirectsDetected(0);
      
      // Show a message if possible
      if (typeof window !== 'undefined') {
        toast({
          title: "Authentication issue detected",
          description: "Manual login is now required for security reasons.",
          variant: "destructive",
        });
      }
    }
    
    // Add a longer delay before initialization to prevent rapid auth checks on page load
    const initTimer = setTimeout(async () => {
      if (!isMounted) return;
      
      try {
        debugLog('sessionCheck', 'Getting session from Supabase');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          debugLog('sessionCheckError', error.message);
          throw error;
        }
        
        // Parse URL params to check for redirects, force params, etc.
        const urlParams = new URLSearchParams(window.location.search);
        const fromAuth = urlParams.get('from_auth') === 'true';
        const fromSignin = urlParams.get('from_signin') === 'true';
        const force = urlParams.get('force') === 'true';
        
        // Check for recent navigation and redirects
        const navIntent = localStorage.getItem('auth_navigation_intent');
        const lastRedirectTime = localStorage.getItem('last_redirect_time');
        const now = Date.now();
        const recentRedirect = lastRedirectTime && (now - parseInt(lastRedirectTime)) < 5000;
        
        // If there was a recent redirect, don't redirect again to prevent loops
        if (recentRedirect) {
          debugLog('recentRedirectDetected', {
            timeSinceLastRedirect: lastRedirectTime ? now - parseInt(lastRedirectTime) : 'unknown',
            threshold: 5000,
            currentPath: window.location.pathname
          });
          
          // Clear navigation intent to prevent future redirects
          localStorage.removeItem('auth_navigation_intent');
          
          // Update state but don't redirect
          if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
          
          // Set loading and initialization to complete
          setLoading(false);
          setInitialized(true);
          debugLog('initCompletedWithoutRedirect', 'Initialized without redirect due to recent redirect');
          return;
        }
        
        if (data?.session) {
          debugLog('sessionFound', {
            userId: data.session.user.id,
            expires: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'unknown'
          });
          
          setSession(data.session);
          setUser(data.session.user);
          
          // If we're on a sign-in page and not forcing to stay, redirect to the appropriate dashboard
          const isOnAuthPage = pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup');
          
          // Fetch user access if we have a user
          if (data.session.user) {
            const access = await fetchUserAccess(data.session.user.id);
            
            if (access) {
              debugLog('userAccessFound', { role: access.role });
              setUserAccess(access);
              localStorage.setItem('user_role', access.role);
              
              // If we're on a sign-in page and not forcing to stay, redirect
              if (isOnAuthPage && !force) {
                // Get the appropriate dashboard based on role
                const dashboardPath = 
                  access.role === 'admin' ? '/admin' : 
                  '/dashboard';  // All non-admin users go to regular dashboard
                
                debugLog('redirectingFromAuthPage', { to: dashboardPath });
                
                // Redirect but wait a moment to ensure logs are written
                setTimeout(() => {
                  window.location.href = `${dashboardPath}?from_auth=true`;
                }, 100);
                return;
              }
            } else {
              // Default user access
              debugLog('noUserAccess', 'Using default role');
              const defaultAccess: UserAccess = {
                user_id: data.session.user.id,
                role: 'basic_user',
                is_active: true,
                created_at: new Date().toISOString(),
              };
              setUserAccess(defaultAccess);
              localStorage.setItem('user_role', 'basic_user');
              
              // If we're on a sign-in page and not forcing to stay, redirect
              if (isOnAuthPage && !force) {
                debugLog('redirectingFromAuthPageWithDefaultRole', { to: '/dashboard' });
                
                // Redirect but wait a moment to ensure logs are written
                setTimeout(() => {
                  window.location.href = '/dashboard?from_auth=true';
                }, 100);
                return;
              }
            }
            
            // Check if we're on the correct page for the user's role
            if (!isOnAuthPage && !force) {
              const role = access?.role || 'basic_user';
              const isOnWrongPage = (
                (role === 'admin' && !pathname.startsWith('/admin')) ||
                (role !== 'admin' && !(
                  pathname.startsWith('/dashboard') || 
                  pathname.startsWith('/tag-manager') ||
                  pathname.startsWith('/troubleshooting-assistant') ||
                  pathname === '/' ||
                  pathname.startsWith('/debug-auth')
                ))
              );
              
              if (isOnWrongPage) {
                debugLog('incorrectRouteForRole', {
                  role,
                  currentPath: pathname,
                  shouldRedirect: true
                });
                
                // Get the appropriate dashboard based on role
                const dashboardPath = 
                  role === 'admin' ? '/admin' : 
                  '/dashboard';  // All non-admin users go to regular dashboard
                
                debugLog('redirectingToCorrectDashboard', { to: dashboardPath });
                
                // Redirect but wait a moment to ensure logs are written
                setTimeout(() => {
                  window.location.href = `${dashboardPath}?from_auth=true`;
                }, 100);
                return;
              }
            }
          }
        } else {
          debugLog('noSessionFound', 'User is not logged in');
          
          // If we're on a protected path but no session, redirect to sign-in
          if (protectedPaths.some((p: string) => pathname.startsWith(p)) && !force) {
            debugLog('accessingProtectedPathWithoutSession', { pathname, redirecting: true });
            
            setTimeout(() => {
              window.location.href = '/auth/signin';
            }, 100);
            return;
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        debugLog('initError', error);
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
        setSession(session);
        setUser(session?.user || null);
        
        // Fetch user access if we have a session
        if (session?.user) {
          const access = await fetchUserAccess(session.user.id);
          if (access) {
            setUserAccess(access);
          } else {
            // Default user access
            const defaultAccess: UserAccess = {
              user_id: session.user.id,
              role: 'basic_user',
              is_active: true,
              created_at: new Date().toISOString(),
            };
            setUserAccess(defaultAccess);
          }
        } else {
          setUserAccess(null);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      subscription.unsubscribe();
    };
  }, [fetchUserAccess]);

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
  };
} 