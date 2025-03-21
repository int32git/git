'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut, Lock } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export function UserMenu() {
  const { user, userAccess, signOut, requireManualLogin, isManualLoginRequired } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Ensure manual login is required on next visit
      requireManualLogin(true);
      await signOut();
      console.log("UserMenu - User signed out");
    } catch (error) {
      console.error("UserMenu - Error signing out:", error);
    }
  };

  const handleProfile = () => {
    if (!userAccess) return;
    
    // Route to the appropriate profile page based on user role
    console.log("UserMenu - Navigating to profile, role:", userAccess.role);
    const profilePath = userAccess.role === 'admin' 
      ? '/admin/profile'
      : '/dashboard/profile';
    router.push(profilePath);
  };
  
  const toggleRequireManualLogin = () => {
    const newValue = !isManualLoginRequired;
    requireManualLogin(newValue);
    toast.success(
      newValue
        ? "You will need to sign in each time you visit"
        : "Automatic sign-in is now enabled"
    );
  };

  if (!user || !userAccess) return null;

  // Format the role for display (replace underscores with spaces and capitalize)
  const formattedRole = userAccess.role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Get initials from email
  const initials = user.email
    ?.split('@')[0]
    .split('.')
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {formattedRole}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfile}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(userAccess.role === 'admin' ? '/admin/settings' : '/dashboard/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem 
          checked={isManualLoginRequired}
          onCheckedChange={toggleRequireManualLogin}
        >
          <Lock className="mr-2 h-4 w-4" />
          Require sign-in each time
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 