import React, { useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useTranslation } from 'react-i18next'
import { Building2, Globe, Mail, Check, RotateCw, User as UserIcon, Calendar } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { GeneralSettings } from './GeneralSettings'
import { NotificationsSettings } from './NotificationsSettings'
import { AccountSettings } from './AccountSettings'
import { SchedulerSettings } from './SchedulerSettings'

import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export const SettingsPage: React.FC = () => {
  const { workspaceName, workspaceLogo, isLoading } = useWorkspace()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'platform_admin'
  const defaultTab = isAdmin ? 'general' : 'account'
  const activeTab = searchParams.get('tab') || defaultTab

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 duration-700 animate-in fade-in slide-in-from-bottom-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 border-b border-border/50 pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-muted" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-muted/30 p-0 shadow-inner">
              {workspaceLogo ? (
                <img
                  src={workspaceLogo}
                  alt={workspaceName}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
          )}
          <div>
            {isLoading ? (
              <div className="w-48 space-y-2 py-1">
                <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {isAdmin ? workspaceName || t('settings.title') : t('settings.account.profile')}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAdmin ? t('settings.desc') : t('settings.account.profile_desc')}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-border/50 bg-secondary/50 px-4 py-2 backdrop-blur-sm transition-all duration-300">
          {isSaving ? (
            <>
              <RotateCw className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t('common.saving')}
              </span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
                {t('common.saved')}
              </span>
            </>
          )}
        </div>
      </div>

      <Tabs
        defaultValue={defaultTab}
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="no-scrollbar mb-8 flex w-full overflow-x-auto rounded-xl bg-muted/50 p-1">
          {isAdmin && (
            <TabsTrigger
              value="general"
              className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Globe className="mr-2 h-4 w-4" />
              <span>{t('settings.tabs.general')}</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="account"
            className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            <span>{t('settings.tabs.account')}</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="scheduler"
              className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>{t('settings.tabs.scheduler')}</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="notifications"
            className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Mail className="mr-2 h-4 w-4" />
            <span>{t('settings.tabs.notifications')}</span>
          </TabsTrigger>
        </TabsList>

        <div className="pb-12">
          {isLoading ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-6 space-y-2">
                  <div className="h-5 w-1/4 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="mb-6 h-10 w-full animate-pulse rounded-md bg-muted" />
                <div className="mb-6 space-y-2 border-t border-border pt-6">
                  <div className="h-5 w-1/3 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          ) : (
            <>
              {isAdmin && (
                <TabsContent
                  value="general"
                  className="mt-0 w-full space-y-6 focus-visible:outline-none focus-visible:ring-0"
                >
                  <GeneralSettings setIsSaving={setIsSaving} />
                </TabsContent>
              )}

              <TabsContent
                value="account"
                className="mt-0 w-full space-y-6 focus-visible:outline-none focus-visible:ring-0"
              >
                <AccountSettings setIsSaving={setIsSaving} />
              </TabsContent>

              {isAdmin && (
                <TabsContent
                  value="scheduler"
                  className="mt-0 w-full space-y-6 focus-visible:outline-none focus-visible:ring-0"
                >
                  <SchedulerSettings setIsSaving={setIsSaving} />
                </TabsContent>
              )}

              <TabsContent
                value="notifications"
                className="mt-0 w-full space-y-6 focus-visible:outline-none focus-visible:ring-0"
              >
                <NotificationsSettings setIsSaving={setIsSaving} />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  )
}

export default SettingsPage
