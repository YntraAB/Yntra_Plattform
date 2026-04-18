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
import './App.css';

/**
 * This component serves as the entry point.
 * It conditionally renders either the LoginPage or the Router with authenticated routes.
 */
function App() {
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout
  } = useAuth();

  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const router = useMemo(() => createBrowserRouter(routes), []);

  useEffect(() => {
    const hash = window.location.hash;

    if (hash.includes('error=')) {
      setUrlError("Inbjudningslänken är ogiltig, har gått ut, eller så har kontot tagits bort av en administratör.");
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

  const handleLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials);
    localStorage.removeItem('pending_invite_path');
  };

  const handleLogout = () => {
    logout();
  };

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
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
}

export default App;