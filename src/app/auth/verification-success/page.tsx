'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight, ShieldCheck, PenLine } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

function VerificationSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [profileCreationAttempted, setProfileCreationAttempted] = useState(false);
  const [action, setAction] = useState<'signup' | 'recovery' | 'invite' | null>(null);
  
  // Get the user's email and action from the URL query parameters
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const actionParam = searchParams.get('action') as 'signup' | 'recovery' | 'invite' | null;
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (actionParam) {
      setAction(actionParam);
    } else {
      setAction('signup'); // Default to signup if not specified
    }
    
    // Check if the user is already signed in
    const checkSession = async () => {
      const supabase = createClientComponentClient<Database>();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoadingSession(false);
      
      // If already authenticated, ensure profile exists and redirect to dashboard
      if (session) {
        // Attempt to create profile if not already attempted
        if (!profileCreationAttempted) {
          try {
            setProfileCreationAttempted(true);
            console.log('Attempting to create user profile after email verification');
            
            // Call the API endpoint to create a profile
            const response = await fetch('/api/user/create-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({}), // Could add profile details here if needed
            });
            
            const data = await response.json();
            console.log('Profile creation result:', data);
          } catch (err) {
            console.error('Error ensuring profile exists:', err);
            // Non-blocking - continue even if profile creation fails 
            // as the webhook should handle it or we can try later
          }
        }
        
        router.push('/dashboard');
      }
    };
    
    checkSession();
  }, [searchParams, router, profileCreationAttempted]);

  // Countdown redirect effect
  useEffect(() => {
    if (secondsRemaining <= 0) {
      router.push('/auth/signin');
      return;
    }
    
    // Don't start countdown until we've checked the session
    if (isLoadingSession) {
      return;
    }
    
    const timer = setTimeout(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [secondsRemaining, router, isLoadingSession]);

  // Handle a sign in click
  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const handleOnboardingStart = () => {
    router.push('/onboarding');
  };

  // Format email for display - obfuscate middle part
  const formatEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    
    const [username, domain] = email.split('@');
    if (username.length <= 3) {
      return `${username.charAt(0)}***@${domain}`;
    }
    
    return `${username.charAt(0)}***${username.charAt(username.length - 1)}@${domain}`;
  };

  // Different content based on the action type
  const renderContent = () => {
    return (
      <div className="space-y-4 animate-fadeIn">
        <p className="text-center text-muted-foreground">
          {action === 'signup' && 'Your account is now verified and ready to use.'}
          {action === 'recovery' && 'Your account has been successfully recovered.'}
          {action === 'invite' && 'You\'ve successfully accepted the invitation.'}
        </p>
        
        <div className="w-full p-4 bg-muted rounded-md">
          <h3 className="font-medium mb-3 flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
            What's next?
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li className="animate-fadeSlideIn" style={{ animationDelay: '0.2s' }}>
              Sign in with your verified email address
            </li>
            <li className="animate-fadeSlideIn" style={{ animationDelay: '0.4s' }}>
              Complete your profile information
            </li>
            <li className="animate-fadeSlideIn" style={{ animationDelay: '0.6s' }}>
              Connect your Microsoft Intune &amp; Defender accounts
            </li>
            <li className="animate-fadeSlideIn" style={{ animationDelay: '0.8s' }}>
              Start managing your devices and security
            </li>
          </ol>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md animate-scaleIn">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 animate-popIn">
                <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Email Verified!</CardTitle>
            <CardDescription className="text-center">
              {email ? (
                <>Your email <span className="font-medium">{formatEmail(email)}</span> has been successfully verified.</>
              ) : (
                <>Your email has been successfully verified.</>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center space-y-4">
            {renderContent()}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3">
            <Button 
              className="w-full" 
              onClick={handleSignIn}
              size="lg"
            >
              Sign In Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleOnboardingStart}
            >
              Start Onboarding <PenLine className="ml-2 h-4 w-4" />
            </Button>
            
            <div className="flex items-center justify-center mt-2 space-x-1 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to sign in page in <span className="font-bold">{secondsRemaining}</span> seconds...
              </p>
            </div>
            
            <div className="text-xs text-center text-muted-foreground mt-2">
              Need help? <Link href="/contact" className="text-primary hover:underline">Contact support</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Wrap the component in a Suspense boundary to fix the hydration warnings
export default function VerificationSuccess() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-lg font-medium">Verifying your email...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we finish setting up your account
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerificationSuccessContent />
    </Suspense>
  );
} 