import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export const ClientLayout: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const userName = user?.name || '';
  const activeSection = location.pathname.substring(1) || 'home';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-screen flex bg-background overflow-hidden relative">
      <div className="w-64 bg-sidebar border-r border-border flex flex-col z-20 transition-all duration-300 shadow-sm">
        <div className="h-14 flex items-center px-4 border-b border-border bg-sidebar dark:bg-sidebar/90">
          <span className="text-foreground font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Trygghetsportalen</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <button 
             onClick={() => navigate('/home')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${activeSection === 'home' ? 'bg-primary shadow-md text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
             {t('common.home', 'Hem')}
          </button>
          <button 
             onClick={() => navigate('/inbox')}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${activeSection === 'inbox' ? 'bg-primary shadow-md text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
             {t('sidebar.sections.inbox', 'Meddelanden')}
          </button>
        </div>
        <div className="p-4 border-t border-border mt-auto">
           <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg">
                  <LogOut className="w-4 h-4" /> {t('common.logout', 'Logga ut')}
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-background/50">
        <header className="h-14 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground capitalize animate-in fade-in slide-in-from-left-2">
             {activeSection === 'home' ? 'Start' : activeSection}
          </div>
          <div className="flex items-center gap-3 relative" ref={profileRef}>
            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-3 py-1 cursor-pointer hover:bg-secondary rounded-xl transition-colors">
              <div className="text-right hidden md:block">
                <div className="text-foreground text-sm font-medium leading-tight">{userName}</div>
                <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Konto</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shadow-inner font-bold border border-primary/30">
                {userName.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
            {isProfileOpen && (
              <div className="absolute top-14 right-0 w-48 bg-sidebar border border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-secondary transition-colors">
                  <LogOut className="w-4 h-4" /> Logga ut
                </button>
              </div>
            )}
          </div>
        </header>

        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          <div className="flex-1 overflow-y-auto w-full h-full p-4">
             <Outlet />
          </div>
        </Suspense>
      </div>
    </div>
  );
};
