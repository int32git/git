'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { type SupabaseClient } from '@supabase/supabase-js';

type SupabaseContext = {
  supabase: SupabaseClient | null;
};

const SupabaseContext = createContext<SupabaseContext>({
  supabase: null,
});

export function SupabaseProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [supabase] = useState(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  });

  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Refresh data
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return context;
}; 