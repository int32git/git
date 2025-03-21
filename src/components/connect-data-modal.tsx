'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, Database } from 'lucide-react';
import { toast } from 'sonner';
import { initializeMsal, loginWithPopup, graphScopes, clearMsalData, isAuthenticated } from '@/lib/services/msal-service';
import { 
  fetchIntuneDevices, fetchDefenderData, fetchSoftwareInventory,
  DeviceDataResponse, SoftwareDataResponse, DefenderData
} from '@/lib/services/graph-service';

// Define the expected dashboard data structure
export interface DashboardData {
  timestamp: number; // When the data was fetched
  devices: {
    total: number;
    compliant: number;
    nonCompliant: number;
    ids: string[]; // Array of unique device IDs from Microsoft
  };
  risks: {
    high: number;
    medium: number;
    low: number;
  };
  software: {
    monitored: number;
    outdated: number;
  };
}

interface ConnectDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (data: DashboardData) => void;
}

export function ConnectDataModal({
  open,
  onOpenChange,
  onConnect,
}: ConnectDataModalProps) {
  const [activeTab, setActiveTab] = useState('defender');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Azure AD App credentials
  const [clientId, setClientId] = useState('');
  const [tenantId, setTenantId] = useState('');
  
  // Connection options
  const [useMockData, setUseMockData] = useState(false);
  
  const handleConnect = async () => {
    if (!clientId || !tenantId) {
      toast.error('Client ID and Tenant ID are required');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      if (useMockData) {
        // Generate mock data based on the selected API
        const mockData: DashboardData = generateMockData(activeTab);
        
        // Call the onConnect callback with the generated data
        onConnect(mockData);
        toast.success('Connected with mock data');
        onOpenChange(false);
        return;
      }
      
      // Initialize MSAL with the provided credentials
      initializeMsal(clientId, tenantId);
      
      // Login with popup and request the necessary scopes
      const scopes = activeTab === 'defender' ? graphScopes.defender : graphScopes.intune;
      const authResult = await loginWithPopup(scopes);
      
      if (!authResult) {
        throw new Error('Authentication failed');
      }
      
      setIsAuthenticated(true);
      
      // Fetch real data from Microsoft Graph API
      let dashboardData: DashboardData = {
        timestamp: Date.now(),
        devices: {
          total: 0,
          compliant: 0,
          nonCompliant: 0,
          ids: []
        },
        risks: {
          high: 0,
          medium: 0,
          low: 0
        },
        software: {
          monitored: 0,
          outdated: 0
        }
      };
      
      if (activeTab === 'defender') {
        // Fetch Defender data
        const defenderData: DefenderData = await fetchDefenderData();
        
        dashboardData = {
          ...dashboardData,
          risks: {
            high: defenderData.alerts.high,
            medium: defenderData.alerts.medium,
            low: defenderData.alerts.low
          },
          devices: {
            total: defenderData.devices.total,
            compliant: defenderData.devices.secure,
            nonCompliant: defenderData.devices.atRisk,
            ids: Array.from({ length: defenderData.devices.total }, (_, i) => `defender-device-${i + 1}`)
          }
        };
      } else {
        // Fetch Intune data
        const deviceData: DeviceDataResponse = await fetchIntuneDevices();
        const softwareData: SoftwareDataResponse = await fetchSoftwareInventory();
        
        dashboardData = {
          ...dashboardData,
          devices: {
            total: deviceData.totalCount,
            compliant: deviceData.compliantCount,
            nonCompliant: deviceData.nonCompliantCount,
            ids: deviceData.deviceIds
          },
          software: {
            monitored: softwareData.monitored,
            outdated: softwareData.outdated
          }
        };
      }
      
      // Call the onConnect callback with the fetched data
      onConnect(dashboardData);
      
      toast.success('Connected successfully to Microsoft Graph API');
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear MSAL data on error
      clearMsalData();
      setIsAuthenticated(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      // Clear MSAL data
      clearMsalData();
      setIsAuthenticated(false);
      toast.success('Disconnected from Microsoft Graph API');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  };

  // Function to generate mock data
  const generateMockData = (source: string): DashboardData => {
    // Common data for both sources
    const commonData: DashboardData = {
      timestamp: Date.now(),
      devices: {
        total: Math.floor(Math.random() * 500) + 100,
        compliant: 0,
        nonCompliant: 0,
        ids: []
      },
      risks: {
        high: Math.floor(Math.random() * 10),
        medium: Math.floor(Math.random() * 25),
        low: Math.floor(Math.random() * 50)
      },
      software: {
        monitored: Math.floor(Math.random() * 200) + 50,
        outdated: Math.floor(Math.random() * 50)
      }
    };
    
    // Set the calculated values
    commonData.devices.compliant = Math.floor(commonData.devices.total * 0.85); // 85% compliant
    commonData.devices.nonCompliant = commonData.devices.total - commonData.devices.compliant;
    
    // Generate random device IDs
    commonData.devices.ids = Array.from({ length: commonData.devices.total }, () => 
      `device-${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}`
    );
    
    // Add some variation based on the source
    if (source === 'defender') {
      commonData.risks.high += 5;
      commonData.risks.medium += 10;
    } else {
      commonData.devices.total += 50;
      commonData.devices.compliant += 40;
      commonData.devices.nonCompliant += 10;
      
      // Add more device IDs for the additional devices
      const currentLength = commonData.devices.ids?.length || 0;
      const additionalIds = Array.from(
        { length: 50 }, 
        (_, i) => `${source}-device-${currentLength + i + 1}`
      );
      commonData.devices.ids = [...(commonData.devices.ids || []), ...additionalIds];
    }
    
    return commonData;
  };

  const isFormValid = () => {
    if (useMockData) {
      return true;
    }
    return clientId && tenantId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect to Microsoft Data</DialogTitle>
          <DialogDescription>
            Connect to Microsoft APIs to fetch device and security data
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="defender" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="defender" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" /> Defender API
            </TabsTrigger>
            <TabsTrigger value="intune" className="flex items-center">
              <Database className="mr-2 h-4 w-4" /> Intune API
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="defender" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-mock-data"
                  checked={useMockData}
                  onChange={(e) => setUseMockData(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="use-mock-data">Use mock data (for testing)</Label>
              </div>
              
              {!useMockData && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="client-id">Azure AD App Client ID</Label>
                    <Input 
                      id="client-id" 
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Enter Azure AD App Client ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-id">Azure Tenant ID</Label>
                    <Input 
                      id="tenant-id" 
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      placeholder="Enter Azure Tenant ID"
                    />
                  </div>
                </>
              )}
              
              <div className="rounded-md bg-muted p-4">
                <h3 className="font-medium mb-2">Required Permissions</h3>
                <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                  <li>SecurityEvents.Read.All</li>
                  <li>SecurityActions.Read.All</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="intune" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-mock-data-intune"
                  checked={useMockData}
                  onChange={(e) => setUseMockData(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="use-mock-data-intune">Use mock data (for testing)</Label>
              </div>
              
              {!useMockData && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="client-id-intune">Azure AD App Client ID</Label>
                    <Input 
                      id="client-id-intune" 
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Enter Azure AD App Client ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-id-intune">Azure Tenant ID</Label>
                    <Input 
                      id="tenant-id-intune" 
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      placeholder="Enter Azure Tenant ID"
                    />
                  </div>
                </>
              )}
              
              <div className="rounded-md bg-muted p-4">
                <h3 className="font-medium mb-2">Required Permissions</h3>
                <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                  <li>DeviceManagementManagedDevices.Read.All</li>
                  <li>DeviceManagementConfiguration.Read.All</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          {isAuthenticated ? (
            <div className="flex w-full justify-between">
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
              <Button 
                type="submit" 
                onClick={handleConnect}
                disabled={isConnecting || !isFormValid()}
              >
                Refresh Data
              </Button>
            </div>
          ) : (
            <Button 
              type="submit" 
              onClick={handleConnect}
              disabled={isConnecting || !isFormValid()}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 