export type UserRole = 'admin' | 'premium_user' | 'basic_user';

export interface UserAccess {
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  // Add any other fields that might be in your user_access table
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
} 