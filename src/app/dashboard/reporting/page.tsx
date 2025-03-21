'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, BarChart, PieChart, LineChart, Clock, Save, Share, Lock, Eye, FileDown, CheckCircle, Pencil, Trash2, MoveHorizontal, Type, Heading1, Image, BarChart2, FileBarChart2, Shield, ShieldCheck } from 'lucide-react';
import { Table as TableIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';

// Define template interface
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

// Example report templates
const reportTemplates: ReportTemplate[] = [
  { 
    id: 'compliance-summary',
    name: 'Compliance Summary',
    description: 'Overview of device compliance status across your organization.',
    icon: <FileText className="h-8 w-8 text-primary" />,
    category: 'compliance'
  },
  { 
    id: 'security-posture',
    name: 'Security Posture',
    description: 'Executive summary of your security posture with key metrics and recommendations.',
    icon: <FileText className="h-8 w-8 text-primary" />,
    category: 'executive'
  },
  { 
    id: 'device-health',
    name: 'Device Health Status',
    description: 'Detailed report of all device health metrics and issues.',
    icon: <FileText className="h-8 w-8 text-primary" />,
    category: 'operations'
  },
  { 
    id: 'patch-compliance',
    name: 'Patch Compliance',
    description: 'Status of patch deployment and compliance across your fleet.',
    icon: <FileText className="h-8 w-8 text-primary" />,
    category: 'compliance'
  },
  { 
    id: 'software-inventory',
    name: 'Software Inventory',
    description: 'Complete inventory of installed software with version information.',
    icon: <FileText className="h-8 w-8 text-primary" />,
    category: 'inventory'
  },
  { 
    id: 'risk-assessment',
    name: 'Risk Assessment',
    description: 'Detailed analysis of security risks and prioritized recommendations.',
    icon: <FileText className="h-8 w-8 text-primary" />,
    category: 'executive'
  },
];

// DraggableComponent interface
interface DraggableComponentProps {
  component?: string;
  name?: string;
  label?: string;
  icon: React.ReactNode;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, componentType: string) => void;
}

// Example visualization components
const DraggableComponent: React.FC<DraggableComponentProps> = ({ 
  component, 
  name, 
  label, 
  icon, 
  onDragStart 
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart?.(e, component || name || '');
  };

  return (
    <div
      className="flex items-center p-2 border rounded-md cursor-grab bg-background hover:bg-muted transition-colors"
      draggable
      onDragStart={handleDragStart}
    >
      {icon}
      <span className="ml-2 text-sm">{label || name}</span>
    </div>
  );
};

export default function DashboardReportingPage() {
  const { userAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Check if user is premium
  const isPremium = userAccess?.role === 'premium_user';

  // Filter templates based on category
  const filteredTemplates = selectedCategory === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(template => template.category === selectedCategory);

  return (
    <div className="p-8 pt-6">
      {isPremium ? (
        <>
          {/* Premium user content */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Reporting</h1>
            <Button
              variant="outline"
              onClick={() => setActiveTab("templates")}
              className={activeTab === "templates" ? "bg-muted" : ""}
            >
              {activeTab === "templates" ? "Viewing Report Templates" : "View Report Templates"}
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="builder">Report Builder</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates">
              {/* Report Templates Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Input 
                    placeholder="Search templates..." 
                    className="max-w-sm" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {template.icon}
                          <CardTitle className="text-lg ml-2">{template.name}</CardTitle>
                        </div>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <CardDescription className="pt-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Generated:</span>
                          <span className="text-sm">Last 7 days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Format:</span>
                          <span className="text-sm">PDF, Excel, CSV</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm">
                        <FileDown className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="builder">
              {/* Report Builder Section */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-muted/40 rounded-lg p-4 border">
                  <h3 className="text-lg font-medium mb-3">Report Components</h3>
                  <div className="space-y-3">
                    <DraggableComponent component="BarChart" label="Bar Chart" icon={<BarChart2 className="h-4 w-4 mr-2" />} />
                    <DraggableComponent component="LineChart" label="Line Chart" icon={<LineChart className="h-4 w-4 mr-2" />} />
                    <DraggableComponent component="PieChart" label="Pie Chart" icon={<PieChart className="h-4 w-4 mr-2" />} />
                    <DraggableComponent component="Table" label="Data Table" icon={<TableIcon className="h-4 w-4 mr-2" />} />
                    <DraggableComponent component="Text" label="Text Block" icon={<Type className="h-4 w-4 mr-2" />} />
                    <DraggableComponent component="Heading" label="Heading" icon={<Heading1 className="h-4 w-4 mr-2" />} />
                    <DraggableComponent component="Image" label="Image" icon={<Image className="h-4 w-4 mr-2" />} />
                  </div>
                </div>
                
                <div className="lg:col-span-3 border rounded-lg p-4 min-h-[500px] relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Preview Area</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border border-dashed rounded-lg p-6 h-[400px] flex items-center justify-center bg-muted/30">
                    <div className="text-center">
                      <MoveHorizontal className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Drag components here to build your report</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="scheduled">
              {/* Scheduled Reports Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Scheduled Report</CardTitle>
                    <CardDescription>Configure automated report generation and distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-template">Report Template</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a report template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="device-compliance">Device Compliance Summary</SelectItem>
                          <SelectItem value="security-audit">Security Audit</SelectItem>
                          <SelectItem value="software-inventory">Software Inventory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="schedule-frequency">Frequency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="export-format">Export Format</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select export format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="distribution">Distribution Method</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select distribution method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="shared-folder">Shared Folder</SelectItem>
                          <SelectItem value="download-only">Download Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="recipients">Recipients</Label>
                      <Input id="recipients" placeholder="Enter email addresses (comma separated)" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Report
                    </Button>
                  </CardFooter>
                </Card>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Active Scheduled Reports</h3>
                    <Input placeholder="Search reports..." className="max-w-xs" />
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report Name</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Next Run</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Device Compliance Summary</TableCell>
                        <TableCell>Weekly (Monday)</TableCell>
                        <TableCell>March 25, 2024</TableCell>
                        <TableCell>3 recipients</TableCell>
                        <TableCell>PDF</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Security Audit Report</TableCell>
                        <TableCell>Monthly (1st)</TableCell>
                        <TableCell>April 1, 2024</TableCell>
                        <TableCell>2 recipients</TableCell>
                        <TableCell>Excel</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="space-y-6">
          <div className="border-b pb-5">
            <h1 className="text-3xl font-bold tracking-tight">Reporting</h1>
            <p className="text-muted-foreground mt-1">Premium feature - Upgrade to access comprehensive reporting tools</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Premium Reporting Features</h2>
                <p className="text-muted-foreground">Unlock powerful reporting capabilities with our Premium plan</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">Pre-built Report Templates</h3>
                    <p className="text-sm text-muted-foreground">Access over 20 professionally designed report templates for compliance, security, inventory and more</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">Custom Report Builder</h3>
                    <p className="text-sm text-muted-foreground">Create personalized reports with our intuitive drag-and-drop interface</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">Scheduled Reports</h3>
                    <p className="text-sm text-muted-foreground">Automate report generation and distribution on your preferred schedule</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">Export Options</h3>
                    <p className="text-sm text-muted-foreground">Export reports in multiple formats including PDF, Excel, CSV, and JSON</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button size="lg" asChild>
                  <Link href="/pricing">Upgrade to Premium</Link>
                </Button>
              </div>
            </Card>
            
            <div className="relative">
              <Card className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <BarChart2 className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Device Compliance Report</h3>
                    </div>
                    <div className="h-32 bg-muted/50 rounded-md flex items-center justify-center">
                      <FileBarChart2 className="h-12 w-12 text-muted-foreground/70" />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Shield className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Security Health Check</h3>
                    </div>
                    <div className="h-32 bg-muted/50 rounded-md flex items-center justify-center">
                      <ShieldCheck className="h-12 w-12 text-muted-foreground/70" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-lg">
                  <Lock className="h-12 w-12 text-primary mb-4" />
                  <p className="text-center text-lg font-medium mb-2">Premium Feature</p>
                  <p className="text-center text-muted-foreground mb-6 max-w-xs">
                    Upgrade your plan to access all reporting capabilities
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 