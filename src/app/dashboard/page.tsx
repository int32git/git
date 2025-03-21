'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMicrosoftData } from '@/hooks/useMicrosoftData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, RefreshCw, FileText, Calendar, Download } from 'lucide-react';
import { ConnectDataModal, DashboardData } from '@/components/connect-data-modal';
import { toast } from 'sonner';
import { logout } from '@/lib/services/msal-service';
import { DeviceComplianceChart } from '@/components/charts/device-compliance-chart';
import { SecurityAlertsChart } from '@/components/charts/security-alerts-chart';
import { SoftwareStatusChart } from '@/components/charts/software-status-chart';
import { DeviceCountChart } from '@/components/charts/device-count-chart';
import { Link } from '@/components/ui/link';
import { DeviceIdViewer } from '@/components/device-id-viewer';
import { PremiumReportPreview } from '@/components/premium-report-preview';

export default function DashboardPage() {
  const { user, userAccess, loading } = useAuth();
  const { 
    isConnected, 
    isLoading: dataLoading, 
    data: dashboardData, 
    formattedTimestamp,
    saveData,
    clearData
  } = useMicrosoftData();
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Check for cached data on component mount
  useEffect(() => {
    console.log("Dashboard page - Mounted, user:", user?.email, "role:", userAccess?.role);
  }, [user, userAccess]);

  const isPremium = userAccess?.role === 'premium_user';

  const handleDisconnect = () => {
    try {
      // Logout from MSAL
      logout();
      
      // Clear stored data
      clearData();
      
      toast.success('Disconnected from Microsoft data sources');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
  };

  if (loading || dataLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  if (!user || !userAccess) {
    return <div className="p-8">Not authenticated. Please sign in.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {isConnected ? (
              <span className="flex items-center">
                <RefreshCw className="h-3 w-3 mr-1" /> Last updated: {formattedTimestamp}
              </span>
            ) : (
              <span>Connect data to view visualizations</span>
            )}
          </p>
        </div>
        <Button 
          onClick={() => setShowConnectModal(true)}
          className="flex items-center"
          variant={isConnected ? "outline" : "default"}
        >
          <Database className="mr-2 h-4 w-4" /> 
          {isConnected ? 'Update Data Sources' : 'Connect to Data'}
        </Button>
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center space-y-4 border border-dashed rounded-lg p-16 bg-slate-50">
          <Database className="h-16 w-16 text-slate-400" />
          <h2 className="text-xl font-semibold">No Data Sources Connected</h2>
          <p className="text-center text-slate-500 max-w-md">
            Connect to Microsoft Defender or Intune API to visualize your device and security data on this dashboard.
          </p>
          <Button 
            onClick={() => setShowConnectModal(true)}
            size="lg"
            className="mt-4"
          >
            Connect to Data
          </Button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.devices.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Device count from all sources
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.devices.total && dashboardData.devices.total > 0 
                    ? Math.round((dashboardData.devices.compliant / dashboardData.devices.total) * 100) 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall device compliance score
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(dashboardData?.risks.high || 0) + (dashboardData?.risks.medium || 0) + (dashboardData?.risks.low || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total active security alerts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Software Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.software.outdated || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Applications need updates
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DeviceComplianceChart 
              compliantCount={dashboardData?.devices.compliant || 0}
              nonCompliantCount={dashboardData?.devices.nonCompliant || 0}
            />
            
            <SecurityAlertsChart 
              highCount={dashboardData?.risks.high || 0}
              mediumCount={dashboardData?.risks.medium || 0}
              lowCount={dashboardData?.risks.low || 0}
            />
            
            <DeviceCountChart 
              totalCount={dashboardData?.devices.total || 0}
              deviceIds={dashboardData?.devices.ids || []}
            />
            
            {isPremium && (
              <SoftwareStatusChart 
                monitored={dashboardData?.software.monitored || 0}
                outdated={dashboardData?.software.outdated || 0}
              />
            )}
          </div>
        </>
      )}

      {/* Upgrade message - only show if not connected or after charts */}
      {userAccess?.role === 'basic_user' && (
        <>
          <Card className="border-blue-200 bg-blue-50 mt-6">
            <CardHeader>
              <CardTitle>Upgrade to Premium</CardTitle>
              <CardDescription>
                Get access to additional features like Asset Lifecycle, Risk Management, and Software Inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant="outline" className="bg-white" asChild>
                  <Link href="/pricing">View Premium Plans</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href="/reporting">Try Reporting Preview</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <PremiumReportPreview />
        </>
      )}

      {/* The Connect Data Modal */}
      <ConnectDataModal 
        open={showConnectModal} 
        onOpenChange={setShowConnectModal}
        onConnect={(data: DashboardData) => {
          // Save the data using our custom hook
          saveData(data);
          toast.success('Successfully connected and cached data');
        }}
      />
    </div>
  );
} 