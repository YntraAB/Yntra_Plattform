import React from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme-provider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, School, HeartPulse, Sparkles, Moon, Sun, Monitor } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { workspaceName, modules, updateModules, isLoading } = useWorkspace();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleToggle = (moduleKey: 'school' | 'assistance', checked: boolean) => {
    if (checked) {
      // Om de sätter PÅ en modul, stänger vi automatiskt av den andra
      const otherKey = moduleKey === 'school' ? 'assistance' : 'school';
      updateModules({ [moduleKey]: true, [otherKey]: false });
    } else {
      // Om de stänger av den sätter vi bara den till false
      updateModules({ [moduleKey]: false });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Laddar arbetsyta...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {workspaceName || "Arbetsyta"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Hantera aktiva moduler och inställningar för hela organisationen.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SKOLMODUL */}
        <Card className={`relative overflow-hidden transition-all duration-300 border-2 ${modules.school ? 'border-primary shadow-lg shadow-primary/10' : 'border-card-foreground/5 hover:border-primary/30'} bg-card/40 backdrop-blur-sm`}>
          {modules.school && (
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          )}
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className={`w-5 h-5 ${modules.school ? 'text-primary' : 'text-muted-foreground'}`} />
                <CardTitle className="text-xl">Skolmodul</CardTitle>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">Under utveckling</span>
              </div>
              <Switch 
                checked={modules.school} 
                onCheckedChange={(c) => handleToggle('school', c)} 
                disabled={user?.role !== 'admin' && user?.role !== 'platform_admin'}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <CardDescription className="pt-2">
              Aktivera funktioner skräddarsydda för skolmiljöer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 bg-background/50 p-2 rounded-md"><Sparkles className="w-3 h-3 text-primary/70" /> Hantera lektioner och schema.</li>
              <li className="flex items-center gap-2 bg-background/50 p-2 rounded-md"><Sparkles className="w-3 h-3 text-primary/70" /> Betygsättning och frånvaro för elever.</li>
              <li className="flex items-center gap-2 bg-background/50 p-2 rounded-md"><Sparkles className="w-3 h-3 text-primary/70" /> Klasslistor och vikariehantering.</li>
            </ul>
          </CardContent>
        </Card>

        {/* ASSISTANSMODUL */}
        <Card className={`relative overflow-hidden transition-all duration-300 border-2 ${modules.assistance ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-card-foreground/5 hover:border-emerald-500/30'} bg-card/40 backdrop-blur-sm`}>
          {modules.assistance && (
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          )}
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className={`w-5 h-5 ${modules.assistance ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <CardTitle className="text-xl">Assistansmodul</CardTitle>
              </div>
              <Switch 
                checked={modules.assistance} 
                onCheckedChange={(c) => handleToggle('assistance', c)} 
                disabled={user?.role !== 'admin' && user?.role !== 'platform_admin'}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
            <CardDescription className="pt-2">
              Verktyg för personlig assistans och vårdboenden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 bg-background/50 p-2 rounded-md"><Sparkles className="w-3 h-3 text-emerald-500/70" /> Brukarregister och journalföring.</li>
              <li className="flex items-center gap-2 bg-background/50 p-2 rounded-md"><Sparkles className="w-3 h-3 text-emerald-500/70" /> Hantera sovande jour och medicinering.</li>
              <li className="flex items-center gap-2 bg-background/50 p-2 rounded-md"><Sparkles className="w-3 h-3 text-emerald-500/70" /> Beredskapsrapporter och dokumentation.</li>
            </ul>
          </CardContent>
        </Card>
        
        {/* UTSEENDE & TEMA */}
        <Card className={`relative overflow-hidden transition-all duration-300 border-2 border-primary/20 bg-card/40 backdrop-blur-sm md:col-span-2`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Utseende & Tema</CardTitle>
              </div>
            </div>
            <CardDescription className="pt-2">
              Anpassa hur Yntra plattformen ser ut på din skärm. Det här valet sparas bara på din nuvarande webbläsare.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-3 w-full max-w-sm">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}
                >
                  <Sun className={`w-6 h-6 mb-2 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`}>Ljust</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}
                >
                  <Moon className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`}>Mörkt</span>
                </button>
                <button 
                  onClick={() => setTheme('system')}
                  className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}
                >
                  <Monitor className={`w-6 h-6 mb-2 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`}>System</span>
                </button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
