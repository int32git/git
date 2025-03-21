export interface User {
  id: string;
  email: string;
  access_type: 'admin' | 'basic' | 'premium';
  // ... any other existing properties ...
}

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'azure') => Promise<void>;
  signOut: () => Promise<void>;
}; 