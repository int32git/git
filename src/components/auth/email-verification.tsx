'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface EmailVerificationProps {
  email: string;
  onResendSuccess?: () => void;
  redirectTo?: string;
  showSignInLink?: boolean;
}

export default function EmailVerification({
  email,
  onResendSuccess,
  redirectTo,
  showSignInLink = true,
}: EmailVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Rate limiting - only allow 3 resend attempts
  const isResendLimited = resendCount >= 3;

  const handleResendVerification = async () => {
    if (isResending || isResendLimited) return;

    setIsResending(true);
    setResendStatus('idle');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/api/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setResendStatus('success');
      setResendCount(prev => prev + 1);
      if (onResendSuccess) {
        onResendSuccess();
      }
    } catch (err: any) {
      console.error('Error resending verification email:', err);
      setResendStatus('error');
      setErrorMessage(err?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignInClick = () => {
    router.push('/auth/signin');
  };

  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    
    const maskedUsername = 
      username.length <= 3 
        ? username.charAt(0) + '***' 
        : username.charAt(0) + '***' + username.charAt(username.length - 1);
        
    return `${maskedUsername}@${domain}`;
  };

  const cooldownTimeLeft = () => {
    if (resendCount === 0) return null;
    return `You can resend ${3 - resendCount} more time${3 - resendCount !== 1 ? 's' : ''}.`;
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription className="mt-2">
          We've sent a verification link to <span className="font-medium">{maskEmail(email)}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <p className="text-center text-muted-foreground">
            Click the link in the email to verify your account. If you don't see it, check your spam folder.
          </p>
          
          {resendStatus === 'success' && (
            <Alert className="bg-success/10 text-success border-success">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Verification email resent</AlertTitle>
              <AlertDescription>
                We've sent a new verification email to your inbox.
              </AlertDescription>
            </Alert>
          )}
          
          {resendStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-3">
        <Button
          variant="outline"
          onClick={handleResendVerification}
          disabled={isResending || isResendLimited}
          className="w-full"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Resend verification email'
          )}
        </Button>
        
        {cooldownTimeLeft() && (
          <p className="text-xs text-center text-muted-foreground">
            {cooldownTimeLeft()}
          </p>
        )}
        
        {isResendLimited && (
          <p className="text-xs text-center text-muted-foreground">
            Maximum resend attempts reached. Please try again later.
          </p>
        )}
        
        {showSignInLink && (
          <Button 
            variant="link" 
            onClick={handleSignInClick}
            className="w-full mt-2"
          >
            Back to sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 