'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { UserMenu } from '@/components/user-menu';
import { Loader2 } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import { basicNavigation, premiumNavigation, NavigationItem } from '@/app/dashboard/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userAccess, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!user || !userAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-6">Please <Link href="/auth/signin" className="text-primary underline">sign in</Link> to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white">
        <div className="p-4">
          <h2 className="text-xl font-semibold">
            {userAccess.role === 'premium_user' ? 'Premium Dashboard' : 'Dashboard'}
          </h2>
          {userAccess.role === 'basic_user' && (
            <div className="mt-2 text-xs text-slate-400">
              <Link href="/pricing" className="text-blue-400 hover:text-blue-300">
                Upgrade to Premium
              </Link>
              {' '}for full access
            </div>
          )}
        </div>
        
        {/* Dashboard Nav component */}
        <div className="mt-4">
          <DashboardNav darkMode={true} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <nav className="flex items-center gap-6 text-sm">
              {/* Mobile menu button - only visible on mobile */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                  onClick={() => {
                    // Toggle the mobile sidebar visibility
                    const sidebar = document.getElementById('mobile-sidebar');
                    if (sidebar) {
                      sidebar.classList.toggle('translate-x-0');
                      sidebar.classList.toggle('-translate-x-full');
                    }
                  }}
                  aria-label="Toggle menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
            </nav>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 space-y-4 p-8 pt-6 bg-slate-50">
          {children}
        </main>
      </div>

      {/* Mobile sidebar - hidden by default on mobile */}
      <div 
        id="mobile-sidebar" 
        className="fixed inset-0 z-50 transform -translate-x-full transition-transform duration-300 ease-in-out md:hidden"
      >
        <div className="h-full w-64 bg-slate-800 text-white overflow-y-auto">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={() => {
                const sidebar = document.getElementById('mobile-sidebar');
                if (sidebar) {
                  sidebar.classList.add('-translate-x-full');
                  sidebar.classList.remove('translate-x-0');
                }
              }}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="mt-4">
            <DashboardNav darkMode={true} />
          </div>
        </div>
        {/* Semi-transparent overlay */}
        <div 
          className="absolute inset-0 bg-black/50 -z-10"
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar');
            if (sidebar) {
              sidebar.classList.add('-translate-x-full');
              sidebar.classList.remove('translate-x-0');
            }
          }}
        ></div>
      </div>
    </div>
  );
} 