import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/supabase';
import { CookieOptions } from '@supabase/ssr';

// Explicitly set dynamic mode to force-dynamic to ensure proper SSR handling on Vercel
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

type AuthType = "signup" | "recovery" | "invite" | undefined;

/**
 * This route handles the callback from Supabase Auth.
 * It is called when a user completes the sign-in or sign-up process
 * with a third-party provider or magic link.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type') as AuthType;
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const cookieStore = cookies();

  if (!code) {
    console.error('No code provided in callback');
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('No authentication code provided')}`);
  }

  try {
    console.log(`Processing auth callback with code, type: ${type}`);
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      throw error;
    }

    console.log('Successfully exchanged code for session');
    
    // Revalidate relevant paths to ensure fresh data after auth state change
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    
    // Handle different auth flows
    if (type === 'signup') {
      console.log('Signup flow detected, redirecting to onboarding');
      return NextResponse.redirect(`${origin}/onboarding`);
    } else if (type === 'recovery') {
      console.log('Recovery flow detected, redirecting to password reset');
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    } else if (type === 'invite') {
      console.log('Invite flow detected, redirecting to accept-invite');
      return NextResponse.redirect(`${origin}/accept-invite`);
    }

    // Default redirect
    console.log(`Auth flow completed, redirecting to ${next}`);
    return NextResponse.redirect(`${origin}${next}`);
  } catch (err: any) {
    console.error('Unexpected error in auth callback:', err);
    const errorMessage = err?.message || 'An unexpected error occurred during authentication';
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(errorMessage)}`
    );
  }
} 