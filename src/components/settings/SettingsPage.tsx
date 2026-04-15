import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Clock,
  LayoutGrid,
  Palette,
  Building2,
  School,
  HeartPulse,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Mail,
  BellRing,
  Check,
  RotateCw
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export const SettingsPage: React.FC = () => {
  const {
    workspaceName,
    modules,
    updateModules,
    settings,
    updateSettings,
    preferences,
    updatePreferences,
    isLoading
  } = useWorkspace();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [notifSettings, setNotifSettings] = useState({
    on: true,
    type: 'full_content'
  });

  useEffect(() => {
    async function loadUserSettings() {
      if (!user) return;
      const { data } = await supabase.from('users').select('notifications_on, notification_type').eq('id', user.id).single();
      if (data) {
        setNotifSettings({
          on: !!data.notifications_on,
          type: data.notification_type || 'full_content'
        });
      }
    }
    loadUserSettings();
  }, [user]);

  const updateNotifSetting = async (key: 'on' | 'type', value: any) => {
    if (!user) return;
    setIsSaving(true);
    const newSettings = { ...notifSettings, [key]: value };
    setNotifSettings(newSettings);

    await supabase.from('users').update({
      notifications_on: newSettings.on,
      notification_type: newSettings.type
    }).eq('id', user.id);

    setTimeout(() => setIsSaving(false), 500);
  };

  const handleModuleToggle = async (moduleKey: 'school' | 'assistance', checked: boolean) => {
    setIsSaving(true);
    if (checked) {
      const otherKey = moduleKey === 'school' ? 'assistance' : 'school';
      await updateModules({ [moduleKey]: true, [otherKey]: false });
    } else {
      await updateModules({ [moduleKey]: false });
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleUpdateSettings = async (newSettings: any) => {
    setIsSaving(true);
    await updateSettings(newSettings);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleUpdatePreferences = async (newPrefs: any) => {
    setIsSaving(true);
    await updatePreferences(newPrefs);
    setTimeout(() => setIsSaving(false), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 shadow-inner">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {workspaceName || t('settings.title')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('settings.desc')}
            </p>
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
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Alla ändringar sparade</span>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Globe className="w-4 h-4 mr-2" />
            <span>{t('settings.tabs.general')}</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LayoutGrid className="w-4 h-4 mr-2" />
            <span>{t('settings.tabs.modules')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Mail className="w-4 h-4 mr-2" />
            <span>{t('settings.tabs.notifications')}</span>
          </TabsTrigger>
        </TabsList>

        {/* --- GENERAL SETTINGS --- */}
        <TabsContent value="general" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Localization Card */}
            <Card className="bg-card/40 backdrop-blur-sm border-2 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('settings.localization')}</CardTitle>
                    <CardDescription>{t('settings.localization_desc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.language')}</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(val) => handleUpdateSettings({ language: val })}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sv">Svenska</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.timezone')}</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(val) => handleUpdateSettings({ timezone: val })}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Stockholm">Stockholm (GMT+1)</SelectItem>
                      <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.week_start')}</Label>
                  <Select
                    value={settings.week_start.toString()}
                    onValueChange={(val) => handleUpdateSettings({ week_start: parseInt(val) })}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('settings.monday')}</SelectItem>
                      <SelectItem value="0">{t('settings.sunday')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Appearance Card */}
            <Card className="bg-card/40 backdrop-blur-sm border-2 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('settings.theme')}</CardTitle>
                    <CardDescription>{t('settings.appearance_desc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.choose_theme')}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => { setTheme('light'); handleUpdatePreferences({ theme: 'light' }); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                        theme === 'light' ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border/40 bg-background/40 hover:border-primary/40"
                      )}
                    >
                      <Sun className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-medium">{t('settings.theme_light')}</span>
                    </button>
                    <button
                      onClick={() => { setTheme('dark'); handleUpdatePreferences({ theme: 'dark' }); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                        theme === 'dark' ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border/40 bg-background/40 hover:border-primary/40"
                      )}
                    >
                      <Moon className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-medium">{t('settings.theme_dark')}</span>
                    </button>
                    <button
                      onClick={() => { setTheme('system'); handleUpdatePreferences({ theme: 'system' }); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                        theme === 'system' ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border/40 bg-background/40 hover:border-primary/40"
                      )}
                    >
                      <Monitor className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-medium">{t('settings.theme_system')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.font_scale')}</Label>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-mono">
                      {Math.round((preferences.font_scale || 1) * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[preferences.font_scale || 1]}
                    min={0.8}
                    max={1.2}
                    step={0.05}
                    onValueChange={([val]) => handleUpdatePreferences({ font_scale: val })}
                    className="py-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Business Hours Card */}
            <Card className="bg-card/40 backdrop-blur-sm border-2 border-border/50 shadow-sm md:col-span-2 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('settings.business_hours')}</CardTitle>
                    <CardDescription>{t('settings.business_hours_desc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="bg-background/30 p-6 rounded-2xl border border-border/30">
                  <div className="flex justify-between text-sm mb-6">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-1">{t('settings.from_hour')}</span>
                      <span className="text-2xl font-bold font-mono">{settings.business_hours.start}:00</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-1">{t('settings.to_hour')}</span>
                      <span className="text-2xl font-bold font-mono">{settings.business_hours.end}:00</span>
                    </div>
                  </div>
                  <Slider
                    defaultValue={[settings.business_hours.start, settings.business_hours.end]}
                    max={24}
                    step={1}
                    onValueCommit={([start, end]) => handleUpdateSettings({ business_hours: { start, end } })}
                    className="py-4"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- MODULES SETTINGS --- */}
        <TabsContent value="modules" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6 md:grid-cols-2">
            {/* SKOLMODUL */}
            <Card className={cn(
              "relative overflow-hidden transition-all duration-500 border-2 group",
              modules.school
                ? "border-primary shadow-2xl shadow-primary/10 bg-primary/[0.03]"
                : "border-border/50 bg-card/40 hover:border-primary/30"
            )}>
              {modules.school && (
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              )}
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-2xl border transition-all duration-500",
                      modules.school ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110" : "bg-muted text-muted-foreground border-border"
                    )}>
                      <School className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl font-bold">{t('settings.modules.school_title')}</CardTitle>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">{t('settings.modules.beta')}</span>
                      </div>
                      <CardDescription className="text-sm font-medium mt-0.5">{t('settings.modules.school_desc')}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={modules.school}
                    onCheckedChange={(c) => handleModuleToggle('school', c)}
                    disabled={user?.role !== 'admin' && user?.role !== 'platform_admin'}
                    className="data-[state=checked]:bg-primary shadow-inner"
                  />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3 text-sm text-muted-foreground mt-2">
                  <li className="flex items-center gap-3 bg-background/40 p-3 rounded-xl border border-border/30 hover:bg-background/60 transition-colors">
                    <div className="p-1 rounded-full bg-primary/10 text-primary"><Sparkles className="w-3.5 h-3.5" /></div>
                    <span>{t('settings.modules.school_feature_1', { defaultValue: 'Närvarohantering och schema för elever.' })}</span>
                  </li>
                  <li className="flex items-center gap-3 bg-background/40 p-3 rounded-xl border border-border/30 hover:bg-background/60 transition-colors">
                    <div className="p-1 rounded-full bg-primary/10 text-primary"><Sparkles className="w-3.5 h-3.5" /></div>
                    <span>{t('settings.modules.school_feature_2', { defaultValue: 'Betygskataloger och studieplaner.' })}</span>
                  </li>
                  <li className="flex items-center gap-3 bg-background/40 p-3 rounded-xl border border-border/30 hover:bg-background/60 transition-colors">
                    <div className="p-1 rounded-full bg-primary/10 text-primary"><Sparkles className="w-3.5 h-3.5" /></div>
                    <span>{t('settings.modules.school_feature_3', { defaultValue: 'Utvecklingssamtal och rapportering.' })}</span>
                  </li>
                </ul>
              </CardContent>
              {modules.school && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              )}
            </Card>

            {/* ASSISTANSMODUL */}
            <Card className={cn(
              "relative overflow-hidden transition-all duration-500 border-2 group",
              modules.assistance
                ? "border-emerald-500 shadow-2xl shadow-emerald-500/10 bg-emerald-500/[0.03]"
                : "border-border/50 bg-card/40 hover:border-emerald-500/30"
            )}>
              {modules.assistance && (
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
              )}
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-2xl border transition-all duration-500",
                      modules.assistance ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-110" : "bg-muted text-muted-foreground border-border"
                    )}>
                      <HeartPulse className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl font-bold">{t('settings.modules.assistance_title')}</CardTitle>
                        <Check className={cn("w-5 h-5 text-emerald-500 transition-opacity duration-300", modules.assistance ? "opacity-100" : "opacity-0")} />
                      </div>
                      <CardDescription className="text-sm font-medium mt-0.5">{t('settings.modules.assistance_desc')}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={modules.assistance}
                    onCheckedChange={(c) => handleModuleToggle('assistance', c)}
                    disabled={user?.role !== 'admin' && user?.role !== 'platform_admin'}
                    className="data-[state=checked]:bg-emerald-500 shadow-inner"
                  />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3 text-sm text-muted-foreground mt-2">
                  <li className="flex items-center gap-3 bg-background/40 p-3 rounded-xl border border-border/30 hover:bg-background/60 transition-colors">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500"><Sparkles className="w-3.5 h-3.5" /></div>
                    <span>{t('settings.modules.assistance_feature_1', { defaultValue: 'Brukarregister och digital journalföring.' })}</span>
                  </li>
                  <li className="flex items-center gap-3 bg-background/40 p-3 rounded-xl border border-border/30 hover:bg-background/60 transition-colors">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500"><Sparkles className="w-3.5 h-3.5" /></div>
                    <span>{t('settings.modules.assistance_feature_2', { defaultValue: 'Hantera sovande jour och medicinsignering.' })}</span>
                  </li>
                  <li className="flex items-center gap-3 bg-background/40 p-3 rounded-xl border border-border/30 hover:bg-background/60 transition-colors">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500"><Sparkles className="w-3.5 h-3.5" /></div>
                    <span>{t('settings.modules.assistance_feature_3', { defaultValue: 'Beredskapsrapporter och avvikelsehantering.' })}</span>
                  </li>
                </ul>
              </CardContent>
              {modules.assistance && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
              )}
            </Card>
          </div>

          <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm flex gap-4 items-start shadow-sm">
            <div className="bg-amber-500/10 p-2 rounded-lg shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold mb-1">{t('settings.modules_info_title')}</p>
              <p className="opacity-80">{t('settings.modules_info_desc')}</p>
            </div>
          </div>
        </TabsContent>

        {/* --- NOTIFICATIONS SETTINGS --- */}
        <TabsContent value="notifications" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <Card className="bg-card/40 backdrop-blur-sm border-2 border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t('settings.notifications.title')}</CardTitle>
                    <CardDescription className="mt-1">
                      {t('settings.notifications.desc')}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={notifSettings.on}
                  onCheckedChange={(c) => updateNotifSetting('on', c)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  disabled={!notifSettings.on}
                  onClick={() => updateNotifSetting('type', 'full_content')}
                  className={cn(
                    "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left group relative",
                    notifSettings.type === 'full_content'
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-background/50 hover:border-primary/30",
                    !notifSettings.on && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "mt-1 p-2.5 rounded-xl transition-colors shadow-sm",
                    notifSettings.type === 'full_content' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={cn("font-bold", notifSettings.type === 'full_content' ? "text-foreground" : "text-muted-foreground")}>{t('settings.notifications.full_content')}</div>
                    <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t('settings.notifications.full_content_desc')}</div>
                  </div>
                  {notifSettings.type === 'full_content' && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>

                <button
                  disabled={!notifSettings.on}
                  onClick={() => updateNotifSetting('type', 'alert_only')}
                  className={cn(
                    "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left group relative",
                    notifSettings.type === 'alert_only'
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-background/50 hover:border-primary/30",
                    !notifSettings.on && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "mt-1 p-2.5 rounded-xl transition-colors shadow-sm",
                    notifSettings.type === 'alert_only' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={cn("font-bold", notifSettings.type === 'alert_only' ? "text-foreground" : "text-muted-foreground")}>{t('settings.notifications.alert_only')}</div>
                    <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t('settings.notifications.alert_only_desc')}</div>
                  </div>
                  {notifSettings.type === 'alert_only' && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-muted-foreground font-medium">{t('settings.notifications.no_spam')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
