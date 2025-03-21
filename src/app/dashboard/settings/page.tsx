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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ArrowLeft, Bell, Shield, User, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const router = useRouter();
  const { userAccess } = useAuth();
  const isPremium = userAccess?.role === 'premium_user' || userAccess?.role === 'admin';

  if (!isPremium) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Advanced Settings</h1>
            <p className="text-muted-foreground">
              Configure advanced options for your account and application
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Premium Feature</CardTitle>
            <CardDescription>
              Advanced Settings are available only to premium plan users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upgrade to Premium</h3>
              <p className="text-muted-foreground max-w-md">
                Advanced Settings provide detailed configuration options for security alerts,
                notification preferences, API access, and integration settings.
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
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advanced Settings</h1>
          <p className="text-muted-foreground">
            Configure advanced options for your account and application
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Globe className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-alerts" className="flex flex-col space-y-1">
                  <span>Email Alerts</span>
                  <span className="text-xs text-muted-foreground">Receive important alerts via email</span>
                </Label>
                <Switch id="email-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="web-notifications" className="flex flex-col space-y-1">
                  <span>Web Notifications</span>
                  <span className="text-xs text-muted-foreground">Show notifications in the web application</span>
                </Label>
                <Switch id="web-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="daily-digest" className="flex flex-col space-y-1">
                  <span>Daily Digest</span>
                  <span className="text-xs text-muted-foreground">Receive a daily summary of activities</span>
                </Label>
                <Switch id="daily-digest" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="two-factor" className="flex flex-col space-y-1">
                  <span>Two-Factor Authentication</span>
                  <span className="text-xs text-muted-foreground">Add an extra layer of security to your account</span>
                </Label>
                <Switch id="two-factor" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="session-timeout" className="flex flex-col space-y-1">
                  <span>Session Timeout</span>
                  <span className="text-xs text-muted-foreground">Automatically log out after inactivity</span>
                </Label>
                <Switch id="session-timeout" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Account settings will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure external integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Integration settings will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 