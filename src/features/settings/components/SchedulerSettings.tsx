import React from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Calendar, Clock, Layout, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkspaceSettings, UserPreferences } from '@/types'

interface SchedulerSettingsProps {
  setIsSaving: (val: boolean) => void
}

export const SchedulerSettings: React.FC<SchedulerSettingsProps> = ({ setIsSaving }) => {
  const { t } = useTranslation()
  const { settings, updateSettings, preferences, updatePreferences } = useWorkspace()

  // Local state for smooth slider experience
  const [localHours, setLocalHours] = React.useState({
    start: settings.business_hours?.start || 7,
    end: settings.business_hours?.end || 17,
  })

  // Sync local state when settings change from elsewhere
  React.useEffect(() => {
    setLocalHours({
      start: settings.business_hours?.start || 7,
      end: settings.business_hours?.end || 17,
    })
  }, [settings.business_hours])

  const handleUpdateSettings = async (newSettings: Partial<WorkspaceSettings>) => {
    setIsSaving(true)
    await updateSettings(newSettings)
    setTimeout(() => setIsSaving(false), 500)
  }

  const handleUpdatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    setIsSaving(true)
    await updatePreferences(newPrefs)
    setTimeout(() => setIsSaving(false), 500)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Calendar Display */}
        <Card className="border-2 border-border/50 bg-card/40 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
                <Layout className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.scheduler.display')}</CardTitle>
                <CardDescription>{t('settings.scheduler.display_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('settings.scheduler.default_view')}
              </Label>
              <Select
                value={settings.default_calendar_view || 'week'}
                onValueChange={(val) =>
                  handleUpdateSettings({
                    default_calendar_view: val as 'month' | 'week' | 'day' | undefined,
                  })
                }
              >
                <SelectTrigger className="h-10 border-border/50 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t('scheduler.views.day')}</SelectItem>
                  <SelectItem value="week">{t('scheduler.views.week')}</SelectItem>
                  <SelectItem value="month">{t('scheduler.views.month')}</SelectItem>
                  <SelectItem value="agenda">{t('scheduler.views.agenda')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('settings.scheduler.density')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdatePreferences({ calendar_density: 'compact' })}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all',
                    preferences.calendar_density === 'compact'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border/40 bg-background/40 hover:border-primary/40',
                  )}
                >
                  <Maximize2 className="mb-2 h-4 w-4 rotate-45 scale-75" />
                  <span className="text-xs font-medium">
                    {t('settings.scheduler.density_compact')}
                  </span>
                </button>
                <button
                  onClick={() => handleUpdatePreferences({ calendar_density: 'relaxed' })}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all',
                    preferences.calendar_density === 'relaxed'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border/40 bg-background/40 hover:border-primary/40',
                  )}
                >
                  <Maximize2 className="mb-2 h-4 w-4" />
                  <span className="text-xs font-medium">
                    {t('settings.scheduler.density_relaxed')}
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="border-2 border-border/50 bg-card/40 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500">
                <Clock className="h-5 w-5" />
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
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('settings.scheduler.start_hour')}
                  </Label>
                  <span className="font-mono text-xs">{localHours.start}:00</span>
                </div>
                <Slider
                  value={[localHours.start]}
                  min={0}
                  max={12}
                  step={1}
                  onValueChange={([val]) => setLocalHours((prev) => ({ ...prev, start: val }))}
                  onValueCommit={([val]) =>
                    handleUpdateSettings({
                      business_hours: { ...settings.business_hours, start: val },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('settings.scheduler.end_hour')}
                  </Label>
                  <span className="font-mono text-xs">{localHours.end}:00</span>
                </div>
                <Slider
                  value={[localHours.end]}
                  min={13}
                  max={23}
                  step={1}
                  onValueChange={([val]) => setLocalHours((prev) => ({ ...prev, end: val }))}
                  onValueCommit={([val]) =>
                    handleUpdateSettings({
                      business_hours: { ...settings.business_hours, end: val },
                    })
                  }
                />
              </div>
            </div>
            <p className="text-[10px] italic text-muted-foreground">
              {t('settings.scheduler.hours_info')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/[0.03] shadow-none">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold">{t('settings.scheduler.advanced_title')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.scheduler.advanced_desc')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
