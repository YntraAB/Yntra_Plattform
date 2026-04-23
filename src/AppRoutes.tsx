import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { Navigate, useLocation, Outlet, useNavigate, useMatches } from 'react-router-dom';
import { Sidebar } from './features/scheduler/components/Sidebar';
import { LogOut, Settings, ChevronDown, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const CalendarPage = lazy(() => import('@/features/scheduler/components/CalendarPage').then(module => ({ default: module.CalendarPage })));
const WorkNotesPage = lazy(() => import('@/features/notes/components/WorkNotesPage').then(module => ({ default: module.WorkNotesPage })));
const ClientOverviewPage = lazy(() => import('@/features/assistance/components/ClientOverviewPage').then(module => ({ default: module.ClientOverviewPage })));
const DirectoryPage = lazy(() => import('@/features/directory/components/DirectoryPage').then(module => ({ default: module.DirectoryPage })));
const MessagesPage = lazy(() => import('@/features/messages/components/MessagesPage').then(module => ({ default: module.MessagesPage })));
const TimeManagerPage = lazy(() => import('@/features/time/components/TimeManagerPage').then(module => ({ default: module.TimeManagerPage })));
const SettingsPage = lazy(() => import('@/features/settings/components/SettingsPage').then(module => ({ default: module.SettingsPage })));

import { ClientLayout } from './features/client-portal/components/ClientLayout';
const ClientHomePage = lazy(() => import('./features/client-portal/components/ClientHomePage').then(module => ({ default: module.ClientHomePage })));

const RoleGuard: React.FC<{ children: React.ReactNode, allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) {
     const fallback = user.role === 'client' ? "/home" : "/schedule";
     if (location.pathname === fallback || location.pathname === fallback + '/') {
       // Prevent infinite redirect loop if fallback is also denied
       return (
         <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
           <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
           <p className="text-muted-foreground">Your role "{user.role}" does not have permission to view this page.</p>
         </div>
       );
     }
     return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
};

const AppLayoutWrapper: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'client') return <ClientLayout />;
  return <Layout />;
};

const RootRedirect: React.FC = () => {
    const { user } = useAuth();
    if (user?.role === 'client') return <Navigate to="/home" replace />;
    return <Navigate to="/schedule" replace />;
};

export const Layout: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();

  const userName = user?.name || '';
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

  const breadcrumbs = matches
    .filter((match: any) => match.handle && match.handle.breadcrumb)
    .map((match: any) => ({
      label: typeof match.handle.breadcrumb === 'function'
        ? match.handle.breadcrumb(t, match.data)
        : match.handle.breadcrumb,
      path: match.pathname
    }));

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(path) => navigate(`/${path}`)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-sidebar border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
              {breadcrumbs.length > 0 ? (
                breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={bc.path}>
                    <span className={idx === breadcrumbs.length - 1 ? "text-foreground font-medium" : "cursor-pointer hover:text-foreground transition-colors"} onClick={() => navigate(bc.path)}>
                      {bc.label}
                    </span>
                    {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  </React.Fragment>
                ))
              ) : (
                <span className="text-foreground capitalize font-medium">{activeSection.replace('-', ' ')}</span>
              )}
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
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
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
              <span className="text-sm font-medium">{t('common.loading_view')}...</span>
            </div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export const routes = [
  {
    path: "/",
    element: <AppLayoutWrapper />,
    children: [
      { index: true, element: <RootRedirect /> },
      {
        path: "home",
        element: <RoleGuard allowedRoles={['client']}><ClientHomePage /></RoleGuard>,
        handle: { breadcrumb: (t: any) => t('common.home', 'Hem') }
      },
      {
        path: "schedule",
        element: <RoleGuard allowedRoles={['platform_admin', 'admin', 'user', 'assistant']}><CalendarPage /></RoleGuard>,
        handle: { breadcrumb: (t: any) => t('sidebar.sections.schedule') }
      },
      {
        path: "inbox",
        element: <RoleGuard allowedRoles={['platform_admin', 'admin', 'user', 'assistant', 'client']}><MessagesPage /></RoleGuard>,
        handle: { breadcrumb: (t: any) => t('sidebar.sections.inbox') }
      },
      {
        path: "directory",
        element: <RoleGuard allowedRoles={['platform_admin', 'admin', 'user', 'assistant']}><DirectoryPage /></RoleGuard>,
        handle: { breadcrumb: (t: any) => t('sidebar.sections.directory') }
      },
      {
        path: "work-notes",
        element: <RoleGuard allowedRoles={['platform_admin', 'admin', 'user', 'assistant']}><WorkNotesPage /></RoleGuard>,
        handle: { breadcrumb: (t: any) => t('sidebar.sections.notes') }
      },
      {
        path: "medication",
        element: <RoleGuard allowedRoles={['platform_admin', 'admin', 'user', 'assistant']}><ClientOverviewPage /></RoleGuard>,
        handle: { breadcrumb: (t: any) => t('sidebar.sections.assistance', 'Assistance') }
      },
      {
        path: "settings",
        element: <RoleGuard allowedRoles={['platform_admin', 'admin']}><SettingsPage /></RoleGuard>,
        handle: { breadcrumb: (t: any) => t('common.settings') }
      },
      {
        path: "time",
        element: <RoleGuard allowedRoles={['platform_admin', 'admin', 'user', 'assistant']}><div className="flex-1 min-w-0 overflow-y-auto"><TimeManagerPage /></div></RoleGuard>,
        handle: { breadcrumb: (t: any) => t('sidebar.sections.time') }
      },
      {
        path: "timereports",
        element: <RoleGuard allowedRoles={['platform_admin', 'admin', 'user', 'assistant']}><div className="flex-1 min-w-0 overflow-y-auto"><TimeManagerPage /></div></RoleGuard>,
        handle: { breadcrumb: (t: any) => t('sidebar.sections.timereports') }
      },
    ]
  }
];

