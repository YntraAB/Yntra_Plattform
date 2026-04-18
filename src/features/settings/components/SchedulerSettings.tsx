import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar, Clock, Layout, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchedulerSettingsProps {
  setIsSaving: (val: boolean) => void;
}

export const SchedulerSettings: React.FC<SchedulerSettingsProps> = ({ setIsSaving }) => {
  const { t } = useTranslation();
  const { settings, updateSettings, preferences, updatePreferences } = useWorkspace();

  // Local state for smooth slider experience
  const [localHours, setLocalHours] = React.useState({
    start: settings.business_hours?.start || 7,
    end: settings.business_hours?.end || 17
  });

  // Sync local state when settings change from elsewhere
  React.useEffect(() => {
    setLocalHours({
      start: settings.business_hours?.start || 7,
      end: settings.business_hours?.end || 17
    });
  }, [settings.business_hours]);

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar Display */}
        <Card className="bg-card/40 backdrop-blur-sm border-2 border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.scheduler.display')}</CardTitle>
                <CardDescription>{t('settings.scheduler.display_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.scheduler.default_view')}</Label>
              <Select
                value={settings.default_calendar_view || 'week'}
                onValueChange={(val) => handleUpdateSettings({ default_calendar_view: val })}
              >
                <SelectTrigger className="bg-background/50 border-border/50 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t('scheduler.views.day')}</SelectItem>
                  <SelectItem value="week">{t('scheduler.views.week')}</SelectItem>
                  <SelectItem value="month">{t('scheduler.views.month')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.scheduler.density')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdatePreferences({ calendar_density: 'compact' })}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                    preferences.calendar_density === 'compact' ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border/40 bg-background/40 hover:border-primary/40"
                  )}
                >
                  <Maximize2 className="w-4 h-4 mb-2 rotate-45 scale-75" />
                  <span className="text-xs font-medium">{t('settings.scheduler.density_compact')}</span>
                </button>
                <button
                  onClick={() => handleUpdatePreferences({ calendar_density: 'relaxed' })}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                    preferences.calendar_density === 'relaxed' ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border/40 bg-background/40 hover:border-primary/40"
                  )}
                >
                  <Maximize2 className="w-4 h-4 mb-2" />
                  <span className="text-xs font-medium">{t('settings.scheduler.density_relaxed')}</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="bg-card/40 backdrop-blur-sm border-2 border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.scheduler.hours')}</CardTitle>
                <CardDescription>{t('settings.scheduler.hours_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.scheduler.start_hour')}</Label>
                  <span className="text-xs font-mono">{localHours.start}:00</span>
                </div>
                <Slider
                  value={[localHours.start]}
                  min={0}
                  max={12}
                  step={1}
                  onValueChange={([val]) => setLocalHours(prev => ({ ...prev, start: val }))}
                  onValueCommit={([val]) => handleUpdateSettings({ 
                    business_hours: { ...settings.business_hours, start: val } 
                  })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.scheduler.end_hour')}</Label>
                  <span className="text-xs font-mono">{localHours.end}:00</span>
                </div>
                <Slider
                  value={[localHours.end]}
                  min={13}
                  max={23}
                  step={1}
                  onValueChange={([val]) => setLocalHours(prev => ({ ...prev, end: val }))}
                  onValueCommit={([val]) => handleUpdateSettings({ 
                    business_hours: { ...settings.business_hours, end: val } 
                  })}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              {t('settings.scheduler.hours_info')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/[0.03] border-primary/20 shadow-none">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold">{t('settings.scheduler.advanced_title')}</p>
            <p className="text-xs text-muted-foreground">
              {t('settings.scheduler.advanced_desc')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
