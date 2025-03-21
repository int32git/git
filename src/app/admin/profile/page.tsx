'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, KeyRound, Mail, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { Factor as SupabaseFactor } from '@supabase/supabase-js';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    const checkMfaStatus = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        setIsMfaEnabled(data.all.some((factor: SupabaseFactor) => 
          factor.status === 'verified' && factor.factor_type === 'totp'
        ));
      } catch (error) {
        console.error('Error checking MFA status:', error);
        toast.error('Failed to check MFA status');
      }
    };

    checkMfaStatus();
    setFormData(prev => ({ ...prev, email: user.email || '' }));
  }, [user, router]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ email: formData.email });
      if (error) throw error;
      toast.success('Email update initiated. Please check your inbox for confirmation.');
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableMfa = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });
      if (error) throw error;
      
      setQrCodeUrl(data.totp.qr_code);
      setShowQrCode(true);
    } catch (error) {
      console.error('Error enabling MFA:', error);
      toast.error('Failed to enable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    setIsLoading(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: 'totp'
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        challengeId: challenge.id,
        code: verificationCode
      });
      if (verifyError) throw verifyError;

      setIsMfaEnabled(true);
      setShowQrCode(false);
      setVerificationCode('');
      toast.success('MFA enabled successfully');
    } catch (error) {
      console.error('Error verifying MFA:', error);
      toast.error('Failed to verify MFA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    setIsLoading(true);
    try {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const totpFactor = data.all.find((factor: SupabaseFactor) => 
        factor.factor_type === 'totp' && factor.status === 'verified'
      );
      if (!totpFactor) throw new Error('MFA factor not found');

      const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
      if (error) throw error;

      setIsMfaEnabled(false);
      toast.success('MFA disabled successfully');
    } catch (error) {
      console.error('Error disabling MFA:', error);
      toast.error('Failed to disable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="space-y-6">
              <TabsList>
                <TabsTrigger value="email">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="password">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="mfa">
                  <Shield className="h-4 w-4 mr-2" />
                  Two-Factor Auth
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Email
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="password">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="mfa">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={isMfaEnabled}
                      onCheckedChange={isMfaEnabled ? handleDisableMfa : handleEnableMfa}
                      disabled={isLoading}
                    />
                  </div>

                  {showQrCode && (
                    <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
                          <DialogDescription>
                            Scan this QR code with your authenticator app and enter the verification code below.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center space-y-4">
                          <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                          <div className="grid gap-2 w-full">
                            <Label htmlFor="verification-code">Verification Code</Label>
                            <Input
                              id="verification-code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              placeholder="Enter 6-digit code"
                              maxLength={6}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleVerifyMfa} disabled={isLoading || verificationCode.length !== 6}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 