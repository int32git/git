'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="mr-2"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      {open && (
        <div className="fixed inset-0 top-16 z-50 bg-background/95 backdrop-blur-sm animate-in slide-in-from-left">
          <div className="container h-full flex flex-col">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-lg font-semibold">Dashboard Menu</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto pb-16">
              <DashboardNav />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 