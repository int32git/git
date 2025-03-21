import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';

// Tell Next.js this route should not be statically optimized
export const dynamic = 'force-dynamic';

// Define types for our diagnostic results
interface DiagnosticError {
  code?: string;
  message: string;
  details?: string;
  stack?: string | null;
}

interface DiagnosticResults {
  timestamp: string;
  environment: string | undefined;
  supabaseUrlConfigured: boolean;
  supabaseKeyConfigured: boolean;
  supabaseUrl: string | undefined;
  supabasePing: {
    success: boolean;
    responseTime: number | null;
    error: DiagnosticError | null;
  };
  authCheck: {
    success: boolean;
    responseTime: number | null;
    error: DiagnosticError | null;
  };
}

export async function GET(request: NextRequest) {
  // Create response object to track connectivity
  const diagnosticResults: DiagnosticResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePing: {
      success: false,
      responseTime: null,
      error: null
    },
    authCheck: {
      success: false,
      responseTime: null,
      error: null
    }
  };

  try {
    // Create a Supabase client for the Route Handler
    const cookieStore = cookies();
const supabase = createServerClient<Database>({ cookies });

    // Test basic connectivity to Supabase database
    const startTime = Date.now();
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      const endTime = Date.now();
      
      diagnosticResults.supabasePing.responseTime = endTime - startTime;
      
      if (error) {
        diagnosticResults.supabasePing.error = {
          code: error.code,
          message: error.message,
          details: error.details
        };
      } else {
        diagnosticResults.supabasePing.success = true;
      }
    } catch (err: any) {
      diagnosticResults.supabasePing.error = {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
      };
    }

    // Test auth API functionality
    const authStartTime = Date.now();
    try {
      const { error } = await supabase.auth.getSession();
      const authEndTime = Date.now();
      
      diagnosticResults.authCheck.responseTime = authEndTime - authStartTime;
      
      if (error) {
        diagnosticResults.authCheck.error = {
          code: error.name,
          message: error.message
        };
      } else {
        diagnosticResults.authCheck.success = true;
      }
    } catch (err: any) {
      diagnosticResults.authCheck.error = {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
      };
    }

    // Get client IP and network info
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    return NextResponse.json({
      ...diagnosticResults,
      clientInfo: {
        ip: clientIp,
        userAgent
      }
    });
  } catch (err: any) {
    console.error('Fatal error in diagnostic endpoint:', err);
    
    return NextResponse.json({
      ...diagnosticResults,
      fatalError: {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
      }
    }, { status: 500 });
  }
} 