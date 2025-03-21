import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

interface RateLimitInfo {
  count: number;
  timestamp: number;
}

// In-memory storage for rate limiting
// In production, you would use Redis or a similar distributed store
const rateLimitStore = new Map<string, RateLimitInfo>();

// Create a simple in-memory rate limiter with cleanup
// This map holds rate limit data with user IP+path as the key
const rateLimits = new Map<string, { count: number, timestamp: number }>();

// Clean up old rate limit entries every 10 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    // Use Array.from to convert to array for compatibility
    Array.from(rateLimits.entries()).forEach(([key, data]) => {
      // Remove entries older than 1 hour
      if (now - data.timestamp > 60 * 60 * 1000) {
        rateLimits.delete(key);
      }
    });
  }, CLEANUP_INTERVAL);
}

/**
 * Generate a CSRF token and store it in a cookie
 */
export function generateCsrfToken() {
  const csrfToken = nanoid(32);
  cookies().set('csrf-token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });
  return csrfToken;
}

/**
 * Validate a CSRF token against the one stored in cookies
 */
export function validateCsrfToken(token: string): boolean {
  const storedToken = cookies().get('csrf-token')?.value;
  return !!storedToken && storedToken === token;
}

/**
 * Check if a request exceeds the rate limit
 * @param req The Next.js request object
 * @param limit Maximum number of requests allowed within the window
 * @param window Time window in milliseconds
 * @returns NextResponse with 429 status if rate limit exceeded, or null if within limits
 */
export function checkRateLimit(
  req: NextRequest, 
  limit: number, 
  windowMs: number
): NextResponse | null {
  // In development, disable rate limiting or be very lenient
  if (process.env.NODE_ENV === 'development') {
    // Only rate limit in development if there are truly excessive requests
    // This prevents frustration during development
    limit = limit * 10; // 10x more lenient in development
    
    // Skip checks for very common endpoints even in development
    const path = new URL(req.url).pathname;
    if (path.includes('_next') || path.includes('favicon')) {
      return null;
    }
  }
  
  // Get client IP or fallback to a default
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  
  // Create a key based on the IP and path
  const path = new URL(req.url).pathname;
  const key = `${ip}:${path}`;
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get current rate limit data
  const current = rateLimits.get(key) || { count: 0, timestamp: now };
  
  // Reset if outside current window
  if (current.timestamp < windowStart) {
    current.count = 0;
    current.timestamp = now;
  }
  
  // Increment the counter
  current.count++;
  rateLimits.set(key, current);
  
  // If rate limit exceeded, return 429 response
  if (current.count > limit) {
    const res = NextResponse.json(
      { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
    
    // Set headers to explain rate limiting
    res.headers.set('Retry-After', Math.ceil(windowMs / 1000).toString());
    
    return res;
  }
  
  return null;
}

/**
 * Set security headers for all responses
 * @param res The NextResponse object
 * @returns The updated NextResponse
 */
export function setSecurityHeaders(res: NextResponse): NextResponse {
  // Content Security Policy
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src 'self' https://js.stripe.com; font-src 'self';"
  );
  
  // XSS Protection
  res.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Frame Options (prevent clickjacking)
  res.headers.set('X-Frame-Options', 'DENY');
  
  // Permissions Policy (formerly Feature Policy)
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  return res;
} 