'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Loader2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

// Define the Provider type since it's not exported
type Provider = 'apple' | 'azure' | 'bitbucket' | 'discord' | 'facebook' | 'github' | 'gitlab' | 'google' | 'keycloak' | 'linkedin' | 'notion' | 'slack' | 'spotify' | 'twitch' | 'twitter' | 'workos';

// Dynamically import Auth component with no SSR to avoid hydration issues
const Auth = dynamic(
  () => import('@supabase/auth-ui-react').then((mod) => mod.Auth),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
);

interface SupabaseAuthProps {
  supabaseClient: SupabaseClient;
  view: 'sign_in' | 'sign_up' | 'magic_link' | 'forgotten_password';
  redirectTo?: string;
  showMicrosoftButton?: boolean;
}

export default function SupabaseAuth({
  supabaseClient,
  view,
  redirectTo,
  showMicrosoftButton = true,
}: SupabaseAuthProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Filter providers if Microsoft button is not needed
  const providers: Provider[] = showMicrosoftButton ? ['google', 'azure'] : ['google'];

  return (
    <>
      <Auth
        supabaseClient={supabaseClient}
        view={view}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: 'hsl(var(--primary))',
                brandAccent: 'hsl(var(--primary))',
              },
            },
          },
        }}
        providers={providers}
        redirectTo={redirectTo}
        localization={{
          variables: {
            [view]: {
              social_provider_text: `${view === 'sign_in' ? 'Sign in' : 'Sign up'} with {{provider}}`
            }
          }
        }}
      />
      
      {/* Add custom styles for the Azure button to show Microsoft styling */}
      {showMicrosoftButton && (
        <style jsx global>{`
          .supabase-ui-auth button[data-provider="azure"] {
            background-color: #2F2F2F !important;
            color: white !important;
          }
          .supabase-ui-auth button[data-provider="azure"]::before {
            content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" width="16" height="16"><path fill="white" d="M11.5 1.2a10.3 10.3 0 1 0 0 20.6 10.3 10.3 0 0 0 0-20.6zM9.3 17.8L4.8 16l-.9-2.1 5.7 1v-4.2H5.4l9.2-5.5v13l-5.3-1.4z"/></svg>');
            margin-right: 8px;
          }
          /* Replace the text "Azure" with "Microsoft" */
          .supabase-ui-auth button[data-provider="azure"] span:after {
            content: "Microsoft";
            visibility: visible;
            display: block;
            height: 0;
          }
          .supabase-ui-auth button[data-provider="azure"] span {
            visibility: hidden;
          }
        `}</style>
      )}
    </>
  );
} 