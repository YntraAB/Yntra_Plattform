import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AuthState, SocialAuthProvider } from '@/types';

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthState['user'];
  isLoading: boolean;
  error: string | null;
  loginWithProvider: (provider: SocialAuthProvider) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  simulateRole: (role: string | null) => void;
  isPlatformAdmin: boolean;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface DbUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  workspace_id: string | null;
  phone: string | null;
  location: string | null;
  privacy_settings: import('@/types').UserPrivacySettings | null;
}

async function getDbUser(userId: string): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, workspace_id, phone, location, privacy_settings')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
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

  return {
    isAuthenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.email || i18n.t('common.user', 'Användare'),
      role: (session.user.user_metadata?.role as any) || 'user',
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
  const { t } = useTranslation();
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);

  const isPlatformAdmin = useMemo(() => {
    return (authState.user_metadata?.role === 'platform_admin') || (authState.user?.role === 'platform_admin') || (simulatedRole !== null);
  }, [authState.user_metadata, authState.user, simulatedRole]);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (session: Session | null, _event: string) => {
      try {
        const nextState = await getAuthStateFromSession(session);

        if (isMounted) {
          setAuthState(nextState);
        }

        if (session) {
          getDbUser(session.user.id).then(dbUser => {
            if (isMounted && dbUser) {
              setAuthState((prev: AuthState) => {
                if (!prev.user) return prev;
                return {
                  ...prev,
                  user: {
                    ...prev.user!,
                    email: dbUser.email || prev.user!.email,
                    name: dbUser.full_name || prev.user!.email,
                    role: (dbUser.role as any) || prev.user!.role,
                    workspaceId: dbUser.workspace_id || undefined,
                    phone: dbUser.phone || undefined,
                    location: dbUser.location || undefined,
                    privacy_settings: dbUser.privacy_settings as any,
                  }
                };
              });
            }
          }).catch(() => {
            // silently
          });
        }
      } catch (error: unknown) {
        if (isMounted) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: getErrorMessage(error, t('auth.sync_error', 'Kunde inte uppdatera autentiseringssessionen.')),
          });
        }
      }
    };

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await syncSession(session, 'INITIAL_GET_SESSION');
      } catch (error) {
        console.error('[AuthContext] Init error:', error);
        if (isMounted) {
          setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        await syncSession(session, event);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginWithProvider = useCallback(async (provider: SocialAuthProvider): Promise<boolean> => {
    setAuthState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));

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
      const message = getErrorMessage(error, t('auth.social_login_start_error', 'Social inloggning kunde inte startas.'));

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
    setAuthState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(error, t('auth.logout_failed', 'Utloggningen misslyckades.')),
      }));

      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState((prev: AuthState) => ({ ...prev, error: null }));
  }, []);

  const simulateRole = useCallback((role: string | null) => {
    setSimulatedRole(role);
  }, []);

  const userWithSimulation = useMemo(() => {
    if (!authState.user) return null;
    if (!simulatedRole) return authState.user;
    return {
      ...authState.user,
      role: simulatedRole as any
    };
  }, [authState.user, simulatedRole]);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: authState.isAuthenticated,
    user: userWithSimulation,
    isLoading: authState.isLoading,
    error: authState.error,
    loginWithProvider,
    logout,
    clearError,
    simulateRole,
    isPlatformAdmin,
  }), [authState.error, authState.isAuthenticated, authState.isLoading, userWithSimulation, clearError, loginWithProvider, logout, simulateRole, isPlatformAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
