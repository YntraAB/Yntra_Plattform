import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AuthState, SocialAuthProvider } from '@/types';
import type { Database } from '@/types/database';

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthState['user'];
  isLoading: boolean;
  error: string | null;
  loginWithProvider: (provider: SocialAuthProvider) => Promise<boolean>;
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

type DbUser = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'full_name' | 'role' | 'workspace_id'>;

async function getDbUser(userId: string): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, workspace_id')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getAuthStateFromSession(session: Session | null): Promise<AuthState> {
  if (!session) {
    return {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    };
  }

  const dbUser = await getDbUser(session.user.id);

  return {
    isAuthenticated: true,
    user: {
      id: session.user.id,
      email: dbUser?.email || session.user.email || '',
      name: dbUser?.full_name || session.user.email || 'Anvandare',
      role: dbUser?.role || 'user',
      workspaceId: dbUser?.workspace_id || undefined,
      last_sign_in_at: session.user.last_sign_in_at,
    },
    isLoading: false,
    error: null,
    user_metadata: session.user.user_metadata,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getAuthRedirectUrl() {
  return `${window.location.origin}/`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (session: Session | null, fallbackMessage: string) => {
      try {
        const nextState = await getAuthStateFromSession(session);

        if (isMounted) {
          setAuthState(nextState);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: getErrorMessage(error, fallbackMessage),
          });
        }
      }
    };

    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        await syncSession(session, 'Kunde inte lasa autentiseringssessionen.');
      } catch (error: unknown) {
        if (isMounted) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: getErrorMessage(error, 'Kunde inte lasa autentiseringssessionen.'),
          });
        }
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await syncSession(session, 'Kunde inte uppdatera autentiseringssessionen.');
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginWithProvider = useCallback(async (provider: SocialAuthProvider): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Social inloggning kunde inte startas.');

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
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(error, 'Utloggningen misslyckades.'),
      }));

      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    loginWithProvider,
    logout,
    clearError,
  }), [authState.error, authState.isAuthenticated, authState.isLoading, authState.user, clearError, loginWithProvider, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
