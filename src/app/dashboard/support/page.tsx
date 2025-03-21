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
import { HeadphonesIcon, ArrowLeft, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function PremiumSupportPage() {
  const router = useRouter();
  const { userAccess } = useAuth();
  const isPremium = userAccess?.role === 'premium_user' || userAccess?.role === 'admin';

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Premium Support</h1>
          <p className="text-muted-foreground">
            Get priority support from our dedicated customer success team
          </p>
        </div>
      </div>
      
      {isPremium ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Premium Support</CardTitle>
              <CardDescription>
                Choose your preferred method to reach our premium support team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border rounded-lg text-center">
                  <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                  <p className="text-muted-foreground mb-4">
                    Send us an email and receive a response within 4 business hours
                  </p>
                  <Button asChild>
                    <Link href="mailto:premium-support@defenderplus.com">
                      Email Support
                    </Link>
                  </Button>
                </div>
                
                <div className="p-6 border rounded-lg text-center">
                  <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
                  <p className="text-muted-foreground mb-4">
                    Chat with our support team in real-time (Available 9am-5pm ET)
                  </p>
                  <Button>
                    Start Live Chat
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => router.back()}
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
              Premium Support is available only to premium plan users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HeadphonesIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upgrade to Premium</h3>
              <p className="text-muted-foreground max-w-md">
                Premium Support provides priority response times, dedicated account managers,
                and access to live chat support during business hours.
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