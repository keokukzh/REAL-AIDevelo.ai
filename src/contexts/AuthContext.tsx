import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthPayload, AuthTokens } from '../shared/types/auth';
import { apiRequest, ApiRequestError } from '../services/api';

interface AuthContextValue {
  user: AuthPayload['user'] | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string) => Promise<void>;
  register: (email: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const saveTokens = (tokens: AuthTokens) => {
  localStorage.setItem('auth_token', tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }
};

const clearTokens = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthPayload['user'] | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem('auth_token');
    const storedRefresh = localStorage.getItem('refresh_token');

    if (!storedAccess && !storedRefresh) {
      setIsLoading(false);
      return;
    }

    // Attempt to refresh token silently on load
    const hydrate = async () => {
      try {
        if (!storedRefresh) {
          setIsLoading(false);
          return;
        }
        const response = await apiRequest<{ token: string; refreshToken?: string }>('/auth/refresh', {
          method: 'POST',
          data: { refreshToken: storedRefresh },
        });
        const newTokens: AuthTokens = {
          accessToken: response.token,
          refreshToken: response.refreshToken ?? storedRefresh,
        };
        saveTokens(newTokens);
        setTokens(newTokens);
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, []);

  const authenticate = async (path: '/auth/login' | '/auth/register', email: string, name?: string) => {
    const response = await apiRequest<AuthPayload>(path, {
      method: 'POST',
      data: { email, name },
    });
    saveTokens(response.tokens);
    setTokens(response.tokens);
    setUser(response.user);
  };

  const login = async (email: string, name?: string) => {
    await authenticate('/auth/login', email, name);
  };

  const register = async (email: string, name?: string) => {
    await authenticate('/auth/register', email, name);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setTokens(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tokens,
      isAuthenticated: !!tokens?.accessToken,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, tokens, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

