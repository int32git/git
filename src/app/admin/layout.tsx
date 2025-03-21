'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutDashboard, Users, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { UserMenu } from '@/components/user-menu';
import { toast } from 'sonner';
import { navigation, NavigationItem } from '@/app/admin/navigation';

// Create a session storage cache to limit redirects across sessions
const SESSION_REDIRECT_KEY = 'admin_redirect_timestamp';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userAccess, loading, requireManualLogin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [initialized, setInitialized] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const redirectAttempted = useRef(false);
  const checkCount = useRef(0);
  const initialRender = useRef(true);

  // Clear any redirect tracking upon successful admin access
  useEffect(() => {
    // Clear redirect tracking on mount
    sessionStorage.removeItem('auth_redirect_target');
    
    // If we've arrived at the admin dashboard, clean up any redirect timestamps
    // to avoid redirect loops on future navigation
    if (pathname.startsWith('/admin')) {
      sessionStorage.removeItem('last_redirect_time');
    }
  }, [pathname]);

  // Check user access for the admin area
  useEffect(() => {
    // Skip checks on the very first render to let data load
    if (initialRender.current) {
      initialRender.current = false;
      // Wait a bit before starting checks
      setTimeout(() => {
        checkCount.current = 0; // Reset counter for next useEffect run
      }, 2000);
      return;
    }

    // Don't do anything until loading is complete
    if (loading) return;

    // Only check access once
    if (accessChecked) return;

    // Prevent excessive checks
    checkCount.current += 1;
    if (checkCount.current > 3) {
      console.log("Admin layout - Too many auth checks, stopping");
      return;
    }

    console.log("Admin layout - Auth state:", { 
      user: user?.email, 
      userAccess: userAccess?.role, 
      loading,
      checkCount: checkCount.current
    });

    // If already redirected, don't do it again
    if (redirectAttempted.current) {
      console.log("Admin layout - Redirect already attempted, skipping");
      return;
    }

    // Handle no user case - require login
    if (!user || !userAccess) {
      console.log("Admin layout - No user, redirecting to signin");
      redirectAttempted.current = true;
      
      // Ensure manual login is required - no auto-login
      requireManualLogin(true);
      
      // Set redirect tracking
      const redirectTimestamp = Date.now().toString();
      sessionStorage.setItem('last_redirect_time', redirectTimestamp);
      
      // Use a longer delay to prevent rapid redirects
      setTimeout(() => {
        window.location.replace('/auth/signin');
      }, 2000);
      return;
    }

    // Check admin access - redirect non-admin users to dashboard
    if (userAccess.role !== 'admin') {
      // Check for recent redirects to prevent loops
      const lastRedirectTime = sessionStorage.getItem('last_redirect_time');
      const now = Date.now();
      if (lastRedirectTime && (now - parseInt(lastRedirectTime)) < 5000) {
        console.log("Admin layout - Recent redirect detected, skipping dashboard redirect");
        setAccessChecked(true);
        return;
      }
      
      console.log("Admin layout - Non-admin user, redirecting to dashboard");
      toast.error('Access denied. Admin privileges required.');
      redirectAttempted.current = true;
      
      // Set redirect tracking
      const redirectTimestamp = Date.now().toString();
      sessionStorage.setItem('last_redirect_time', redirectTimestamp);
      
      // Use a longer delay
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 2000);
      return;
    }

    // Check if account is active
    if (!userAccess.is_active) {
      console.log("Admin layout - Inactive user");
      toast.error('Your account is not active. Please contact support.');
      redirectAttempted.current = true;
      
      // Ensure manual login is required - no auto-login
      requireManualLogin(true);
      
      // Set redirect tracking
      const redirectTimestamp = Date.now().toString();
      sessionStorage.setItem('last_redirect_time', redirectTimestamp);
      
      // Use a longer delay
      setTimeout(() => {
        window.location.replace('/auth/signin');
      }, 2000);
      return;
    }

    // All checks have passed - user is logged in, has admin access, and is active
    setInitialized(true);
    setAccessChecked(true);
    console.log("Admin layout - Initialized for admin");
  }, [user, userAccess, loading, router, requireManualLogin, accessChecked]);

  // Show loading indicator while checking auth state
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading admin portal...</span>
      </div>
    );
  }

  // Don't render content until we're sure they have access
  if (!user || !userAccess || !userAccess.is_active || userAccess.role !== 'admin') {
    // If we've checked access already but user is missing, just show the content
    // This handles the case where access check is in progress or we're waiting for redirect
    if (accessChecked) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-500">Access check complete, but access denied.</p>
          <p className="ml-2">If you're not redirected soon, <a href="/auth/signin" className="text-blue-500 underline">click here to sign in</a>.</p>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Checking admin access...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white">
        <div className="p-4">
          <h2 className="text-xl font-semibold">Admin Portal</h2>
        </div>
        <nav className="mt-4">
          {navigation.map((item: NavigationItem) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium",
                pathname === item.href
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <nav className="flex items-center gap-6 text-sm">
              {/* Navigation items can go here if needed */}
            </nav>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 space-y-4 p-8 pt-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
} 