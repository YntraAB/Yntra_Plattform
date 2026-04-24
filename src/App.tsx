/**
 * This is the root component.
 * It manages the application state, routing between login and scheduler views,
 * and provides the overall application structure.
 * 
/**
 * This is the root component.
 * It manages the application state, routing between login and scheduler views,
 * and provides the overall application structure.
 * 
 * The app follows a modular architecture with clear separation of concerns:
 * - Authentication (login/logout)
 * - Scheduling system (calendar, events, navigation)
 * - UI components (reusable, well-documented)
 */

import { useTranslation } from 'react-i18next';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { routes } from './AppRoutes';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { PasswordResetPage } from '@/features/auth/components/PasswordResetPage';
import { InviteError } from '@/features/auth/components/InviteError';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { VisualEffectHandler } from './components/VisualEffectHandler';
import type { SocialAuthProvider } from '@/types';
import './App.css';

/**
 * This component serves as the entry point.
 * It conditionally renders either the LoginPage or the Router with authenticated routes.
 */
function App() {
  const { t } = useTranslation();
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    loginWithProvider,
    logout
  } = useAuth();

  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<SocialAuthProvider | null>(null);

  const router = useMemo(() => createBrowserRouter(routes), []);

  useEffect(() => {
    const hash = window.location.hash;

    if (hash.includes('error=')) {
      setUrlError(t('auth.invite_error.message', 'Inbjudningslänken är ogiltig, har gått ut, eller så har kontot tagits bort av en administratör.'));
      window.location.hash = '';
    }
    else if (hash.includes('type=invite') || hash.includes('type=recovery')) {
      setNeedsPasswordReset(true);
      localStorage.setItem('pending_invite_path', 'true');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordReset(true);
        localStorage.setItem('pending_invite_path', 'true');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !needsPasswordReset) {
      if (localStorage.getItem('pending_invite_path') === 'true') {
        setNeedsPasswordReset(true);
      }
    }
  }, [isAuthenticated, needsPasswordReset]);

  const handleLogin = async (provider: SocialAuthProvider) => {
    setPendingProvider(provider);

    const didStart = await loginWithProvider(provider);

    if (didStart) {
      localStorage.removeItem('pending_invite_path');
      return;
    }

    setPendingProvider(null);
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {t('auth.securing_connection', 'Säkrar anslutningen...')}
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {urlError ? (
        <InviteError error={urlError} onClose={() => setUrlError(null)} />
      ) : needsPasswordReset ? (
        <PasswordResetPage
          onSuccess={() => {
            localStorage.removeItem('pending_invite_path');
            setNeedsPasswordReset(false);
            window.location.hash = '';
          }}
          onCancel={() => {
            localStorage.removeItem('pending_invite_path');
            setNeedsPasswordReset(false);
            window.location.hash = '';
            handleLogout();
          }}
        />
      ) : isAuthenticated && user ? (
        <WorkspaceProvider>
          <VisualEffectHandler />
          <RouterProvider router={router} />
        </WorkspaceProvider>
      ) : (
        <LoginPage
          onLogin={handleLogin}
          pendingProvider={pendingProvider}
          error={error}
        />
      )}
    </div>
  );
}

export default App;
