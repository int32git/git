import { getTokenSilent, acquireTokenWithPopup, graphScopes } from './msal-service';

// Microsoft Graph API base URL
const graphApiUrl = 'https://graph.microsoft.com/v1.0';
const defenderApiUrl = 'https://api.securitycenter.microsoft.com/api/v1.0';

// Interface for Intune device data
export interface IntuneDevice {
  id: string;
  deviceName: string;
  managementState: string;
  osVersion: string;
  model: string;
  manufacturer: string;
  complianceState: string;
  lastSyncDateTime: string;
}

// Interface for Defender security data
export interface DefenderData {
  alerts: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  devices: {
    total: number;
    secure: number;
    atRisk: number;
  };
}

// Interface for Device Data response
export interface DeviceDataResponse {
  devices: IntuneDevice[];
  compliantCount: number;
  nonCompliantCount: number;
  totalCount: number;
  deviceIds: string[]; // Array of unique device IDs
}

// Interface for Software Data response
export interface SoftwareDataResponse {
  monitored: number;
  outdated: number;
  softwares: Array<{
    name: string;
    version: string;
    isOutdated: boolean;
  }>;
}

/**
 * Fetch Intune device data
 */
export async function fetchIntuneDevices(): Promise<DeviceDataResponse> {
  try {
    // Get token for Intune API
    let token = await getTokenSilent(graphScopes.intune);
    
    if (!token) {
      // Silent token acquisition failed, acquire token with popup
      token = await acquireTokenWithPopup(graphScopes.intune);
    }
    
    if (!token) {
      throw new Error('Failed to acquire token for Intune API');
    }
    
    // Fetch devices from Intune API
    const response = await fetch(`${graphApiUrl}/deviceManagement/managedDevices?$top=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Intune devices: ${response.statusText}`);
    }
    
    const data = await response.json();
    const devices: IntuneDevice[] = data.value.map((device: any) => ({
      id: device.id,
      deviceName: device.deviceName,
      managementState: device.managementState,
      osVersion: device.osVersion,
      model: device.model,
      manufacturer: device.manufacturer,
      complianceState: device.complianceState,
      lastSyncDateTime: device.lastSyncDateTime
    }));
    
    // Calculate compliance statistics
    const compliantCount = devices.filter(device => device.complianceState === 'compliant').length;
    const nonCompliantCount = devices.length - compliantCount;
    
    return {
      devices,
      compliantCount,
      nonCompliantCount,
      totalCount: devices.length,
      deviceIds: devices.map(device => device.id)
    };
  } catch (error) {
    console.error('Error fetching Intune devices:', error);
    throw error;
  }
}

/**
 * Fetch Defender data
 */
export async function fetchDefenderData(): Promise<DefenderData> {
  try {
    // Get token for Defender API
    let token = await getTokenSilent(graphScopes.defender);
    
    if (!token) {
      // Silent token acquisition failed, acquire token with popup
      token = await acquireTokenWithPopup(graphScopes.defender);
    }
    
    if (!token) {
      throw new Error('Failed to acquire token for Defender API');
    }
    
    // Since accessing actual Defender API requires a proper tenant with Defender enabled,
    // we'll return mock data for demonstration purposes
    // In a real implementation, you would fetch data from the actual API
    
    // Mock data
    return {
      alerts: {
        high: Math.floor(Math.random() * 5),
        medium: Math.floor(Math.random() * 10) + 5,
        low: Math.floor(Math.random() * 15) + 10,
        total: Math.floor(Math.random() * 30) + 20
      },
      devices: {
        total: Math.floor(Math.random() * 100) + 50,
        secure: Math.floor(Math.random() * 80) + 40,
        atRisk: Math.floor(Math.random() * 20) + 10
      }
    };
    
    // Actual API call would look like this:
    // const response = await fetch(`${defenderApiUrl}/alerts?$top=50`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Failed to fetch Defender alerts: ${response.statusText}`);
    // }
    // 
    // const data = await response.json();
    // // Process data...
  } catch (error) {
    console.error('Error fetching Defender data:', error);
    throw error;
  }
}

/**
 * Fetch software inventory
 */
export async function fetchSoftwareInventory(): Promise<SoftwareDataResponse> {
  try {
    // Get token for Intune API
    let token = await getTokenSilent(graphScopes.intune);
    
    if (!token) {
      // Silent token acquisition failed, acquire token with popup
      token = await acquireTokenWithPopup(graphScopes.intune);
    }
    
    if (!token) {
      throw new Error('Failed to acquire token for Intune API');
    }
    
    // Since accessing full software inventory requires specific API calls,
    // we'll return mock data for demonstration purposes
    // In a real implementation, you would fetch data from the actual API
    
    // Mock data for software inventory
    const softwareCount = Math.floor(Math.random() * 50) + 30;
    const outdatedCount = Math.floor(Math.random() * 15) + 5;
    
    const softwareNames = [
      'Microsoft Office',
      'Adobe Acrobat',
      'Chrome',
      'Firefox',
      'Zoom',
      'Microsoft Teams',
      'Slack',
      'Visual Studio Code',
      'Notepad++',
      'VLC Media Player'
    ];
    
    // Generate mock software list
    const softwares = Array.from({ length: 10 }, (_, i) => {
      const isOutdated = i < (outdatedCount / 3);
      return {
        name: softwareNames[i],
        version: `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        isOutdated
      };
    });
    
    return {
      monitored: softwareCount,
      outdated: outdatedCount,
      softwares
    };
    
    // Actual API call would look like this (but requires specific API endpoints):
    // const response = await fetch(`${graphApiUrl}/deviceManagement/managedDevices/...[some endpoint for software]`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
  } catch (error) {
    console.error('Error fetching software inventory:', error);
    throw error;
  }
}

// Transform the raw data into our dashboard format
export function transformToDeviceData(apiResponse: any[]): DeviceDataResponse {
  return {
    devices: apiResponse,
    compliantCount: apiResponse.filter(device => device.complianceState === 'compliant').length,
    nonCompliantCount: apiResponse.filter(device => device.complianceState !== 'compliant').length,
    totalCount: apiResponse.length,
    deviceIds: apiResponse.map(device => device.id || device.deviceId || `device-${Math.random().toString(36).substring(2, 10)}`)
  };
}