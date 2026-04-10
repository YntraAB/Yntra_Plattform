import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Defines the structure of our modules
export interface WorkspaceModules {
  school: boolean;
  assistance: boolean;
  [key: string]: boolean | undefined;
}

interface WorkspaceState {
  workspaceId: string | null;
  workspaceName: string;
  modules: WorkspaceModules;
  isLoading: boolean;
  updateModules: (newModules: Partial<WorkspaceModules>) => Promise<boolean>;
  setAdminWorkspace: (id: string) => void;
}

// Default values before data has loaded
const defaultModules: WorkspaceModules = {
  school: false,
  assistance: false,
};

const WorkspaceContext = createContext<WorkspaceState>({
  workspaceId: null,
  workspaceName: '',
  modules: defaultModules,
  isLoading: true,
  updateModules: async () => false,
  setAdminWorkspace: () => {},
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [modules, setModules] = useState<WorkspaceModules>(defaultModules);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch the user's workspace when they log in
  useEffect(() => {
    async function fetchWorkspace() {
      if (!user) {
        setIsLoading(false);
        setWorkspaceId(null);
        return;
      }

      setIsLoading(true);

      // 1. Get the user's workspace ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.workspace_id) {
        if (user.role === 'platform_admin') {
          const stored = localStorage.getItem('dev_override_modules');
          if (stored) {
             try { setModules(JSON.parse(stored)); } catch(e){}
          }
          // Om dev redan har switchat arbetsyta i UI:t, behåll den
          let targetWsId = workspaceId;

          // Annars ladda första bästa workspace
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

      // 2. Fetch the actual workspace data (name, modules)
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('name, modules_active')
        .eq('id', activeWorkspaceId)
        .single();

      if (!workspaceError && workspaceData) {
        setWorkspaceName(workspaceData.name);
        
        // Ensure the JSON matches our WorkspaceModules type
        const dbModules = workspaceData.modules_active as any;
        setModules({
          school: dbModules?.school || false,
          assistance: dbModules?.assistance || false,
        });
      }

      setIsLoading(false);
    }

    fetchWorkspace();
    
    // Subscribe to realtime changes on this specific workspace
    // (So if Admin changes settings, it updates for everyone instantly)
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
          }
        )
        .subscribe();
    }

    // Subscribe to realtime changes on the user
    // (If user gets assigned a workspace, app updates instantly)
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
    
    // Optimerisk UI uppdatering
    setModules(updatedModules);

    if (!workspaceId) {
      // Dev override: om Dev (platform_admin) inte tillhör en specifik organisation 
      // i DB så appliceras modulen bara lokalt för UI utveckling
      if (user?.role === 'platform_admin') {
         localStorage.setItem('dev_override_modules', JSON.stringify(updatedModules));
         return true;
      }
      return false;
    }

    // Save to Supabase
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

  return (
    <WorkspaceContext.Provider value={{ workspaceId, workspaceName, modules, isLoading, updateModules, setAdminWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
