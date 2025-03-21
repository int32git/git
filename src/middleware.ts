import { createServerClient } from '@supabase/ssr';
import { CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, setSecurityHeaders } from './lib/security';

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/admin',
  '/tag-manager',
  '/troubleshooting-assistant',
];

// Paths that should not be accessible when authenticated
const authPaths = [
  '/auth/signin',
  '/auth/signup',
];

// API endpoints that should have rate limiting
const apiPaths = [
  '/api/',
];

// Special paths that should be allowed even without auth
const specialPaths = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/images',
];

// Debug mode for middleware
const DEBUG_MIDDLEWARE = process.env.NODE_ENV === 'development';

// Function to log if in debug mode
const debugLog = (...args: any[]) => {
  if (DEBUG_MIDDLEWARE) {
    console.log('[Middleware]', ...args);
  }
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  debugLog('Processing request for path:', pathname);
  
  // Create the response early so we can modify headers
  const res = NextResponse.next();
  
  // Add security headers to all responses
  setSecurityHeaders(res);
  
  // Check if this is a static asset or special path that should bypass auth
  if (specialPaths.some(path => pathname.startsWith(path))) {
    debugLog('Path is a special path, bypassing auth checks');
    return res;
  }
  
  // Check if we have a ?force=true parameter which bypasses redirects
  const url = new URL(req.url);
  const forceParam = url.searchParams.get('force');
  const bypassRedirects = forceParam === 'true';
  
  if (bypassRedirects) {
    debugLog('Bypassing redirects due to force parameter');
    return res;
  }
  
  // Apply rate limiting to API routes
  if (apiPaths.some(path => pathname.startsWith(path))) {
    // More lenient rate limit for API routes
    const rateLimitResponse = checkRateLimit(req, 120, 60 * 1000); // 120 requests per minute
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }
  
  // Apply rate limits to auth endpoints but make it more lenient
  if (pathname.startsWith('/auth/')) {
    // More lenient rate limit for auth routes
    const rateLimitResponse = checkRateLimit(req, 30, 60 * 1000); // 30 requests per minute for auth
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }
  
  // Skip middleware for non-matching routes
  const shouldProcess = [
    ...protectedPaths,
    ...authPaths,
    ...apiPaths
  ].some(path => pathname.startsWith(path));
  
  if (!shouldProcess) {
    debugLog('Path not handled by middleware, skipping');
    return res;
  }
  
  // Skip redirect logic on /api routes - API routes should handle auth themselves
  if (pathname.startsWith('/api/')) {
    return res;
  }
  
  // Check for recent redirects to prevent loops
  const lastRedirectTime = req.cookies.get('last_redirect_time')?.value;
  const now = Date.now();
  const recentRedirect = lastRedirectTime && (now - parseInt(lastRedirectTime)) < 5000;
  
  // Check for recent signout
  const lastSignoutTime = req.cookies.get('last_signout_time')?.value;
  const recentSignout = lastSignoutTime && (now - parseInt(lastSignoutTime)) < 10000; // 10 seconds
  
  // Track redirect counts to prevent loops
  let redirectCount = 0;
  const redirectCountCookie = req.cookies.get('auth_redirect_count')?.value;
  if (redirectCountCookie) {
    try {
      const data = JSON.parse(redirectCountCookie);
      // Reset count if it's been more than 30 seconds
      if (now - data.timestamp > 30000) {
        redirectCount = 1;
      } else {
        redirectCount = data.count + 1;
      }
    } catch (e) {
      redirectCount = 1;
    }
  } else {
    redirectCount = 1;
  }
  
  // Detect potential redirect loops
  const tooManyRedirects = redirectCount > 3;
  
  if (recentRedirect || tooManyRedirects) {
    debugLog('preventingRedirectLoop', {
      timeSinceLastRedirect: lastRedirectTime ? now - parseInt(lastRedirectTime) : 'unknown',
      redirectCount,
      tooManyRedirects,
      threshold: 5000,
      currentPath: pathname
    });
    
    // Set manual login requirement to true to prevent further redirects
    res.cookies.set('require_manual_login', 'true', { 
      maxAge: 2592000,  // 30 days
      path: '/' 
    });
    
    return res;
  }
  
  // If there was a recent signout and we're trying to access auth pages, don't redirect
  if (recentSignout && authPaths.some(path => pathname.startsWith(path))) {
    debugLog('recentSignoutDetected', 'Allowing access to auth page after signout');
    
    // Clear the signout time as we've handled it
    res.cookies.set('last_signout_time', '', { maxAge: 0, path: '/' });
    
    return res;
  }
  
  // Check if manual login is required
  const requireManualLogin = req.cookies.get('require_manual_login')?.value === 'true';
  
  // Check Supabase authentication
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return req.cookies.get(name)?.value;
          },
          set(name, value, options) {
            res.cookies.set(name, value, options);
          },
          remove(name, options) {
            res.cookies.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );
    
    // Get Supabase session, but handle token errors gracefully
    let session = null;
    try {
      const sessionResponse = await supabase.auth.getSession();
      session = sessionResponse.data.session;
    } catch (tokenError: any) {
      // Check for token refresh errors
      if (tokenError.message && tokenError.message.includes('Invalid Refresh Token')) {
        debugLog('invalidRefreshToken', 'Detected invalid refresh token in middleware');
        
        // Clear the invalid tokens
        res.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/' });
        res.cookies.set('sb-access-token', '', { maxAge: 0, path: '/' });
        
        // If user was trying to access a protected route, redirect to sign-in with error
        if (protectedPaths.some(p => pathname.startsWith(p))) {
          debugLog('redirectingToSignIn', 'Redirecting to sign-in due to token error');
          const redirectUrl = new URL('/auth/signin', req.url);
          redirectUrl.searchParams.set('token_error', 'true');
          const redirectResponse = NextResponse.redirect(redirectUrl);
          return redirectResponse;
        }
        
        // Otherwise, just continue with no session
        session = null;
      } else {
        // For other errors, rethrow
        throw tokenError;
      }
    }
    
    debugLog('Authentication check result:', !!session);
    
    // Handle protected routes for unauthenticated users
    if (protectedPaths.some(protectedPath => pathname.startsWith(protectedPath)) && !session) {
      debugLog('Unauthenticated access to protected path:', pathname);
      
      // Check if this is coming directly from a sign-in page
      const fromSignin = url.searchParams.get('from_signin') === 'true';
      if (fromSignin) {
        debugLog('comingFromSigninButNoSession', 'Coming from sign-in page but no session found, allowing access');
        // This is an edge case - user signed in successfully but session not detected in middleware
        // Allow access to the route, and let the client-side handle session errors
        return res;
      }
      
      // If manual login is required, don't redirect to prevent loops
      if (requireManualLogin || recentRedirect || tooManyRedirects) {
        debugLog('Allowing access to protected page without session due to manual login requirement');
        return res;
      }
      
      // Check for cookies to confirm there truly is no session
      const hasAccessToken = req.cookies.get('sb-access-token')?.value;
      const hasRefreshToken = req.cookies.get('sb-refresh-token')?.value;
      
      // If there are tokens but no session, this could be an auth state discrepancy
      // Allow access rather than bouncing back and forth
      if (hasAccessToken || hasRefreshToken) {
        debugLog('accessTokenFoundButNoSession', 'Tokens found but no session, potential auth state mismatch');
        return res;
      }
      
      // Redirect to signin
      debugLog('Redirecting to signin page with return_to parameter');
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('return_to', pathname);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      
      // Track redirect time
      redirectResponse.cookies.set('last_redirect_time', now.toString(), { maxAge: 60 });
      redirectResponse.cookies.set('redirect_path', pathname, { maxAge: 300 });
      
      // Update redirect count
      redirectResponse.cookies.set('auth_redirect_count', JSON.stringify({ 
        count: redirectCount, 
        timestamp: now 
      }), { maxAge: 300, path: '/' });
      
      return redirectResponse;
    }
    
    // Handle auth routes for authenticated users
    if (authPaths.some(authPath => pathname.startsWith(authPath)) && session) {
      debugLog('Authenticated user accessing auth page:', pathname);
      
      // If manual login is required or force parameter is set, allow access
      if (requireManualLogin || forceParam === 'true' || recentRedirect || tooManyRedirects) {
        debugLog('Allowing authenticated user to access auth page due to manual login or force parameter');
        return res;
      }
      
      // Check for from_signin parameter which indicates direct login
      const fromSignin = url.searchParams.get('from_signin') === 'true';
      if (fromSignin) {
        debugLog('Detected direct sign-in, skipping middleware redirect');
        return res;
      }
      
      // Check for return_to parameter
      const returnTo = url.searchParams.get('return_to');
      if (returnTo && protectedPaths.some(path => returnTo.startsWith(path))) {
        debugLog('Redirecting to return URL:', returnTo);
        const redirectUrl = new URL(returnTo, req.url);
        redirectUrl.searchParams.set('from_auth', 'true');
        
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.cookies.set('last_redirect_time', now.toString(), { maxAge: 60 });
        redirectResponse.cookies.set('redirect_path', pathname, { maxAge: 300 });
        
        // Update redirect count
        redirectResponse.cookies.set('auth_redirect_count', JSON.stringify({ 
          count: redirectCount, 
          timestamp: now 
        }), { maxAge: 300, path: '/' });
        
        return redirectResponse;
      }
      
      // Determine correct route based on user role
      let userRole = 'basic_user';
      
      try {
        // Get user role from metadata
        if (session.user.user_metadata?.role) {
          userRole = session.user.user_metadata.role;
        } else if (session.user.app_metadata?.role) {
          userRole = session.user.app_metadata.role;
        }
      } catch (e) {
        debugLog('Error extracting user role:', e);
      }
      
      // Determine redirect path based on role
      let redirectPath = '/dashboard';
      if (userRole === 'admin') {
        redirectPath = '/admin';
      }
      
      // Redirect to appropriate dashboard
      debugLog('Redirecting to dashboard based on role:', redirectPath);
      const redirectUrl = new URL(redirectPath, req.url);
      redirectUrl.searchParams.set('from_auth', 'true');
      
      const redirectResponse = NextResponse.redirect(redirectUrl);
      redirectResponse.cookies.set('last_redirect_time', now.toString(), { maxAge: 60 });
      redirectResponse.cookies.set('redirect_path', pathname, { maxAge: 300 });
      
      // Update redirect count
      redirectResponse.cookies.set('auth_redirect_count', JSON.stringify({ 
        count: redirectCount, 
        timestamp: now 
      }), { maxAge: 300, path: '/' });
      
      return redirectResponse;
    }
    
    // Handle admin route access for non-admin users
    if (pathname.startsWith('/admin') && session) {
      // Get user role
      let userRole = 'basic_user';
      try {
        if (session.user.user_metadata?.role) {
          userRole = session.user.user_metadata.role;
        } else if (session.user.app_metadata?.role) {
          userRole = session.user.app_metadata.role;
        }
      } catch (e) {
        debugLog('Error extracting user role:', e);
      }
      
      // Redirect non-admin users
      if (userRole !== 'admin') {
        debugLog('Non-admin user accessing admin route, redirecting to dashboard');
        const redirectUrl = new URL('/dashboard', req.url);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.cookies.set('last_redirect_time', now.toString(), { maxAge: 60 });
        
        return redirectResponse;
      }
    }
    
    // All other cases, pass through
    return res;
  } catch (error) {
    debugLog('Error in middleware:', error);
    // If there's an error checking the session, just let the request through
    return res;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/api/:path*',
    '/tag-manager/:path*',
    '/troubleshooting-assistant/:path*',
  ],
}; 