import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../config/superbase';
import { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to handle user profile and auth state
  const handleAuthUser = async (user: SupabaseUser) => {
    try {
      setSupabaseUser(user);

      let { data: profile, error } = await supabase()
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.details?.includes('Results contain 0 rows')) {
        const { data: newProfile, error: insertError } = await supabase()
          .from('users')
          .insert({
            id: user.id,
            email: user.email!,
            username: user.user_metadata?.username || user.email!.split('@')[0],
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          setIsAuthenticated(false);
          setCurrentUser(null);
          setSupabaseUser(null);
          return;
        }
        profile = newProfile;
      } else if (error) {
        console.error('Error fetching user profile:', error);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setSupabaseUser(null);
        return;
      }

      if (profile) {
        const userProfile: User = {
          id: profile.id as string,
          username: profile.username as string,
          email: profile.email as string,
          created_at: profile.created_at as string,
          supabase_user: user,
        };

        setCurrentUser(userProfile);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setSupabaseUser(null);
      }
    } catch (error) {
      console.error('Error handling auth user:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setSupabaseUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Initialize auth state on mount
    supabase().auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Error getting session:', error);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setSupabaseUser(null);
        setLoading(false);
        return;
      }
      if (data.session?.user) {
        handleAuthUser(data.session.user).then(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setSupabaseUser(null);
        setLoading(false);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase().auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setLoading(true);

      if (session?.user) {
        handleAuthUser(session.user).then(() => {
          setLoading(false);
        });
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setSupabaseUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login, signup, logout, resetPassword unchanged
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase().auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase().auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) return { success: false, error: error.message };
      if (data.user && !data.session) {
        return { success: true, error: 'Please check your email to confirm your account before signing in.' };
      }
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase().auth.signOut();
      if (error) console.error('Logout error:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        supabaseUser,
        loading,
        login,
        signup,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
