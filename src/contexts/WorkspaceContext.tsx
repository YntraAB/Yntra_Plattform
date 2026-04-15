import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import i18n from 'i18next';

export interface WorkspaceModules {
  school: boolean;
  assistance: boolean;
}

export interface WorkspaceModules {
  school: boolean;
  assistance: boolean;
}

export interface WorkspaceSettings {
  timezone: string;
  week_start: number; // 0 for Sunday, 1 for Monday
  language: string;
  business_hours: {
    start: number;
    end: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  calendar_density: 'compact' | 'relaxed';
  font_scale: number;
}

interface WorkspaceState {
  workspaceId: string | null;
  workspaceName: string;
  modules: WorkspaceModules;
  settings: WorkspaceSettings;
  preferences: UserPreferences;
  isLoading: boolean;
  updateModules: (newModules: Partial<WorkspaceModules>) => Promise<boolean>;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => Promise<boolean>;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<boolean>;
  setAdminWorkspace: (id: string) => void;
}

const defaultModules: WorkspaceModules = {
  school: false,
  assistance: false,
};

const defaultSettings: WorkspaceSettings = {
  timezone: 'Europe/Stockholm',
  week_start: 1,
  language: 'sv',
  business_hours: { start: 7, end: 17 }
};

const defaultPreferences: UserPreferences = {
  theme: 'system',
  calendar_density: 'relaxed',
  font_scale: 1.0
};

const WorkspaceContext = createContext<WorkspaceState>({
  workspaceId: null,
  workspaceName: '',
  modules: defaultModules,
  settings: defaultSettings,
  preferences: defaultPreferences,
  isLoading: true,
  updateModules: async () => false,
  updateSettings: async () => false,
  updatePreferences: async () => false,
  setAdminWorkspace: () => { },
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [modules, setModules] = useState<WorkspaceModules>(defaultModules);
  const [settings, setSettings] = useState<WorkspaceSettings>(defaultSettings);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (settings.language && i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language]);

  useEffect(() => {
    async function fetchWorkspace() {
      if (!user) {
        setIsLoading(false);
        setWorkspaceId(null);
        return;
      }

      setIsLoading(true);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('workspace_id, preferences')
        .eq('id', user.id)
        .single();

      if (userData?.preferences) {
        setPreferences(prev => ({ ...prev, ...(userData.preferences as any) }));
      }

      if (userError || !userData?.workspace_id) {
        if (user.role === 'platform_admin') {
          const stored = localStorage.getItem('dev_override_modules');
          if (stored) {
            try { setModules(JSON.parse(stored)); } catch (e) { }
          }
          let targetWsId = workspaceId;

          if (!targetWsId) {
            const { data: firstWs } = await supabase.from('workspaces').select('id, name, modules_active').limit(1).single();
            if (firstWs) targetWsId = firstWs.id;
          }

          if (targetWsId) {
            const { data: explicitWs } = await supabase.from('workspaces').select('id, name, modules_active').eq('id', targetWsId).single();
            if (explicitWs) {
              setWorkspaceId(explicitWs.id);
              setWorkspaceName(explicitWs.name);
              const dbM = explicitWs.modules_active as any;
              if (!stored) setModules({ school: !!dbM?.school, assistance: !!dbM?.assistance });
            }
          }
        }
        setIsLoading(false);
        return;
      }

      const activeWorkspaceId = userData.workspace_id;
      setWorkspaceId(activeWorkspaceId);

      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('name, modules_active, settings')
        .eq('id', activeWorkspaceId)
        .single();

      if (!workspaceError && workspaceData) {
        setWorkspaceName(workspaceData.name);

        const dbModules = workspaceData.modules_active as any;
        setModules({
          school: dbModules?.school || false,
          assistance: dbModules?.assistance || false,
        });

        if (workspaceData.settings) {
          const wsSettings = workspaceData.settings as any;
          setSettings(prev => ({ ...prev, ...wsSettings }));
          if (wsSettings.language) {
            i18n.changeLanguage(wsSettings.language);
          }
        }
      }

      setIsLoading(false);
    }

    fetchWorkspace();

    let workspaceChannel: any = null;
    if (workspaceId) {
      workspaceChannel = supabase
        .channel('workspace-updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'workspaces', filter: `id=eq.${workspaceId}` },
          (payload) => {
            const updatedData = payload.new;
            setWorkspaceName(updatedData.name);
            const dbModules = updatedData.modules_active as any;
            setModules({
              school: !!dbModules?.school,
              assistance: !!dbModules?.assistance,
            });
            if (updatedData.settings) {
              setSettings(prev => ({ ...prev, ...(updatedData.settings as any) }));
            }
          }
        )
        .subscribe();
    }

    let userChannel: any = null;
    if (user) {
      userChannel = supabase
        .channel('user-workspace-updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
          (payload) => {
            const newWorkspaceId = payload.new.workspace_id;
            if (newWorkspaceId !== workspaceId) {
              setWorkspaceId(newWorkspaceId || null);
            }
            if (payload.new.preferences) {
              setPreferences(prev => ({ ...prev, ...(payload.new.preferences as any) }));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (workspaceChannel) supabase.removeChannel(workspaceChannel);
      if (userChannel) supabase.removeChannel(userChannel);
    };
  }, [user, workspaceId]);

  /**
   * Method for admins to update the active modules
   */
  const updateModules = async (newModules: Partial<WorkspaceModules>) => {
    const updatedModules = { ...modules, ...newModules };

    setModules(updatedModules);

    if (!workspaceId) {
      if (user?.role === 'platform_admin') {
        localStorage.setItem('dev_override_modules', JSON.stringify(updatedModules));
        return true;
      }
      return false;
    }

    const { error } = await supabase
      .from('workspaces')
      .update({ modules_active: updatedModules })
      .eq('id', workspaceId);

    if (error) {
      console.error("Misslyckades spara moduler:", error);
      return false;
    }

    return true;
  };

  const setAdminWorkspace = (id: string) => {
    if (user?.role === 'platform_admin') {
      setWorkspaceId(id);
    }
  };

  const updateSettings = async (newSettings: Partial<WorkspaceSettings>) => {
    if (!workspaceId) return false;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    const { error } = await supabase.from('workspaces').update({ settings: updated }).eq('id', workspaceId);
    return !error;
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!user) return false;
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    const { error } = await supabase.from('users').update({ preferences: updated }).eq('id', user.id);
    return !error;
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaceId,
      workspaceName,
      modules,
      settings,
      preferences,
      isLoading,
      updateModules,
      updateSettings,
      updatePreferences,
      setAdminWorkspace
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
