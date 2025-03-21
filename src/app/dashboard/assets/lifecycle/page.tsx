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
import { BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AssetLifecyclePage() {
  const router = useRouter();
  const { userAccess } = useAuth();
  const isPremium = userAccess?.role === 'premium_user' || userAccess?.role === 'admin';

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Lifecycle Management</h1>
          <p className="text-muted-foreground">
            Track the complete lifecycle of your assets from procurement to retirement
          </p>
        </div>
      </div>
      
      {isPremium ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Lifecycle Module</CardTitle>
              <CardDescription>
                This feature is coming soon in our next update
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Asset Lifecycle Tracking</h3>
                <p className="text-muted-foreground max-w-md">
                  Our team is currently developing comprehensive asset lifecycle management tools.
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
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assets
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Premium Feature</CardTitle>
            <CardDescription>
              Asset Lifecycle Management is a premium feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upgrade to Premium</h3>
              <p className="text-muted-foreground max-w-md">
                Asset Lifecycle Management allows you to track your assets from procurement to retirement, 
                with detailed history, maintenance records, and lifecycle status tracking.
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