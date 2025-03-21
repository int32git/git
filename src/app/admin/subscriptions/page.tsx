'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabaseService, type Customer, type SubscriptionPlan, type CustomerSubscription, type BillingCycle, type SubscriptionStatus } from '@/lib/services/supabase-service';
import { Loader2, Plus, MoreVertical, Search, RefreshCw } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

const statusColors: Record<SubscriptionStatus, string> = {
  active: 'bg-green-100 text-green-800',
  trial: 'bg-blue-100 text-blue-800',
  past_due: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('new');
  const [error, setError] = useState<string | null>(null);

  // Form state for new subscription
  const [formData, setFormData] = useState({
    // New customer fields
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
    // Subscription fields
    customer_id: '',
    plan_id: '',
    billing_cycle: 'monthly' as BillingCycle,
    device_count: 0,
  });

  // Memoize fetchData to prevent unnecessary recreations
  const fetchData = useCallback(async () => {
    try {
      const [subsData, plansData, customersData] = await Promise.all([
        supabaseService.getCustomerSubscriptions(),
        supabaseService.getSubscriptionPlans(),
        supabaseService.getCustomers(),
      ]);
      setSubscriptions(subsData);
      setPlans(plansData);
      setCustomers(customersData);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on mount and cleanup on unmount
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchData();
      } catch (error) {
        if (mounted) {
          console.error('Error loading data:', error);
          setError('Failed to load data');
        }
      }
    };

    loadData();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_subscriptions'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let customerId = formData.customer_id;

      // If creating a new customer
      if (selectedTab === 'new') {
        const newCustomer = await supabaseService.createCustomer({
          company_name: formData.company_name,
          company_email: formData.company_email,
          company_phone: formData.company_phone,
          company_address: formData.company_address,
          company_city: formData.company_city,
          company_state_province: formData.company_state_province,
          company_postal_code: formData.company_postal_code,
          company_country: formData.company_country,
          company_website: formData.company_website,
          tax_id: formData.tax_id,
          is_active: true,
        });
        customerId = newCustomer.id;
      }

      // Create subscription
      const selectedPlan = plans.find(p => p.id === formData.plan_id);
      if (!selectedPlan) throw new Error('Invalid plan selected');

      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + (formData.billing_cycle === 'annual' ? 12 : 1));

      await supabaseService.createCustomerSubscription({
        customer_id: customerId,
        plan_id: formData.plan_id,
        status: 'active',
        billing_cycle: formData.billing_cycle,
        device_count: formData.device_count,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end: null,
        canceled_at: null,
        authorize_net_subscription_id: null,
        payment_profile_id: null,
      });

      await fetchData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError('Failed to create subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (subscription: CustomerSubscription, newStatus: SubscriptionStatus) => {
    setIsLoading(true);
    try {
      await supabaseService.updateCustomerSubscription(subscription.id, {
        status: newStatus,
        ...(newStatus === 'canceled' ? { canceled_at: new Date().toISOString() } : {}),
      });
      await fetchData();
    } catch (error) {
      console.error('Error updating subscription status:', error);
      setError('Failed to update subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
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
      customer_id: '',
      plan_id: '',
      billing_cycle: 'monthly',
      device_count: 0,
    });
    setSelectedTab('new');
    setError(null);
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.customer?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.plan?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Subscription</DialogTitle>
              <DialogDescription>
                Add a new subscription for an existing or new client.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto">
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">New Client</TabsTrigger>
                    <TabsTrigger value="existing">Existing Client</TabsTrigger>
                  </TabsList>
                  <TabsContent value="new" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="company_name">Company Name *</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          required={selectedTab === 'new'}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company_email">Email *</Label>
                        <Input
                          id="company_email"
                          type="email"
                          value={formData.company_email}
                          onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                          required={selectedTab === 'new'}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company_phone">Phone *</Label>
                        <Input
                          id="company_phone"
                          value={formData.company_phone}
                          onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                          required={selectedTab === 'new'}
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
                  </TabsContent>
                  <TabsContent value="existing">
                    <div className="grid gap-2">
                      <Label htmlFor="customer_id">Select Client *</Label>
                      <Select
                        value={formData.customer_id}
                        onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plan_id">Subscription Plan *</Label>
                    <Select
                      value={formData.plan_id}
                      onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {formatPrice(plan.monthly_price_eur)}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="billing_cycle">Billing Cycle *</Label>
                    <Select
                      value={formData.billing_cycle}
                      onValueChange={(value: BillingCycle) => setFormData({ ...formData, billing_cycle: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="device_count">Number of Devices</Label>
                    <Input
                      id="device_count"
                      type="number"
                      min="0"
                      value={formData.device_count}
                      onChange={(e) => setFormData({ ...formData, device_count: parseInt(e.target.value) || 0 })}
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
                  Create Subscription
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>Manage your client subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          {isLoading && subscriptions.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-red-500">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Current Period</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{subscription.customer?.company_name}</TableCell>
                      <TableCell>{subscription.plan?.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[subscription.status]}
                        >
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{subscription.billing_cycle}</TableCell>
                      <TableCell>{subscription.device_count}</TableCell>
                      <TableCell>
                        {subscription.current_period_start && (
                          <>
                            {format(new Date(subscription.current_period_start), 'MMM d, yyyy')}
                            {' - '}
                            {format(new Date(subscription.current_period_end!), 'MMM d, yyyy')}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {subscription.status !== 'active' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(subscription, 'active')}
                              >
                                Activate
                              </DropdownMenuItem>
                            )}
                            {subscription.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(subscription, 'canceled')}
                                className="text-red-600"
                              >
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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