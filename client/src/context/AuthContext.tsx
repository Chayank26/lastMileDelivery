/**
 * Authentication Context Provider
 * -------------------------------
 * Manages user state, JWT tokens in localStorage, role switching,
 * and automatic session hydration.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

export type RoleType = 'ADMIN' | 'AGENT' | 'CUSTOMER';

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleType;
  isDemoAccount?: boolean;
}

interface IAuthContext {
  user: IUser | null;
  token: string | null;
  role: RoleType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  demoLogin: (targetRole: RoleType) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('last_mile_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Rehydrate user profile on initial app load if token exists
  useEffect(() => {
    const hydrateUser = async () => {
      const storedToken = localStorage.getItem('last_mile_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        setUser(response.data.user);
      } catch (error) {
        console.warn('⚠️ Stored token invalid or expired. Logging out.');
        localStorage.removeItem('last_mile_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    hydrateUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('last_mile_token', newToken);
      setToken(newToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (targetRole: RoleType) => {
    setIsLoading(true);
    try {
      const response = await authApi.demoLogin(targetRole);
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('last_mile_token', newToken);
      setToken(newToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('last_mile_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data.user);
    } catch (error) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
