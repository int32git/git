import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';
import { CookieOptions } from '@supabase/ssr';

// Explicitly set dynamic mode to force-dynamic to ensure proper SSR handling on Vercel
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  
  try {
    // Get the URL including search params
    console.log('Auth callback triggered', new Date().toISOString());
    
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');
    const type = requestUrl.searchParams.get('type');
    
    // Log the request details for debugging
    console.log(`Auth callback details:
      - Code present: ${code ? 'yes' : 'no'}
      - Error: ${error || 'none'}
      - Error description: ${errorDescription || 'none'}
      - Type: ${type || 'none'}`
    );
    
    // Handle errors from the OAuth/email verification flow
    if (error) {
      console.error(`Auth callback error: ${error}`, errorDescription);
      
      // Different error handling based on error type
      if (error === 'access_denied') {
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent('Access was denied. Please try again.')}`, origin)
        );
      } else if (error.includes('invalid_grant')) {
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent('Verification link has expired or was already used. Please request a new one.')}`, origin)
        );
      } else {
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(errorDescription || error)}`, origin)
        );
      }
    }
    
    // If there's no code, that's unexpected
    if (!code) {
      console.error('No code parameter in auth callback');
      return NextResponse.redirect(
        new URL('/auth/signin?error=Missing+verification+code', origin)
      );
    }
    
    // Create a Supabase client for the Route Handler
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Exchange the code for a session
    console.log('Exchanging code for session...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    // Handle any errors during code exchange
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      
      if (exchangeError.message.includes('expired')) {
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent('Verification link has expired. Please request a new one.')}`, origin)
        );
      } else {
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(exchangeError.message)}`, origin)
        );
      }
    }
    
    console.log('Session exchange successful, user ID:', data?.user?.id);
    
    // Get the user's email (safely)
    const email = data?.user?.email || '';
    
    // Check if this was for email verification or password recovery
    if (type === 'signup' || (!type && data?.user?.email_confirmed_at)) {
      // Email verification after signup
      console.log('Email verified after signup:', email);
      
      // Redirect to verification success page with email and verified flag
      return NextResponse.redirect(
        new URL(`/auth/verification-success?email=${encodeURIComponent(email)}&action=signup&verified=true`, origin)
      );
    } else if (type === 'recovery') {
      // Password reset flow
      console.log('Password recovery flow for:', email);
      
      // Redirect to reset password page
      return NextResponse.redirect(
        new URL(`/auth/reset-password?email=${encodeURIComponent(email)}`, origin)
      );
    } else if (type === 'invite') {
      // Invitation flow
      console.log('User accepted invitation:', email);
      
      // Redirect to set password page for invited users
      return NextResponse.redirect(
        new URL(`/auth/set-password?email=${encodeURIComponent(email)}`, origin)
      );
    }
    
    // For standard sign-in flows, record login timestamp and redirect to dashboard
    try {
      // Optional: Record login timestamp in user profile
      if (data?.user?.id) {
        await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }
    } catch (profileErr) {
      // Non-critical error, just log it but continue
      console.error('Error updating profile timestamp:', profileErr);
    }
    
    console.log('Redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', origin));
  } catch (err) {
    // Catch any unexpected errors
    console.error('Unexpected error in auth callback:', err);
    
    return NextResponse.redirect(
      new URL('/auth/signin?error=An+unexpected+error+occurred', origin)
    );
  }
} 