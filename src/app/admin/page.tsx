'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Shield,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Laptop,
  Server,
  ShieldAlert,
} from 'lucide-react';

interface DeviceMetrics {
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  compliantDevices: number;
  nonCompliantDevices: number;
  healthIssues: number;
  securityAlerts: number;
  osDistribution: {
    windows: number;
    macos: number;
    linux: number;
  };
  securityStatus: {
    upToDate: number;
    needsAttention: number;
    critical: number;
  };
}

interface RecentAlert {
  id: string;
  deviceName: string;
  type: 'security' | 'health' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DeviceMetrics>({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    compliantDevices: 0,
    nonCompliantDevices: 0,
    healthIssues: 0,
    securityAlerts: 0,
    osDistribution: {
      windows: 0,
      macos: 0,
      linux: 0,
    },
    securityStatus: {
      upToDate: 0,
      needsAttention: 0,
      critical: 0,
    },
  });

  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API calls to Intune and Defender APIs
      // Mock data for demonstration
      const mockMetrics: DeviceMetrics = {
        totalDevices: 256,
        activeDevices: 230,
        inactiveDevices: 26,
        compliantDevices: 245,
        nonCompliantDevices: 11,
        healthIssues: 8,
        securityAlerts: 3,
        osDistribution: {
          windows: 180,
          macos: 65,
          linux: 11,
        },
        securityStatus: {
          upToDate: 240,
          needsAttention: 12,
          critical: 4,
        },
      };

      const mockAlerts: RecentAlert[] = [
        {
          id: '1',
          deviceName: 'LAPTOP-001',
          type: 'security',
          severity: 'high',
          message: 'Outdated antivirus definitions detected',
          timestamp: '2024-03-15T10:30:00Z',
        },
        {
          id: '2',
          deviceName: 'DESKTOP-003',
          type: 'compliance',
          severity: 'medium',
          message: 'Device encryption not enabled',
          timestamp: '2024-03-15T09:45:00Z',
        },
        {
          id: '3',
          deviceName: 'MAC-007',
          type: 'health',
          severity: 'low',
          message: 'High CPU usage detected',
          timestamp: '2024-03-15T09:15:00Z',
        },
      ];

      setMetrics(mockMetrics);
      setRecentAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: RecentAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: RecentAlert['type']) => {
    switch (type) {
      case 'security':
        return ShieldAlert;
      case 'health':
        return Activity;
      case 'compliance':
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeDevices} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.compliantDevices}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.compliantDevices / metrics.totalDevices) * 100).toFixed(1)}% compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Issues</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.healthIssues}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.securityAlerts} security alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.securityStatus.upToDate}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.securityStatus.critical} critical issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* OS Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>OS Distribution</CardTitle>
            <CardDescription>Device distribution by operating system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Laptop className="h-4 w-4 mr-2" />
                  <span>Windows</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium">{metrics.osDistribution.windows}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({((metrics.osDistribution.windows / metrics.totalDevices) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Laptop className="h-4 w-4 mr-2" />
                  <span>macOS</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium">{metrics.osDistribution.macos}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({((metrics.osDistribution.macos / metrics.totalDevices) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  <span>Linux</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium">{metrics.osDistribution.linux}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({((metrics.osDistribution.linux / metrics.totalDevices) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest device and security alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => {
                const Icon = getTypeIcon(alert.type);
                return (
                  <div key={alert.id} className="flex items-start space-x-4">
                    <Icon className={`h-5 w-5 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{alert.deviceName}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Overview</CardTitle>
          <CardDescription>Detailed security status of managed devices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Actions Required</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Up to Date
                  </div>
                </TableCell>
                <TableCell>{metrics.securityStatus.upToDate}</TableCell>
                <TableCell>
                  {((metrics.securityStatus.upToDate / metrics.totalDevices) * 100).toFixed(1)}%
                </TableCell>
                <TableCell>None</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                    Needs Attention
                  </div>
                </TableCell>
                <TableCell>{metrics.securityStatus.needsAttention}</TableCell>
                <TableCell>
                  {((metrics.securityStatus.needsAttention / metrics.totalDevices) * 100).toFixed(1)}%
                </TableCell>
                <TableCell>Update required</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    Critical
                  </div>
                </TableCell>
                <TableCell>{metrics.securityStatus.critical}</TableCell>
                <TableCell>
                  {((metrics.securityStatus.critical / metrics.totalDevices) * 100).toFixed(1)}%
                </TableCell>
                <TableCell>Immediate attention needed</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 