import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { cache } from 'react';

/**
 * Creates a Supabase client for Server Components with caching
 */
export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
});

/**
 * Gets the current user session from Supabase
 */
export async function getSession() {
  const supabase = createServerSupabaseClient();
  try {
    const { 
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error in getSession:', error);
    throw error;
  }
}

/**
 * Gets the current user from Supabase
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  
  try {
    return session.user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error;
  }
} 