import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import i18n from 'i18next';
import { useWorkspaceInfo, useUserPreferences } from '@/hooks/queries/useWorkspaceData';
import { userService } from '@/services/userService';
import { workspaceService } from '@/services/workspaceService';
import type { WorkspaceModules, WorkspaceSettings, UserPreferences } from '@/types';

interface WorkspaceState {
  workspaceId: string | null;
  workspaceName: string;
  modules: WorkspaceModules;
  settings: WorkspaceSettings;
  preferences: UserPreferences;
  isLoading: boolean;
  selectedTeamId: string | null;
  updateModules: (newModules: Partial<WorkspaceModules>) => Promise<boolean>;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => Promise<boolean>;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<boolean>;
  setAdminWorkspace: (id: string) => void;
  setSelectedTeamId: (id: string | null) => void;
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
  selectedTeamId: null,
  updateModules: async () => false,
  updateSettings: async () => false,
  updatePreferences: async () => false,
  setAdminWorkspace: () => { },
  setSelectedTeamId: () => { },
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamIdState] = useState<string | null>(() => {
    return localStorage.getItem('yntra_selected_team_id');
  });
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem('yntra_selected_team_id', selectedTeamId);
    } else {
      localStorage.removeItem('yntra_selected_team_id');
    }
  }, [selectedTeamId]);

  useEffect(() => {
    async function resolveWorkspace() {
      if (!user) {
        setActiveWorkspaceId(null);
        setInternalLoading(false);
        return;
      }

      try {
        const workspaceId = await userService.getUserWorkspaceId(user.id);

        if (workspaceId) {
          setActiveWorkspaceId(workspaceId);
        } else if (user.role === 'platform_admin') {
          const firstWs = await workspaceService.getFirstWorkspace();
          if (firstWs) setActiveWorkspaceId(firstWs);
        }
      } catch (error) {
        console.error('Failed to resolve workspace:', error);
      } finally {
        setInternalLoading(false);
      }
    }
    resolveWorkspace();
  }, [user]);

  const {
    data: workspaceInfo,
    isLoading: wsLoading,
    updateSettings: mutateSettings,
    updateModules: mutateModules
  } = useWorkspaceInfo(activeWorkspaceId);

  const {
    data: userPrefs,
    isLoading: prefsLoading,
    updatePreferences: mutatePreferences
  } = useUserPreferences(user?.id || null);

  const modules = workspaceInfo?.modules_active ? {
    school: !!workspaceInfo.modules_active.school,
    assistance: !!workspaceInfo.modules_active.assistance
  } : defaultModules;

  const settings = (workspaceInfo?.settings as unknown as WorkspaceSettings) || defaultSettings;
  const preferences = (userPrefs as unknown as UserPreferences) || defaultPreferences;

  useEffect(() => {
    if (settings.language && i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language]);

  const isLoading = internalLoading || wsLoading || prefsLoading;

  const updateModules = async (newModules: Partial<WorkspaceModules>) => {
    try {
      await mutateModules({ ...modules, ...newModules });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateSettings = async (newSettings: Partial<WorkspaceSettings>) => {
    try {
      await mutateSettings({ ...settings, ...newSettings });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    try {
      await mutatePreferences({ ...preferences, ...newPrefs });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const setAdminWorkspace = (id: string) => {
    if (user?.role === 'platform_admin') {
      setActiveWorkspaceId(id);
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaceId: activeWorkspaceId,
      workspaceName: workspaceInfo?.name || '',
      modules,
      settings,
      preferences,
      isLoading,
      selectedTeamId,
      updateModules,
      updateSettings,
      updatePreferences,
      setAdminWorkspace,
      setSelectedTeamId: setSelectedTeamIdState
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
