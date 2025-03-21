import { LayoutDashboard, Users, CreditCard, FileText } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: any; // Using any for Lucide icons as they don't export a common type
}

export const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Client Management', href: '/admin/clients', icon: Users },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Billing & Invoices', href: '/admin/billing', icon: FileText },
]; 