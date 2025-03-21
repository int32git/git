'use client';

import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { ClipboardCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function CompliancePage() {
  const router = useRouter();
  const { userAccess } = useAuth();
  const isPremium = userAccess?.role === 'premium_user' || userAccess?.role === 'admin';

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health & Compliance</h1>
          <p className="text-muted-foreground">
            Monitor device health status and compliance with company policies
          </p>
        </div>
      </div>
      
      {isPremium ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Health & Compliance Module</CardTitle>
              <CardDescription>
                This feature is coming soon in our next update
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardCheck className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Compliance Monitoring</h3>
                <p className="text-muted-foreground max-w-md">
                  Our team is currently developing comprehensive compliance and device health monitoring tools.
                  This feature will be available in our next product update.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => router.back()}
                className="mr-2" 
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Premium Feature</CardTitle>
            <CardDescription>
              Health & Compliance Monitoring is a premium feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upgrade to Premium</h3>
              <p className="text-muted-foreground max-w-md">
                Health & Compliance Monitoring allows you to track device health status,
                ensure compliance with company policies, and receive alerts when devices
                fall out of compliance.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={() => router.back()}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button asChild>
              <Link href="/pricing">
                View Pricing Plans
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 