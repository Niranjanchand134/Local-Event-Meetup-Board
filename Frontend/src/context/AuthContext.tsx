import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
  isVerifiedOrganizer: boolean;
  isNormalUser: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string, requestedRole?: string) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async (): Promise<AuthUser | null> => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      setUser(null);
      return null;
    }

    try {
      const response = await api.get<AuthUser>('/users/me');
      setUser(response.data);
      setToken(storedToken);
      return response.data;
    } catch (error) {
      console.error('Failed to validate session token:', error);
      localStorage.removeItem('access_token');
      setToken(null);
      setUser(null);
      return null;
    }
  };

  // Fetch current logged-in user on app mount or when token changes
  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await api.post<{ access_token: string }>('/auth/login', {
        email,
        password,
      });

      const access_token = res.data.access_token;
      localStorage.setItem('access_token', access_token);
      setToken(access_token);

      const meRes = await api.get<AuthUser>('/users/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      setUser(meRes.data);
      return meRes.data;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    requestedRole: string = 'user'
  ): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await api.post<{ access_token: string }>('/auth/signup', {
        name,
        email,
        password,
        requested_role: requestedRole,
      });

      const access_token = res.data.access_token;
      localStorage.setItem('access_token', access_token);
      setToken(access_token);

      const meRes = await api.get<AuthUser>('/users/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      setUser(meRes.data);
      return meRes.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';
  const isVerifiedOrganizer = (user?.role === 'organizer' && user?.is_verified_organizer) || user?.role === 'admin';
  const isNormalUser = user?.role === 'user';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        isOrganizer,
        isVerifiedOrganizer,
        isNormalUser,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
