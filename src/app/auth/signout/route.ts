import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';

// Tell Next.js this route should not be statically optimized
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
const supabase = createServerClient<Database>({ cookies });
    
    // Sign the user out
    await supabase.auth.signOut();
    
    // Redirect to the home page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.redirect(new URL('/?error=Failed+to+sign+out', request.url));
  }
}

// Also handle GET requests for client-side navigation
export async function GET(request: NextRequest) {
  return POST(request);
} 