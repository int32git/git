'use client';

import { useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Laptop, Server, Smartphone, ExternalLink } from 'lucide-react';

type AssetStatus = 'active' | 'retiring' | 'disposed' | 'pending';

interface Asset {
  id: string;
  name: string;
  type: 'laptop' | 'desktop' | 'server' | 'mobile';
  status: AssetStatus;
  purchaseDate: string;
  endOfLifeDate: string;
  assignedTo?: string;
}

export default function AssetLifecyclePage() {
  const { userAccess } = useAuth();
  const router = useRouter();

  // Check if user has premium access
  useEffect(() => {
    if (userAccess && userAccess.role !== 'premium_user' && userAccess.role !== 'admin') {
      toast.error('This page requires a premium subscription');
      router.push('/dashboard');
    }
  }, [userAccess, router]);

  const assets: Asset[] = [
    {
      id: 'A-001',
      name: 'MacBook Pro 2023',
      type: 'laptop',
      status: 'active',
      purchaseDate: '2023-01-15',
      endOfLifeDate: '2026-01-15',
      assignedTo: 'Sarah Johnson'
    },
    {
      id: 'A-002',
      name: 'Dell XPS 15',
      type: 'laptop',
      status: 'active',
      purchaseDate: '2022-05-10',
      endOfLifeDate: '2025-05-10',
      assignedTo: 'Michael Chen'
    },
    {
      id: 'A-003',
      name: 'Database Server 1',
      type: 'server',
      status: 'active',
      purchaseDate: '2021-11-30',
      endOfLifeDate: '2026-11-30'
    },
    {
      id: 'A-004',
      name: 'HP EliteDesk',
      type: 'desktop',
      status: 'retiring',
      purchaseDate: '2020-03-22',
      endOfLifeDate: '2023-03-22',
      assignedTo: 'Alex Wong'
    },
    {
      id: 'A-005',
      name: 'iPhone 14 Pro',
      type: 'mobile',
      status: 'active',
      purchaseDate: '2022-10-01',
      endOfLifeDate: '2025-10-01',
      assignedTo: 'Emily Davis'
    },
    {
      id: 'A-006',
      name: 'Test Server',
      type: 'server',
      status: 'disposed',
      purchaseDate: '2019-06-15',
      endOfLifeDate: '2022-06-15'
    }
  ];

  const getStatusBadgeColor = (status: AssetStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 hover:bg-green-600';
      case 'retiring':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'disposed':
        return 'bg-slate-500 hover:bg-slate-600';
      case 'pending':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return '';
    }
  };

  const getAssetIcon = (type: Asset['type']) => {
    switch (type) {
      case 'laptop':
        return <Laptop className="h-4 w-4" />;
      case 'server':
        return <Server className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  // If not premium, don't render the page content
  if (userAccess && userAccess.role !== 'premium_user' && userAccess.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Asset Lifecycle Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets Overview</CardTitle>
          <CardDescription>
            Track and manage your organization's IT assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Assets</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="retiring">Retiring Soon</TabsTrigger>
              <TabsTrigger value="disposed">Disposed</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <Table>
                <TableCaption>A list of all your organization's assets.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>End of Life</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.id}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell className="flex items-center">
                        {getAssetIcon(asset.type)}
                        <span className="ml-2 capitalize">{asset.type}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(asset.status)}>
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.purchaseDate}</TableCell>
                      <TableCell>{asset.endOfLifeDate}</TableCell>
                      <TableCell>{asset.assignedTo || 'Unassigned'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="active" className="mt-4">
              <Table>
                <TableCaption>Active assets only.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>End of Life</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets
                    .filter((asset) => asset.status === 'active')
                    .map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.id}</TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell className="flex items-center">
                          {getAssetIcon(asset.type)}
                          <span className="ml-2 capitalize">{asset.type}</span>
                        </TableCell>
                        <TableCell>{asset.purchaseDate}</TableCell>
                        <TableCell>{asset.endOfLifeDate}</TableCell>
                        <TableCell>{asset.assignedTo || 'Unassigned'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="retiring" className="mt-4">
              {/* Retiring assets table */}
              <Table>
                <TableCaption>Assets that are retiring soon.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>End of Life</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets
                    .filter((asset) => asset.status === 'retiring')
                    .map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.id}</TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell className="flex items-center">
                          {getAssetIcon(asset.type)}
                          <span className="ml-2 capitalize">{asset.type}</span>
                        </TableCell>
                        <TableCell>{asset.endOfLifeDate}</TableCell>
                        <TableCell>{asset.assignedTo || 'Unassigned'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="disposed" className="mt-4">
              {/* Disposed assets table */}
              <Table>
                <TableCaption>Assets that have been disposed.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>End of Life</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets
                    .filter((asset) => asset.status === 'disposed')
                    .map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.id}</TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell className="flex items-center">
                          {getAssetIcon(asset.type)}
                          <span className="ml-2 capitalize">{asset.type}</span>
                        </TableCell>
                        <TableCell>{asset.purchaseDate}</TableCell>
                        <TableCell>{asset.endOfLifeDate}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 