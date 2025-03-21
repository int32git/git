import { supabase } from '../supabase';

export interface Customer {
  id: string;
  company_name: string;
  company_address: string;
  company_city: string;
  company_state_province: string;
  company_postal_code: string;
  company_country: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  tax_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: 'active' | 'trial' | 'past_due' | 'canceled' | 'expired';
  billing_cycle: 'monthly' | 'annual';
  device_count: number;
  current_period_start: string;
  current_period_end: string;
  customer: {
    company_name: string;
  };
  plan: {
    name: string;
    monthly_price_eur: number;
    annual_price_eur: number;
  };
}

export interface Invoice {
  id: string;
  customer_id: string;
  subscription_id: string | null;
  invoice_number: string;
  amount_eur: number;
  tax_amount_eur: number;
  total_amount_eur: number;
  status: 'draft' | 'sent' | 'paid' | 'past_due' | 'void';
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  customer: {
    company_name: string;
  };
}

export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'canceled' | 'expired';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  is_basic: boolean;
  monthly_price_eur: number;
  annual_price_eur: number | null;
  features: any; // JSON object
  max_devices: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerSubscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  device_count: number;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  authorize_net_subscription_id: string | null;
  payment_profile_id: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  customer?: Customer;
  plan?: SubscriptionPlan;
}

export interface UserLicense {
  id: string;
  user_id: string;
  subscription_id: string;
  is_active: boolean;
  assigned_at: string;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  user?: any; // Auth user type
  subscription?: CustomerSubscription;
}

export const supabaseService = {
  // Customers
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('company_name');

    if (error) throw error;
    return data;
  },

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('customer_subscriptions')
      .select(`
        *,
        customer:customers(company_name),
        plan:subscription_plans(name, monthly_price_eur, annual_price_eur)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('customer_subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(company_name)
      `)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getInvoiceStats(): Promise<{
    totalOutstanding: number;
    overdueCount: number;
    pendingCount: number;
  }> {
    const { data, error } = await supabase
      .from('invoices')
      .select('status, total_amount_eur');

    if (error) throw error;

    return {
      totalOutstanding: data
        .filter(invoice => invoice.status !== 'paid' && invoice.status !== 'void')
        .reduce((sum, invoice) => sum + invoice.total_amount_eur, 0),
      overdueCount: data.filter(invoice => invoice.status === 'past_due').length,
      pendingCount: data.filter(invoice => invoice.status === 'sent').length,
    };
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('monthly_price_eur', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Customer Subscriptions
  async getCustomerSubscriptions(): Promise<CustomerSubscription[]> {
    const { data, error } = await supabase
      .from('customer_subscriptions')
      .select(`
        *,
        customer:customers(*),
        plan:subscription_plans(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCustomerSubscription(id: string): Promise<CustomerSubscription> {
    const { data, error } = await supabase
      .from('customer_subscriptions')
      .select(`
        *,
        customer:customers(*),
        plan:subscription_plans(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createCustomerSubscription(subscription: Omit<CustomerSubscription, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerSubscription> {
    const { data, error } = await supabase
      .from('customer_subscriptions')
      .insert([subscription])
      .select(`
        *,
        customer:customers(*),
        plan:subscription_plans(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateCustomerSubscription(id: string, subscription: Partial<CustomerSubscription>): Promise<CustomerSubscription> {
    const { data, error } = await supabase
      .from('customer_subscriptions')
      .update(subscription)
      .eq('id', id)
      .select(`
        *,
        customer:customers(*),
        plan:subscription_plans(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // User Licenses
  async getUserLicenses(subscriptionId: string): Promise<UserLicense[]> {
    const { data, error } = await supabase
      .from('user_licenses')
      .select(`
        *,
        user:user_id(*)
      `)
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createUserLicense(license: Omit<UserLicense, 'id' | 'created_at' | 'updated_at'>): Promise<UserLicense> {
    const { data, error } = await supabase
      .from('user_licenses')
      .insert([license])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserLicense(id: string, license: Partial<UserLicense>): Promise<UserLicense> {
    const { data, error } = await supabase
      .from('user_licenses')
      .update(license)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
}; 