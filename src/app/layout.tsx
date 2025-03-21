import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import MicrosoftAuthProvider from "@/components/providers/microsoft-auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { ClientLayoutWrapper } from "@/components/client-layout-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Intune & Defender Management",
    template: "%s | Intune & Defender Management"
  },
  description: "Secure. Compliant. Simplified. Merge Microsoft Intune & Defender data to track assets, manage security, and ensure compliance—all in one place.",
  keywords: ["Intune", "Defender", "Security", "Compliance", "Microsoft", "Management", "Asset Tracking"],
  authors: [{ name: "Intune Defender Management Team" }],
  creator: "Intune Defender Management",
  publisher: "Intune Defender Management",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Intune & Defender Management",
    description: "Secure. Compliant. Simplified. Merge Microsoft Intune & Defender data to track assets, manage security, and ensure compliance—all in one place.",
    siteName: "Intune & Defender Management",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intune & Defender Management",
    description: "Secure. Compliant. Simplified. Merge Microsoft Intune & Defender data to track assets, manage security, and ensure compliance—all in one place.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <MicrosoftAuthProvider>
              <div className="flex flex-col min-h-screen">
                <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
                <Toaster />
              </div>
            </MicrosoftAuthProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
} 