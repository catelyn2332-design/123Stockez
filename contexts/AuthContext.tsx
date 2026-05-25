// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getCurrentUser, mockLogin, logout } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const u = await mockLogin(email, password);
    setUser(u);
  };

  const signOut = async () => {
    await logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, login, signOut }}>{children}</AuthContext.Provider>;
}
