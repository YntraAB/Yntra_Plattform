import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export function useWorkspaceTeams(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['teams', workspaceId];

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase.channel('scheduler-teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase.from('teams').select('*').eq('workspace_id', workspaceId);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!workspaceId,
  });
}

export function useWorkspaceUsers(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['users', workspaceId];

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase.channel('scheduler-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase.from('users').select('*').eq('workspace_id', workspaceId);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!workspaceId,
  });
}
