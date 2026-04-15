import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { School, HeartPulse, Sparkles, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModulesSettingsProps {
  setIsSaving: (val: boolean) => void;
}

export const ModulesSettings: React.FC<ModulesSettingsProps> = ({ setIsSaving }) => {
  const { t } = useTranslation();
  const { modules, updateModules } = useWorkspace();
  const { user } = useAuth();

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

  return (
    <div className="space-y-6">
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
    </div>
  );
};
