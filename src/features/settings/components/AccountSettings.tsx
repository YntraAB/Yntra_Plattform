import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Shield, Palette, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { UserPreferences } from '@/types';

interface AccountSettingsProps {
  setIsSaving: (val: boolean) => void;
}

const ACCENT_COLORS = [
  { name: 'Default', value: 'primary' },
  { name: 'Sapphire', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amethyst', value: '#a855f7' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Slate', value: '#64748b' },
];

export const AccountSettings: React.FC<AccountSettingsProps> = ({ setIsSaving }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { preferences, updatePreferences } = useWorkspace();
  const [name, setName] = useState(user?.name || '');

  const handleUpdatePreference = async (newPrefs: Partial<UserPreferences>) => {
    setIsSaving(true);
    await updatePreferences(newPrefs);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    // Update auth metadata
    await supabase.auth.updateUser({
      data: { full_name: name }
    });

    // Update users table
    await supabase.from('users').update({ name }).eq('id', user.id);

    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card className="bg-card/40 backdrop-blur-sm border-2 border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.account.profile')}</CardTitle>
                <CardDescription>{t('settings.account.profile_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.email')}</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted/50 border-border/50" />
              <p className="text-[10px] text-muted-foreground">{t('settings.account.email_change_info')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.name')}</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
                <Button variant="outline" size="sm" onClick={handleUpdateProfile}>
                  {t('common.save')}
                </Button>
              </div>
            </div>
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('settings.account.role')}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <Shield className="w-5 h-5 text-muted-foreground/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Customization */}
        <Card className="bg-card/40 backdrop-blur-sm border-2 border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.account.appearance')}</CardTitle>
                <CardDescription>{t('settings.account.appearance_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.account.accent_color')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleUpdatePreference({ accent_color: color.value })}
                    className={cn(
                      "group relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all transition-transform hover:scale-105",
                      preferences.accent_color === color.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/40 bg-background/40"
                    )}
                  >
                    <div
                      className="w-6 h-6 rounded-full mb-1 shadow-inner border border-black/10"
                      style={{ backgroundColor: color.value === 'primary' ? 'hsl(var(--primary))' : color.value }}
                    />
                    <span className="text-[10px] font-medium truncate w-full text-center">{color.name}</span>
                    {preferences.accent_color === color.value && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-lg">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                {t('settings.account.accent_info')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-amber-500/[0.03] border-amber-500/20 shadow-none">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{t('settings.account.security_title')}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500/80">
              {t('settings.account.security_desc')}
            </p>
            <div className="mt-2 pt-2 border-t border-amber-500/10 flex items-center gap-2 text-[10px] text-amber-600/60 font-medium italic">
              <Clock className="w-3 h-3" />
              {t('common.last_active')}: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
