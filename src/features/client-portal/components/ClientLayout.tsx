import React, { useState, useRef, useEffect, Suspense } from 'react'
import { useLocation, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'

export const ClientLayout: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const userName = user?.name || ''
  const activeSection = location.pathname.substring(1) || 'home'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div className="z-20 flex w-64 flex-col border-r border-border bg-sidebar shadow-sm transition-all duration-300">
        <div className="flex h-14 items-center border-b border-border bg-sidebar px-4 dark:bg-sidebar/90">
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-lg font-bold tracking-tight text-foreground text-transparent">
            {t('client_portal.title')}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          <button
            onClick={() => navigate('/home')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${activeSection === 'home' ? 'bg-primary font-medium text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
          >
            {t('common.home')}
          </button>
          <button
            onClick={() => navigate('/inbox')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${activeSection === 'inbox' ? 'bg-primary font-medium text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
          >
            {t('sidebar.sections.inbox')}
          </button>
          <button
            onClick={() => navigate('/directory')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${activeSection === 'directory' ? 'bg-primary font-medium text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
          >
            {t('sidebar.teams')}
          </button>
        </div>
        <div className="mt-auto border-t border-border p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" /> {t('common.logout')}
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-background/50">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium capitalize text-foreground animate-in fade-in slide-in-from-left-2">
            {activeSection === 'home'
              ? t('client_portal.sections.start')
              : t(`sidebar.sections.${activeSection}`)}
          </div>
          <div className="relative flex items-center gap-3" ref={profileRef}>
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex cursor-pointer items-center gap-3 rounded-xl py-1 pl-3 transition-colors hover:bg-secondary"
            >
              <div className="hidden text-right md:block">
                <div className="text-sm font-medium leading-tight text-foreground">{userName}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('client_portal.account')}
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/20 font-bold text-primary shadow-inner">
                {userName.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            {isProfileOpen && (
              <div className="absolute right-0 top-14 z-50 w-48 rounded-xl border border-border bg-sidebar py-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-secondary hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" /> {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </header>

        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <div className="h-full w-full flex-1 overflow-y-auto p-4">
            <Outlet />
          </div>
        </Suspense>
      </div>
    </div>
  )
}
