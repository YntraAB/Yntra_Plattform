import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AuthState, LoginCredentials } from '@/types';

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthState['user'];
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getAuthStateFromSession(session: Session | null): AuthState {
  if (!session) {
    return {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    };
  }

  return {
    isAuthenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.full_name || session.user.email || 'Användare',
      role: session.user.user_metadata?.role || 'user',
      last_sign_in_at: session.user.last_sign_in_at,
    },
    isLoading: false,
    error: null,
    user_metadata: session.user.user_metadata,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (isMounted) {
        setAuthState(getAuthStateFromSession(session));
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setAuthState(getAuthStateFromSession(session));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ogiltiga uppgifter eller fel på servern.';

      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: message,
      });

      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    await supabase.auth.signOut();
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    logout,
    clearError,
  }), [authState.error, authState.isAuthenticated, authState.isLoading, authState.user, clearError, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
