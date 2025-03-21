# Supabase Integration Guide

This document provides instructions for setting up the necessary Supabase resources for the Intune & Defender Management application.

## Table Setup

Ensure the following tables are created in your Supabase project:

### 1. Profiles Table

```sql
-- Create a table for user profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  avatar_url text,
  email text not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policy for users to view their own profile
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

-- Create policy for users to update their own profile
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);
```

### 2. Organizations Table

```sql
-- Create a table for organizations
create table organizations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  owner_id uuid references auth.users not null
);

-- Enable Row Level Security
alter table organizations enable row level security;

-- Create policy for owners to manage their organizations
create policy "Owners can manage their organizations"
  on organizations for all
  using (auth.uid() = owner_id);
```

## Setting Up Webhooks

To ensure user profiles are created automatically when users sign up, set up a webhook in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Webhooks
3. Click "Create a new webhook"
4. Set the following values:
   - **Name**: `auth-user-created`
   - **URL**: `https://your-application-url.com/api/auth/webhook`
   - **HTTP Method**: `POST`
   - **Event Triggers**: Select `auth.user.created`
   
   Optional security (recommended):
   - Click "Add header"
   - Set header name to `x-webhook-secret`
   - Set value to a secure random string
   - Add this same value to your application's environment variables as `SUPABASE_WEBHOOK_SECRET`

5. Click "Save"

## Environment Variables

Ensure the following environment variables are set in your application:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_WEBHOOK_SECRET=your-webhook-secret
```

## Testing User Registration

To test that profiles are being created correctly:

1. Sign up a new user
2. Verify their email
3. Log in to your Supabase dashboard
4. Navigate to the "Table Editor" and check the `profiles` and `organizations` tables
5. You should see entries with the corresponding user IDs

## Troubleshooting

If profiles are not being created:

1. Check the Supabase webhook logs in the Supabase dashboard
2. Ensure your webhook URL is correct and accessible from the internet
3. Check your application logs for any errors during profile creation
4. Try the manual profile creation option by having a logged-in user visit `/api/user/create-profile`

## Database Row-Level Security

The above table definitions include Row-Level Security (RLS) policies to ensure users can only access their own data.
If you need to adjust these for your specific use case, edit the policies in the SQL editor. 