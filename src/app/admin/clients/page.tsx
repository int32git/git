'use client';

import { useEffect, useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { supabaseService, type Customer } from '@/lib/services/supabase-service';
import { Loader2, Plus, Pencil, SlidersHorizontal, Search } from 'lucide-react';

type VisibleColumns = { [key in keyof Omit<Customer, 'id' | 'created_at' | 'updated_at'>]: boolean };

export default function ClientManagementPage() {
  const [clients, setClients] = useState<Customer[]>([]);
  const [filteredClients, setFilteredClients] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    company_name: true,
    company_email: true,
    company_phone: true,
    company_address: false,
    company_city: false,
    company_state_province: false,
    company_postal_code: false,
    company_country: false,
    company_website: false,
    tax_id: false,
    is_active: true,
  });
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_city: '',
    company_state_province: '',
    company_postal_code: '',
    company_country: '',
    company_website: '',
    tax_id: '',
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const filterClients = () => {
    if (!searchTerm) {
      setFilteredClients(clients);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = clients.filter(client => 
      client.company_name.toLowerCase().includes(searchLower) ||
      client.company_email.toLowerCase().includes(searchLower) ||
      client.company_phone.toLowerCase().includes(searchLower) ||
      client.company_city?.toLowerCase().includes(searchLower) ||
      client.company_country?.toLowerCase().includes(searchLower)
    );
    setFilteredClients(filtered);
  };

  const fetchClients = async () => {
    try {
      const data = await supabaseService.getCustomers();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (selectedClient) {
        await supabaseService.updateCustomer(selectedClient.id, formData);
      } else {
        await supabaseService.createCustomer(formData);
      }
      await fetchClients();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving client:', error);
      setError('Failed to save client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (client: Customer) => {
    setIsLoading(true);
    try {
      await supabaseService.updateCustomer(client.id, {
        is_active: !client.is_active,
      });
      await fetchClients();
    } catch (error) {
      console.error('Error updating client status:', error);
      setError('Failed to update client status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (client: Customer) => {
    setSelectedClient(client);
    setFormData({
      company_name: client.company_name,
      company_email: client.company_email,
      company_phone: client.company_phone,
      company_address: client.company_address,
      company_city: client.company_city,
      company_state_province: client.company_state_province,
      company_postal_code: client.company_postal_code,
      company_country: client.company_country,
      company_website: client.company_website,
      tax_id: client.tax_id,
      is_active: client.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedClient(null);
    setFormData({
      company_name: '',
      company_email: '',
      company_phone: '',
      company_address: '',
      company_city: '',
      company_state_province: '',
      company_postal_code: '',
      company_country: '',
      company_website: '',
      tax_id: '',
      is_active: true,
    });
    setError(null);
  };

  const columnLabels: { [key in keyof VisibleColumns]: string } = {
    company_name: 'Company Name',
    company_email: 'Email',
    company_phone: 'Phone',
    company_address: 'Address',
    company_city: 'City',
    company_state_province: 'State/Province',
    company_postal_code: 'Postal Code',
    company_country: 'Country',
    company_website: 'Website',
    tax_id: 'Tax ID',
    is_active: 'Status',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Client Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
              <DialogDescription>
                {selectedClient 
                  ? 'Update the client\'s information below.'
                  : 'Fill in the client\'s information below.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_email">Email *</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_phone">Phone *</Label>
                    <Input
                      id="company_phone"
                      value={formData.company_phone}
                      onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_website">Website</Label>
                    <Input
                      id="company_website"
                      type="url"
                      value={formData.company_website}
                      onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="is_active">Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active">{formData.is_active ? 'Active' : 'Inactive'}</Label>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company_address">Address</Label>
                  <Input
                    id="company_address"
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company_city">City</Label>
                    <Input
                      id="company_city"
                      value={formData.company_city}
                      onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_state_province">State/Province</Label>
                    <Input
                      id="company_state_province"
                      value={formData.company_state_province}
                      onChange={(e) => setFormData({ ...formData, company_state_province: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_postal_code">Postal Code</Label>
                    <Input
                      id="company_postal_code"
                      value={formData.company_postal_code}
                      onChange={(e) => setFormData({ ...formData, company_postal_code: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_country">Country</Label>
                    <Input
                      id="company_country"
                      value={formData.company_country}
                      onChange={(e) => setFormData({ ...formData, company_country: e.target.value })}
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-sm text-red-500">
                    {error}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedClient ? 'Update Client' : 'Add Client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>Manage your client list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4 space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {(Object.keys(visibleColumns) as Array<keyof VisibleColumns>).map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column}
                    checked={visibleColumns[column]}
                    onCheckedChange={(checked: boolean) =>
                      setVisibleColumns((prev) => ({ ...prev, [column]: checked }))
                    }
                  >
                    {columnLabels[column]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {(Object.keys(visibleColumns) as Array<keyof VisibleColumns>).map((column) =>
                      visibleColumns[column] ? (
                        <TableHead key={column}>{columnLabels[column]}</TableHead>
                      ) : null
                    )}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      {(Object.keys(visibleColumns) as Array<keyof VisibleColumns>).map((column) =>
                        visibleColumns[column] ? (
                          <TableCell key={column}>
                            {column === 'is_active' ? (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={client.is_active}
                                  onCheckedChange={() => handleToggleStatus(client)}
                                />
                                <span className={`text-sm ${client.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                  {client.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            ) : (
                              client[column]
                            )}
                          </TableCell>
                        ) : null
                      )}
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 