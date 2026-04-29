import React, { useState, useRef, useEffect, Suspense, lazy } from 'react'
import { Navigate, useLocation, Outlet, useNavigate, useMatches } from 'react-router-dom'
import { Sidebar } from './features/scheduler/components/Sidebar'
import { LogOut, Settings, ChevronDown, Loader2, LayoutGrid } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { BreadcrumbProvider, useBreadcrumbContext } from '@/contexts/BreadcrumbContext'
import { ErrorBoundary, RouteErrorBoundary } from './components/layout/ErrorBoundary'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { BLOCK_REGISTRY } from '@/lib/blocks/registry'
import type { WorkspaceModules, UserRole } from '@/types'
import type { TFunction } from 'i18next'

interface BreadcrumbHandle {
  breadcrumb: string | ((t: TFunction, data?: unknown) => string)
}

interface BreadcrumbMatch {
  handle: BreadcrumbHandle
  pathname: string
  data: unknown
}

const SettingsPage = lazy(() =>
  import('@/features/settings/components/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)

import { ClientLayout } from './features/client-portal/components/ClientLayout'
const ClientHomePage = lazy(() =>
  import('./features/client-portal/components/ClientHomePage').then((module) => ({
    default: module.ClientHomePage,
  })),
)

const RoleGuard: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/" replace />
  if (!allowedRoles.includes(user.role)) {
    const fallback = user.role === 'client' ? '/home' : '/schedule'
    if (location.pathname === fallback || location.pathname === fallback + '/') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center bg-background p-8">
          <h2 className="mb-2 text-2xl font-bold text-destructive">
            {t('auth.access_denied.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('auth.access_denied.message', { role: user.role })}
          </p>
        </div>
      )
    }
    return <Navigate to={fallback} replace />
  }
  return <>{children}</>
}

const BlockGuard: React.FC<{
  children: React.ReactNode
  blockId: keyof WorkspaceModules
}> = ({ children, blockId }) => {
  const { modules } = useWorkspace()
  const { t } = useTranslation()

  if (!modules[blockId]) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 text-center">
        <div className="mb-6 rounded-2xl bg-muted/50 p-6">
          <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground/30" />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          {t('settings.blocks.disabled_title', 'Feature Block Disabled')}
        </h2>
        <p className="max-w-md text-muted-foreground">
          {t(
            'settings.blocks.disabled_message',
            'This functional block is currently deactivated for your workspace. Please contact your administrator to enable it.',
          )}
        </p>
      </div>
    )
  }
  return <>{children}</>
}

import { OfflineIndicator } from './components/layout/OfflineIndicator'

const AppLayoutWrapper: React.FC = () => {
  const { user } = useAuth()
  if (user?.role === 'client') {
    return (
      <ErrorBoundary>
        <BreadcrumbProvider>
          <ClientLayout />
          <OfflineIndicator />
        </BreadcrumbProvider>
      </ErrorBoundary>
    )
  }
  return (
    <ErrorBoundary>
      <BreadcrumbProvider>
        <Layout />
        <OfflineIndicator />
      </BreadcrumbProvider>
    </ErrorBoundary>
  )
}

const RootRedirect: React.FC = () => {
  const { user } = useAuth()
  if (user?.role === 'client') return <Navigate to="/home" replace />
  return <Navigate to="/schedule" replace />
}

export const Layout: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { user, logout, isPlatformAdmin, simulateRole } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const matches = useMatches()

  const userName = user?.name || ''
  const activeSection = location.pathname.substring(1) || 'schedule'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { dynamicBreadcrumbs } = useBreadcrumbContext()

  const baseBreadcrumbs: import('@/contexts/BreadcrumbContext').DynamicBreadcrumbItem[] = (matches as unknown as BreadcrumbMatch[])
    .filter((match) => match.handle && match.handle.breadcrumb)
    .map((match) => ({
      label:
        typeof match.handle.breadcrumb === 'function'
          ? match.handle.breadcrumb(t, match.data)
          : match.handle.breadcrumb,
      path: match.pathname,
    }))

  const breadcrumbs = [...baseBreadcrumbs, ...dynamicBreadcrumbs]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={(path) => navigate(`/${path}`)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-sidebar px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 duration-200 animate-in fade-in slide-in-from-left-2">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.length > 0 ? (
                    breadcrumbs.map((bc, idx) => (
                      <React.Fragment key={`${bc.label}-${idx}`}>
                        <BreadcrumbItem>
                          {idx === breadcrumbs.length - 1 ? (
                            <BreadcrumbPage>{bc.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <span
                                className="cursor-pointer"
                                onClick={() =>
                                  bc.onClick ? bc.onClick() : bc.path && navigate(bc.path)
                                }
                              >
                                {bc.label}
                              </span>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {idx < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                      </React.Fragment>
                    ))
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage className="capitalize">
                        {t(
                          `sidebar.sections.${activeSection === 'notes' ? 'notes' : activeSection.replace('-', '')}`,
                          activeSection.replace('-', ' '),
                        )}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isPlatformAdmin && (
              <Select value={user?.role || ''} onValueChange={(val) => simulateRole(val as UserRole)}>
                <SelectTrigger className="h-8 w-[120px] rounded-lg border-border bg-secondary/50 text-[11px] font-bold shadow-none duration-300 animate-in fade-in zoom-in focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder={t('auth.role_simulator.placeholder')} />
                </SelectTrigger>
                <SelectContent align="end" className="border-border bg-sidebar">
                  <SelectItem value="platform_admin">
                    {t('auth.role_simulator.platform_admin')}
                  </SelectItem>
                  <SelectItem value="admin">{t('auth.role_simulator.admin')}</SelectItem>
                  <SelectItem value="assistant">{t('auth.role_simulator.assistant')}</SelectItem>
                  <SelectItem value="user">{t('auth.role_simulator.user')}</SelectItem>
                  <SelectItem value="client">{t('auth.role_simulator.client')}</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="relative flex items-center gap-3" ref={profileRef}>
              <div
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex cursor-pointer items-center gap-3 rounded-md py-1 pl-3 transition-colors hover:bg-secondary"
              >
                <div className="hidden text-right md:block">
                  <div className="text-sm font-medium leading-tight text-foreground">
                    {userName}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {user?.role === 'platform_admin'
                      ? t('auth.role_simulator.platform_admin')
                      : user?.role || t('auth.role_simulator.admin')}
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-inner">
                  <span className="text-sm font-bold text-foreground">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              {isProfileOpen && (
                <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-border bg-sidebar py-2 shadow-2xl">
                  {user?.role !== 'client' && (
                    <>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          navigate('/settings')
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" /> {t('common.settings')}
                      </button>
                      <div className="my-1 border-t border-border"></div>
                    </>
                  )}
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <LogOut className="h-4 w-4" /> {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center bg-background">
                <div className="flex animate-pulse flex-col items-center gap-4 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm font-medium">{t('common.loading_view')}...</span>
                </div>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export const routes = [
  {
    path: '/',
    element: <AppLayoutWrapper />,
    errorElement: <RouteErrorBoundary />,
    handle: { breadcrumb: (t: TFunction) => t('common.home') },
    children: [
      { index: true, element: <RootRedirect /> },
      {
        path: 'home',
        element: (
          <RoleGuard allowedRoles={['client']}>
            <ClientHomePage />
          </RoleGuard>
        ),
        errorElement: <RouteErrorBoundary />,
        handle: { breadcrumb: (t: TFunction) => t('common.home') },
      },
      {
        path: 'settings',
        element: (
          <RoleGuard allowedRoles={['platform_admin', 'admin', 'user', 'assistant']}>
            <SettingsPage />
          </RoleGuard>
        ),
        errorElement: <RouteErrorBoundary />,
        handle: { breadcrumb: (t: TFunction) => t('common.settings') },
      },
      ...Object.values(BLOCK_REGISTRY).flatMap((block) =>
        block.routes.map((route) => ({
          path: route.path,
          element: (
            <RoleGuard allowedRoles={route.allowedRoles}>
              <BlockGuard blockId={block.id as keyof WorkspaceModules}>
                <route.component />
              </BlockGuard>
            </RoleGuard>
          ),
          errorElement: <RouteErrorBoundary />,
          handle: { breadcrumb: (t: TFunction) => t(route.breadcrumbKey) },
        })),
      ),
    ],
  },
]
