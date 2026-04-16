import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Palette, Clock, Sun, Moon, Monitor } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface GeneralSettingsProps {
  setIsSaving: (val: boolean) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ setIsSaving }) => {
  const { t } = useTranslation();
  const { settings, updateSettings, preferences, updatePreferences } = useWorkspace();
  const { theme, setTheme } = useTheme();

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

  return (
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
    </div>
  );
};
