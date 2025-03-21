import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted py-12 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Defender2</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The complete solution for Microsoft Defender and Intune, providing advanced asset management, tagging, and security visualization tools.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Solutions</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/solutions/asset-management" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Asset Management
                </Link>
              </li>
              <li>
                <Link href="/solutions/tag-management" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Tag Management
                </Link>
              </li>
              <li>
                <Link href="/solutions/patch-management" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Patch Management
                </Link>
              </li>
              <li>
                <Link href="/solutions/risk-management" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Risk Management
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/documentation" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/webinars" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Webinars
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Microsoft Partnership
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Defender2. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 