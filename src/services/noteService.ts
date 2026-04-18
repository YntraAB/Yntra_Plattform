import { supabase } from '@/lib/supabase';

export const noteService = {
  /**
   * Fetch all notes for a workspace
   */
  async getWorkspaceNotes(workspaceId: string) {
    const { data, error } = await supabase
      .from('work_notes')
      .select(`
        *,
        author:users(full_name, email),
        team:teams(name)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
