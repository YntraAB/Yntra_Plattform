/**
 * This custom hook manages user authentication state and provides
 * login/logout functionality.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { LoginCredentials, AuthState } from '@/types';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setAuthState({
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
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }));
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthState({
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
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
      }
    });

    return () => subscription.unsubscribe();
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

  return useMemo(() => ({
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    logout,
    clearError,
  }), [authState.isAuthenticated, authState.user, authState.isLoading, authState.error, login, logout, clearError]);
}
