import React, { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useTranslation } from 'react-i18next';
import { Building2, Globe, LayoutGrid, Mail, Check, RotateCw, User as UserIcon, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { GeneralSettings } from './GeneralSettings';
import { ModulesSettings } from './ModulesSettings';
import { NotificationsSettings } from './NotificationsSettings';
import { AccountSettings } from './AccountSettings';
import { SchedulerSettings } from './SchedulerSettings';

import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const SettingsPage: React.FC = () => {
  const { workspaceName, isLoading } = useWorkspace();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'platform_admin';
  const defaultTab = isAdmin ? 'general' : 'account';
  const activeTab = searchParams.get('tab') || defaultTab;

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse" />
          ) : (
            <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 shadow-inner">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          )}
          <div>
            {isLoading ? (
              <div className="space-y-2 py-1 w-48">
                <div className="h-8 w-full bg-muted rounded-md animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse" />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {isAdmin ? (workspaceName || t('settings.title')) : t('settings.account.profile')}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {isAdmin ? t('settings.desc') : t('settings.account.profile_desc')}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm transition-all duration-300">
          {isSaving ? (
            <>
              <RotateCw className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">{t('common.saving')}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">{t('common.saved')}</span>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-full mb-8 p-1 bg-muted/50 rounded-xl overflow-x-auto no-scrollbar">
          {isAdmin && (
            <TabsTrigger value="general" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Globe className="w-4 h-4 mr-2" />
              <span>{t('settings.tabs.general')}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="account" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <UserIcon className="w-4 h-4 mr-2" />
            <span>{t('settings.tabs.account')}</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="scheduler" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{t('settings.tabs.scheduler')}</span>
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="modules" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <LayoutGrid className="w-4 h-4 mr-2" />
              <span>{t('settings.tabs.modules')}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Mail className="w-4 h-4 mr-2" />
            <span>{t('settings.tabs.notifications')}</span>
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="space-y-2 mb-6">
                <div className="h-5 w-1/4 bg-muted rounded-md animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded-md animate-pulse" />
              </div>
              <div className="h-10 w-full bg-muted rounded-md animate-pulse mb-6" />
              <div className="pt-6 border-t border-border space-y-2 mb-6">
                <div className="h-5 w-1/3 bg-muted rounded-md animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
              </div>
              <div className="h-10 w-full bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {isAdmin && (
              <TabsContent value="general" className="w-full space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <GeneralSettings setIsSaving={setIsSaving} />
              </TabsContent>
            )}

            <TabsContent value="account" className="w-full space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <AccountSettings setIsSaving={setIsSaving} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="scheduler" className="w-full space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <SchedulerSettings setIsSaving={setIsSaving} />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="modules" className="w-full space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <ModulesSettings setIsSaving={setIsSaving} />
              </TabsContent>
            )}

            <TabsContent value="notifications" className="w-full space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <NotificationsSettings setIsSaving={setIsSaving} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPage;
