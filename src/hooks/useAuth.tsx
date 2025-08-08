import { useState, useContext, createContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { useLocalStorage } from './useLocalStorage';
import * as api from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [isLoading, setIsLoading] = useState(false);

  // Try to restore session on mount
  useEffect(() => {
    const tryRestore = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && !user) {
        try {
          await api.refresh();
          // Session is valid but we might not have user data in localStorage
          // Keep existing user data if available
        } catch {
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      }
    };
    tryRestore();
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userData = await api.login(email, password);
      
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        lastActive: new Date()
      };
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userData = await api.register(email, password, name);
      
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        lastActive: new Date()
      };
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}