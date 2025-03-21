'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Database } from '@/types/supabase';

export default function DiagnosticPage() {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [authServiceStatus, setAuthServiceStatus] = useState<'checking' | 'working' | 'error'>('checking');
  const [apiStatus, setApiStatus] = useState<'checking' | 'working' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [supabaseErrorDetails, setSupabaseErrorDetails] = useState<any>(null);
  const [apiErrorDetails, setApiErrorDetails] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(true);
  const [apiDiagnosticData, setApiDiagnosticData] = useState<any>(null);

  useEffect(() => {
    // Get environment variables
    if (typeof window !== 'undefined') {
      setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      // Display only first few characters for security
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      setSupabaseKey(key.substring(0, 8) + '...');
    }

    // Check network connectivity
    checkNetworkStatus();

    // Check Supabase connectivity
    const supabase = createClientComponentClient<Database>();
    checkSupabaseConnection(supabase);
    
    // Check auth service
    checkAuthService(supabase);
  }, []);

  const checkNetworkStatus = () => {
    if (typeof window !== 'undefined') {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    }
  };

  const checkSupabaseConnection = async (supabase: any) => {
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
      if (error) {
        setSupabaseStatus('error');
        setSupabaseErrorDetails(error);
        console.error('Supabase connection error:', error);
      } else {
        setSupabaseStatus('connected');
      }
    } catch (err) {
      setSupabaseStatus('error');
      setSupabaseErrorDetails(err);
      console.error('Error checking Supabase connection:', err);
    }
  };

  const checkAuthService = async (supabase: any) => {
    try {
      // We'll just check if auth API is responding, not actually signing in
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        setAuthServiceStatus('error');
        console.error('Auth service error:', error);
      } else {
        setAuthServiceStatus('working');
      }
    } catch (err) {
      setAuthServiceStatus('error');
      console.error('Error checking auth service:', err);
    }
  };

  const checkApiDiagnostic = async () => {
    try {
      const response = await fetch('/api/auth/diagnostic');
      
      if (!response.ok) {
        setApiStatus('error');
        setApiErrorDetails({
          status: response.status,
          statusText: response.statusText
        });
        return;
      }
      
      const data = await response.json();
      setApiDiagnosticData(data);
      
      // Check if the API diagnostic was successful
      if (data.supabasePing.success && data.authCheck.success) {
        setApiStatus('working');
      } else {
        setApiStatus('error');
        setApiErrorDetails(data);
      }
    } catch (err: any) {
      setApiStatus('error');
      setApiErrorDetails({
        message: err.message,
        stack: err.stack
      });
    } finally {
      setRunningTests(false);
    }
  };

  const runAllTests = () => {
    setRunningTests(true);
    setNetworkStatus('checking');
    setSupabaseStatus('checking');
    setAuthServiceStatus('checking');
    setApiStatus('checking');
    setError(null);
    setSupabaseErrorDetails(null);
    setApiErrorDetails(null);
    setApiDiagnosticData(null);
    
    const supabase = createClientComponentClient<Database>();
    
    checkNetworkStatus();
    checkSupabaseConnection(supabase);
    checkAuthService(supabase);
    checkApiDiagnostic();
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Diagnostics</CardTitle>
          <CardDescription>
            This tool checks your connection to our authentication services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Network Connectivity:</span>
              {networkStatus === 'checking' ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : networkStatus === 'online' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Supabase API:</span>
              {supabaseStatus === 'checking' ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : supabaseStatus === 'connected' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Auth Service:</span>
              {authServiceStatus === 'checking' ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : authServiceStatus === 'working' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">API Diagnostic:</span>
              {apiStatus === 'checking' ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : apiStatus === 'working' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
          
          {!runningTests && (
            <div className="space-y-2 mt-4 pt-4 border-t border-muted">
              <h3 className="font-medium">Configuration:</h3>
              <div className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                <div><span className="text-muted-foreground">SUPABASE_URL:</span> {supabaseUrl || 'Not found'}</div>
                <div><span className="text-muted-foreground">SUPABASE_KEY:</span> {supabaseKey || 'Not found'}</div>
                {apiDiagnosticData && (
                  <div><span className="text-muted-foreground">API_ENVIRONMENT:</span> {apiDiagnosticData.environment}</div>
                )}
              </div>
              
              {supabaseErrorDetails && (
                <div className="mt-4">
                  <h3 className="font-medium text-destructive">Supabase Error Details:</h3>
                  <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto mt-1">
                    {JSON.stringify(supabaseErrorDetails, null, 2)}
                  </pre>
                </div>
              )}
              
              {apiErrorDetails && (
                <div className="mt-4">
                  <h3 className="font-medium text-destructive">API Diagnostic Error:</h3>
                  <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto mt-1">
                    {JSON.stringify(apiErrorDetails, null, 2)}
                  </pre>
                </div>
              )}
              
              {apiDiagnosticData && (
                <div className="mt-4">
                  <h3 className="font-medium">API Diagnostic Results:</h3>
                  <div className="bg-muted p-2 rounded text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Supabase Ping:</span> {apiDiagnosticData.supabasePing.success ? '✅' : '❌'}</div>
                      <div><span className="text-muted-foreground">Response Time:</span> {apiDiagnosticData.supabasePing.responseTime}ms</div>
                      <div><span className="text-muted-foreground">Auth Check:</span> {apiDiagnosticData.authCheck.success ? '✅' : '❌'}</div>
                      <div><span className="text-muted-foreground">Auth Response Time:</span> {apiDiagnosticData.authCheck.responseTime}ms</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-amber-50 border border-amber-200 p-3 rounded mt-4">
                <h3 className="font-medium text-amber-800">Troubleshooting Tips:</h3>
                <ul className="list-disc pl-5 mt-1 text-sm text-amber-800">
                  <li>Check your internet connection</li>
                  <li>Try clearing your browser cache</li>
                  <li>Ensure Supabase is properly configured</li>
                  <li>Check for ad blockers or network restrictions</li>
                  <li>Try using a different browser</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={runAllTests} 
            disabled={runningTests}
            className="w-full"
          >
            {runningTests ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Tests Again'
            )}
          </Button>
          <div className="flex w-full gap-2 mt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              asChild
            >
              <Link href="/auth/signup">
                Back to Sign Up
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              asChild
            >
              <Link href="/auth/signin">
                Go to Sign In
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 