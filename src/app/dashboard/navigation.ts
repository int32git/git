import { 
  LayoutDashboard, 
  HelpCircle, 
  HeadphonesIcon, 
  UserIcon,
  Settings,
  Tag,
  Shield,
  BarChart3,
  FileSpreadsheet,
  LucideIcon,
  Boxes,
  ClipboardCheck
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

// Basic user navigation items
export const basicNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Asset Management', href: '/dashboard/assets', icon: Boxes },
  { name: 'Tag Manager', href: '/dashboard/tags', icon: Tag },
  { name: 'Troubleshooting Assistant', href: '/dashboard/assistant', icon: HelpCircle },
];

// Premium user navigation items
export const premiumNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Asset Management', href: '/dashboard/assets', icon: Boxes },
  { name: 'Tag Manager', href: '/dashboard/tags', icon: Tag },
  { name: 'Asset Lifecycle', href: '/dashboard/assets/lifecycle', icon: BarChart3 },
  { name: 'Software Inventory', href: '/dashboard/software', icon: FileSpreadsheet },
  { name: 'Health & Compliance', href: '/dashboard/compliance', icon: ClipboardCheck },
  { name: 'Risk Management', href: '/dashboard/risks', icon: Shield },
  { name: 'Troubleshooting Assistant', href: '/dashboard/assistant', icon: HelpCircle },
  { name: 'Premium Support', href: '/dashboard/support', icon: HeadphonesIcon },
  { name: 'Advanced Settings', href: '/dashboard/settings', icon: Settings },
]; 