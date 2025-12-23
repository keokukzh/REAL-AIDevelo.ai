import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) {
      throw new Error('Password is required for login');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Verbindungsfehler. Bitte überprüfe deine Internetverbindung und versuche es erneut.');
        }
        // Provide user-friendly error messages
        if (error.message.includes('Invalid API key') || error.message.includes('Invalid login credentials')) {
          throw new Error('Ungültige Anmeldedaten. Bitte überprüfe E-Mail und Passwort.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Zu viele Anmeldeversuche. Bitte warte einen Moment.');
        }
        throw new Error(error.message || 'Anmeldung fehlgeschlagen');
      }
      
      setSession(data.session);
      setUser(data.user);
    } catch (err: any) {
      // Handle network/fetch errors
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError') || err?.name === 'TypeError') {
        throw new Error('Verbindungsfehler. Bitte überprüfe deine Internetverbindung und die Supabase-Konfiguration.');
      }
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        // Handle network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Verbindungsfehler. Bitte überprüfe deine Internetverbindung und versuche es erneut.');
        }
        throw error;
      }
      
      // Note: Supabase requires email confirmation by default
      // If email confirmation is disabled, session will be available immediately
      setSession(data.session);
      setUser(data.user);
    } catch (err: any) {
      // Handle network/fetch errors
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError') || err?.name === 'TypeError') {
        throw new Error('Verbindungsfehler. Bitte überprüfe deine Internetverbindung und die Supabase-Konfiguration.');
      }
      throw err;
    }
  };

  const loginWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    // Magic link sent - user will click link in email
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: !!session?.access_token,
      isLoading,
      login,
      register,
      loginWithMagicLink,
      logout,
    }),
    [user, session, isLoading]
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
