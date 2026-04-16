import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/scheduler/Sidebar';
import { LogOut, Settings, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const CalendarPage = lazy(() => import('@/components/scheduler/CalendarPage').then(module => ({ default: module.CalendarPage })));
const WorkNotesPage = lazy(() => import('@/components/notes/WorkNotesPage').then(module => ({ default: module.WorkNotesPage })));
const MedicationPage = lazy(() => import('@/components/assistance/MedicationPage').then(module => ({ default: module.MedicationPage })));
const DirectoryPage = lazy(() => import('@/components/directory/DirectoryPage').then(module => ({ default: module.DirectoryPage })));
const MessagesPage = lazy(() => import('@/components/messages/MessagesPage').then(module => ({ default: module.MessagesPage })));
const TimeManagerPage = lazy(() => import('@/components/time/TimeManagerPage').then(module => ({ default: module.TimeManagerPage })));
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage').then(module => ({ default: module.SettingsPage })));

interface AppRoutesProps {
  userName: string;
  onLogout: () => void;
}

const Layout: React.FC<AppRoutesProps> = ({ userName, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const activeSection = location.pathname.substring(1) || 'schedule';

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
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(path) => navigate(`/${path}`)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-sidebar border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-foreground capitalize font-medium">{activeSection.replace('-', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 relative" ref={profileRef}>
            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-3 py-1 cursor-pointer hover:bg-secondary rounded-md transition-colors">
              <div className="text-right hidden md:block">
                <div className="text-foreground text-sm font-medium leading-tight">{userName}</div>
                <div className="text-primary text-[10px] font-bold uppercase tracking-wider">{user?.role === 'platform_admin' ? 'dev' : user?.role || 'admin'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-inner">
                <span className="text-foreground text-sm font-bold">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
            {isProfileOpen && (
              <div className="absolute top-12 right-0 w-48 bg-sidebar border border-border rounded-xl shadow-2xl py-2 z-50">
                {(user?.role === 'admin' || user?.role === 'platform_admin') && (
                  <>
                    <button
                      onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="w-4 h-4" /> {t('common.settings')}
                    </button>
                    <div className="my-1 border-t border-border"></div>
                  </>
                )}
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" /> {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </header>
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Laddar vy...</span>
            </div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export const AppRoutes: React.FC<AppRoutesProps> = ({ userName, onLogout }) => {
  return (
    <Routes>
      <Route element={<Layout userName={userName} onLogout={onLogout} />}>
        <Route path="/" element={<Navigate to="/schedule" replace />} />
        <Route path="/schedule" element={<CalendarPage />} />
        <Route path="/inbox" element={<MessagesPage setBreadcrumbNode={() => { }} />} />
        <Route path="/directory" element={<DirectoryPage setBreadcrumbNode={() => { }} />} />
        <Route path="/work-notes" element={<WorkNotesPage setBreadcrumbNode={() => { }} />} />
        <Route path="/medication" element={<MedicationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/time" element={<div className="flex-1 min-w-0 overflow-y-auto"><TimeManagerPage setBreadcrumbNode={() => { }} /></div>} />
        <Route path="/timereports" element={<div className="flex-1 min-w-0 overflow-y-auto"><TimeManagerPage setBreadcrumbNode={() => { }} /></div>} />
      </Route>
    </Routes>
  );
};
