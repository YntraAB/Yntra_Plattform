import { supabase } from '@/lib/supabase';
import type { WorkspaceSettings, WorkspaceModules } from '@/types';

export const workspaceService = {
  /**
   * Fetch workspace details
   */
  async getWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from('workspaces')
      .select('name, modules_active, settings')
      .eq('id', workspaceId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Update workspace settings
   */
  async updateSettings(workspaceId: string, settings: Partial<WorkspaceSettings>) {
    const { error } = await supabase
      .from('workspaces')
      .update({ settings })
      .eq('id', workspaceId);

    if (error) throw new Error(error.message);
  },

  /**
   * Update active modules
   */
  async updateModules(workspaceId: string, modules_active: Partial<WorkspaceModules>) {
    const { error } = await supabase
      .from('workspaces')
      .update({ modules_active })
      .eq('id', workspaceId);

    if (error) throw new Error(error.message);
  },

  /**
   * Get the first available workspace (for platform admins)
   */
  async getFirstWorkspace() {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)
      .single();

    if (error) return null;
    return data?.id || null;
  }
};
