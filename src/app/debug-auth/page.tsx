'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function DebugAuthPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [authState, setAuthState] = useState<any>({});
  const { user, userAccess, session, clearDebugLog } = useAuth();

  useEffect(() => {
    // Load debug logs
    const authLogs = localStorage.getItem('auth_debug_log');
    if (authLogs) {
      try {
        setLogs(JSON.parse(authLogs));
      } catch (e) {
        console.error('Failed to parse auth logs:', e);
        setLogs([]);
      }
    }

    // Collect auth state
    const state: Record<string, any> = {};
    
    // User info
    if (user) {
      state.user = {
        id: user.id,
        email: user.email,
        role: localStorage.getItem('user_role') || 'unknown'
      };
    }
    
    // Session info
    const lastAuthSession = localStorage.getItem('last_auth_session');
    if (lastAuthSession) {
      try {
        state.lastSession = JSON.parse(lastAuthSession);
      } catch (e) {
        state.lastSession = 'Parse Error';
      }
    }
    
    // Navigation intent
    const navIntent = localStorage.getItem('auth_navigation_intent');
    if (navIntent) {
      try {
        state.navigationIntent = JSON.parse(navIntent);
      } catch (e) {
        state.navigationIntent = 'Parse Error';
      }
    }
    
    // Redirect tracking
    state.lastRedirectTime = localStorage.getItem('last_redirect_time');
    
    // Login settings
    state.requireManualLogin = localStorage.getItem('require_manual_login');
    state.loginAttempts = localStorage.getItem('login_attempts');
    
    // Page info
    state.currentLocation = window.location.href;
    
    setAuthState(state);
  }, [user]);

  const handleClearLogs = () => {
    clearDebugLog();
    setLogs([]);
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Authentication Debug Tool</CardTitle>
          <CardDescription>
            View authentication logs and state to diagnose issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Auth State</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[300px] text-xs">
                {JSON.stringify(authState, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Session Data</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[300px] text-xs">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Authentication Logs</h3>
              <Button onClick={handleClearLogs} variant="outline" size="sm">
                Clear Logs
              </Button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[500px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Action</th>
                    <th className="text-left p-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center p-4">
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, index) => (
                      <tr 
                        key={index} 
                        className={`border-b border-gray-200 dark:border-gray-700 ${
                          log.action.includes('Error') ? 'bg-red-50 dark:bg-red-900/20' : ''
                        }`}
                      >
                        <td className="p-2 whitespace-nowrap">{formatTime(log.timestamp)}</td>
                        <td className="p-2 font-mono">{log.action}</td>
                        <td className="p-2 font-mono break-all">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 