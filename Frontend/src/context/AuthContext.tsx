import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string, requestedRole?: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch current logged-in user on app mount or when token changes
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<AuthUser>('/users/me');
        setUser(response.data);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to validate session token:', error);
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
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
    requestedRole: string = 'attendee'
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        signup,
        logout,
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
