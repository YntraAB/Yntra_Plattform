import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Mail, BellRing, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationsSettingsProps {
  setIsSaving: (val: boolean) => void
}

export const NotificationsSettings: React.FC<NotificationsSettingsProps> = ({ setIsSaving }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [notifSettings, setNotifSettings] = useState({
    on: true,
    type: 'full_content',
  })

  useEffect(() => {
    async function loadUserSettings() {
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('notifications_on, notification_type')
        .eq('id', user.id)
        .single()
      if (data) {
        setNotifSettings({
          on: !!data.notifications_on,
          type: data.notification_type || 'full_content',
        })
      }
    }
    loadUserSettings()
  }, [user])

  const updateNotifSetting = async (key: 'on' | 'type', value: string | boolean) => {
    if (!user) return
    setIsSaving(true)
    const newSettings = { ...notifSettings, [key]: value }
    setNotifSettings(newSettings)

    await supabase
      .from('users')
      .update({
        notifications_on: newSettings.on,
        notification_type: newSettings.type,
      })
      .eq('id', user.id)

    setTimeout(() => setIsSaving(false), 500)
  }

  return (
    <Card className="overflow-hidden border-2 border-border/50 bg-card/40 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('settings.notifications.title')}</CardTitle>
              <CardDescription className="mt-1">{t('settings.notifications.desc')}</CardDescription>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            disabled={!notifSettings.on}
            onClick={() => updateNotifSetting('type', 'full_content')}
            className={cn(
              'group relative flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all',
              notifSettings.type === 'full_content'
                ? 'border-primary bg-primary/10'
                : 'border-border/50 bg-background/50 hover:border-primary/30',
              !notifSettings.on && 'cursor-not-allowed opacity-50',
            )}
          >
            <div
              className={cn(
                'mt-1 rounded-xl p-2.5 shadow-sm transition-colors',
                notifSettings.type === 'full_content'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div
                className={cn(
                  'font-bold',
                  notifSettings.type === 'full_content'
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {t('settings.notifications.full_content')}
              </div>
              <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {t('settings.notifications.full_content_desc')}
              </div>
            </div>
            {notifSettings.type === 'full_content' && (
              <div className="absolute right-3 top-3">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
          </button>

          <button
            disabled={!notifSettings.on}
            onClick={() => updateNotifSetting('type', 'alert_only')}
            className={cn(
              'group relative flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all',
              notifSettings.type === 'alert_only'
                ? 'border-primary bg-primary/10'
                : 'border-border/50 bg-background/50 hover:border-primary/30',
              !notifSettings.on && 'cursor-not-allowed opacity-50',
            )}
          >
            <div
              className={cn(
                'mt-1 rounded-xl p-2.5 shadow-sm transition-colors',
                notifSettings.type === 'alert_only'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div
                className={cn(
                  'font-bold',
                  notifSettings.type === 'alert_only' ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {t('settings.notifications.alert_only')}
              </div>
              <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {t('settings.notifications.alert_only_desc')}
              </div>
            </div>
            {notifSettings.type === 'alert_only' && (
              <div className="absolute right-3 top-3">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-4">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <p className="text-xs font-medium text-muted-foreground">
            {t('settings.notifications.no_spam')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
