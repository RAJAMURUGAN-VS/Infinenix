// types/auth.ts
import { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  supabase_user?: SupabaseUser;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthError {
  message: string;
  status?: number;
}