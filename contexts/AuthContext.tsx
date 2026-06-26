// Powered by OnSpace.AI — Real Supabase Auth Context
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/template';

interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabaseClient();
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(sessionToUser(data.session.user));
      setIsLoading(false);
    });
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? sessionToUser(session.user) : null);
      setIsLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await getSupabaseClient().auth.signInWithOAuth({ provider: 'google' });
    if (error) throw new Error(error.message);
  };

  const loginWithPassword = async (email: string, password: string) => {
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signUp = async (email: string, password: string): Promise<{ needsConfirmation: boolean }> => {
    const { data, error } = await getSupabaseClient().auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return { needsConfirmation: !data.session };
  };

  const sendOTP = async (email: string) => {
    const { error } = await getSupabaseClient().auth.signInWithOtp({ email });
    if (error) throw new Error(error.message);
  };

  const verifyOTP = async (email: string, token: string) => {
    const { error } = await getSupabaseClient().auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    await getSupabaseClient().auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, loginWithPassword, signUp, sendOTP, verifyOTP, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function sessionToUser(u: any): AppUser {
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email?.split('@')[0] ?? 'Utilisateur',
  };
}
