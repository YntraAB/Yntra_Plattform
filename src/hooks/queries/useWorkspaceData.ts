import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { teamService } from '@/services/teamService';
import { userService } from '@/services/userService';
import { workspaceService } from '@/services/workspaceService';
import type { WorkspaceSettings, WorkspaceModules, UserPreferences } from '@/types';

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
      return teamService.getWorkspaceTeams(workspaceId);
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
      return userService.getWorkspaceUsers(workspaceId);
    },
    enabled: !!workspaceId,
  });
}

export function useWorkspaceInfo(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceId];

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase.channel(`workspace-${workspaceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'workspaces',
        filter: `id=eq.${workspaceId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return null;
      return workspaceService.getWorkspace(workspaceId);
    },
    enabled: !!workspaceId,
  });

  const updateSettings = async (settings: Partial<WorkspaceSettings>) => {
    if (!workspaceId) return;
    await workspaceService.updateSettings(workspaceId, settings);
    queryClient.invalidateQueries({ queryKey });
  };

  const updateModules = async (modules_active: Partial<WorkspaceModules>) => {
    if (!workspaceId) return;
    await workspaceService.updateModules(workspaceId, modules_active);
    queryClient.invalidateQueries({ queryKey });
  };

  return { ...query, updateSettings, updateModules };
}

export function useUserPreferences(userId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['user-preferences', userId];

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`user-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return null;
      return userService.getUserPreferences(userId);
    },
    enabled: !!userId,
  });

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!userId) return;
    await userService.updateUserPreferences(userId, preferences);
    queryClient.invalidateQueries({ queryKey });
  };

  return { ...query, updatePreferences };
}
