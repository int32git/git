'use client';

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const pathname = usePathname();
  
  // Don't show header/footer on dashboard or admin pages that have their own layouts
  const skipHeaderFooter = pathname?.startsWith('/dashboard') || 
                          pathname?.startsWith('/admin') || 
                          pathname?.startsWith('/auth/callback');
  
  // Add headers and footers to not-found pages unless they're under routes that already have layouts
  const is404Page = pathname === null && !skipHeaderFooter;
  
  if (skipHeaderFooter) {
    return <main className="flex-1 bg-background">{children}</main>;
  }
  
  return (
    <>
      <Header />
      <main className="flex-1 bg-background">{children}</main>
      <Footer />
    </>
  );
} 