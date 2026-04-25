import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { User, Palette, Check, Clock, Sun, Moon, Monitor, Zap, Shield, Leaf } from 'lucide-react'
import { useTheme, type Theme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TwoFactorSettings } from './TwoFactorSettings'
import type { UserPreferences, UserPrivacySettings } from '@/types'

interface AccountSettingsProps {
  setIsSaving: (val: boolean) => void
}

const ACCENT_COLORS = [
  { name: 'Yntra Blue', value: 'primary' },
  { name: 'Azure', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Crimson', value: '#ef4444' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Midnight', value: '#0f172a' },
]

export const AccountSettings: React.FC<AccountSettingsProps> = ({ setIsSaving }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { preferences, updatePreferences, brandColor } = useWorkspace()
  const { theme, setTheme } = useTheme()

  const getSafeScale = (val: number | undefined) => {
    if (!val) return 1
    return val > 2 ? val / 100 : val
  }

  const [localFontScale, setLocalFontScale] = useState(getSafeScale(preferences.font_scale))
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [location, setLocation] = useState(user?.location || '')
  const [privacy, setPrivacy] = useState<UserPrivacySettings>(
    user?.privacy_settings || {
      phone: 'organization',
      location: 'organization',
    },
  )

  useEffect(() => {
    setLocalFontScale(getSafeScale(preferences.font_scale))
  }, [preferences.font_scale])

  const handleUpdatePreference = async (newPrefs: Partial<UserPreferences>) => {
    setIsSaving(true)
    await updatePreferences(newPrefs)
    setTimeout(() => setIsSaving(false), 500)
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    setIsSaving(true)

    try {
      await supabase.auth.updateUser({
        data: { full_name: name },
      })

      await supabase
        .from('users')
        .update({
          full_name: name,
          phone,
          location,
          privacy_settings: privacy,
        })
        .eq('id', user.id)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Personal Details */}
        <Card className="flex flex-col border-2 border-border/50 bg-card/40 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.account.profile')}</CardTitle>
                <CardDescription>{t('settings.account.profile_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('common.email')}
              </Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="h-11 border-border/50 bg-muted/50"
              />
              <p className="text-[10px] text-muted-foreground">
                {t('settings.account.email_change_info')}
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('common.name')}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 border-border/50 bg-background/50"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('settings.account.phone')}
                </Label>
                <div className="space-y-1.5">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+46..."
                    className="h-11 border-border/50 bg-background/50"
                  />
                  <Select
                    value={privacy.phone}
                    onValueChange={(val: string) => setPrivacy((prev) => ({ ...prev, phone: val as 'everyone' | 'organization' | 'none' }))}
                  >
                    <SelectTrigger className="h-8 border-border/40 bg-secondary/30 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">
                        {t('settings.account.visibility_everyone')}
                      </SelectItem>
                      <SelectItem value="organization">
                        {t('settings.account.visibility_organization')}
                      </SelectItem>
                      <SelectItem value="none">{t('settings.account.visibility_none')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('settings.account.location')}
                </Label>
                <div className="space-y-1.5">
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Stockholm, SE"
                    className="h-11 border-border/50 bg-background/50"
                  />
                  <Select
                    value={privacy.location}
                    onValueChange={(val: string) => setPrivacy((prev) => ({ ...prev, location: val as 'everyone' | 'organization' | 'none' }))}
                  >
                    <SelectTrigger className="h-8 border-border/40 bg-secondary/30 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">
                        {t('settings.account.visibility_everyone')}
                      </SelectItem>
                      <SelectItem value="organization">
                        {t('settings.account.visibility_organization')}
                      </SelectItem>
                      <SelectItem value="none">{t('settings.account.visibility_none')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4">
              <Button className="w-full shadow-lg shadow-primary/20" onClick={handleUpdateProfile}>
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visual Customization */}
        <Card className="border-2 border-border/50 bg-card/40 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.account.appearance')}</CardTitle>
                <CardDescription>{t('settings.account.appearance_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Accent Color Section */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                {t('settings.account.accent_color')}
              </Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ACCENT_COLORS.map((color) => {
                  const isActive = preferences.accent_color === color.value
                  return (
                    <button
                      key={color.value}
                      onClick={() => handleUpdatePreference({ accent_color: color.value })}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all duration-300 hover:scale-[1.02] active:scale-95',
                        isActive
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                          : 'border-border/40 bg-background/40 hover:border-primary/40 hover:bg-background/60',
                      )}
                    >
                      <div
                        className="h-8 w-8 flex-shrink-0 rounded-xl border border-black/10 shadow-inner"
                        style={{
                          backgroundColor:
                            color.value === 'primary' ? 'hsl(var(--primary))' : color.value,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-[11px] font-bold',
                            isActive ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {color.name}
                        </p>
                      </div>
                      {isActive && (
                        <div className="absolute -right-2 -top-2 rounded-full bg-primary p-1 text-primary-foreground shadow-lg ring-2 ring-background duration-300 animate-in zoom-in">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom & Org Color Section */}
            <div className="space-y-4 border-t border-border/40 pt-6">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Custom Branding
                </Label>
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                  Premium
                </div>
              </div>

              <div className="group/custom flex flex-col items-center gap-4 rounded-3xl border border-border/40 bg-muted/20 p-4 backdrop-blur-sm sm:flex-row">
                <div className="relative h-14 w-14 flex-shrink-0 transition-transform duration-500 group-hover/custom:rotate-12">
                  <input
                    type="color"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    value={
                      preferences.accent_color?.startsWith('#')
                        ? preferences.accent_color
                        : '#3b82f6'
                    }
                    onChange={(e) => handleUpdatePreference({ accent_color: e.target.value })}
                  />
                  <div
                    className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-background shadow-lg ring-1 ring-border/50"
                    style={{
                      backgroundColor:
                        preferences.accent_color === 'primary'
                          ? 'hsl(var(--primary))'
                          : preferences.accent_color || '#3b82f6',
                    }}
                  >
                    <div className="mt-auto h-1/2 w-full bg-black/5" />
                  </div>
                </div>

                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                    {t('settings.account.custom_color_title')}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {t('settings.account.custom_color_desc')}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 p-1.5">
                  <span className="px-2 font-mono text-[10px] font-bold uppercase text-muted-foreground/80">
                    HEX
                  </span>
                  <Input
                    className="h-8 w-24 border-none bg-transparent text-right font-mono text-[11px] font-bold focus-visible:ring-0"
                    value={
                      preferences.accent_color === 'primary'
                        ? '#3B82F6'
                        : preferences.accent_color || '#3B82F6'
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^#?([0-9A-F]{3}){1,2}$/i.test(val)) {
                        handleUpdatePreference({
                          accent_color: val.startsWith('#') ? val : `#${val}`,
                        })
                      }
                    }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleUpdatePreference({ accent_color: brandColor })}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-3xl border-2 border-dashed p-4 transition-all duration-300',
                    preferences.accent_color === brandColor
                      ? 'border-primary bg-primary/5 shadow-inner'
                      : 'border-border/30 hover:border-primary/40 hover:bg-primary/5',
                  )}
                >
                  <div
                    className="h-10 w-10 flex-shrink-0 rounded-2xl border-2 border-background shadow-lg ring-1 ring-border/50"
                    style={{ backgroundColor: brandColor }}
                  />
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                      Sync with Organization
                    </p>
                    <p className="text-[10px] italic text-muted-foreground/70">
                      Inherit the official brand color from your workspace.
                    </p>
                  </div>
                  {preferences.accent_color === brandColor && (
                    <div className="rounded-full bg-primary p-1 text-primary-foreground shadow-lg">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Theme & Scale Section */}
            <div className="space-y-6 border-t border-border/40 pt-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  {t('settings.choose_theme')}
                </Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { value: 'light', icon: Sun, label: t('settings.theme_light') },
                    { value: 'dark', icon: Moon, label: t('settings.theme_dark') },
                    { value: 'midnight', icon: Zap, label: 'Midnight' },
                    { value: 'slate', icon: Shield, label: 'Slate' },
                    { value: 'forest', icon: Leaf, label: 'Forest' },
                    { value: 'system', icon: Monitor, label: t('settings.theme_system') },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setTheme(item.value as Theme)
                        handleUpdatePreference({ theme: item.value as Theme })
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all duration-300',
                        theme === item.value
                          ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                          : 'border-border/40 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      <item.icon className="mb-1.5 h-5 w-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    {t('settings.font_scale')}
                  </Label>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary shadow-inner">
                    {Math.round(localFontScale * 100)}%
                  </span>
                </div>
                <Slider
                  value={[localFontScale]}
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  onValueChange={([val]) => setLocalFontScale(val)}
                  onValueCommit={([val]) => handleUpdatePreference({ font_scale: val })}
                  className="py-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/[0.03] shadow-none">
        <CardContent className="space-y-4 p-4">
          <TwoFactorSettings />
          <div className="flex items-center gap-2 border-t border-amber-500/10 pt-2 text-[10px] font-medium italic text-amber-600/60">
            <Clock className="h-3 w-3" />
            {t('common.last_active')}:{' '}
            {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountSettings
