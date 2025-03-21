'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileBarChart2, 
  Shield, 
  Settings, 
  Users, 
  Lock,
  Tag,
  Boxes,
  HelpCircle,
  BarChart3,
  FileSpreadsheet,
  ClipboardCheck,
  HeadphonesIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { basicNavigation, premiumNavigation } from '@/app/dashboard/navigation';

// Extended navigation item with isPremiumOnly flag
interface ExtendedNavigationItem {
  name: string;
  href: string;
  icon: any;
  isPremiumOnly?: boolean;
}

interface DashboardNavProps {
  darkMode?: boolean;
}

export function DashboardNav({ darkMode = false }: DashboardNavProps) {
  const pathname = usePathname();
  const { userAccess } = useAuth();
  const isPremium = userAccess?.role === 'premium_user';

  // Use navigation from the navigation.ts file and convert to ExtendedNavigationItem
  const baseNavItems = isPremium ? premiumNavigation : basicNavigation;
  
  // Mark premium-only features
  const baseNavWithPremium: ExtendedNavigationItem[] = baseNavItems.map(item => {
    // Premium-only features in the basic navigation
    const isPremiumOnly = !isPremium && [
      '/dashboard/assets/lifecycle',
      '/dashboard/software',
      '/dashboard/compliance',
      '/dashboard/risks',
      '/dashboard/support',
    ].includes(item.href);
    
    return {
      ...item,
      isPremiumOnly
    };
  });
  
  // Add the reporting item to navigation
  const reportingItem: ExtendedNavigationItem = {
    name: 'Reporting',
    href: '/dashboard/reporting',
    icon: FileBarChart2,
    isPremiumOnly: false
  };
  
  // Insert reporting after dashboard
  const allNavItems = [
    baseNavWithPremium[0], // Dashboard
    reportingItem,        // Reporting
    ...baseNavWithPremium.slice(1) // All other items
  ];

  return (
    <div className="w-full space-y-1 py-3">
      {allNavItems.map((item) => {
        const isActive = pathname === item.href;
        const isPremiumFeature = item.isPremiumOnly === true;
        const icon = item.icon ? React.createElement(item.icon, { className: "h-5 w-5" }) : null;

        return (
          <TooltipProvider key={item.href}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Link 
                    href={isPremiumFeature ? '/pricing' : item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      darkMode 
                        ? isActive
                          ? "bg-slate-700 text-white"
                          : "text-slate-300 hover:bg-slate-700 hover:text-white"
                        : isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted",
                      isPremiumFeature && darkMode
                        ? "opacity-60"
                        : isPremiumFeature && "opacity-70"
                    )}
                  >
                    {icon}
                    <span>{item.name}</span>
                    {isPremiumFeature && (
                      <Lock className={cn(
                        "h-3.5 w-3.5 ml-auto",
                        darkMode ? "text-slate-400" : "text-muted-foreground"
                      )} />
                    )}
                    {item.name === 'Reporting' && !isPremium && (
                      <Badge variant={darkMode ? "outline" : "outline"} className={cn(
                        "ml-auto text-xs px-1.5 py-0",
                        darkMode 
                          ? "border-blue-400/40 text-blue-300"
                          : "border-primary/30 text-primary/70"
                      )}>
                        Preview
                      </Badge>
                    )}
                  </Link>
                </div>
              </TooltipTrigger>
              {isPremiumFeature && (
                <TooltipContent side="right">
                  <p className="text-sm">Premium feature - Upgrade to access</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
} 