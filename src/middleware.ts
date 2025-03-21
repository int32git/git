import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
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
  
  if (recentRedirect) {
    debugLog('preventingRedirectLoop', {
      timeSinceLastRedirect: lastRedirectTime ? now - parseInt(lastRedirectTime) : 'unknown',
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
  
  // Check if manual login is required
  const requireManualLogin = req.cookies.get('require_manual_login')?.value === 'true';
  
  // Check Supabase authentication
  try {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    
    debugLog('Authentication check result:', !!session);
    
    // Handle protected routes for unauthenticated users
    if (protectedPaths.some(protectedPath => pathname.startsWith(protectedPath)) && !session) {
      debugLog('Unauthenticated access to protected path:', pathname);
      
      // If manual login is required or we had a recent redirect, don't redirect to prevent loops
      if (requireManualLogin || recentRedirect) {
        debugLog('Allowing access to protected page without session due to manual login requirement');
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
      
      return redirectResponse;
    }
    
    // Handle auth routes for authenticated users
    if (authPaths.some(authPath => pathname.startsWith(authPath)) && session) {
      debugLog('Authenticated user accessing auth page:', pathname);
      
      // If manual login is required or force parameter is set, allow access
      if (requireManualLogin || forceParam === 'true') {
        debugLog('Allowing authenticated user to access auth page due to manual login or force parameter');
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