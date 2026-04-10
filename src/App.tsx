/**
 * =============================================================================
 * VOLT SCHEDULER - MAIN APPLICATION
 * =============================================================================
 * This is the root component of the Volt Scheduler application.
 * It manages the application state, routing between login and scheduler views,
 * and provides the overall application structure.
 * 
 * The app follows a modular architecture with clear separation of concerns:
 * - Authentication (login/logout)
 * - Scheduling system (calendar, events, navigation)
 * - UI components (reusable, well-documented)
 * =============================================================================
 */

import { LoginPage } from '@/components/login/LoginPage';
import { SchedulerPage } from '@/components/scheduler/SchedulerPage';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import './App.css';

/**
 * Main App Component
 * 
 * This component serves as the entry point for the Volt Scheduler application.
 * It conditionally renders either the LoginPage or SchedulerPage based on
 * the user's authentication state.
 */
function App() {
  // Use the authentication hook to manage user state
  const { 
    isAuthenticated, 
    user, 
    isLoading, 
    error, 
    login, 
    logout 
  } = useAuth();

  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    // Fånga upp Supabase inbjudnings-/återställningslänkar och fel från URL:en
    const hash = window.location.hash;
    
    // Hantera ogiltiga inbjudningslänkar / raderade konton
    if (hash.includes('error=')) {
      setUrlError("Inbjudningslänken är ogiltig, har gått ut, eller så har kontot tagits bort av en administratör.");
      window.location.hash = ''; // Rensa URL:en
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
    // Om användaren loggat in via en länk men aldrig satt ett lösenord.
    // Låser vi dem till inställningssidan för lösenord helt oberoende 
    // av namn eller andra db-variabler.
    if (isAuthenticated && !needsPasswordReset) {
      if (localStorage.getItem('pending_invite_path') === 'true') {
        setNeedsPasswordReset(true);
      }
    }
  }, [isAuthenticated, needsPasswordReset]);

  /**
   * Handle login form submission
   * Passes credentials to the auth hook's login function
   */
  const handleLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials);
    // Standard inloggning med lösenord bevisar att konto har ett lösenord
    localStorage.removeItem('pending_invite_path');
  };

  /**
   * Handle logout action
   * Clears authentication state and returns to login page
   */
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="app-container">
      {/* 
        Conditional rendering based on authentication state:
        - If authenticated: show the scheduler interface
        - If not authenticated: show the login page
      */}
      {needsPasswordReset ? (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
           <div className="bg-sidebar border border-border rounded-xl w-[400px] p-8 shadow-2xl animate-fade-in">
             <div className="flex justify-center text-primary mb-6"><Key className="w-12 h-12" /></div>
             <h2 className="text-foreground text-2xl font-bold text-center mb-2">Välkommen!</h2>
             <p className="text-muted-foreground text-sm text-center mb-8">Vänligen fyll i dina uppgifter och välj ett lösenord för ditt nya konto.</p>
             
             <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="För- och efternamn" className="w-full bg-accent border border-border text-foreground rounded-md px-3 py-3 text-sm focus:outline-none focus:border-primary mb-4" />
             
             <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Telefonnummer (valfritt)" className="w-full bg-accent border border-border text-foreground rounded-md px-3 py-3 text-sm focus:outline-none focus:border-primary mb-4" />

             <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nytt lösenord" className="w-full bg-accent border border-border text-foreground rounded-md px-3 py-3 text-sm focus:outline-none focus:border-primary mb-6" />
             
             <button disabled={resetLoading || newPassword.length < 6 || !fullName} onClick={async () => {
                setResetLoading(true);
                const { data: { user }, error } = await supabase.auth.updateUser({ 
                  password: newPassword,
                  data: { full_name: fullName, phone: phoneNumber }
                });
                
                if (user) {
                  await supabase.from('users').update({ 
                    full_name: fullName, 
                    phone: phoneNumber 
                  }).eq('id', user.id);
                }

                setResetLoading(false);
                if (error) alert("Fel vid kontoskapande: " + error.message);
                else {
                   localStorage.removeItem('pending_invite_path');
                   setNeedsPasswordReset(false);
                   window.location.hash = '';
                }
             }} className="w-full bg-primary hover:bg-primary/80 text-white h-12 rounded-lg font-medium transition-colors disabled:opacity-50">
               {resetLoading ? 'Sparar...' : 'Spara & Fortsätt'}
             </button>

             <button 
                disabled={resetLoading} 
                onClick={() => {
                   localStorage.removeItem('pending_invite_path');
                   setNeedsPasswordReset(false);
                   window.location.hash = '';
                   handleLogout();
                }} 
                className="w-full mt-3 bg-transparent hover:bg-muted text-muted-foreground h-10 rounded-lg text-sm font-medium transition-colors"
             >
               Avbryt och Logga ut
             </button>
           </div>
        </div>
      ) : isAuthenticated && user ? (
        /* 
          SCHEDULER VIEW
          The main application interface with sidebar, calendar, and event management
        */
        <WorkspaceProvider>
          <SchedulerPage 
            userName={user.name} 
            onLogout={handleLogout} 
          />
        </WorkspaceProvider>
      ) : (
        /* 
          LOGIN VIEW
          The Volt-branded login page with dark theme and purple accents
        */
        <LoginPage 
          onLogin={handleLogin} 
          isLoading={isLoading} 
          error={urlError || error} 
        />
      )}
    </div>
  );
}

export default App;
