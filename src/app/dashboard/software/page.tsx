'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  FileSpreadsheet, 
  Filter, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Laptop,
  Server,
  Search
} from 'lucide-react';

type DeviceType = 'laptop' | 'desktop' | 'server' | 'mobile';
type UpdateStatus = 'up-to-date' | 'update-available' | 'critical-update' | 'end-of-life';

interface Software {
  id: string;
  name: string;
  vendor: string;
  version: string;
  deviceCount: number;
  deviceTypes: DeviceType[];
  updateStatus: UpdateStatus;
  lastUpdated: string;
}

const getStatusBadge = (status: UpdateStatus) => {
  switch (status) {
    case 'up-to-date':
      return <Badge className="bg-green-500 hover:bg-green-600">Up to date</Badge>;
    case 'update-available':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Update available</Badge>;
    case 'critical-update':
      return <Badge className="bg-red-500 hover:bg-red-600">Critical update</Badge>;
    case 'end-of-life':
      return <Badge className="bg-slate-600 hover:bg-slate-700">End of life</Badge>;
    default:
      return null;
  }
};

const getDeviceIcon = (type: DeviceType) => {
  switch (type) {
    case 'laptop':
      return <Laptop className="h-4 w-4" />;
    case 'desktop':
      return <Laptop className="h-4 w-4" />;
    case 'server':
      return <Server className="h-4 w-4" />;
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    default:
      return null;
  }
};

export default function SoftwareInventoryPage() {
  const { userAccess } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<UpdateStatus | 'all'>('all');

  // Check if user has premium access
  useEffect(() => {
    if (userAccess && userAccess.role !== 'premium_user' && userAccess.role !== 'admin') {
      toast.error('This page requires a premium subscription');
      router.push('/dashboard');
    }
  }, [userAccess, router]);

  const softwareList: Software[] = [
    {
      id: '1',
      name: 'Microsoft Office',
      vendor: 'Microsoft',
      version: '2021',
      deviceCount: 150,
      deviceTypes: ['laptop', 'desktop'],
      updateStatus: 'up-to-date',
      lastUpdated: '2023-09-15'
    },
    {
      id: '2',
      name: 'Adobe Creative Cloud',
      vendor: 'Adobe',
      version: '24.1.0',
      deviceCount: 45,
      deviceTypes: ['laptop', 'desktop'],
      updateStatus: 'update-available',
      lastUpdated: '2023-08-22'
    },
    {
      id: '3',
      name: 'AutoCAD',
      vendor: 'Autodesk',
      version: '2022',
      deviceCount: 12,
      deviceTypes: ['desktop'],
      updateStatus: 'critical-update',
      lastUpdated: '2023-05-10'
    },
    {
      id: '4',
      name: 'SQL Server',
      vendor: 'Microsoft',
      version: '2019',
      deviceCount: 5,
      deviceTypes: ['server'],
      updateStatus: 'up-to-date',
      lastUpdated: '2023-10-01'
    },
    {
      id: '5',
      name: 'Slack',
      vendor: 'Salesforce',
      version: '4.29.149',
      deviceCount: 200,
      deviceTypes: ['laptop', 'desktop', 'mobile'],
      updateStatus: 'up-to-date',
      lastUpdated: '2023-10-05'
    },
    {
      id: '6',
      name: 'Windows 10',
      vendor: 'Microsoft',
      version: '21H2',
      deviceCount: 120,
      deviceTypes: ['laptop', 'desktop'],
      updateStatus: 'critical-update',
      lastUpdated: '2023-07-12'
    },
    {
      id: '7',
      name: 'Red Hat Enterprise Linux',
      vendor: 'Red Hat',
      version: '8.6',
      deviceCount: 8,
      deviceTypes: ['server'],
      updateStatus: 'update-available',
      lastUpdated: '2023-06-18'
    },
    {
      id: '8',
      name: 'MySQL',
      vendor: 'Oracle',
      version: '8.0.28',
      deviceCount: 6,
      deviceTypes: ['server'],
      updateStatus: 'up-to-date',
      lastUpdated: '2023-09-20'
    },
    {
      id: '9',
      name: 'Adobe Acrobat Reader',
      vendor: 'Adobe',
      version: '22.001.20117',
      deviceCount: 180,
      deviceTypes: ['laptop', 'desktop'],
      updateStatus: 'end-of-life',
      lastUpdated: '2022-12-05'
    }
  ];

  // Filter software based on search query and status filter
  const filteredSoftware = softwareList.filter(software => {
    const matchesSearch = 
      searchQuery === '' || 
      software.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      software.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || 
      software.updateStatus === filterStatus;
      
    return matchesSearch && matchesStatus;
  });

  // If not premium, don't render the page content
  if (userAccess && userAccess.role !== 'premium_user' && userAccess.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Software Inventory</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Software Applications
          </CardTitle>
          <CardDescription>
            Manage and monitor all software applications across your devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or vendor"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'} 
                onClick={() => setFilterStatus('all')}
                size="sm"
                className="min-w-24"
              >
                <Filter className="mr-2 h-4 w-4" /> All
              </Button>
              <Button 
                variant={filterStatus === 'up-to-date' ? 'default' : 'outline'} 
                onClick={() => setFilterStatus('up-to-date')}
                size="sm"
                className="min-w-24"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Current
              </Button>
              <Button 
                variant={filterStatus === 'update-available' ? 'default' : 'outline'} 
                onClick={() => setFilterStatus('update-available')}
                size="sm"
                className="min-w-24"
              >
                <Clock className="mr-2 h-4 w-4" /> Updates
              </Button>
              <Button 
                variant={filterStatus === 'critical-update' ? 'default' : 'outline'} 
                onClick={() => setFilterStatus('critical-update')}
                size="sm"
                className="min-w-24"
              >
                <AlertTriangle className="mr-2 h-4 w-4" /> Critical
              </Button>
            </div>
          </div>

          <Table>
            <TableCaption>A list of all software applications across your organization.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Software</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Device Types</TableHead>
                <TableHead>Device Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSoftware.map((software) => (
                <TableRow key={software.id}>
                  <TableCell className="font-medium">{software.name}</TableCell>
                  <TableCell>{software.vendor}</TableCell>
                  <TableCell>{software.version}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {software.deviceTypes.map((type) => (
                        <div key={type} title={type.charAt(0).toUpperCase() + type.slice(1)}>
                          {getDeviceIcon(type)}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{software.deviceCount}</TableCell>
                  <TableCell>{getStatusBadge(software.updateStatus)}</TableCell>
                  <TableCell>{software.lastUpdated}</TableCell>
                </TableRow>
              ))}
              {filteredSoftware.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    No software found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Software Requiring Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {softwareList.filter(s => s.updateStatus === 'update-available' || s.updateStatus === 'critical-update').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {softwareList.filter(s => s.updateStatus === 'critical-update').length} critical updates
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">End of Life Software</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {softwareList.filter(s => s.updateStatus === 'end-of-life').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Affecting {softwareList.filter(s => s.updateStatus === 'end-of-life').reduce((acc, s) => acc + s.deviceCount, 0)} devices
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((softwareList.filter(s => s.updateStatus === 'up-to-date').length / softwareList.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current software versions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 